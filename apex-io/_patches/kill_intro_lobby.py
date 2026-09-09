from pathlib import Path
import re, hashlib
idx_p, css_p, js_p = Path("apex-io/index.html"), Path("apex-io/styles.css"), Path("apex-io/game.js")
idx, css, js = idx_p.read_text(), css_p.read_text(), js_p.read_text()

idx2, n = re.subn(
    r'\s*<div id="intro"[\s\S]*?</div>\s*(?=<audio id="hiss-audio"|<script)',
    "\n  ",
    idx,
    count=1,
)
if n != 1 and 'id="intro"' in idx:
    idx2, n = re.subn(r'<div id="intro"[\s\S]*?</button>\s*</div>\s*', "", idx, count=1)
idx = idx2
if 'id="intro"' in idx:
    raise SystemExit("intro still present")
idx = idx.replace('<div class="app waiting-intro" id="app">', '<div class="app" id="app">')
idx = idx.replace('class="app waiting-intro"', 'class="app"')
if 'src="game.js"' not in idx:
    if "intro-boot.js" in idx:
        idx = idx.replace('<script src="intro-boot.js"></script>', '<script src="intro-boot.js"></script>\n<script src="game.js"></script>', 1)
    else:
        idx = idx.replace("</body>", '<script src="game.js"></script>\n</body>', 1)

Path("apex-io/intro-boot.js").write_text(
    "/* No splash — lobby first. */\n(function(){try{var a=document.getElementById(\"app\");if(a)a.classList.remove(\"waiting-intro\");var w=document.getElementById(\"intro\");if(w){try{w.remove();}catch(e){w.style.display=\"none\";}}}catch(e){}})();\n"
)

css = re.sub(r"\.intro \{[\s\S]*?\n\}", ".intro { display: none !important; }\n", css, count=1)
css = re.sub(r"\s*backdrop-filter:\s*[^;]+;", "\n  backdrop-filter: none;", css)
if ".intro{display:none!important}" not in css.replace(" ", ""):
    css += "\n.intro { display: none !important; }\n.side, .overlay { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }\n"

if "function runBiteIntro()" in js:
    m = re.search(r"function runBiteIntro\(\) \{[\s\S]*?\n  \}\n\n  runBiteIntro\(\);", js)
    if m:
        js = js[:m.start()] + """function runBiteIntro() {
    const wrap = document.getElementById("intro");
    const app = document.getElementById("app");
    if (app) app.classList.remove("waiting-intro");
    if (wrap) { try { wrap.remove(); } catch (_) {} }
    try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}
  }

  runBiteIntro();""" + js[m.end():]

for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY"]:
    if s not in js:
        raise SystemExit("missing " + s)

idx_p.write_text(idx)
css_p.write_text(css)
js_p.write_text(js)
print("ok", hashlib.sha256(idx.encode()).hexdigest()[:10])
