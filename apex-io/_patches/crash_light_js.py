from pathlib import Path
import re, hashlib
js_p = Path("apex-io/game.js")
js = js_p.read_text(encoding="utf-8")

if "function ensureCoilVid()" not in js:
    helper = """
  function ensureCoilVid() {
    const vid = document.getElementById("coil-vid");
    if (!vid) return null;
    if (!vid.getAttribute("src") and False:
      pass
"""
    # fixed helper below
    helper = '''
  function ensureCoilVid() {
    const vid = document.getElementById("coil-vid");
    if (!vid) return null;
    if (!vid.getAttribute("src") && !vid.currentSrc) {
      vid.setAttribute("src", "coil-draw.mp4");
      try { vid.load(); } catch (_) {}
    }
    return vid;
  }
'''
    if "function playCoilBite()" not in js:
        raise SystemExit("playCoilBite missing")
    js = js.replace("function playCoilBite()", helper + "\n  function playCoilBite()", 1)

js2 = js.replace(
"""  function playCoilBite() {
    const vid = document.getElementById("coil-vid");""",
"""  function playCoilBite() {
    const vid = ensureCoilVid();""",
1)
js2 = js2.replace(
"""    fluteSfx();
    const vid = document.getElementById("coil-vid");""",
"""    fluteSfx();
    const vid = ensureCoilVid();""",
1)
js2 = js2.replace(
"""  const lobbyArt = new Image();
  lobbyArt.onload = () => { if (state.mode === "lobby") render(); };
  lobbyArt.src = "lobby-bg.jpg";""",
"""  const lobbyArt = new Image();
  lobbyArt.onload = () => { if (state.mode === "lobby") render(); };
  setTimeout(() => { try { lobbyArt.src = "lobby-bg.jpg"; } catch (_) {} }, 0);""",
1)

pat = re.compile(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);")
new_fn = """function runBiteIntro() {
    // No intro — lobby loads immediately.
    const wrap = document.getElementById("intro");
    const app = document.getElementById("app");
    if (app) app.classList.remove("waiting-intro");
    if (wrap) { try { wrap.remove(); } catch (_) {} }
    try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}
  }

  runBiteIntro();"""
if pat.search(js2):
    js2 = pat.sub(new_fn, js2, count=1)
if "ensureCoilVid" not in js2:
    raise SystemExit("ensureCoilVid missing")
js_p.write_text(js2, encoding="utf-8")
print("js_ok", hashlib.sha256(js2.encode()).hexdigest()[:16])
