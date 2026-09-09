from pathlib import Path
import re, hashlib
js_p = Path("apex-io/game.js")
js = js_p.read_text(encoding="utf-8")
new_fn = '''function runBiteIntro() {
    // Logo splash only — no intro.mp4 (video was crashing mobile/Chrome tabs).
    const wrap = document.getElementById("intro");
    const app = document.getElementById("app");
    const afterIntro = () => {
      try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}
    };
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      if (app) app.classList.remove("waiting-intro");
      if (wrap) {
        try {
          wrap.classList.add("gone");
          setTimeout(() => { try { wrap.remove(); } catch (_) {} }, 250);
        } catch (_) {
          try { wrap.remove(); } catch (_) {}
        }
      }
      afterIntro();
    }
    if (!wrap || TRAILER) {
      if (wrap) { try { wrap.remove(); } catch (_) {} }
      if (app) app.classList.remove("waiting-intro");
      afterIntro();
      return;
    }
    const skip = document.getElementById("intro-skip");
    if (skip) {
      skip.onclick = (e) => { try { e.preventDefault(); e.stopPropagation(); } catch (_) {} finish(); };
      skip.addEventListener("touchend", (e) => { e.preventDefault(); e.stopPropagation(); finish(); }, { passive: false });
    }
    wrap.addEventListener("click", (e) => {
      if (e.target && e.target.id === "intro-skip") return;
      finish();
    });
    setTimeout(finish, 1200);
    setTimeout(finish, 2500);
  }

  runBiteIntro();'''
pat = re.compile(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);")
if not pat.search(js):
    raise SystemExit("runBiteIntro not found")
if "Logo splash only" in js and "intro-vid" not in pat.search(js).group(0):
    print("already patched", hashlib.sha256(js.encode()).hexdigest())
    raise SystemExit(0)
js2 = pat.sub(new_fn, js, count=1)
block = pat.search(js2).group(0)
if "Logo splash only" not in block or "intro-vid" in block:
    raise SystemExit("verify failed")
js_p.write_text(js2, encoding="utf-8")
print("patched", hashlib.sha256(js2.encode()).hexdigest())
