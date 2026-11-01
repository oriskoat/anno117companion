"""Import an entitled local content pack into a developer checkout."""
import argparse
import stat
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
FILES = {'knowledge.js','game-locales.js','icons.js','icons.json','gallery.js'}
FOLDERS = {'icons','islands','specialists'}

def import_pack(archive, destination=None):
    destination=Path(destination or ROOT/'android-probe/app/src/main/assets/dashboard').resolve()
    pending=[];seen=set();size=0
    with zipfile.ZipFile(archive) as bundle:
        for item in bundle.infolist():
            if item.is_dir():continue
            path=PurePosixPath(item.filename)
            if '\\' in item.filename or path.is_absolute() or '..' in path.parts or ':' in item.filename:
                raise ValueError('Unsafe content-pack path')
            if stat.S_ISLNK(item.external_attr >> 16):raise ValueError('Symbolic links are not allowed')
            allowed=(len(path.parts)==1 and path.name in FILES) or (len(path.parts)==2 and path.parts[0] in FOLDERS and path.suffix.lower() in {'.png','.webp','.svg'})
            if not allowed:raise ValueError('Not a game-content file: '+item.filename)
            normalized=str(path).lower()
            if normalized in seen:raise ValueError('Duplicate content-pack path')
            seen.add(normalized);size+=item.file_size
            if item.file_size>30_000_000 or size>350_000_000:raise ValueError('Content pack is too large')
            target=(destination/str(path)).resolve()
            if not target.is_relative_to(destination):raise ValueError('Path leaves dashboard')
            pending.append((target,bundle.read(item)))
    for target,data in pending:
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    return len(pending)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('archive',type=Path)
    args=parser.parse_args();print('Imported',import_pack(args.archive),'local content files')
