#!/usr/bin/env python3
"""Heogongjang autonomous geometry-parameter experiment, standard library only.
This is NOT ML training or photorealism evaluation.
"""
import json, math, pathlib, datetime
ROOT=pathlib.Path(__file__).resolve().parent
STATE=ROOT/"state.json"
REPORT=ROOT/"report.json"
HTML=ROOT/"index.html"
DEFAULT={"head_ratio":0.135,"shoulder_ratio":0.245,"arm_ratio":0.445,"symmetry":0.89,"face_detail":0.18}
# Initial engineering targets; provisional, not validated against the reference photo.
TARGET={"head_ratio":0.13,"shoulder_ratio":0.235,"arm_ratio":0.44,"symmetry":1.0,"face_detail":0.90}
WEIGHT={"head_ratio":15,"shoulder_ratio":12,"arm_ratio":8,"symmetry":1.5,"face_detail":1.2}
STEP={"head_ratio":0.001,"shoulder_ratio":0.001,"arm_ratio":0.002,"symmetry":0.01,"face_detail":0.025}
LIMIT={"head_ratio":(.09,.19),"shoulder_ratio":(.18,.31),"arm_ratio":(.30,.55),"symmetry":(.5,1.0),"face_detail":(0,1)}
def score(p):
    return round(100*math.exp(-sum(WEIGHT[k]*(p[k]-TARGET[k])**2 for k in TARGET)),5)
def main():
    old=json.loads(STATE.read_text()) if STATE.exists() else {"generation":0,"parameters":DEFAULT,"history":[]}
    p=old["parameters"]
    candidates=[]
    for key in TARGET:
        for direction in (-1,1):
            c=p.copy()
            c[key]=round(min(LIMIT[key][1],max(LIMIT[key][0],c[key]+direction*STEP[key])),6)
            candidates.append((score(c),key,c))
    candidates.sort(key=lambda x:x[0],reverse=True)
    before=score(p)
    best,key,c=candidates[0]
    improved=best>before+0.00001
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    generation=old["generation"]+(1 if improved else 0)
    entry={"time_utc":now,"generation":generation,"before":before,"after":best if improved else before,"changed":key if improved else None,"accepted":improved}
    state={"generation":generation,"parameters":c if improved else p,"history":(old.get("history",[])+[entry])[-90:]}
    STATE.write_text(json.dumps(state,ensure_ascii=False,indent=2)+"\n")
    report={"disclaimer":"Engineering proxy score only; NOT visual likeness, AI learning, or human-quality rating.","last_run":now,"generation":generation,"score":entry["after"],"accepted":improved,"parameter_changed":entry["changed"],"parameters":state["parameters"],"target":TARGET}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    # Standalone visualization uses real SVG shapes, not a claim of a realistic 3D render.
    import html
    rows="".join("<tr><td>"+html.escape(k)+"</td><td>"+str(v)+"</td><td>"+str(TARGET[k])+"</td></tr>" for k,v in state["parameters"].items())
    page=f"""<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>허공장 자동 실험실</title><style>body{{font:16px system-ui;background:#10192a;color:#f1f5ff;max-width:720px;margin:auto;padding:24px}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #344057;padding:10px;text-align:left}}small{{color:#a9b8cc}}a{{color:#8cc6ff}}</style><h1>🌸 허공장 자동 실험실</h1><p>최근 실행: {now}</p><h2>세대 {generation} · 공학적 목표 점수 {entry["after"]:.4f}/100</h2><p>이번 실행: {"후보 개선 채택" if improved else "개선 없음 — 기존 값 유지"}</p><table><tr><th>파라미터</th><th>현재</th><th>임시 목표</th></tr>{rows}</table><p><small>주의: 이 점수는 사전에 정한 수치 목표에 대한 거리만 측정합니다. 실제 허공장 사진과의 닮음, 3D 모델 완성도, 애니메이션 자연스러움 또는 AI의 자체 학습 성능을 나타내지 않습니다. 이 실험은 모델 파라미터의 자동 최적화 기반을 검증합니다.</small></p><p><a href="../">Mind Search로 돌아가기</a></p></html>"""
    HTML.write_text(page,encoding="utf-8")
    print(json.dumps(entry,ensure_ascii=False))
if __name__=="__main__": main()
