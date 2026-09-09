from pathlib import Path
import re, hashlib

idx_p = Path("apex-io/index.html")
css_p = Path("apex-io/styles.css")
idx = idx_p.read_text(encoding="utf-8")
css = css_p.read_text(encoding="utf-8")

idx = idx.replace('<div class="app waiting-intro" id="app">', '<div class="app" id="app">', 1)
idx = re.sub(r"\n?\s*<div id=\"intro\"[\s\S]*?</div>\s*(?=<audio id=\"hiss-audio\")", "\n  ", idx, count=1)

idx2, n1 = re.subn(
    r'<video id="coil-vid"[^>]*>\s*',
    '<video id="coil-vid" playsinline muted preload="none"></video>\n            ',
    idx,
    count=1,
)
if n1 != 1 and not ('id="coil-vid"' in idx2 and 'coil-draw.mp4' not in idx2):
    raise SystemExit(f"coil-vid replace failed n={n1}")

idx2 = re.sub(
    r'<audio id="hiss-audio"[^>]*>\s*(?:</audio>)?',
    '<audio id="hiss-audio" src="hiss.mp3" preload="none"></audio>',
    idx2,
    count=1,
)
if "coil-draw.mp4" in idx2:
    raise SystemExit("coil-draw.mp4 still in index")

css2 = css.replace(
    'url("lobby-bg.jpg") center / cover no-repeat fixed;',
    'url("lobby-bg.jpg") center / cover no-repeat;',
    1,
)
if ".intro {" in css2:
    head = css2.split(".intro {", 1)[1][:100]
    if "display: none !important" not in head:
        css2 = re.sub(r"\.intro \{[\s\S]*?\n\}", ".intro {\n  display: none !important;\n}", css2, count=1)

idx_p.write_text(idx2, encoding="utf-8")
css_p.write_text(css2, encoding="utf-8")
print("html_ok", hashlib.sha256(idx2.encode()).hexdigest()[:16])
