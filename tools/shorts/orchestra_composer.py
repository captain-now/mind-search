#!/usr/bin/env python3
"""Original 90-second cinematic orchestral composer for AI Heogongjang.

Creates multitrack General MIDI with original notes, 4-act orchestration,
and WAV audio. If FluidSynth and a user-supplied SoundFont are available,
renders realistic sampled instruments; otherwise uses a procedural fallback.
No copyrighted recordings or downloaded soundfonts are bundled.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import struct
import subprocess
import wave

TICKS=480
BPM=80
BEAT=60/BPM
DURATION=90
# Four chords in A minor; last resolves to C major for a hopeful ending.
PROGRESSIONS={
    "hope":[[57,60,64],[53,57,60],[55,59,62],[48,52,55]],
    "peace":[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],
    "reflection":[[57,60,64],[55,59,62],[53,57,60],[52,55,59]],
}
INSTRUMENTS=[
    ("piano",0,0),("cello",1,42),("strings",2,48),
    ("violin",3,40),("flute",4,73),("horn",5,60),
    ("timpani",6,47),
]

def mood_from_story(story):
    text=(story.get("ko","")+" "+story.get("en","")).lower()
    if any(w in text for w in ("죽음","슬픔","눈물","그리움","loss","grief")):
        return "reflection"
    if any(w in text for w in ("평화","고요","자연","명상","peace","nature")):
        return "peace"
    return "hope"

def vlq(n):
    n=max(0,int(n)); out=[n&127]; n>>=7
    while n:
        out.insert(0,(n&127)|128);n>>=7
    return bytes(out)

def chunk(kind,payload):
    return kind+struct.pack(">I",len(payload))+payload

def add_note(events,channel,pitch,start,duration,velocity):
    if start>=DURATION: return
    end=min(DURATION,start+duration)
    if end<=start:return
    tick=lambda sec:round(sec/BEAT*TICKS)
    events.append((tick(start),1,bytes([0x90|channel,pitch,max(1,min(127,velocity))])))
    events.append((tick(end),0,bytes([0x80|channel,pitch,0])))

def make_track(events,channel,program,name):
    ev=[(0,-2,b"\xff\x03"+vlq(len(name.encode()))+name.encode()),
        (0,-1,bytes([0xC0|channel,program]))]
    ev+=events
    ev.sort(key=lambda item:(item[0],item[1]))
    payload=bytearray();prev=0
    for tick,_,message in ev:
        payload+=vlq(tick-prev)+message;prev=tick
    payload+=vlq(round(DURATION/BEAT*TICKS)-prev)+b"\xff\x2f\x00"
    return chunk(b"MTrk",payload)

def compose(story,output):
    mood=mood_from_story(story)
    chords=PROGRESSIONS[mood]
    digest=hashlib.sha256((story.get("title","")+story.get("ko","")).encode()).digest()
    seed=int.from_bytes(digest[:4],"big")
    # 4 bars = 12 sec; chord changes every 6 sec to align with photo scenes.
    tracks={name:[] for name,_,_ in INSTRUMENTS}
    for scene in range(15):
        t=scene*6.0
        chord=chords[(scene+seed%4)%4]
        bass=chord[0]-24
        act=0 if t<30 else 1 if t<60 else 2 if t<80 else 3
        strength=[0.48,0.72,1.0,0.42][act]
        for j in range(8):
            pitch=chord[(j+seed//(scene+1))%3]+(12 if j%4==3 else 0)
            add_note(tracks["piano"],0,pitch,t+j*.75,.55,int(55*strength)+14)
        add_note(tracks["cello"],1,bass,t,5.85,int(60*strength)+12)
        for pitch in chord:
            add_note(tracks["strings"],2,pitch,t,5.9,int(50*strength)+12)
        if act>=1:
            for j in range(4):
                add_note(tracks["violin"],3,chord[(j+1)%3]+12,t+j*1.5,1.42,int(61*strength)+10)
            if scene%2==0:
                add_note(tracks["flute"],4,chord[2]+24,t+1.5,2.7,int(52*strength)+8)
        if act==2:
            add_note(tracks["horn"],5,chord[0],t,5.75,70)
            add_note(tracks["timpani"],6,max(36,bass),t,1.0,62)
    tracks_bin=[make_track(tracks[name],channel,program,name) for name,channel,program in INSTRUMENTS]
    header=chunk(b"MThd",struct.pack(">HHH",1,len(tracks_bin)+1,TICKS))
    tempo=round(60000000/BPM)
    tempo_track=chunk(b"MTrk",b"\x00\xff\x51\x03"+tempo.to_bytes(3,"big")+vlq(round(DURATION/BEAT*TICKS))+b"\xff\x2f\x00")
    output.write_bytes(header+tempo_track+b"".join(tracks_bin))
    return {"mood":mood,"tracks":len(tracks_bin),"duration_seconds":DURATION,"bpm":BPM}

def render_with_soundfont(midi,wav,soundfont):
    exe=shutil.which("fluidsynth")
    if not exe or not soundfont or not Path(soundfont).is_file():
        return False
    # FluidSynth offline renderer. Output duration is normalized to 90s.
    raw=wav.with_name("soundfont_raw.wav")
    subprocess.run([exe,"-ni","-F",str(raw),"-r","22050",str(soundfont),str(midi)],
                   check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=180)
    ffmpeg=shutil.which("ffmpeg")
    if ffmpeg:
        subprocess.run([ffmpeg,"-y","-loglevel","error","-i",str(raw),"-af",
                        "afade=t=in:st=0:d=2,afade=t=out:st=86:d=4,alimiter=limit=0.90",
                        "-t","90","-ar","22050","-ac","2",str(wav)],check=True)
        raw.unlink(missing_ok=True)
    else:
        raw.replace(wav)
    return True

def fallback_audio(wav,story,seconds=90,rate=22050):
    """Lightweight procedural orchestral approximation, independent of SoundFont."""
    chords=[(220,261.63,329.63),(174.61,220,261.63),(196,246.94,293.66),(164.81,196,246.94)]
    digest=hashlib.sha256((story.get("title","")+story.get("ko","")).encode()).digest()
    offset=digest[0]%4
    with wave.open(str(wav),"wb") as wf:
        wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(rate)
        for start in range(0,seconds*rate,4096):
            buf=bytearray()
            for i in range(start,min(start+4096,seconds*rate)):
                t=i/rate;chord=chords[(int(t//6)+offset)%4]
                act=0 if t<30 else 1 if t<60 else 2 if t<80 else 3
                amp=[.35,.55,.75,.28][act]
                fade=max(0,min(1,t/2,(seconds-t)/4))
                note=chord[int(t/.75)%3]
                decay=math.exp(-5*(t%.75))
                piano=decay*(math.sin(2*math.pi*note*t)+.2*math.sin(4*math.pi*note*t))
                cello=math.sin(2*math.pi*chord[0]/2*t)
                strings=sum(math.sin(2*math.pi*f*t+.2*math.sin(2*math.pi*5*t)) for f in chord)/3
                flute=math.sin(2*math.pi*chord[2]*2*t) if act>=1 else 0
                horn=math.sin(2*math.pi*chord[0]*t) if act==2 else 0
                value=amp*fade*(.32*piano+.17*cello+.23*strings+.12*flute+.13*horn)
                buf.extend(struct.pack("<h",int(22000*max(-.94,min(.94,value)))))
            wf.writeframes(buf)

def generate(story,out_dir,soundfont=None):
    out_dir=Path(out_dir);out_dir.mkdir(parents=True,exist_ok=True)
    midi=out_dir/"original_orchestra_90s.mid"
    wav=out_dir/"original_orchestra_90s.wav"
    info=compose(story,midi)
    used=False
    try:
        used=render_with_soundfont(midi,wav,soundfont)
    except (subprocess.SubprocessError,OSError) as exc:
        print("SoundFont rendering failed; using synthesizer:",str(exc))
    if not used:
        fallback_audio(wav,story)
    info.update({"renderer":"fluidsynth_soundfont" if used else "procedural_fallback",
                 "midi":str(midi),"wav":str(wav)})
    (out_dir/"music_manifest.json").write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding="utf-8")
    return info

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--story",type=Path,required=True)
    p.add_argument("--output-dir",type=Path,default=Path("orchestra_output"))
    p.add_argument("--soundfont",default=os.getenv("HEOGONGJANG_SOUNDFONT"))
    args=p.parse_args()
    story=json.loads(args.story.read_text(encoding="utf-8"))
    print(json.dumps(generate(story,args.output_dir,args.soundfont),ensure_ascii=False,indent=2))
