"""Generate original instrumental MIDI, render with FluidSynth and FFmpeg.
No copyrighted melodies are used. Output is a review artifact, not auto-published.
"""
from pathlib import Path
import datetime as dt
import json
import math
import shutil
import struct
import subprocess

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
BPM = 76
PPQ = 480
BARS = 16
BEATS = BARS * 4
SECONDS = round(BEATS * 60 / BPM, 2)

def vlq(n):
    result = [n & 0x7f]
    n >>= 7
    while n:
        result.insert(0, (n & 0x7f) | 0x80)
        n >>= 7
    return bytes(result)

def track(events):
    events.sort(key=lambda e: (e[0], e[1]))
    buf = bytearray()
    previous = 0
    for tick, priority, message in events:
        buf += vlq(tick - previous) + message
        previous = tick
    buf += b"\x00\xff\x2f\x00"
    return b"MTrk" + struct.pack(">I", len(buf)) + buf

def add_note(events, channel, note, start, length, velocity):
    start_tick = round(start * PPQ)
    end_tick = round((start + length) * PPQ)
    events.append((start_tick, 1, bytes([0x90 | channel, note, velocity])))
    events.append((end_tick, 0, bytes([0x80 | channel, note, 0])))

def create_midi(path):
    tempo = round(60_000_000 / BPM)
    conductor = [(0, 0, b"\xff\x51\x03" + tempo.to_bytes(3, "big"))]
    # Original gentle chord sequence in C major / A minor.
    progression = [
        (48, [60, 64, 67]), (45, [57, 60, 64]),
        (41, [57, 60, 65]), (43, [59, 62, 67]),
    ]
    piano = [(0, 0, bytes([0xC0, 0]))]  # GM acoustic grand piano
    strings = [(0, 0, bytes([0xC1, 48]))]  # GM string ensemble 1
    melody = [72, 74, 76, 74, 69, 72, 71, 67,
              72, 76, 79, 76, 74, 72, 71, 72]
    for bar in range(BARS):
        bass, chord = progression[bar % len(progression)]
        beat = bar * 4
        add_note(piano, 0, bass, beat, 3.8, 49)
        for j, pitch in enumerate(chord):
            add_note(piano, 0, pitch, beat + 0.08 + j * 0.08, 3.55, 42)
        add_note(strings, 1, melody[bar], beat + 0.5, 2.8, 45)
    # 16 bars at 76 BPM = about 50.5 sec, within the 30–80 sec Shorts requirement.
    parts = [track(conductor), track(piano), track(strings)]
    path.write_bytes(b"MThd" + struct.pack(">IHHH", 6, 1, len(parts), PPQ) + b"".join(parts))

def run(args):
    print("+", " ".join(map(str, args)), flush=True)
    subprocess.run(list(map(str, args)), check=True)

def main():
    sf_candidates = [
        Path("/usr/share/sounds/sf2/FluidR3_GM.sf2"),
        Path("/usr/share/sounds/sf2/default-GM.sf2"),
    ]
    sf = next((p for p in sf_candidates if p.exists()), None)
    if sf is None:
        raise RuntimeError("No installed SoundFont found; check fluid-soundfont-gm package")
    for exe in ("fluidsynth", "ffmpeg", "ffprobe"):
        if not shutil.which(exe):
            raise RuntimeError(f"Missing executable: {exe}")
    midi = OUT / "heogongjang_original.mid"
    wav = OUT / "heogongjang_original.wav"
    mp3 = OUT / "heogongjang_original.mp3"
    m4a = OUT / "heogongjang_original.m4a"
    create_midi(midi)
    run(["fluidsynth", "-ni", "-F", wav, "-r", "44100", sf, midi])
    # Apply short fade-in/out and ensure the file lasts exactly the planned duration.
    af = f"afade=t=in:st=0:d=1.5,afade=t=out:st={SECONDS-3:.2f}:d=3"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav,
         "-af", af, "-t", str(SECONDS), "-codec:a", "libmp3lame", "-b:a", "320k", mp3])
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", wav,
         "-af", af, "-t", str(SECONDS), "-codec:a", "aac", "-b:a", "192k", m4a])
    wav.unlink()
    metadata = {
        "created_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "composition": "Original instrumental generated from project code",
        "bpm": BPM, "duration_seconds": SECONDS,
        "instruments": ["GM Acoustic Grand Piano", "GM String Ensemble"],
        "soundfont": str(sf), "formats": ["MIDI", "MP3 320kbps", "AAC 192kbps"],
        "status": "review_required_no_auto_publish"
    }
    (OUT / "manifest.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
