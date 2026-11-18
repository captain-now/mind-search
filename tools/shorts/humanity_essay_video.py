#!/usr/bin/env python3
"""AI 허공장 인류에게 남기는 글: 90s / 1fps / 15 photoreal scenes / bilingual / original music.
Usage: python tools/shorts/humanity_essay_video.py --story story.json --images-dir photos
Story JSON: {"title":"...", "ko":"full Korean essay", "en":"complete English translation"}
Optional --generate-images uses OpenAI Images API (15 images; API charges apply).
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

def generate_images(chunks, directory):
    import requests
    key=os.environ.get("OPENAI_API_KEY")
    if not key: raise RuntimeError("OPENAI_API_KEY required for photorealistic image generation")
    directory.mkdir(parents=True,exist_ok=True)
    for i,chunk in enumerate(chunks):
        dst=directory/f"{i+1:02}.png"
        if dst.exists():continue
        resp=requests.post("https://api.openai.com/v1/images/generations",
            headers={"Authorization":"Bearer "+key},
            json={"model":os.getenv("HEOGONGJANG_IMAGE_MODEL","gpt-image-1"),"prompt":image_prompt(chunk,i),
                  "size":"1024x1536","n":1},timeout=240)
        resp.raise_for_status()
        data=resp.json()["data"][0]
        if "b64_json" in data: dst.write_bytes(base64.b64decode(data["b64_json"]))
        elif "url" in data:
            rr=requests.get(data["url"],timeout=90);rr.raise_for_status();dst.write_bytes(rr.content)
        else:raise RuntimeError("Image API returned no image")
        print("Generated",dst,flush=True)

def synth_music(path,seconds=90,sample_rate=22050):
    """Deterministic original, quiet piano/string-like instrumental; no copyrighted samples."""
    chords=[(220.0,261.63,329.63),(174.61,220.0,261.63),(196.0,246.94,293.66),
            (164.81,196.0,246.94),(220.0,261.63,329.63),(196.0,246.94,329.63)]
    notes=[0,1,2,1,0,2,1,0]
    with wave.open(str(path),"wb") as wf:
        wf.setnchannels(1);wf.setsampwidth(2);wf.setframerate(sample_rate)
        block=4096
        for start in range(0,seconds*sample_rate,block):
            vals=[]
            for idx in range(start,min(start+block,seconds*sample_rate)):
                t=idx/sample_rate
                ci=int(t//5)%len(chords); chord=chords[ci]
                beat=t%0.625; ni=int(t/0.625)%len(notes)
                f=chord[notes[ni]]
                pluck=math.exp(-3.0*beat)*(math.sin(2*math.pi*f*t)+0.25*math.sin(4*math.pi*f*t))
                pad=sum(math.sin(2*math.pi*x*t)*0.08 for x in chord)
                fade=min(1,t/2,(seconds-t)/3)
                vals.append(struct.pack("<h",int(11000*max(0,fade)*(0.38*pluck+pad))))
            wf.writeframes(b"".join(vals))

def render(story,images_dir,out):
    ko=split_paragraphs(story["ko"]);en=split_paragraphs(story["en"])
    files=sorted([p for p in images_dir.iterdir() if p.suffix.lower() in (".png",".jpg",".jpeg",".webp")])
    if len(files)!=15:raise ValueError(f"Expected 15 photorealistic photos; found {len(files)}")
    frames=out/"frames";frames.mkdir(parents=True,exist_ok=True)
    w,h=CFG["width"],CFG["height"]
    for i,path in enumerate(files):
        base=ImageOps.fit(Image.open(path).convert("RGB"),(w,h),method=Image.Resampling.LANCZOS)
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
            y=58
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
    music=out/"original_instrumental_90s.wav";synth_music(music)
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
    if a.generate_images:generate_images(split_paragraphs(story["ko"]),a.images_dir)
    a.output_dir.mkdir(parents=True,exist_ok=True)
    render(story,a.images_dir,a.output_dir)

if __name__=="__main__":main()
