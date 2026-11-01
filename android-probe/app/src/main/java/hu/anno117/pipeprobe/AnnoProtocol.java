package hu.anno117.pipeprobe;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

public final class AnnoProtocol {
    public interface Source { int read(byte[] buffer, int offset, int length) throws IOException; }
    public static byte[] exact(Source source, int size) throws IOException {
        if(size < 1 || size > 1048576) throw new IOException("Invalid frame length: " + size);
        byte[] bytes = new byte[size];
        int offset = 0;
        while(offset < size) {
            int n = source.read(bytes, offset, size - offset);
            if(n <= 0 || n > size - offset) throw new IOException("Pipe closed or invalid read length");
            offset += n;
        }
        return bytes;
    }
    public static byte[] frame(Source source) throws IOException {
        int length = ByteBuffer.wrap(exact(source, 4)).order(ByteOrder.LITTLE_ENDIAN).getInt();
        return exact(source, length);
    }
    public static int version(byte[] data) throws IOException {
        if(data.length != 5 || data[0] != 0) throw new IOException("Expected Anno version message; received " + data.length + " bytes");
        return ByteBuffer.wrap(data, 1, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
    }
    private static String string(ByteBuffer b) throws IOException {
        if(!b.hasRemaining()) throw new IOException("Truncated string length");
        int length = Byte.toUnsignedInt(b.get());
        if(length > b.remaining()) throw new IOException("Truncated string");
        byte[] bytes = new byte[length]; b.get(bytes);
        return new String(bytes, StandardCharsets.UTF_8);
    }
    public static String describe(byte[] data) throws IOException {
        if(data.length == 0) throw new IOException("Empty message");
        ByteBuffer b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        int type = Byte.toUnsignedInt(b.get());
        if(type == 0) return "Protocol version: " + version(data);
        if(type == 1) return "Session started: " + string(b);
        if(type == 2) return "Session ended";
        if(type == 3) {
            if(b.remaining() < 8) throw new IOException("Truncated area header");
            int session = Byte.toUnsignedInt(b.get()), island = Byte.toUnsignedInt(b.get()), area = Byte.toUnsignedInt(b.get());
            int guid = b.getInt(); String name = string(b);
            if(b.remaining() < 12) throw new IOException("Truncated area statistics");
            long timestamp = b.getLong(); int entries = b.getInt();
            if(entries < 0 || entries > 100000) throw new IOException("Invalid entry count");
            return name + " | " + entries + " product rows | session " + session + ", island " + island + ", area " + area + ", region GUID " + guid + " | game timestamp " + timestamp;
        }
        return "Unknown message type " + type + " (" + data.length + " bytes)";
    }
}
