"""Read-only Anno 117 protocol v2 capture. No game writes or network listener.
Protocol source: https://github.com/UbisoftMainzAnno/anno117_pipe_example
"""
import argparse
import base64
import json
import struct
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

PIPE = r"\\.\pipe\anno117"
FIELDS = [
    ("ProductGuid", "i"), ("ProductGeneration", "f"),
    ("ProductConsumption", "f"), ("ProductDelta", "f"),
    ("PerfectProductGeneration", "f"), ("PerfectProductConsumption", "f"),
    ("AmountOfBuildings", "i"), ("TotalMaintenance", "i"),
    ("TotalIncome", "f"), ("TotalProfit", "i"),
    ("SummedProductivity", "f"), ("AverageProductivity", "f"),
]


class Reader:
    def __init__(self, data):
        self.data, self.pos = data, 0

    def get(self, fmt):
        size = struct.calcsize("<" + fmt)
        if self.pos + size > len(self.data):
            raise ValueError("Truncated message")
        value = struct.unpack_from("<" + fmt, self.data, self.pos)[0]
        self.pos += size
        return value

    def string(self):
        size = self.get("B")
        if self.pos + size > len(self.data):
            raise ValueError("Truncated string")
        raw = self.data[self.pos:self.pos + size]
        self.pos += size
        return raw.decode("utf-8", errors="replace")

    def count(self):
        count = self.get("i")
        if not 0 <= count <= 100000:
            raise ValueError("Invalid count")
        return count

    def mapping(self):
        result = {}
        for _ in range(self.count()):
            guid, amount = self.get("i"), self.get("i")
            result[str(guid)] = result.get(str(guid), 0) + amount
        return result


def decode(data, version):
    r = Reader(data)
    kind = r.get("B")
    result = {"type_id": kind}
    if kind == 0:
        result.update(type="Version", version=r.get("i"))
    elif version != 2:
        result.update(type="Undecoded", reason="Expected protocol version 2")
        return result
    elif kind == 1:
        result.update(type="SessionStart", name=r.string())
    elif kind == 2:
        result.update(type="SessionEnd")
    elif kind == 3:
        result.update(type="AreaProductionStatistics", session_id=r.get("B"),
                      island_id=r.get("B"), area_index=r.get("B"),
                      session_guid=r.get("i"), area_name=r.string(),
                      game_timestamp=r.get("q"))
        entries = []
        for _ in range(r.count()):
            entry = {name: r.get(fmt) for name, fmt in FIELDS}
            entry["WorkforceGUIDtoAmount"] = r.mapping()
            entry["BuildingGUIDtoAmount"] = r.mapping()
            entries.append(entry)
        result["entries"] = entries
    else:
        result["type"] = "Unknown"
    result["trailing_bytes"] = len(data) - r.pos
    return result


def read_exact(pipe, size):
    chunks = bytearray()
    while len(chunks) < size:
        part = pipe.read(size - len(chunks))
        if not part:
            raise EOFError("Pipe closed")
        chunks.extend(part)
    return bytes(chunks)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wait", type=float, default=1800)
    parser.add_argument("--seconds", type=float, default=60)
    args = parser.parse_args()
    out = Path(__file__).parent / "captures" / datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    out.mkdir(parents=True)
    state = {"state": "waiting_for_pipe", "pipe": PIPE, "output": str(out), "messages": 0}
    lock = threading.Lock()

    def update(**values):
        with lock:
            state.update(values)
            (out / "status.json").write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    update()

    def worker():
        while True:
            try:
                with open(PIPE, "rb", buffering=0) as pipe:
                    update(state="connected", last_error=None)
                    version = None
                    with (out / "messages.jsonl").open("a", encoding="utf-8") as log:
                        while True:
                            prefix = read_exact(pipe, 4)
                            size = struct.unpack("<i", prefix)[0]
                            if not 1 <= size <= 1024 * 1024:
                                raise ValueError(f"Invalid frame length: {size}")
                            data = read_exact(pipe, size)
                            record = {"received_at": datetime.now(timezone.utc).isoformat(),
                                      "payload_bytes": size, "payload_base64": base64.b64encode(data).decode("ascii")}
                            try:
                                record["decoded"] = decode(data, version)
                                if record["decoded"].get("type") == "Version":
                                    version = record["decoded"]["version"]
                                if record["decoded"].get("entries") and "first_data_monotonic" not in state:
                                    update(first_data_monotonic=time.monotonic())
                            except Exception as exc:
                                record["decode_error"] = str(exc)
                            log.write(json.dumps(record, ensure_ascii=False) + "\n")
                            log.flush()
                            update(messages=state["messages"] + 1, protocol_version=version,
                                   last_message_at=record["received_at"],
                                   last_type=record.get("decoded", {}).get("type", "DecodeError"))
            except (OSError, EOFError, ValueError) as exc:
                update(state="waiting_for_pipe", last_error=str(exc))
                time.sleep(1)

    threading.Thread(target=worker, daemon=True).start()
    deadline = time.monotonic() + args.wait
    while time.monotonic() < deadline:
        start = state.get("first_data_monotonic")
        if start is not None and time.monotonic() - start >= args.seconds:
            update(state="capture_complete")
            return
        time.sleep(0.25)
    update(state="timeout")


if __name__ == "__main__":
    main()
