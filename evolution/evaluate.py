"""Heogongjang evolution lab: reproducible, conservative baseline evaluation.
This does NOT train a neural model or claim visual realism."""
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HISTORY = ROOT / "history.json"
STATUS = ROOT / "status.json"
def load(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))

def evaluate():
    # Auditable readiness tests, not subjective likeness scores.
    tests = {
        "website_entry": (ROOT.parent / "index.html").exists(),
        "video_studio_entry": (ROOT.parent / "video-studio" / "index.html").exists(),
        "evolution_policy": (ROOT / "POLICY.md").exists(),
        "evaluation_script": Path(__file__).exists(),
    }
    score = round(100 * sum(tests.values()) / len(tests))
    history = load(HISTORY, [])
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    previous = history[-1]["score"] if history else None
    result = {
        "timestamp_utc": timestamp,
        "score": score,
        "previous_score": previous,
        "change": None if previous is None else score - previous,
        "checks": tests,
        "note": "Infrastructure readiness only; NOT face likeness, animation quality, or machine learning."
    }
    history.append(result)
    HISTORY.write_text(json.dumps(history[-365:], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    STATUS.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if not all(tests.values()):
        raise SystemExit("Readiness checks failed; see status.json")

if __name__ == "__main__":
    evaluate()
