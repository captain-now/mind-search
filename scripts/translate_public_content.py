#!/usr/bin/env python3
"""Translate public writings without altering Korean source or existing translations."""
import json, os, pathlib, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
LANGS=("en","zh","ja","fr","hi","ru","de")
KEY=os.environ.get("GOOGLE_TRANSLATE_API_KEY")
if not KEY:
    raise SystemExit("GOOGLE_TRANSLATE_API_KEY is missing; translation not published.")
URL="https://translation.googleapis.com/language/translate/v2?key="+urllib.parse.quote(KEY)
def translate(text, lang):
    payload=json.dumps({"q":text,"source":"ko","target":lang,"format":"text"}).encode()
    req=urllib.request.Request(URL,data=payload,headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=35) as res:
        data=json.load(res)
    from html import unescape
    result=unescape(data["data"]["translations"][0]["translatedText"]).strip()
    if not result or (result==text and any("\uac00"<=c<="\ud7a3" for c in text)):
        raise ValueError("Untranslated output for "+lang)
    return result
def update(name, fn):
    path=ROOT/name
    data=json.loads(path.read_text(encoding="utf-8"))
    changed=fn(data)
    if changed:
        path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(name, "updated" if changed else "unchanged")
def quote(d):
    if not d.get("text"): raise ValueError("Missing daily quote")
    translations=d.setdefault("translations",{})
    changed=False
    for lang in LANGS:
        if not translations.get(lang):
            translations[lang]=translate(d["text"],lang);changed=True
    return changed
def posts(d):
    changed=False
    for post in d["posts"]:
        translations=post.setdefault("translations",{})
        for lang in LANGS:
            existing=translations.get(lang) or {}
            if not isinstance(existing,dict): existing={}
            title=existing.get("title") or translate(post["title"],lang)
            body=existing.get("body") or translate(post.get("body") or post.get("text") or "",lang)
            if not existing.get("title") or not existing.get("body"):
                translations[lang]={"title":title,"body":body};changed=True
    return changed
update("daily-quote.json",quote)
update("heogongjang-posts.json",posts)
