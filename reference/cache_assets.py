"""Cache source event thumbnails for the local offline snapshot. Preserves image bytes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
import json,subprocess
ROOT=Path(__file__).resolve().parent
snapshot=json.loads((ROOT/'public/snapshot.json').read_text())
folder=ROOT/'public/assets/markets';folder.mkdir(exist_ok=True)
def download(e):
    url=e.get('image','')
    if not url.startswith('https://'):return None
    ext=Path(urlparse(url).path).suffix.lower()
    if ext not in ['.jpg','.jpeg','.png','.webp','.gif']:ext='.png'
    name=e['id']+ext;p=folder/name
    if not p.exists():
        r=subprocess.run(['curl','--proto','=https','-fsSL','--max-time','15','--max-filesize','2000000',url,'-o',str(p)],capture_output=True)
        if r.returncode:
            p.unlink(missing_ok=True);return None
    return e['id'],'assets/markets/'+name
with ThreadPoolExecutor(max_workers=6) as pool:
    mapped=dict(x for x in pool.map(download,snapshot['events']) if x)
(ROOT/'public/image-cache.mjs').write_text('export const cachedImages = '+json.dumps(mapped,separators=(',',':'))+';\n')
print('Cached',len(mapped),'original public thumbnails')
