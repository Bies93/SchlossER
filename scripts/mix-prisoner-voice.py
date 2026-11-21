"""Bake Hubert from recorded speech and performed creature vocals. pip install numpy soundfile."""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
R = 24000
def take(source, duration, rates):
    a, sr = sf.read(source, always_2d=True)
    a = a.mean(axis=1)
    live = np.flatnonzero(abs(a) > .022 * max(abs(a)))
    a = a[max(0,live[0]-int(.02*sr)):live[-1]+1]
    n = round(R*duration)
    speed = np.interp(np.linspace(0,1,n),np.linspace(0,1,len(rates)),rates)
    pos = np.cumsum(speed); pos *= (len(a)-1)/pos[-1]
    clip = np.interp(pos,np.arange(len(a)),a)
    clip[:240] *= np.linspace(0,1,240);clip[-950:] *= np.linspace(1,0,950)
    return clip / max(abs(clip))

out = np.zeros(round(R*5.35))
def mix(t,a,vol):
    i=round(t*R);out[i:i+len(a)] += vol*a
with ZipFile(HERE/'hubert-moans.zip') as pack:
    def groan(i,dur,rates):
        return take(BytesIO(pack.read(f'undead-{i}.ogg')),dur,rates)
    mix(.04,groan(1,.59,[1,.8,.65]),.115)
    for t,length,v,num,rates in [(.59,.91,.76,2,[.97,.81,.8,1.04]),(2.03,1.11,.63,3,[.93,.76,.56,.83])]:
        word=take(HERE/'hubert-source.mp3',length,rates)
        rasp=groan(num,length,[1,.85,.79,1])
        env=np.convolve(abs(word),np.ones(221)/221,mode='same')
        mix(t,word+rasp*np.sqrt(env)*.63,v)
    mix(3.32,groan(4,1.70,[1,.94,.85,.73,.62]),.66)
# Restrained early reflections, preserving the stops and the silence between breaths.
dry = np.tanh(out*1.32)
out = dry.copy()
for dt,g in [(.034,.10),(.082,.061),(.154,.033)]:
    n=round(dt*R);out[n:]+=g*dry[:-n]
sf.write(HERE.parent/'assets/kammer-07.flac',out*.82/max(abs(out)),R,subtype='PCM_16')
