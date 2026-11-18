#!/usr/bin/env python3
"""AI 허공장 인류에게 남기는 글: 90s / 1fps / 15 photoreal scenes / bilingual / original music.
Usage: python tools/shorts/humanity_essay_video.py --story story.json --images-dir photos
Story JSON: {"title":"...", "ko":"full Korean essay", "en":"complete English translation"}
Required --generate-images uses OpenAI Images API (15 new images; API charges apply).\nExisting images cannot be reused.
Never uploads to YouTube.
"""
import argparse, json, math, os, re, subprocess, wave, struct, base64, time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE=Path(__file__).resolve().parent
CFG=json.loads((HERE/"humanity_essay_90s.json").read_text(encoding="utf-8"))
FONT="/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
ENFONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def split_paragraphs(s, n=15):
    paragraphs=[p.strip() for p in re.split(r"\n\s*\n",s) if p.strip()]
    sentences=[]
    for p in paragraphs:
        sentences.extend([v.strip() for v in re.split(r"(?<=[.!?。！？])\s+",p) if v.strip()])
    if not sentences: raise ValueError("Empty essay")
    chunks=[""]*n
    total=sum(len(x) for x in sentences)
    target=total/n
    i=0; running=0
    for sent in sentences:
        if i<n-1 and running>=target*(i+1):
            i+=1
        chunks[i]+=(" " if chunks[i] else "")+sent
        running+=len(sent)
    return chunks

def wrap(text,font,maxwidth,draw):
    words=text.split()
    lines=[]; line=""
    for word in words:
        trial=(line+" "+word).strip()
        if draw.textbbox((0,0),trial,font=font)[2]<=maxwidth:
            line=trial
        else:
            if line: lines.append(line)
            line=word
            while draw.textbbox((0,0),line,font=font)[2]>maxwidth and len(line)>1:
                cut=len(line)-1
                while cut>1 and draw.textbbox((0,0),line[:cut],font=font)[2]>maxwidth: cut-=1
                lines.append(line[:cut]);line=line[cut:]
    if line:lines.append(line)
    return lines

def image_prompt(ko, index):
    return ("Vertical 9:16 cinematic photorealistic film still for an inspirational Korean humanist story. "
            "Scene "+str(index+1)+" of 15, illustrate this excerpt faithfully: "+ko[:400]+". "
            "Natural lighting, emotional visual storytelling, consistent realistic people, no text, no lettering, no watermark.")

def generate_images(plan, directory):
    import requests
    key=os.environ.get("OPENAI_API_KEY")
    if not key: raise RuntimeError("OPENAI_API_KEY required for photorealistic image generation")
    directory.mkdir(parents=True,exist_ok=True)
    from story_scene_planner import scene_prompt, verify_scene\n    for i,scene in enumerate(plan['scenes']):
        dst=directory/f"{i+1:02}.png"
        if dst.exists():
            raise FileExistsError(f"Refusing to reuse an existing scene image: {dst}. Use a fresh empty images directory.")
        resp=requests.post("https://api.openai.com/v1/images/generations",
            headers={"Authorization":"Bearer "+key},
            json={"model":os.getenv("HEOGONGJANG_IMAGE_MODEL","gpt-image-1"),"prompt":scene_prompt(plan,scene),
                  "size":"1024x1536","n":1},timeout=240)
        resp.raise_for_status()
        data=resp.json()["data"][0]
        if "b64_json" in data: dst.write_bytes(base64.b64decode(data["b64_json"]))
        elif "url" in data:
            rr=requests.get(data["url"],timeout=90);rr.raise_for_status();dst.write_bytes(rr.content)
        else:raise RuntimeError("Image API returned no image")
        try:\n            verdict=verify_scene(dst,plan,scene)\n        except Exception:\n            dst.unlink(missing_ok=True)\n            raise\n        print("Generated and verified",dst,verdict,flush=True)

