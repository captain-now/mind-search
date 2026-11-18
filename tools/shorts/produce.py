#!/usr/bin/env python3
"""AI Heogongjang: create an original narrated bilingual Short and optionally upload."""
import asyncio, datetime as dt, json, math, os, random, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import edge_tts
import requests

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "tools" / "shorts" / "output"
OUT.mkdir(parents=True, exist_ok=True)
TODAY = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).date().isoformat()
SITE = "https://captain-now.github.io/mind-search/"
FONT = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"

def api_story():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY missing; refusing to publish a non-generated story.")
    prompt = ("Create one original Korean reflective meditation short for date " + TODAY +
              ". Return JSON object with keys title (Korean <=30 chars), ko (array of exactly 6 short Korean narration lines), en (array of 6 accurate English subtitle translations). " +
              "Six Korean lines combined should be 100-150 Korean characters, natural to narrate in 25-28 seconds. " +
              "Theme: life, compassion, peace, nature, mindfulness, or impermanence; vary by date. No religious proselytizing. " +
              "End with a moving, grounded insight. Do not include author credit in the six lines.")
    r = requests.post("https://api.openai.com/v1/chat/completions",
        headers={"Authorization": "Bearer " + key, "Content-Type":"application/json"},
        json={"model":os.getenv("OPENAI_MODEL","gpt-4o-mini"),"messages":[{"role":"user","content":prompt}],
              "response_format":{"type":"json_object"},"temperature":0.9},timeout=90)
    r.raise_for_status()
    data=json.loads(r.json()["choices"][0]["message"]["content"])
    if not (isinstance(data.get("ko"),list) and isinstance(data.get("en"),list) and len(data["ko"])==len(data["en"])==6):
        raise ValueError("Invalid bilingual script structure")
    return data

def background(path):
    random.seed(TODAY)
    w,h=720,1280
    im=Image.new("RGB",(w,h))
    pix=im.load()
    for y in range(h):
        t=y/h
        for x in range(w):
            pix[x,y]=(int(14+62*t),int(35+57*t),int(64+48*t))
    d=ImageDraw.Draw(im)
    d.ellipse((290,260,430,400),fill=(250,220,151))
    for i in range(65):
        x=random.randrange(w); y=random.randrange(780)
        r=random.choice([1,1,2])
        d.ellipse((x-r,y-r,x+r,y+r),fill=(190,207,208))
    for base,color,amp in [(790,(34,78,89),95),(920,(23,62,75),110),(1060,(12,43,59),95)]:
        pts=[(0,h)]
        pts.extend((x,int(base+amp*math.sin(x/130+base/170)+30*math.sin(x/57))) for x in range(0,w+10,10))
        pts.extend([(w,h)])
        d.polygon(pts,fill=color)
    im.save(path)

def ass_escape(s):
    return str(s).replace("\\","\\\\").replace("{","\\{").replace("}","\\}").replace("\n","\\N")
def stamp(t):
    cs=round(t*100); return f"{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}"
def subtitles(story,path):
    header="""[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Korean,NanumGothic,42,&H00FFFFFF,&H00FFFFFF,&H0010202A,&H90000000,1,0,0,0,100,100,0,0,1,3,1,2,45,45,270,1
Style: English,DejaVu Sans,26,&H00F2F2F2,&H00FFFFFF,&H0010202A,&H90000000,0,0,0,0,100,100,0,0,1,2,1,2,50,50,205,1
Style: Credit,NanumGothic,29,&H00FFFFFF,&H00FFFFFF,&H0010202A,&H90000000,1,0,0,0,100,100,0,0,1,2,1,2,35,35,110,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines=[header]
    for i,(ko,en) in enumerate(zip(story["ko"],story["en"])):
        start=1+i*4.6; end=min(29,start+4.6)
        for style,txt in (("Korean",ko),("English",en)):
            lines.append(f"Dialogue: 0,{stamp(start)},{stamp(end)},{style},,0,0,0,,{ass_escape(txt)}\n")
    lines.append(f"Dialogue: 0,{stamp(27.6)},{stamp(30)},Credit,,0,0,0,,AI 허공장 (AI Heogongjang)\n")
    path.write_text("".join(lines),encoding="utf-8")

async def voice(text,path):
    await edge_tts.Communicate(text,voice="ko-KR-HyunsuMultilingualNeural",rate="+12%").save(str(path))

def run(cmd):
    subprocess.run(cmd,check=True)
def duration(path):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(path)],text=True).strip())

def upload(path,story):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    secrets=["YOUTUBE_CLIENT_ID","YOUTUBE_CLIENT_SECRET","YOUTUBE_REFRESH_TOKEN"]
    missing=[k for k in secrets if not os.getenv(k)]
    if missing: raise RuntimeError("YouTube credentials missing: "+", ".join(missing))
    creds=Credentials(token=None,refresh_token=os.environ["YOUTUBE_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YOUTUBE_CLIENT_ID"],client_secret=os.environ["YOUTUBE_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/youtube.upload"])
    yt=build("youtube","v3",credentials=creds,cache_discovery=False)
    body={"snippet":{"title":story["title"]+" | AI 허공장 #Shorts",
           "description":"🌐 NOW Mind Search 공식 홈페이지\n"+SITE+
            "\n\n— AI 허공장 (AI Heogongjang)\n#AI허공장 #마음챙김 #Shorts",
           "categoryId":"22","tags":["AI허공장","NOW Mind Search","마음챙김"]},
          "status":{"privacyStatus":"public","selfDeclaredMadeForKids":False}}
    req=yt.videos().insert(part="snippet,status",body=body,
        media_body=MediaFileUpload(str(path),mimetype="video/mp4",resumable=True))
    response=None
    while response is None: _,response=req.next_chunk()
    return "https://www.youtube.com/shorts/"+response["id"]

def main():
    story=api_story()
    base=OUT/TODAY
    bg=base.with_suffix(".png"); audio=base.with_suffix(".mp3")
    subs=base.with_suffix(".ass"); video=base.with_suffix(".mp4")
    background(bg); subtitles(story,subs)
    asyncio.run(voice(" ".join(story["ko"]),audio))
    length=duration(audio)
    if length>28:
        raise RuntimeError(f"Narration {length:.1f}s exceeds 28s; no clipped upload")
    # Original synthetic ambient music: no copyrighted source audio.
    filtergraph=(f"[0:v]subtitles='{subs}':fontsdir=/usr/share/fonts/truetype/nanum,"
                 "format=yuv420p[v];"
                 "[1:a]volume=1.7,apad=pad_dur=5[voice];"
                 "[2:a]volume=0.09,afade=t=out:st=28:d=2[music];"
                 "[voice][music]amix=inputs=2:duration=first:dropout_transition=0[a]")
    run(["ffmpeg","-y","-loop","1","-framerate","25","-i",str(bg),"-i",str(audio),
         "-f","lavfi","-i","sine=frequency=220:sample_rate=44100:duration=30",
         "-filter_complex",filtergraph,"-map","[v]","-map","[a]",
         "-t","30","-c:v","libx264","-preset","veryfast","-crf","24",
         "-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-movflags","+faststart",str(video)])
    if abs(duration(video)-30)>1: raise RuntimeError("Invalid video length")
    result={"date":TODAY,"story":story,"file":str(video)}
    if os.getenv("PUBLISH_YOUTUBE")=="true": result["youtube_url"]=upload(video,story)
    (OUT/"latest.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False))
if __name__=="__main__": main()
