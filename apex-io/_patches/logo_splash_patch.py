from pathlib import Path
import re, hashlib
js_p = Path("apex-io/game.js")
js = js_p.read_text(encoding="utf-8")
new_fn = '''function runBiteIntro() {
    // No intro — lobby loads immediately.
    const wrap = document.getElementById("intro");
    const app = document.getElementById("app");
    if (app) app.classList.remove("waiting-intro");
    if (wrap) { try { wrap.remove(); } catch (_) {} }
    try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}
  }

  runBiteIntro();'''
pat = re.compile(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);")
if not pat.search(js):
    raise SystemExit("runBiteIntro not found")
cur = pat.search(js).group(0)
if "No intro — lobby loads immediately" in cur and "intro-vid" not in cur:
    print("already patched", hashlib.sha256(js.encode()).hexdigest())
    raise SystemExit(0)
js2 = pat.sub(new_fn, js, count=1)
block = pat.search(js2).group(0)
if "No intro — lobby loads immediately" not in block:
    raise SystemExit("verify failed")
js_p.write_text(js2, encoding="utf-8")
print("patched", hashlib.sha256(js2.encode()).hexdigest())
