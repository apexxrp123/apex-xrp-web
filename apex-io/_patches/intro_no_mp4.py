from pathlib import Path
import re, hashlib

idx_p = Path("apex-io/index.html")
css_p = Path("apex-io/styles.css")
js_p = Path("apex-io/game.js")

idx = idx_p.read_text(encoding="utf-8")
css = css_p.read_text(encoding="utf-8")
js = js_p.read_text(encoding="utf-8")

# Replace intro block: NO video element (mp4 crashes tabs)
intro = """  <div id=\"intro\" class=\"intro\" role=\"dialog\" aria-label=\"Apex.XRP\">
    <div class=\"intro-copy\">
      <strong>APEX.XRP</strong>
      <span>Apex Predator. Hunt the canopy.</span>
    </div>
    <button type=\"button\" class=\"intro-skip\" id=\"intro-skip\">Skip</button>
  </div>
"""
if not re.search(r'  <div id="intro"[\s\S]*?\n  <audio id="hiss-audio"', idx):
    raise SystemExit("intro/audio anchor missing")
idx = re.sub(
    r'  <div id="intro"[\s\S]*?\n  <audio id="hiss-audio"',
    intro + "  <audio id=\"hiss-audio\"",
    idx,
    count=1,
)
if "intro.mp4" in idx or "intro-vid" in idx:
    raise SystemExit("intro mp4 still in html")

# Keep coil lazy if crash-light already applied; if coil has src, strip it
idx = re.sub(
    r'<video id="coil-vid"[^>]*>\s*(?:</video>)?',
    '<video id="coil-vid" playsinline muted preload="none"></video>',
    idx,
    count=1,
)
idx = idx.replace("</video></video>", "</video>")

if "intro-boot.js" not in idx:
    idx = idx.replace(
        '<script src="game.js"></script>',
        '<script src="intro-boot.js"></script>\n<script src="game.js"></script>',
        1,
    )

# hiss: no preload
idx = re.sub(
    r'<audio id="hiss-audio"[^>]*>\s*(?:</audio>)?',
    '<audio id="hiss-audio" src="hiss.mp3" preload="none"></audio>',
    idx,
    count=1,
)

# CSS: lobby-bg only once on intro; video rules unused; skip tappable
css = re.sub(
    r"\.intro \{[\s\S]*?\n\}",
    """.intro {
  position: fixed; inset: 0; z-index: 40;
  background: #030806 url("lobby-bg.jpg") center / cover no-repeat;
  display: grid; place-items: center;
}""",
    css,
    count=1,
)
css = re.sub(
    r"\.intro-skip \{[\s\S]*?\n\}",
    """.intro-skip {
  position: absolute; top: 16px; right: 16px; z-index: 100;
  background: rgba(8,18,12,0.85); color: #e8f0ea; border: 1px solid #e7c56a88;
  border-radius: 999px; padding: 12px 18px; cursor: pointer; font: inherit;
  pointer-events: auto; min-height: 44px; min-width: 72px;
}""",
    css,
    count=1,
)
# Mobile: stop 1100x720 scaled layer (GPU Aw Snap)
old_m = """  .app {
    grid-template-columns: 280px 1fr 340px;
    grid-template-rows: 1fr;
    width: 1100px;
    height: 720px;
    transform-origin: top left;
  }"""
new_m = """  .app {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    width: 100%;
    height: 100dvh;
    transform: none !important;
    transform-origin: top left;
  }"""
if old_m in css:
    css = css.replace(old_m, new_m, 1)
# body background: avoid fixed (already may be fixed-free)
css = css.replace(
    'url("lobby-bg.jpg") center / cover no-repeat fixed;',
    'url("lobby-bg.jpg") center / cover no-repeat;',
)

# game.js: runBiteIntro = image splash only (no intro-vid)
new_fn = """function runBiteIntro() {
    const wrap = document.getElementById(\"intro\");
    const app = document.getElementById(\"app\");
    const afterIntro = () => {
      try { if (typeof recordSiteVisit === \"function\") recordSiteVisit(); } catch (_) {}
    };
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      if (app) app.classList.remove(\"waiting-intro\");
      if (wrap) {
        try {
          wrap.classList.add(\"gone\");
          setTimeout(() => { try { wrap.remove(); } catch (_) {} }, 200);
        } catch (_) {
          try { wrap.remove(); } catch (_) {}
        }
      }
      afterIntro();
    }
    if (!wrap || TRAILER) {
      if (wrap) { try { wrap.remove(); } catch (_) {} }
      if (app) app.classList.remove(\"waiting-intro\");
      afterIntro();
      return;
    }
    const go = (e) => { try { if (e) { e.preventDefault(); e.stopPropagation(); } } catch (_) {} finish(); };
    const skip = document.getElementById(\"intro-skip\");
    if (skip) {
      skip.addEventListener(\"click\", go, true);
      skip.addEventListener(\"touchend\", go, { capture: true, passive: false });
    }
    wrap.addEventListener(\"click\", go, true);
    wrap.addEventListener(\"touchend\", go, { capture: true, passive: false });
    setTimeout(finish, 1500);
    setTimeout(finish, 2500);
  }

  runBiteIntro();"""

pat = re.compile(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);")
if not pat.search(js):
    raise SystemExit("runBiteIntro missing")
js2 = pat.sub(new_fn, js, count=1)

# ensureCoilVid if coil has no src - optional helper
if "function ensureCoilVid()" not in js2 and "function playCoilBite()" in js2:
    helper = """
  function ensureCoilVid() {
    const vid = document.getElementById(\"coil-vid\");
    if (!vid) return null;
    if (!vid.getAttribute(\"src\") && !vid.currentSrc) {
      vid.setAttribute(\"src\", \"coil-draw.mp4\");
      try { vid.load(); } catch (_) {}
    }
    return vid;
  }
"""
    js2 = js2.replace("function playCoilBite()", helper + "\n  function playCoilBite()", 1)
    js2 = js2.replace(
        'function playCoilBite() {\n    const vid = document.getElementById("coil-vid");',
        'function playCoilBite() {\n    const vid = ensureCoilVid();',
        1,
    )
    js2 = js2.replace(
        'fluteSfx();\n    const vid = document.getElementById("coil-vid");',
        'fluteSfx();\n    const vid = ensureCoilVid();',
        1,
    )

# Do not strip JS scale transform yet if CSS fixed - also neutralize JS scale that recreates GPU layer
js2 = js2.replace(
"""    if (app && window.innerWidth <= 980 && state.mode !== "play") {
      const s = Math.min(window.innerWidth / 1100, window.innerHeight / 720);
      app.style.transform = "scale(" + s + ")";
    } else if (app) app.style.transform = "";""",
"""    if (app) app.style.transform = "";""",
1,
)

for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY"]:
    if s not in js2:
        raise SystemExit(f"missing {s}")

idx_p.write_text(idx, encoding="utf-8")
css_p.write_text(css, encoding="utf-8")
js_p.write_text(js2, encoding="utf-8")
print("ok", hashlib.sha256(idx.encode()).hexdigest()[:10], hashlib.sha256(js2.encode()).hexdigest()[:10])
print("no mp4", "intro.mp4" not in idx)
