from pathlib import Path
import re, hashlib
js_p = Path("apex-io/game.js")
js = js_p.read_text(encoding="utf-8")
new_fn = '''function runBiteIntro() {
    resetPageZoom();
    const wrap = document.getElementById("intro");
    const vid = document.getElementById("intro-vid");
    const app = document.getElementById("app");
    const afterIntro = () => {
      try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}
    };
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      try { if (vid) vid.pause(); } catch (_) {}
      if (app) app.classList.remove("waiting-intro");
      if (wrap) {
        try {
          wrap.classList.add("gone");
          setTimeout(() => { try { wrap.remove(); } catch (_) {} }, 300);
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
    const go = (e) => { try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (_) {} finish(); };
    if (skip) {
      skip.addEventListener("click", go, true);
      skip.addEventListener("touchend", go, { capture: true, passive: false });
      skip.addEventListener("pointerup", go, true);
    }
    wrap.addEventListener("click", go, true);
    wrap.addEventListener("touchend", go, { capture: true, passive: false });
    setTimeout(finish, 2000);
    setTimeout(finish, 3500);
    if (!vid) { finish(); return; }
    try {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      vid.setAttribute("muted", "");
      vid.onended = finish;
      vid.onerror = () => {
        try { wrap.style.background = '#030806 url("lobby-bg.jpg") center / cover no-repeat'; } catch (_) {}
        setTimeout(finish, 600);
      };
      vid.onstalled = () => setTimeout(finish, 1200);
      const play = vid.play();
      if (play && play.catch) play.catch(() => setTimeout(finish, 400));
    } catch (_) {
      finish();
    }
  }

  runBiteIntro();'''
pat = re.compile(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);")
if not pat.search(js):
    raise SystemExit("runBiteIntro not found")
js2 = pat.sub(new_fn, js, count=1)
if "capture: true" not in js2 or "setTimeout(finish, 2000)" not in js2:
    raise SystemExit("verify failed")
for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY", "xaman"]:
    if s not in js2:
        raise SystemExit(f"missing {s}")
js_p.write_text(js2, encoding="utf-8")
print("js_ok", hashlib.sha256(js2.encode()).hexdigest()[:16])
