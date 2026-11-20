"""Small processed mono voice clip, no external sound library."""
import sys, wave
from pathlib import Path
import numpy as np

rate = 22050
with wave.open(sys.argv[1], 'rb') as w:
    sample = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape((-1, w.getnchannels())).mean(axis=1)
    st = np.flatnonzero(abs(sample) > 180)
    sample = sample[max(0, st[0]-520): min(len(sample), st[-1]+850)]
    source = np.arange(0, len(sample), .87*w.getframerate()/rate)
    dry = np.interp(source+.50*np.sin(source*.003), np.arange(len(sample)), sample)
    dry /= max(abs(dry))
t = np.arange(len(dry))/rate
dry = np.tanh(dry*1.5)*(.77+.15*np.sin(t*2*np.pi*42)+.08*np.sin(t*2*np.pi*19.5))
out = np.zeros(len(dry)+int(1.67*rate))
out[:len(dry)] += dry*.76
start = len(dry)+int(.16*rate)
n = int(1.03*rate)
t = np.arange(n)/rate
rng = np.random.default_rng(71)
f = 82-32*t
phase = np.cumsum(f)*2*np.pi/rate
envelope = (1-np.exp(-t*21))*np.maximum(0,1-t/1.04)**1.78
out[start:start+n] += envelope*(.14*np.sin(phase*2)+.09*np.sin(phase*3)+.15*np.sin(phase*5)+.13*np.sin(phase*7)+.06*rng.normal(size=n))
signal = out.copy()
for delay, amp in [(0.061,.17),(0.138,.085),(0.214,.041)]:
    i = int(delay*rate)
    out[i:] += signal[:-i]*amp
out[:384] *= np.linspace(0,1,384)
out[-1024:] *= np.linspace(1,0,1024)
with wave.open(str(Path(__file__).resolve().parents[1]/'assets'/'kammer-07.wav'), 'wb') as w:
    w.setparams((1,2,rate,0,'NONE','not compressed'))
    w.writeframes((out*.82/max(abs(out))*32767).astype('<i2').tobytes())
