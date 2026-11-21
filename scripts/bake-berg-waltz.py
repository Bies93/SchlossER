"""Render the original score 'Der letzte Walzer'. Requires numpy and FFmpeg.

Usage: python scripts/bake-berg-waltz.py PATH_TO_FREEPATS_WAV_BANK [FFMPEG]
Source: https://freepats.zenvoid.org/Organ/accordion.html (CC0 1.0)
"""
from pathlib import Path
import subprocess
import sys
import numpy as np

bank = Path(sys.argv[1])
ffmpeg = sys.argv[2] if len(sys.argv) > 2 else 'ffmpeg'
rate = 24000
beat = .45
bars = [([(67, 1), (71, .5), (69, .5), (67, 1)], (43, 55, 59)),
        ([(64, 1), (67, 1), (71, 1)], (40, 55, 59)),
        ([(72, 1), (76, 1), (74, 1)], (48, 55, 64)),
        ([(71, 1), (69, .5), (67, .5), (66, 1)], (38, 54, 60)),
        ([(67, .5), (69, .5), (71, 1), (74, 1)], (43, 55, 59)),
        ([(76, 1), (74, .5), (72, .5), (71, 1)], (48, 55, 64)),
        ([(69, 1), (66, .5), (62, .5), (64, .5), (66, .5)], (38, 54, 60)),
        ([(67, 2), (59, .5), (62, .5)], (43, 55, 59)),
        ([(71, 1), (74, 1), (79, 1)], (43, 55, 59)),
        ([(76, 1.5), (74, .5), (72, 1)], (48, 55, 64)),
        ([(71, .5), (67, .5), (64, 1), (67, 1)], (40, 55, 59)),
        ([(66, 1), (69, 1), (74, 1)], (38, 54, 60)),
        ([(72, 1), (76, 1), (72, 1)], (48, 55, 64)),
        ([(71, 1), (67, 1), (64, 1)], (40, 55, 59)),
        ([(66, .5), (69, .5), (74, 1), (66, 1)], (38, 54, 60)),
        ([(67, 3)], (43, 55, 59))]
samples = {}
for note, name, cents in [(47,'B3',-34),(50,'D4',-38),(55,'G4',-30),(59,'B4',-19),
                          (62,'D5',-26),(67,'G5',-29),(72,'C6',-26),(76,'E6',-22)]:
    wav = bank / f'Button Accordion HN {name}.wav'
    raw = subprocess.check_output([ffmpeg, '-v','error','-i',str(wav),'-ac','1','-ar',str(rate),'-f','f32le','-'])
    samples[note] = (np.frombuffer(raw, '<f4').astype(float), cents)
n = round(len(bars)*3*beat*rate)
out = np.zeros(n+rate)
def hit(key, when, length, amplitude):
    base = min(samples, key=lambda k: abs(k-key))
    src, cents = samples[base]
    t = np.arange(round((length+.085)*rate))/rate
    waveform = np.interp((t+.036)*rate*2**((key-base+cents/100)/12), np.arange(len(src)), src)
    env = np.minimum(t/.039,1)*np.clip((length+.085-t)/.11,0,1)
    start = round(when*rate)
    out[start:start+len(t)] += waveform*env*amplitude
for i, (motif, chord) in enumerate(bars):
    start = i*3*beat
    pos = 0
    for j,(key,length) in enumerate(motif):
        hit(key,start+pos*beat,length*beat*.9,.56+.05*np.sin(i*1.31+j))
        pos += length
    hit(chord[0],start,.275,.31)
    for j in [1,2]:
        hit(chord[1],start+j*beat,.208,.23)
        hit(chord[2],start+j*beat+.006,.202,.16)
out = out[:n]
# Circular reflections keep the loop boundary continuous, even in reverb.
out = out+.125*np.roll(out,1219)+.063*np.roll(out,2219)+.03*np.roll(out,3277)
out *= .81/max(.01,np.max(np.abs(out)))
subprocess.run([ffmpeg,'-v','error','-y','-f','f32le','-ar',str(rate),'-ac','1','-i','-',
                '-c:a','libmp3lame','-b:a','48k',str(Path(__file__).resolve().parents[1]/'assets'/'berg-walzer.mp3')],
               input=out.astype('<f4').tobytes(),check=True)
