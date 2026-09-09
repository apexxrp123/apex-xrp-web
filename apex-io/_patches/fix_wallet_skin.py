from pathlib import Path
import hashlib

js_p = Path("apex-io/game.js")
js = js_p.read_text()

old = """const lobbyArt = new Image();
  lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };
  lobbyArt.src = \"\";
  function loadLobbyArt() {
    try {
      const wrap = document.querySelector(\".arena-wrap\");
      if (wrap) wrap.classList.add(\"art-ready\");
      if (!lobbyArt.src || lobbyArt.src.indexOf(\"lobby-bg\") < 0) {
        lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };
        lobbyArt.src = \"lobby-bg-lite.jpg\";
      }
    } catch (_) {}
  }
  setTimeout(loadLobbyArt, 2500);"""

# The above has wrong escapes because of heredoc - rebuild without backslash quotes
old = (
    "const lobbyArt = new Image();\n"
    "  lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };\n"
    "  lobbyArt.src = \"\";\n"
    "  function loadLobbyArt() {\n"
    "    try {\n"
    "      const wrap = document.querySelector(\".arena-wrap\");\n"
    "      if (wrap) wrap.classList.add(\"art-ready\");\n"
    "      if (!lobbyArt.src || lobbyArt.src.indexOf(\"lobby-bg\") < 0) {\n"
    "        lobbyArt.onload = () => { if (state.mode === \"lobby\") render(); };\n"
    "        lobbyArt.src = \"lobby-bg-lite.jpg\";\n"
    "      }\n"
    "    } catch (_) {}\n"
    "  }\n"
    "  setTimeout(loadLobbyArt, 2500);"
)

new = (
    "const lobbyArt = new Image();\n"
    "  // Do NOT set src or onload until after `state` exists (TDZ crash wiped wallets/skins).\n"
    "  function loadLobbyArt() {\n"
    "    try {\n"
    "      const wrap = document.querySelector(\".arena-wrap\");\n"
    "      if (wrap) wrap.classList.add(\"art-ready\");\n"
    "      lobbyArt.onload = () => { try { if (state.mode === \"lobby\") render(); } catch (_) {} };\n"
    "      if (!lobbyArt.src || String(lobbyArt.src).indexOf(\"lobby-bg\") < 0) {\n"
    "        lobbyArt.src = \"lobby-bg-lite.jpg\";\n"
    "      }\n"
    "    } catch (_) {}\n"
    "  }"
)

if old not in js:
    if "Do NOT set src or onload until after" in js:
        print("already patched lobbyArt")
    else:
        raise SystemExit("lobbyArt block not found")
else:
    js = js.replace(old, new, 1)

boot_old = (
    "  try { resize(); if (state.mode === \"lobby\") render(); } catch (_) {}\n"
    "  function startApexLoop() {"
)
boot_new = (
    "  try { resize(); if (state.mode === \"lobby\") render(); } catch (_) {}\n"
    "  try { renderWallets(); renderSkins(); paintPreview(); loadLobbyArt(); } catch (_) {}\n"
    "  // Light skin preview only (not full lobby rAF)\n"
    "  setInterval(function () {\n"
    "    try {\n"
    "      if (state.mode === \"lobby\" && !document.hidden) paintPreview(performance.now());\n"
    "    } catch (_) {}\n"
    "  }, 200);\n"
    "  function startApexLoop() {"
)

if boot_old in js:
    js = js.replace(boot_old, boot_new, 1)
elif "renderWallets(); renderSkins(); paintPreview(); loadLobbyArt();" in js:
    print("boot refresh already present")
else:
    raise SystemExit("boot kick block not found")

for s in ["hasTestnetXaman", "cashOut", "OWNER_TREASURY", "renderWallets", "paintPreview"]:
    if s not in js:
        raise SystemExit("missing " + s)

js_p.write_text(js)
print("ok", hashlib.sha256(js.encode()).hexdigest()[:10], "len", len(js))
