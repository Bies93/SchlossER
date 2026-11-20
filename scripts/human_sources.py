"""Fetch only the selected CC0 entries from the official MakeHuman pack."""
from concurrent.futures import ThreadPoolExecutor
from io import RawIOBase
from pathlib import Path
from urllib.request import Request, urlopen
import struct
import subprocess
import sys
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]/'dist'/'human-source'
PACK = 'https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip'
MPFB = 'https://raw.githubusercontent.com/makehumancommunity/mpfb2/9de0707fdc88438d7c53a1a2ac7937d9221e2431/src/mpfb/data/'

class RangeArchive(RawIOBase):
    def __init__(self):
        self.pos = 0
        self.size = 280737770
    @staticmethod
    def part(start,end):
        raw=subprocess.check_output(['curl','-fsSL','--retry','1','--max-time','260' if end-start>500000 else '40','-r',f'{start}-{end}',PACK])
        if len(raw)!=end-start+1:raise RuntimeError('Invalid archive range')
        return raw
    def seek(self, offset, whence=0):
        self.pos = (0, self.pos, self.size)[whence]+offset
        return self.pos
    def tell(self):
        return self.pos
    def read(self, count=-1):
        end = self.size if count<0 else min(self.size, self.pos+count)
        if end<=self.pos:
            return b''
        data = self.part(self.pos,end-1)
        self.pos += len(data)
        return data

def fetch(url, path):
    if path.exists():
        return
    data = urlopen(url, timeout=35).read()
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)

if __name__ == '__main__':
    ROOT.mkdir(parents=True,exist_ok=True)
    wanted=['male_casualsuit01','male_casualsuit03','female_casualsuit01','female_elegantsuit01',
        'male_elegantsuit01','male_worksuit01','shoes01','shoes03','short01','short03','bob01','afro01',
        'eyebrow001','young_caucasian_male','young_asian_female','young_african_male','old_caucasian_male']
    macros=['caucasian-male-young','caucasian-male-old','asian-female-young','caucasian-female-young','african-male-young']
    extras=['head/head-rectangular','head/head-oval','chin/chin-width-incr','nose/nose-scale-width-incr','nose/nose-scale-width-decr',
        'eyes/l-eye-bag-incr','eyes/r-eye-bag-incr']
    mh='https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/'
    def pack_entry(info):
        path=ROOT/info.filename
        if path.exists():return
        start=info.header_offset
        raw=RangeArchive.part(start,min(280737769,start+30+len(info.filename.encode())+4096+info.compress_size))
        a,b=struct.unpack_from('<HH',raw,26);s=30+a+b
        data=raw[s:s+info.compress_size]
        data=zlib.decompress(data,-15) if info.compress_type==8 else data
        if zlib.crc32(data)!=info.CRC:raise RuntimeError(info.filename+' CRC mismatch')
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    with ThreadPoolExecutor(max_workers=16) as pool:
        jobs=[]
        if '--list' not in sys.argv and '--pack-only' not in sys.argv:
            files=['3dobjs/base.obj','rigs/standard/rig.game_engine.json','rigs/standard/weights.game_engine.json',
                *('targets/macrodetails/'+s+'.target.gz' for s in macros),*('targets/'+s+'.target.gz' for s in extras),
                *('targets/expression/units/caucasian/'+s+'.target.gz' for s in ['mouth-open','eye-left-closure','eye-right-closure',
                   'mouth-corner-puller','mouth-pursing','eyebrows-left-up','eyebrows-right-up'])]
            jobs += [pool.submit(fetch,MPFB+s,ROOT/Path(s).name) for s in files]
            jobs += [pool.submit(fetch,mh+s,ROOT/Path(s).name) for s in ['eyes/low-poly/low-poly.obj','eyes/low-poly/low-poly.mhclo','eyes/materials/brown_eye.png']]
        with zipfile.ZipFile(RangeArchive()) as z:
            if '--list' in sys.argv:
                print('\n'.join(n for n in z.namelist() if any(v in n for v in sys.argv[2:])))
            else:
                for e in z.infolist():
                    f=Path(e.filename)
                    if f.parent.name not in wanted or f.suffix not in ['.obj','.mhclo','.mhmat','.png','.jpg']:continue
                    if any(s in f.stem for s in ('_ao','_normal','_bump','_spec')):continue
                    jobs.append(pool.submit(pack_entry,e))
        for j in jobs:
            try:j.result()
            except Exception as error:print(error)
