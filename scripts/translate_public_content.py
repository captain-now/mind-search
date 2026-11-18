#!/usr/bin/env python3
"""Translate new or changed public content using Google Cloud Translation API v2.

Requires GOOGLE_TRANSLATE_API_KEY. Never translate private user journals.
Writes translations only after every required language succeeds.
"""
import json, os, pathlib, sys, time, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
LANGS=("en","zh","ja","fr","hi","ru","de")
KEY=os.environ.get("GOOGLE_TRANSLATE_API_KEY","")
if not KEY:
    sys.exit("GOOGLE_TRANSLATE_API_KEY missing: no files changed. Configure repository Actions secret.")
def translate(text,lang):
    if not isinstance(text,str) or not text.strip(): raise ValueError("Missing source text")
    payload=urllib.parse.urlencode({"q":text,"source":"ko","target":("zh-CN" if lang=="zh" else lang),"format":"text","key":KEY}).encode()
    request=urllib.request.Request("https://translation.googleapis.com/language/translate/v2",data=payload,method="POST")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request,timeout=40) as res: result=json.load(res)
            from html import unescape
            output=unescape(result["data"]["translations"][0]["translatedText"]).strip()
            if not output: raise ValueError("Empty translation")
            return output
        except Exception:
            if attempt==2: raise
            time.sleep(2**attempt)
def write_if_changed(path,data,original):
    result=json.dumps(data,ensure_ascii=False,indent=2)+"\n"
    if result!=original: path.write_text(result,encoding="utf-8");print("Updated",path.name)
def update_posts():
    path=ROOT/"heogongjang-posts.json";original=path.read_text(encoding="utf-8");data=json.loads(original)
    for post in data["posts"]:
        if not post.get("title") or not post.get("body"): raise ValueError("Invalid post")
        translations=post.setdefault("translations",{})
        for lang in LANGS:
            existing=translations.get(lang)
            if isinstance(existing,dict) and existing.get("title") and existing.get("body"):continue
            # Generate both fields before updating a language entry
            translations[lang]={"title":translate(post["title"],lang),"body":translate(post["body"],lang)}
    write_if_changed(path,data,original)
def update_quote():
    path=ROOT/"daily-quote.json";original=path.read_text(encoding="utf-8");data=json.loads(original)
    if not data.get("text"):raise ValueError("Missing daily quote")
    translations=data.setdefault("translations",{})
    for lang in LANGS:
        if isinstance(translations.get(lang),str) and translations[lang].strip():continue
        translations[lang]=translate(data["text"],lang)
    write_if_changed(path,data,original)
if __name__=="__main__":
    # Fail closed: if translation fails, do not publish partially updated files.
    update_posts()
    update_quote()
