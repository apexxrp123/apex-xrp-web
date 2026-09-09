from pathlib import Path
import hashlib, re

idx_p, app_p, js_p, css_p = Path("apex-io/index.html"), Path("apex-io/app.html"), Path("apex-io/game.js"), Path("apex-io/styles.css")
idx, js, css = idx_p.read_text(), js_p.read_text(), css_p.read_text()

if 'id="intro"' in idx:
    idx = re.sub(r'\s*<div id="intro"[\s\S]*?</div>\s*(?=<audio|<script)', "\n  ", idx, count=1)
idx = idx.replace("waiting-intro", "")

if "app.html" in idx and "game.js" not in idx and app_p.exists() and 'id="arena"' in app_p.read_text():
    pass  # already gated; still refresh gate text below
elif 'id="arena"' in idx:
    app_p.write_text(idx)
elif app_p.exists() and 'id="arena"' in app_p.read_text():
    pass
else:
    raise SystemExit("cannot find full app html to save as app.html")

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
idx_p.write_text(GATE)

old = """function loop(t) {
    const dt = Math.min(0.033, (t - state.last) / 1000 || 0.016);
    state.last = t;
    if (document.hidden) {
      requestAnimationFrame(loop);
      return;
    }
    if (state.mode === "play") update(dt);
    if (state.mode === "killcam") stepKillCam();
    if (state.mode === "lobby") paintPreview(t);
    render();
    requestAnimationFrame(loop);
  }"""
new = """function loop(t) {
    const dt = Math.min(0.033, (t - state.last) / 1000 || 0.016);
    state.last = t;
    if (document.hidden) {
      if (state.mode === "play" || state.mode === "killcam") requestAnimationFrame(loop);
      return;
    }
    if (state.mode === "play") { update(dt); render(); requestAnimationFrame(loop); return; }
    if (state.mode === "killcam") { stepKillCam(); render(); requestAnimationFrame(loop); return; }
  }"""
if old in js:
    js = js.replace(old, new, 1)

marker = "  requestAnimationFrame(loop);\n  function resetPageZoom()"
if marker in js:
    js = js.replace(
        marker,
        """  try { resize(); if (state.mode === "lobby") render(); } catch (_) {}
  function startApexLoop() {
    if (window.__apexLoop) return;
    window.__apexLoop = true;
    requestAnimationFrame(loop);
  }
  setInterval(function () {
    if ((state.mode === "play" || state.mode === "killcam") && !window.__apexLoop) startApexLoop();
    if (state.mode === "lobby") window.__apexLoop = false;
  }, 500);
  function resetPageZoom()""",
        1,
    )

js_p.write_text(js)
css = re.sub(r"\.intro \{[\s\S]*?\n\}", ".intro { display: none !important; }\n", css, count=1)
css_p.write_text(css)
Path("apex-io/intro-boot.js").write_text("/* gate entry */\n")

js2 = js_p.read_text()
for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY"]:
    if s not in js2:
        raise SystemExit("missing " + s)
gate = idx_p.read_text()
if "app.html" not in gate or "game.js" in gate:
    raise SystemExit("bad gate")
if not app_p.exists() or 'id="arena"' not in app_p.read_text():
    raise SystemExit("app.html missing arena")
print("ok", hashlib.sha256(gate.encode()).hexdigest()[:10], "app", app_p.stat().st_size)
