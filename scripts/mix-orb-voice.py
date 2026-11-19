"""Render a short, original sanctuary cue to portable mono PCM (numpy)."""
import sys, wave
from pathlib import Path
import numpy as np

rate = 22050
def take(name, speed):
    with wave.open(str(Path(sys.argv[1]) / (name + '.wav')), 'rb') as w:
        assert w.getsampwidth() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float)
        x = x.reshape((-1, w.getnchannels())).mean(axis=1)
        return np.interp(np.arange(0, len(x), speed*w.getframerate()/rate),
                         np.arange(len(x)), x) / max(1, np.max(abs(x)))

lead, shadow = take('lead', .945), take('shadow', 1.)
# Match the distant double's duration; keep diction mostly in the foreground voice.
shadow = np.interp(np.linspace(0, len(shadow)-1, len(lead)), np.arange(len(shadow)), shadow)
out = np.zeros(len(lead)+rate*2)
for secs, level, signal in [(.26,.87,lead),(.34,.095,shadow),(.41,.11,lead),(.55,.06,lead),(.79,.037,lead)]:
    i = round(rate*secs); out[i:i+len(signal)] += level*signal
t = np.arange(len(out))/rate
env = (1-np.exp(-t*2.1))*np.minimum(1, (t[-1]-t)/1.7)**2
for f, amp in [(130.81,.036),(196.00,.032),(261.63,.016),(329.63,.014),(523.25,.008)]:
    out += amp*env*(1+.19*np.sin(2*np.pi*.41*t))*np.sin(2*np.pi*f*t+.13*np.sin(2*np.pi*2.3*t))
with wave.open(str(Path(__file__).resolve().parents[1]/'assets'/'orb-stimme.wav'),'wb') as w:
    w.setparams((1,2,rate,0,'NONE','not compressed'))
    w.writeframes((out*(28500/max(abs(out)))).astype('<i2').tobytes())
