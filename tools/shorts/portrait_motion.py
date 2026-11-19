#!/usr/bin/env python3
"""Audio-reactive portrait animation for AI Heogongjang Shorts.

This is a lightweight 2D image-warp approximation, NOT a neural phoneme-level
lip-sync model. It runs on GitHub Actions without a GPU or model weights.
"""
import argparse
import math
import subprocess
from pathlib import Path

import cv2
import numpy as np

FPS = 25
W, H = 360, 640


def speech_envelope(audio, seconds):
    """Decode narration to mono PCM and calculate smoothed frame-level energy."""
    pcm = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(audio), "-ac", "1", "-ar", "16000",
        "-f", "s16le", "-acodec", "pcm_s16le", "-"
    ])
    samples = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    n = int(seconds * FPS)
    hop = 16000 / FPS
    energies = np.zeros(n, dtype=np.float32)
    for i in range(n):
        a, b = int(i * hop), min(len(samples), int((i + 1) * hop))
        if b > a:
            energies[i] = np.sqrt(np.mean(samples[a:b] ** 2))
    if energies.max() > 0:
        threshold = np.percentile(energies[energies > 0], 75)
        energies = np.clip((energies - threshold * .12) / max(threshold * 1.2, .001), 0, 1)
    # Smooth rapidly enough to follow syllabic rhythm, without harsh jitter.
    out = np.zeros_like(energies)
    for i in range(1, n):
        rate = .50 if energies[i] > out[i - 1] else .28
        out[i] = out[i - 1] * (1 - rate) + energies[i] * rate
    return out


def load_portrait(path):
    img = cv2.imread(str(path))
    if img is None:
        raise FileNotFoundError(path)
    ih, iw = img.shape[:2]
    # Crop away the label printed at the bottom of the 12-expression tiles.
    img = img[:int(ih * .90)]
    ih, iw = img.shape[:2]
    scale = max(W / iw, H / ih)
    img = cv2.resize(img, (int(iw * scale), int(ih * scale)), interpolation=cv2.INTER_CUBIC)
    ih, iw = img.shape[:2]
    x0, y0 = (iw - W) // 2, (ih - H) // 2
    return img[y0:y0 + H, x0:x0 + W].copy()


def mouth_location(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = detector.detectMultiScale(gray, scaleFactor=1.07, minNeighbors=3, minSize=(45, 45))
    if len(faces) == 0:
        # Approximate placement for the centered portrait; no face = no warp.
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return (int(x + .50 * w), int(y + .77 * h), max(7, int(w * .19)), max(5, int(h * .09)))


def animate(frame, mouth, strength, t):
    # Small camera drift and breathing preserve a stable character identity.
    zoom = 1.012 + .004 * math.sin(t * .65)
    cx, cy = W / 2 + 1.5 * math.sin(t * .3), H / 2 + 1.2 * math.sin(t * .8)
    mat = cv2.getRotationMatrix2D((cx, cy), .12 * math.sin(t * .28), zoom)
    result = cv2.warpAffine(frame, mat, (W, H), flags=cv2.INTER_LINEAR,
                            borderMode=cv2.BORDER_REFLECT_101)
    if mouth is None or strength < .025:
        return result
    mx, my, rx, ry = mouth
    x0, x1 = max(0, mx - 2 * rx), min(W, mx + 2 * rx)
    y0, y1 = max(0, my - 3 * ry), min(H, my + 3 * ry)
    if x1 <= x0 or y1 <= y0:
        return result
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    dx = (xx - mx) / max(rx, 1)
    dy = (yy - my) / max(ry, 1)
    weight = np.exp(-1.7 * dx * dx - .45 * dy * dy)
    # Warp existing lip pixels rather than painting a cartoon mouth.
    displacement = (strength * ry * .65) * np.tanh(dy * 1.4) * weight
    src_y = np.clip(yy - displacement, 0, H - 1).astype(np.float32)
    src_x = xx.astype(np.float32)
    result[y0:y1, x0:x1] = cv2.remap(
        result, src_x, src_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101)
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--image", type=Path, required=True)
    p.add_argument("--audio", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--seconds", type=float, default=30)
    args = p.parse_args()
    frame = load_portrait(args.image)
    mouth = mouth_location(frame)
    if mouth is None:
        raise RuntimeError("Could not locate a face; refusing inaccurate mouth animation")
    env = speech_envelope(args.audio, args.seconds)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-vcodec", "rawvideo",
           "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
           "-pix_fmt", "yuv420p", str(args.output)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for i, level in enumerate(env):
            proc.stdin.write(animate(frame, mouth, float(level), i / FPS).tobytes())
    finally:
        proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("FFmpeg portrait animation failed")


if __name__ == "__main__":
    main()
