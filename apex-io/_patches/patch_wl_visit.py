from pathlib import Path
import re, hashlib

root = Path("apex-io")
js = (root / "game.js").read_text()
html = (root / "index.html").read_text()

if "function rankLevel" not in js:
    needle = "function rankOf(exp)"
    if needle not in js:
        raise SystemExit("rankOf missing")
    insert = (
        "function rankLevel(exp) {\n"
        "    const r = rankOf(exp);\n"
        "    const idx = RANKS.findIndex((x) => x.name === r.cur.name);\n"
        "    return (idx < 0 ? 0 : idx) + 1; // 1 = Hatchling\n"
        "  }\n"
        "  "
    )
    js = js.replace(needle, insert + needle, 1)

WL = """function maybeWhitelistAirdrop(reason) {
    try {
      if (!hasTestnetXaman()) return;
      const level = rankLevel(state.exp);
      if (level < 3) return;
      const addr = state.wallet.address;
      const key = \"apex-io-airdrop-wl\";
      let list = safeParse(localStorage.getItem(key), null) || [];
      if (!Array.isArray(list)) list = [];
      if (list.some((e) => e && e.address === addr)) return;
      const entry = {
        address: addr,
        name: state.playerName,
        level: level,
        rank: rankOf(state.exp).cur.name,
        exp: state.exp,
        at: Date.now(),
        reason: reason || \"level3\",
      };
      list.push(entry);
      localStorage.setItem(key, JSON.stringify(list.slice(-200)));
      state.meta.airdropWhitelisted = true;
      save();
      pushChat(\"den\", \"APEX airdrop whitelist: \" + entry.name + \" · \" + addr.slice(0, 8) + \"… (level \" + level + \")\", true);
      toast(\"Level \" + level + \" — you're on the APEX airdrop whitelist\");
      fetch(DEN_SERVER + \"/airdrop/whitelist\", {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify(entry),
      }).catch(() => {});
    } catch (_) {}
  }

  """
if "function maybeWhitelistAirdrop" not in js:
    if "async function cashOut()" not in js:
        raise SystemExit("cashOut missing")
    js = js.replace("async function cashOut()", WL + "async function cashOut()", 1)

if "maybeWhitelistAirdrop(after.cur.name !== before" not in js:
    m = re.search(r'pushChat\("system", `\+\$\{gained\} EXP`[^;]+;', js)
    if not m:
        raise SystemExit("exp pushChat missing")
    line = m.group(0)
    js = js.replace(line, line + "\n    maybeWhitelistAirdrop(after.cur.name !== before ? \"promote\" : \"exp\");", 1)

m = re.search(r"Force ledger balance on every link[^\n]*\n\s*scheduleBalanceRefresh\(\);", js)
if not m:
    raise SystemExit("signin marker missing")
marker = m.group(0)
if 'maybeWhitelistAirdrop("signin")' not in js:
    js = js.replace(marker, marker + "\n                maybeWhitelistAirdrop(\"signin\");", 1)

VISIT_FN = """async function recordSiteVisit() {
    const el = document.getElementById(\"visit-count\");
    try {
      const res = await fetch(DEN_SERVER + \"/stats/visit\", { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: \"{}\" });
      const body = await res.json().catch(() => ({}));
      if (el && body && body.ok && typeof body.total === \"number\") {
        el.textContent = \"Visitors: \" + body.total.toLocaleString();
      }
    } catch (_) {
      if (el) el.textContent = \"Visitors: —\";
    }
  }

  """
if "function recordSiteVisit" not in js:
    if "function renderMeta()" not in js:
        raise SystemExit("renderMeta missing")
    js = js.replace("function renderMeta()", VISIT_FN + "function renderMeta()", 1)

# single boot call
# remove duplicate typeof stubs first
js = js.replace('try { if (typeof recordSiteVisit === "function") recordSiteVisit(); } catch (_) {}', "recordSiteVisit();")
if js.count("recordSiteVisit();") == 0:
    idx = js.rfind("})();")
    if idx < 0:
        raise SystemExit("boot end missing")
    js = js[:idx] + "  recordSiteVisit();\n" + js[idx:]
elif js.count("recordSiteVisit();") > 1:
    # keep first only in boot zone: collapse extras after first occurrence past mid-file
    parts = js.split("recordSiteVisit();")
    # parts[0] + call + join rest without extra calls... keep one after renderMeta def area and one at end is ok if 2 - prefer exactly 1 at end
    # Rebuild: first occurrence stays, drop others
    js = parts[0] + "recordSiteVisit();" + "".join(parts[1:])
    # if still >1 somehow fixed; if we want only boot call at end, remove the early one from typeof replace when it's mid-file
    # Actually after replace of stub, if stub was at end we're good with 1.

if "id=\"visit-count\"" not in html:
    old = '<div id="bal-usd" class="tiny" style="margin-top:0">$0.00</div>'
    if old not in html:
        raise SystemExit("bal-usd missing")
    html = html.replace(old, old + "\n        <div id=\"visit-count\" class=\"tiny\">Visitors: —</div>", 1)

for s in ["maybeWhitelistAirdrop", "rankLevel", "recordSiteVisit", "/airdrop/whitelist", "/stats/visit", "hasTestnetXaman", "cashOut", "drawTxHash"]:
    if s not in js:
        raise SystemExit("missing " + s)
if 'id="visit-count"' not in html:
    raise SystemExit("visit-count html missing")
if 'id="intro"' in html:
    raise SystemExit("intro present")
if js.find("lobbyArt.src") < js.find("const state ="):
    raise SystemExit("TDZ regress")
if "startApexLoop" in js:
    raise SystemExit("startApexLoop")
if "backdrop-filter" in (root / "styles.css").read_text():
    pass  # styles untouched; crash-light already removed blur

(root / "game.js").write_text(js)
(root / "index.html").write_text(html)
print("ok", hashlib.sha256(js.encode()).hexdigest()[:10], len(js), len(html), "visitCalls", js.count("recordSiteVisit();"))
