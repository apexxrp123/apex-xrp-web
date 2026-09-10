from pathlib import Path
import re, hashlib

GATE = """<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, viewport-fit=cover\" />
  <meta name=\"theme-color\" content=\"#030806\" />
  <title>Apex.XRP</title>
  <style>
    html,body{margin:0;height:100%;background:#030806;color:#e8f0ea;font-family:system-ui,sans-serif}
    main{min-height:100dvh;display:grid;place-items:center;padding:24px;text-align:center}
    h1{letter-spacing:.12em;color:#e7c56a;font-size:28px;margin:0 0 8px}
    p{color:#8aa094;margin:0 0 24px;font-size:14px}
    a{display:inline-block;min-height:48px;min-width:160px;padding:14px 28px;border-radius:999px;border:1px solid #e7c56a88;background:#e7c56a;color:#2a2108;font-weight:800;font-size:16px;text-decoration:none}
  </style>
</head>
<body>
  <main>
    <div>
      <h1>APEX.XRP</h1>
      <p>Tap to open the lobby</p>
      <a href=\"app.html\">Enter</a>
    </div>
  </main>
</body>
</html>
"""

root = Path("apex-io")
# Expect good_* staged by workflow into apex-io/
js = (root / "game.js").read_text()
html = (root / "index.html").read_text() if (root / "_good_index.html").exists() is False else (root / "_good_index.html").read_text()
# workflow will write _good_* then this script reads them
if (root / "_good_index.html").exists():
    html = (root / "_good_index.html").read_text()
    js = (root / "_good_game.js").read_text()
    css = (root / "_good_styles.css").read_text()
else:
    css = (root / "styles.css").read_text()

html2, n = re.subn(r'\s*<div id="intro"[\s\S]*?</div>\s*(?=<audio id="hiss-audio"|<script)', "\n  ", html, count=1)
if n != 1 and 'id="intro"' in html:
    html2, n = re.subn(r'<div id="intro"[\s\S]*?</button>\s*</div>\s*', "", html, count=1)
html = html2
if 'id="intro"' in html:
    raise SystemExit("intro still present")
html = html.replace("waiting-intro", "")
html = re.sub(r'<video id="coil-vid"[^>]*>\s*(?:</video>)?', '<video id="coil-vid" playsine muted preload="none"></video>', html, count=1)
html = re.sub(r'<audio id="hiss-audio"[^>]*>\s*(?:</audio>)?', '<audio id="hiss-audio" src="hiss.mp3" preload="none"></audio>', html, count=1)
html = html.replace("</video></video>", "</video>")
if 'src="game.js"' not in html:
    html = html.replace("</body>", '<script src="game.js"></script>\n</body>')
if "intro-boot.js" not in html:
    html = html.replace('<script src="game.js"></script>', '<script src="intro-boot.js"></script>\n<script src="game.js"></script>')

old_art = (
    "const lobbyArt = new Image();\n"
    "  lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };\n"
    "  lobbyArt.src = \"lobby-bg.jpg\";"
)
new_art = "const lobbyArt = new Image();"
if old_art not in js:
    raise SystemExit("lobbyArt block missing in good game.js")
js = js.replace(old_art, new_art, 1)
marker = "  renderWallets();\n"
if marker not in js:
    raise SystemExit("renderWallets boot missing")
js = js.replace(
    marker,
    "  renderWallets();\n"
    "  try {\n"
    "    lobbyArt.onload = () => { try { if (state.mode === \"lobby\") render(); } catch (_) {} };\n"
    "    lobbyArt.src = \"lobby-bg.jpg\";\n"
    "  } catch (_) {}\n",
    1,
)

css = re.sub(r"\.intro \{[\s\S]*?\n\}", ".intro { display: none !important; }\n", css, count=1)

for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY", "renderWallets", "paintPreview"]:
    if s not in js:
        raise SystemExit("missing " + s)
if "startApexLoop" in js:
    raise SystemExit("startApexLoop should not be in restored good build")

(root / "index.html").write_text(GATE)
(root / "app.html").write_text(html)
(root / "game.js").write_text(js)
(root / "styles.css").write_text(css)
(root / "intro-boot.js").write_text("/* gate entry - lobby is app.html */\n")
print("ok", hashlib.sha256(js.encode()).hexdigest()[:10], "app", len(html), "gate", len(GATE))
