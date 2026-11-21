"""Import the optional local source pack and edit short game SFX from CC-BY audio."""
import argparse
import array
from pathlib import Path
import shutil
import sys
import wave
import soundfile as sf

parser = argparse.ArgumentParser()
parser.add_argument("local_pack", type=Path, help="folder containing mp3/")
parser.add_argument("recordings", type=Path, help="Gunshot Sounds archive's sounds/ folder")
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / "assets" / "sfx"
out.mkdir(parents=True, exist_ok=True)
for key in (
    "bow_fire_01", "bow_fire_02", "bow_fire_03", "bow_reload_open", "bow_reload_close",
    "shotgun_pump_open", "shotgun_pump_close", "impact_metal", "impact_stone",
    "impact_soft", "weapon_equip", "weapon_holster",
):
    shutil.copyfile(args.local_pack / "mp3" / f"{key}.mp3", out / f"{key}.mp3")

for key, source, begin, end, tail in (
    ("rifle_field_1", "sks", .340, 1.02, .165),
    ("rifle_field_2", "sks", 2.287, 2.98, .165),
    ("shotgun_field", "shotty", .125, .697, .137),
):
    with wave.open(str(args.recordings / (source + ".wav")), "rb") as w:
        hz, channels, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        if width != 2 or channels != 2:
            raise ValueError(f"Unexpected source shape: {source}")
        w.setpos(round(begin * hz))
        a = array.array("h", w.readframes(round((end - begin) * hz)))
    if sys.byteorder != "little":
        a.byteswap()
    mono = [(a[i] + a[i + 1]) * .5 for i in range(0, len(a), 2)]
    old = hp = 0.
    for i, val in enumerate(mono):
        hp = .9948 * (hp + val - old)
        old = val
        mono[i] = hp
    scale = 27600 / max(1, max(map(abs, mono)))
    pcm = array.array("h", (round(y * scale * min(1., i / (.0015 * hz)) *
                                    min(1., (len(mono) - 1 - i) / (tail * hz)) ** 1.55)
                            for i, y in enumerate(mono)))
    with sf.SoundFile(out / (key + ".flac"), mode="w", samplerate=hz, channels=1, subtype="PCM_16") as f:
        f.buffer_write(pcm.tobytes(), dtype="int16")
