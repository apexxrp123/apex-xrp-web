from pathlib import Path
import re, hashlib
GOOD_NOTE = "f8ef713c5161c8b0e4d4b2b5abe2f96d9f3702c7"
root = Path("apex-io")
js = (root / "game.js").read_text()
html = (root / "index.html").read_text()
css = (root / "styles.css").read_text()

html2, n = re.subn(r'\s*<div id="intro"[\s\S]*?</div>\s*(?=<audio id="hiss-audio"|<script)', "\n  ", html, count=1)
if n != 1:
    html2, n = re.subn(r'<div id="intro"[\s\S]*?</button>\s*</div>\s*', "", html, count=1)
if n != 1 and 'id="intro"' in html:
    raise SystemExit("intro strip failed")
html = html2.replace("waiting-intro", "")
if 'id="intro"' in html:
    raise SystemExit("intro remains")
html = re.sub(r'<video id="coil-vid"[^>]*>\s*(?:</video>)?', '<video id="coil-vid" playsinline muted preload="none"></video>', html, count=1)
html = re.sub(r'<audio id="hiss-audio"[^>]*>\s*(?:</audio>)?', '<audio id="hiss-audio" src="hiss.mp3" preload="none"></audio>', html, count=1)

old = (
    "const lobbyArt = new Image();\n"
    "  lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };\n"
    "  lobbyArt.src = \"lobby-bg.jpg\";"
)
if old not in js:
    raise SystemExit("lobbyArt block missing")
js = js.replace(old, "const lobbyArt = new Image();", 1)
marker = "  renderWallets();\n  fetch("
if marker not in js:
    raise SystemExit("boot marker missing")
js = js.replace(
    marker,
    "  renderWallets();\n"
    "  try {\n"
    "    lobbyArt.onload = () => { try { if (state.mode === \"lobby\") render(); } catch (_) {} };\n"
    "    lobbyArt.src = \"lobby-bg.jpg\";\n"
    "  } catch (_) {}\n"
    "  fetch(",
    1,
)
if js.find("lobbyArt.src") < js.find("const state ="):
    raise SystemExit("TDZ still present")
if "renderMeta();\n    renderWallets();\n  try" in js:
    raise SystemExit("bad onchange attach")

css = re.sub(r"\s*backdrop-filter:\s*[^;]+;", "", css)
css = ".intro { display: none !important; }\nhtml,body{background:#030806!important;}\n" + css

for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY", "renderWallets", "paintPreview", "renderChat", "renderRank"]:
    if s not in js:
        raise SystemExit("missing " + s)
for s in ["wallet-grid", "skin-preview", "chat-form"]:
    if s not in html:
        raise SystemExit("missing ui " + s)

(root / "index.html").write_text(html)
(root / "game.js").write_text(js)
(root / "styles.css").write_text(css)
(root / "app.html").write_text(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta http-equiv="refresh" content="0;url=index.html"/><title>Apex.XRP</title></head><body><a href="index.html">Open lobby</a></body></html>\n'
)
(root / "intro-boot.js").write_text("/* unused */\n")
print("ok", GOOD_NOTE, hashlib.sha256(js.encode()).hexdigest()[:10], len(html), len(js))
