"""Story-first scene planning and visual fidelity verification for humanity essays."""
import base64,json,os,re
from pathlib import Path

def _client():
    from openai import OpenAI
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY required for story analysis and visual verification")
    return OpenAI()

def _json_response(messages):
    client=_client()
    result=client.chat.completions.create(
        model=os.getenv("HEOGONGJANG_STORY_MODEL","gpt-4o-mini"),
        messages=messages,response_format={"type":"json_object"},temperature=0.2)
    return json.loads(result.choices[0].message.content)

def plan_story(story,out):
    """Read FULL essay first, then create 15 ordered faithful film scenes."""
    if not all(story.get(k) for k in ("title","ko","en")):
        raise ValueError("Story title, complete Korean and English texts are required")
    plan=_json_response([
        {"role":"system","content":(
          "You are a strict Korean story continuity editor. Read the COMPLETE Korean essay before proposing visuals. "
          "Return JSON with keys: synopsis, setting, characters (array with stable appearance descriptions), "
          "props (array), scenes (exactly 15 objects each with index 1..15, ko_excerpt, visual, characters, setting). "
          "Visuals must depict concrete actual actions and settings in the original essay, chronologically. "
          "Do not invent unrelated stories, trees, children, locations or events. For philosophical ending scenes "
          "use only motifs/locations established in the essay. Preserve age, gender, season, location and props. "
          "No lettering or captions in images. Each scene is 6 seconds.")}
        ,{"role":"user","content":json.dumps(story,ensure_ascii=False)}
    ])
    scenes=plan.get("scenes")
    if not isinstance(scenes,list) or len(scenes)!=15:
        raise ValueError("Story planner must produce exactly 15 scenes")
    for i,s in enumerate(scenes,1):
        if s.get("index")!=i or not all(isinstance(s.get(k),str) and s[k].strip() for k in ("ko_excerpt","visual","setting")):
            raise ValueError("Invalid scene plan at index "+str(i))
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    (out/"story_scene_plan.json").write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding="utf-8")
    return plan

def scene_prompt(plan,scene):
    return (
      "Photorealistic cinematic 9:16 vertical full-screen smartphone film still, no borders, no letterbox, no text, no typography, no watermark. Compose characters and main action in center and lower two-thirds, leaving the top area visually calm for transparent Korean and English subtitle overlays. "
      "You MUST portray the scene from the original Korean essay, NOT a generic inspirational story. "
      "Full story synopsis: "+str(plan.get("synopsis",""))[:1000]+". "
      "Established location and season: "+str(plan.get("setting",""))[:500]+". "
      "Fixed characters: "+json.dumps(plan.get("characters",[]),ensure_ascii=False)[:1800]+". "
      "Recurring props: "+json.dumps(plan.get("props",[]),ensure_ascii=False)[:500]+". "
      "Scene "+str(scene["index"])+" of 15: "+scene["visual"]+". "
      "Original excerpt: "+scene["ko_excerpt"]+". "
      "Maintain the SAME characters, ages, clothing, locations and props across all scenes. "
      "No unrelated trees, gardens, children, animals, mountains, sunsets, or other substitute narrative."
    )

def verify_scene(image_path,plan,scene):
    """Vision check: reject wrong story or conspicuously mismatched people/props."""
    raw=Path(image_path).read_bytes()
    encoded=base64.b64encode(raw).decode("ascii")
    verdict=_json_response([
      {"role":"system","content":(
        "You are a strict visual continuity and story-faithfulness reviewer. "
        "Return JSON {pass:boolean,reason:string}. Reject any image whose main action, "
        "characters, age, setting or important props contradict the specified scene. "
        "Reject text-heavy posters, collages, contact sheets, or substituted unrelated narratives. "
        "Accept natural cinematic variations that do not contradict the story.")}
      ,{"role":"user","content":[
        {"type":"text","text":json.dumps({
          "story":plan.get("synopsis"),"characters":plan.get("characters"),
          "scene":scene},ensure_ascii=False)},
        {"type":"image_url","image_url":{"url":"data:image/png;base64,"+encoded,"detail":"low"}}
      ]}
    ])
    if verdict.get("pass") is not True:
        raise ValueError("Scene "+str(scene["index"])+" failed visual story check: "+str(verdict.get("reason")))
    return verdict
