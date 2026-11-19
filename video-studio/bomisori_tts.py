#!/usr/bin/env python3
"""Generate AI Heogongjang Korean narration with the selected Bomisori voice."""
import argparse
import json
import os
import pathlib
import urllib.error
import urllib.request

VOICE_ID = "7oLyBHyhxAjrctX6ZQlw"
API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text-file", required=True, help="UTF-8 Korean narration text file")
    parser.add_argument("--output", default="heogongjang-bomisori.mp3")
    args = parser.parse_args()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        parser.error("Set ELEVENLABS_API_KEY securely (never commit it to GitHub).")
    text = pathlib.Path(args.text_file).read_text(encoding="utf-8").strip()
    if not text:
        parser.error("Narration text is empty.")
    payload = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.65, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}
    }, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(API_URL, data=payload, headers={
        "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"
    }, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio = response.read()
    except urllib.error.HTTPError as error:
        raise SystemExit(f"TTS API failed (HTTP {error.code}): {error.read().decode('utf-8', errors='replace')[:500]}")
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(audio)
    print(f"Created {output} ({len(audio)} bytes)")

if __name__ == "__main__":
    main()