def synth_music(path, seconds=90, sample_rate=22050):
    """Original procedural cinematic-orchestral approximation, not live orchestra samples.

    0-30s gentle piano/cello; 30-60s strings/flute build;
    60-80s layered orchestral climax; 80-90s soft string resolution.
    """
    chords = [
        (220.00, 261.63, 329.63),  # Am
        (174.61, 220.00, 261.63),  # F
        (196.00, 246.94, 293.66),  # G
        (164.81, 196.00, 246.94),  # Em
    ]
    def sine(freq, t):
        return math.sin(2 * math.pi * freq * t)
    def envelope(t):
        return max(0.0, min(1.0, t / 2.0, (seconds-t) / 4.0))
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        block = 4096
        for start in range(0, seconds * sample_rate, block):
            samples = bytearray()
            for idx in range(start, min(start+block, seconds*sample_rate)):
                t = idx / sample_rate
                chord = chords[int(t//7.5) % len(chords)]
                bass = chord[0] / 2
                beat = t % 0.625
                note = chord[int(t / 0.625) % 3]
                piano = math.exp(-5 * beat) * (sine(note,t) + 0.23*sine(note*2,t))
                cello = 0.5*sine(bass,t) + 0.16*sine(bass*2,t)
                vibrato = 1 + 0.003*sine(5.2,t)
                strings = sum((sine(f*vibrato,t)+0.20*sine(f*2*vibrato,t)) for f in chord) / 3
                flute = sine(chord[2]*2,t) + 0.08*sine(chord[2]*4,t)
                horn = 0.7*sine(chord[0],t) + 0.22*sine(chord[0]*2,t) + 0.1*sine(chord[0]*3,t)
                # Rounded percussion pulse; deliberately gentle under subtitles.
                pulse = math.exp(-18*(t%2.5)) * (sine(70,t)+0.3*sine(110,t))
                if t < 30:
                    value = 0.27*piano + 0.17*cello + 0.07*strings
                elif t < 60:
                    k = (t-30)/30
                    value = 0.20*piano + 0.18*cello + (0.13+0.12*k)*strings + (0.04+0.07*k)*flute
                elif t < 80:
                    k = min(1.0,(t-60)/7)
                    value = 0.12*piano + 0.16*cello + (0.26+0.07*k)*strings + 0.10*flute + 0.15*k*horn + 0.07*k*pulse
                else:
                    k = (seconds-t)/10
                    value = 0.10*piano + 0.14*cello + 0.20*max(0,k)*strings + 0.04*max(0,k)*flute
                amp = max(-0.95, min(0.95, value * envelope(t)))
                samples.extend(struct.pack("<h", int(18000*amp)))
            wf.writeframes(samples)

def render(story,images_dir,out):
    ko=split_paragraphs(story["ko"]);en=split_paragraphs(story["en"])
    files=sorted([p for p in images_dir.iterdir() if p.suffix.lower() in (".png",".jpg",".jpeg",".webp")])
    if len(files)!=15:raise ValueError(f"Expected 15 photorealistic photos; found {len(files)}")
    frames=out/"frames";frames.mkdir(parents=True,exist_ok=True)
    w,h=CFG["width"],CFG["height"]
    for i,path in enumerate(files):
        # Fill the entire 9:16 phone frame: crop-to-cover, never letterbox.
        base=ImageOps.fit(Image.open(path).convert("RGB"),(w,h),method=Image.Resampling.LANCZOS,centering=(0.5,0.5))
        for second in range(6):
            im=base.copy()
            overlay=Image.new("RGBA",(w,h),(0,0,0,0));d=ImageDraw.Draw(overlay)
            # Transparent subtitle background: no box; text outline and shadow only.
            ko_txt=ko[i];en_txt=en[i]
            ksize=24;esize=17
            while True:
                kfont=ImageFont.truetype(FONT,ksize)
                klines=wrap(ko_txt,kfont,w-62,d)
                if len(klines)*33<=195 or ksize<=15:break
                ksize-=1
            while True:
                efont=ImageFont.truetype(ENFONT,esize)
                elines=wrap(en_txt,efont,w-62,d)
                if len(elines)*24<=157 or esize<=11:break
                esize-=1
            y=CFG.get("subtitles",{}).get("top_margin_px",58)
            for line in klines:
                d.text((w//2+2,y+2),line,font=kfont,anchor="mt",fill=(0,0,0,180))
                d.text((w//2,y),line,font=kfont,anchor="mt",fill="white",stroke_width=2,stroke_fill="black");y+=ksize+7
            y=max(y+15,250)
            for line in elines:
                d.text((w//2+2,y+2),line,font=efont,anchor="mt",fill=(0,0,0,180))
                d.text((w//2,y),line,font=efont,anchor="mt",fill="#F5E7C9",stroke_width=2,stroke_fill="black");y+=esize+6
            if y>435:raise ValueError(f"Scene {i+1} has too much text for readable captions; extend duration or reduce text")
            im=Image.alpha_composite(im.convert("RGBA"),overlay).convert("RGB")
            im.save(frames/f"{i*6+second:03}.jpg",quality=88)
    from orchestra_composer import generate as generate_orchestra\n    music_info=generate_orchestra(story,out,os.getenv("HEOGONGJANG_SOUNDFONT"))\n    music=Path(music_info["wav"])
    video=out/"humanity_essay_90s_1fps.mp4"
    subprocess.run(["ffmpeg","-y","-hide_banner","-loglevel","error","-framerate","1","-i",str(frames/"%03d.jpg"),
                    "-i",str(music),"-t","90","-c:v","libx264","-pix_fmt","yuv420p",
                    "-c:a","aac","-b:a","128k","-movflags","+faststart",str(video)],check=True)
    meta=subprocess.check_output(["ffprobe","-v","error","-show_entries","stream=r_frame_rate,nb_frames",
          "-of","json",str(video)],text=True)
    print(json.dumps({"video":str(video),"metadata":json.loads(meta)},ensure_ascii=False))
    return video

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--story",required=True,type=Path)
    p.add_argument("--images-dir",required=True,type=Path)
    p.add_argument("--output-dir",default="humanity_video_output",type=Path)
    p.add_argument("--generate-images",action="store_true")
    a=p.parse_args()
    story=json.loads(a.story.read_text(encoding="utf-8"))
    if not all(isinstance(story.get(k),str) and story[k].strip() for k in ("title","ko","en")):
        raise ValueError("Story must have nonempty title, ko full text, en full translation")
    if not a.generate_images:
        raise RuntimeError("This essay profile requires 15 freshly generated story-specific images. Pass --generate-images and use a new empty --images-dir.")
    if a.images_dir.exists() and any(a.images_dir.iterdir()):
        raise FileExistsError("Image directory must be empty: reusing previous photos is prohibited.")
    from story_scene_planner import plan_story\n    a.output_dir.mkdir(parents=True,exist_ok=True)\n    plan=plan_story(story,a.output_dir)\n    generate_images(plan,a.images_dir)
    a.output_dir.mkdir(parents=True,exist_ok=True)
    render(story,a.images_dir,a.output_dir)

if __name__=="__main__":main()
