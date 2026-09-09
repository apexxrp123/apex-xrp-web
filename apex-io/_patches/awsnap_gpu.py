from pathlib import Path
import re, hashlib
idx_p, css_p, js_p = Path("apex-io/index.html"), Path("apex-io/styles.css"), Path("apex-io/game.js")
idx, css, js = idx_p.read_text(), css_p.read_text(), js_p.read_text()
intro = """  <div id=\"intro\" class=\"intro\" role=\"dialog\" aria-label=\"Apex.XRP\">
    <div class=\"intro-copy\"><strong>APEX.XRP</strong><span>Apex Predator. Hunt the canopy.</span></div>
    <button type=\"button\" class=\"intro-skip\" id=\"intro-skip\">Skip</button>
  </div>
"""
if not re.search(r'<div id="intro"[\s\S]*?<audio id="hiss-audio"', idx):
    raise SystemExit("intro missing")
idx = re.sub(r'  <div id="intro"[\s\S]*?\n  <audio id="hiss-audio"', intro + "  <audio id=\"hiss-audio\"", idx, count=1)
if "intro.mp4" in idx or "intro-vid" in idx: raise SystemExit("mp4 left")
idx = re.sub(r'<video id="coil-vid"[^>]*>\s*(?:</video>)?', '<video id="coil-vid" playsinline muted preload="none"></video>', idx, count=1)
idx = idx.replace("</video></video>", "</video>")
idx = re.sub(r'<audio id="hiss-audio"[^>]*>\s*(?:</audio>)?', '<audio id="hiss-audio" src="hiss.mp3" preload="none"></audio>', idx, count=1)
idx = idx.replace('src="logo.png"', 'src="logo-lite.jpg"', 2)
if "intro-boot.js" not in idx:
    idx = idx.replace('<script src="game.js"></script>', '<script src="intro-boot.js"></script>\n<script src="game.js"></script>', 1)
css = re.sub(r"\.intro \{[\s\S]*?\n\}", ".intro {\n  position: fixed; inset: 0; z-index: 40;\n  background: #030806;\n  display: grid; place-items: center;\n}", css, count=1)
css = css.replace('url("lobby-bg.jpg") center / cover no-repeat fixed;', "")
css = css.replace('url("lobby-bg.jpg") center / cover no-repeat;', "")
css = css.replace('url("lobby-bg.jpg") center / cover', "")
css = css.replace('url("lobby-bg.jpg")', 'url("lobby-bg-lite.jpg")')
css = re.sub(r"body \{\s*font-family:[^}]+\}", 'body {\n  font-family: "Trebuchet MS", "Segoe UI", sans-serif;\n  background: #030806;\n  color: var(--text);\n  overflow: hidden;\n}', css, count=1)
css = re.sub(r"\.arena-wrap \{[\s\S]*?\n\}", '.arena-wrap {\n  position: relative;\n  background: #030806;\n}\n.arena-wrap.art-ready {\n  background: linear-gradient(180deg, rgba(4,10,6,0.2), rgba(4,10,6,0.35)), url("lobby-bg-lite.jpg") center / cover no-repeat;\n}', css, count=1)
css = re.sub(r"\s*backdrop-filter:\s*[^;]+;", "\n  backdrop-filter: none;", css)
css += "\n.side, .overlay, .side.right { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }\n@media (max-width: 900px) { .app { transform: none !important; width: 100% !important; height: 100dvh !important; } }\n"
js = js.replace('lobbyArt.src = "lobby-bg.jpg";', 'lobbyArt.src = "";\n  function loadLobbyArt() {\n    try {\n      const wrap = document.querySelector(".arena-wrap");\n      if (wrap) wrap.classList.add("art-ready");\n      if (!lobbyArt.src || lobbyArt.src.indexOf("lobby-bg") < 0) {\n        lobbyArt.onload = () => { if (state.mode === "lobby") render(); };\n        lobbyArt.src = "lobby-bg-lite.jpg";\n      }\n    } catch (_) {}\n  }\n  setTimeout(loadLobbyArt, 2500);\n')
js = js.replace('"lobby-bg.jpg"', '"lobby-bg-lite.jpg"')
js = js.replace('src="logo.png"', 'src="logo-lite.jpg"')
js = js.replace("""    if (app && window.innerWidth <= 980 && state.mode !== "play") {
      const s = Math.min(window.innerWidth / 1100, window.innerHeight / 720);
      app.style.transform = "scale(" + s + ")";
    } else if (app) app.style.transform = "";""", """    if (app) app.style.transform = "";""", 1)
for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY"]:
    if s not in js: raise SystemExit("missing "+s)
idx_p.write_text(idx); css_p.write_text(css); js_p.write_text(js)
print("ok", hashlib.sha256(js.encode()).hexdigest()[:10])
