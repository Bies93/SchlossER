"""Produce the original Zwanni's Funny! loop. Usage: python ... /path/to/ffmpeg."""
from array import array
from io import BytesIO
from math import exp, pi, sin, tanh
from pathlib import Path
from random import Random
from subprocess import run
from sys import argv
import wave

RATE = 24000
BEAT = 60 / 124
pcm = array("f", [0]) * round(16 * BEAT * RATE)
TAU = 2 * pi
rng = Random(8619)


def note(beat, length, midi, gain, kind):
    start, span = round(beat * BEAT * RATE), int(length * BEAT * RATE)
    f = 440 * 2 ** ((midi - 69) / 12)
    for i in range(span):
        t = i / RATE
        env = min(1, t / .018, (span - i) / (RATE * .046))
        phase = TAU * f * t
        if kind == "reed":
            raw = (.56 * sin(phase) + .33 * sin(phase * 2) + .18 * sin(phase * 3)
                   + .21 * sin(phase * 1.006) + .09 * sin(phase * 4))
            raw *= .88 + .12 * sin(30 * t)
        elif kind == "bass":
            raw = (.73 * sin(phase) + .30 * sin(phase * 2)) * exp(-3.2 * t)
        else:
            raw = (sin(TAU * (83 * t + 4 * (1 - exp(-19 * t)))) * exp(-26 * t)
                   if kind == "kick" else (2 * rng.random() - 1) * exp(-71 * t) * .45)
        pcm[(start + i) % len(pcm)] += gain * env * raw


# Two jaunty phrases, an offbeat chord and a deliberately cheap PA sound.
bars = [
    (50, (62, 66, 69), (78, 76, 74, 69)),
    (45, (61, 64, 69), (73, 76, 76, None)),
    (47, (62, 66, 71), (78, 83, 81, 78)),
    (43, (62, 67, 71), (79, 78, 74, None)),
    (50, (62, 66, 69), (78, 76, 74, 69)),
    (45, (61, 64, 69), (73, 76, 81, 79)),
    (43, (62, 67, 71), (78, 79, 76, 73)),
    (50, (62, 66, 69), (74, None, 69, None)),
]
for i, (root, chord, lead) in enumerate(bars):
    at = 2 * i
    for n in (0, 1):
        note(at + n, .42, root + (7 if n else 0), .31, "bass")
        note(at + n, .27, 0, .25 if not n else .17, "kick")
        note(at + n + .49, .19, 0, .22, "tick")
        for p in chord:
            note(at + n + .49, .40, p, .092, "reed")
    for n, pitch in enumerate(lead):
        if pitch is not None:
            note(at + n * .5, .64 if n == 2 and lead[3] is None else .43, pitch, .23, "reed")

wav = BytesIO()
with wave.open(wav, "wb") as f:
    f.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
    f.writeframes(array("h", (int(tanh(x * 1.12) * 29000) for x in pcm)).tobytes())
out = Path(__file__).resolve().parent.parent / "assets" / "zwannis-polka.mp3"
run([argv[1], "-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0",
     "-c:a", "libmp3lame", "-b:a", "64k", str(out)], input=wav.getvalue(), check=True)
