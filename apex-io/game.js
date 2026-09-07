(() => {
  const TRAILER = /trailer=1/.test(location.search);
  const TIERS = [
    { id: "jungle", name: "Jungle", stakeXrp: 1, bots: 8, map: 3600, biome: "jungle", trees: 22 },
    { id: "coil", name: "River Coil", stakeXrp: 5, bots: 12, map: 4800, biome: "river", trees: 0 },
    { id: "apex", name: "Night Apex", stakeXrp: 20, bots: 14, map: 5400, biome: "night", trees: 8 },
  ];

  const SPECIES = [
    { id: "viper", name: "Viper", speed: 1.06 },
    { id: "python", name: "Python", speed: 0.94 },
    { id: "cobra", name: "Cobra", speed: 1.0 },
    { id: "mamba", name: "Mamba", speed: 1.12 },
  ];

  const PATTERNS = ["solid", "banded", "diamond", "speckle", "diamondback", "coral", "python", "king", "sidewinder"];

  const PRESET_SKINS = [
    { a: "#3dff9a", b: "#0b3d24" },
    { a: "#e7c56a", b: "#3a2a08" },
    { a: "#7cf0c2", b: "#14322a" },
    { a: "#ff7a59", b: "#3a140e" },
    { a: "#6aa8ff", b: "#0d1c33" },
    { a: "#d37cff", b: "#2a1038" },
    { a: "#f2f2f2", b: "#222" },
    { a: "#ff5d6c", b: "#3a0d14" },
    { a: "#c4a36a", b: "#3a2a18" },
    { a: "#8b5a2b", b: "#1c1208" },
    { a: "#d9c7a0", b: "#5c4030" },
    { a: "#6b4f2a", b: "#2a1c10" },
    { a: "#b85c38", b: "#1a0e08" },
    { a: "#2f2a24", b: "#c9b48a" },
  ];

  function patternColor(i, pat, a, b) {
    if (pat === "banded") return i % 7 < 3 ? a : b;
    if (pat === "diamond") return i % 9 < 3 ? b : a;
    if (pat === "speckle") return i % 5 === 0 ? b : a;
    if (pat === "diamondback") return (i % 10 < 4) || (i % 10 === 6) ? b : a;
    if (pat === "coral") return [a, a, "#f4f0e4", b, b, "#f4f0e4"][i % 6];
    if (pat === "python") return i % 8 < 3 || i % 8 === 5 ? b : a;
    if (pat === "king") return i % 11 < 2 || (i % 11 > 5 && i % 11 < 8) ? b : a;
    if (pat === "sidewinder") return i % 3 === 0 ? b : a;
    return a;
  }

  const BOT_NAMES = [
    "NileFang", "CoilMint", "AshScale", "RattleKay", "MossKing",
    "IvoryPit", "JadeLatch", "SiltRunner", "CopperMouth", "NightShed",
    "GutterGold", "FenWarden", "LowTide", "HexRib", "DryRiver",
  ];

  const FEE_RATE = 0.10;
  // Creator only: paste your classic r-address. Rebuild the zip. Players never type this.
  const OWNER_TREASURY = "";
  const OWNER_KEY = "";
  const XAMAN_APP_URL = "https://xaman.app";
  const XUMM_API_KEY = "";
  const SLOT_WINS_TO_TREASURY = false;
  const RANKS = [
    { name: "Hatchling", exp: 0 },
    { name: "Scalekit", exp: 80 },
    { name: "Leaf Crawler", exp: 220 },
    { name: "Pitling", exp: 480 },
    { name: "Moss Coil", exp: 900 },
    { name: "Canopy Scout", exp: 1500 },
    { name: "Fang Initiate", exp: 2300 },
    { name: "Den Stalker", exp: 3400 },
    { name: "Hood Acolyte", exp: 4800 },
    { name: "River Warden", exp: 6600 },
    { name: "Night Shedder", exp: 9000 },
    { name: "Goldbelly", exp: 12000 },
    { name: "Venom Knight", exp: 16000 },
    { name: "Coil Baron", exp: 21000 },
    { name: "Pit Lord", exp: 27500 },
    { name: "Canopy King", exp: 36000 },
    { name: "Apex Hunter", exp: 47000 },
    { name: "Crown Cobra", exp: 61000 },
    { name: "Mythic Shed", exp: 79000 },
    { name: "Elder Fang", exp: 102000 },
    { name: "Sovereign of the Pit", exp: 132000 },
    { name: "XRPL Apex", exp: 170000 },
    { name: "Primeval Hood", exp: 220000 },
    { name: "World Eater", exp: 285000 },
    { name: "Last Hiss", exp: 370000 },
  ];
  const CHAT_BOTS = [
    "NileFang parked a 20 den and vanished.",
    "Anyone else hitting trees in Jungle?",
    "Scalekit grind is real. Need more matches.",
    "Cash out before you get greedy.",
    "Who made Last Hiss? Unreal.",
    "River Coil is spicy tonight.",
    "Hood looks better with diamond pattern.",
    "Don't boost into a python.",
  ];
  const STORAGE_KEY = "apex-io-v1";

  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");
  const lobbyArt = new Image();
  lobbyArt.onload = () => { if (state.mode === "lobby") render(); };
  lobbyArt.src = "lobby-bg.jpg";
  const toastEl = document.getElementById("toast");
  const overlay = document.getElementById("overlay");

  const state = {
    mode: "lobby",
    tier: TIERS[0],
    xrpUsd: 0.62,
    treasury: localStorage.getItem("apex-io-treasury") || "",
    network: localStorage.getItem("apex-io-network") || "simulated",
    playerName: cleanName(localStorage.getItem("apex-io-name") || randomName()),
    wallet: safeParse(localStorage.getItem("apex-io-wallet"), null),
    balanceXrp: clampNum(localStorage.getItem("apex-io-bal"), 40, 0, 1e6),
    skin: safeParse(localStorage.getItem("apex-io-skin"), null) || {
      species: "cobra",
      pattern: "banded",
      a: PRESET_SKINS[0].a,
      b: PRESET_SKINS[0].b,
      eyes: "#ffe9a8",
      horn: "none",
      tail: "none",
    },
    world: null,
    mouse: { x: 0, y: 0 },
    stick: { on: false, x: 1, y: 0 },
    boosting: false,
    last: 0,
    feePaidTotal: clampNum(localStorage.getItem("apex-io-fees"), 0, 0, 1e6),
    exp: clampNum(localStorage.getItem("apex-io-exp"), 0, 0, 5e6),
    matchKills: 0,
    chat: sanitizeChat(safeParse(localStorage.getItem("apex-io-chat"), null)),
    board: sanitizeBoard(safeParse(localStorage.getItem("apex-io-board"), null)) || seedBoard(),
    sheds: sanitizeSheds(safeParse(localStorage.getItem("apex-io-sheds"), null)),
    coilWins: sanitizeSheds(safeParse(localStorage.getItem("apex-io-coilwins"), null)),
    meta: safeParse(localStorage.getItem("apex-io-meta"), null) || defaultMeta(),
  };

  function safeParse(raw, fallback) {
    try {
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      if (v && typeof v === "object" && Object.getPrototypeOf(v) !== Object.prototype && !Array.isArray(v)) {
        return fallback;
      }
      return v;
    } catch (_) {
      return fallback;
    }
  }
  function clampNum(raw, fallback, min, max) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function cleanName(s) {
    return String(s || "")
      .replace(/[<>&"'`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16) || randomName();
  }
  function sanitizeBoard(rows) {
    if (!Array.isArray(rows)) return null;
    return rows.slice(0, 20).map((r) => ({
      name: cleanName(r && r.name),
      xrp: clampNum(r && r.xrp, 0, 0, 1e6),
      exp: clampNum(r && r.exp, 0, 0, 5e6),
      server: cleanName((r && r.server) || "Jungle"),
    }));
  }
  function sanitizeSheds(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.slice(0, 30).map((s) => ({
      name: cleanName(s && s.name),
      xrp: clampNum(s && s.xrp, 0, 0, 1e6),
      at: Number(s && s.at) || Date.now(),
    }));
  }
  function sanitizeChat(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.slice(-40).map((m) => ({
      who: cleanName((m && m.who) || "den"),
      text: String((m && m.text) || "").replace(/[<>]/g, "").slice(0, 160),
      sys: !!(m && m.sys),
      tip: !!(m && m.tip),
    }));
  }
  function defaultMeta() {
    return {
      streak: 0,
      hotFang: false,
      journal: { bestCash: 0, longest: 0, greediest: 0 },
      contractsDay: "",
      contracts: [],
      unlocked: ["banded"],
      charm: "none",
      seasonExp: 0,
      seasonStart: Date.now(),
      party: "",
      tipsDay: "",
      tipsCount: 0,
      seasonPot: 0,
      weekFees: 0,
      weekKey: "",
      tickets: 0,
      ticketIds: [],
      lastCoilWeek: "",
      lastCoilWin: "",
    };
  }
  function rankOf(exp) {
    let cur = RANKS[0];
    let next = RANKS[1] || RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
      if (exp >= RANKS[i].exp) {
        cur = RANKS[i];
        next = RANKS[i + 1] || null;
      }
    }
    return { cur, next };
  }

  function randomName() {
    return "Predator" + Math.floor(1000 + Math.random() * 9000);
  }
  function nameKey(s) {
    return String(s || "").trim().toLowerCase();
  }
  function takenNames() {
    const set = new Set(BOT_NAMES.map(nameKey));
    set.add("den");
    set.add("system");
    set.add("apex");
    set.add("admin");
    set.add("tipbot");
    set.add("tip");
    (state.board || []).forEach((r) => {
      if (r && r.name) set.add(nameKey(r.name));
    });
    return set;
  }
  function usernameTaken(raw, allowSelf) {
    const key = nameKey(cleanName(raw));
    if (!key) return true;
    if (allowSelf && key === nameKey(state.playerName)) return false;
    return takenNames().has(key);
  }
  function uniqueName(preferred) {
    let base = cleanName(preferred);
    if (!usernameTaken(base, false)) return base;
    for (let i = 2; i < 80; i++) {
      const tryName = cleanName(base.slice(0, 12) + i);
      if (!usernameTaken(tryName, false)) return tryName;
    }
    return cleanName("Hunter" + Math.floor(1000 + Math.random() * 9000));
  }

  function plantTrees(map, count, keepClear) {
    const trees = [];
    let guard = 0;
    while (trees.length < count && guard < count * 20) {
      guard++;
      const t = {
        x: 180 + Math.random() * (map - 360),
        y: 180 + Math.random() * (map - 360),
        trunk: 16 + Math.random() * 10,
        canopy: 48 + Math.random() * 28,
        hue: 110 + Math.random() * 30,
      };
      const farSpawn = Math.hypot(t.x - keepClear.x, t.y - keepClear.y) > 160;
      const farOther = trees.every((o) => Math.hypot(o.x - t.x, o.y - t.y) > 130);
      if (farSpawn && farOther) trees.push(t);
    }
    return trees;
  }

  function hitTree(x, y, trees, pad) {
    for (const t of trees) {
      const dx = x - t.x, dy = y - t.y;
      const r = t.trunk + pad;
      if (dx * dx + dy * dy < r * r) return t;
    }
    return null;
  }

  function seedBoard() {
    const exps = [18400, 12100, 8600, 5400, 3100, 1700, 720, 210];
    return BOT_NAMES.slice(0, 8).map((n, i) => ({
      name: n,
      xrp: +(38 - i * 4.2).toFixed(2),
      exp: exps[i],
      server: TIERS[i % 3].name,
    }));
  }

  function save() {
    localStorage.setItem("apex-io-treasury", state.treasury);
    localStorage.setItem("apex-io-network", state.network);
    localStorage.setItem("apex-io-name", state.playerName);
    localStorage.setItem("apex-io-bal", String(state.balanceXrp));
    localStorage.setItem("apex-io-skin", JSON.stringify(state.skin));
    localStorage.setItem("apex-io-fees", String(state.feePaidTotal));
    localStorage.setItem("apex-io-board", JSON.stringify(state.board));
    localStorage.setItem("apex-io-sheds", JSON.stringify((state.sheds || []).slice(0, 30)));
    localStorage.setItem("apex-io-coilwins", JSON.stringify((state.coilWins || []).slice(0, 30)));
    localStorage.setItem("apex-io-exp", String(state.exp));
    localStorage.setItem("apex-io-chat", JSON.stringify(state.chat.slice(-40)));
    localStorage.setItem("apex-io-meta", JSON.stringify(state.meta));
    if (state.wallet) localStorage.setItem("apex-io-wallet", JSON.stringify(state.wallet));
    else localStorage.removeItem("apex-io-wallet");
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => (toastEl.style.display = "none"), 2400);
  }

  function usd(xrp) {
    return (xrp * state.xrpUsd).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    });
  }

  async function refreshPrice() {
    let px = 0;
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd");
      const j = await r.json();
      if (j.ripple && j.ripple.usd) px = Number(j.ripple.usd);
    } catch (_) {}
    if (!px) {
      try {
        const r2 = await fetch("https://min-api.cryptocompare.com/data/price?fsym=XRP&tsyms=USD");
        const j2 = await r2.json();
        if (j2.USD) px = Number(j2.USD);
      } catch (_) {}
    }
    if (px > 0) {
      state.xrpUsd = px;
      state.priceAt = Date.now();
    }
    renderMeta();
    renderBoard();
    renderSheds();
  }

  function renderNews(items, stamp) {
    const list = document.getElementById("news-list");
    const stampEl = document.getElementById("news-stamp");
    if (!list) return;
    if (stampEl) stampEl.textContent = stamp || "XRP wire";
    if (!items || !items.length) {
      list.innerHTML = `<div class="tiny">No headlines yet. Will retry.</div>`;
      return;
    }
    list.innerHTML = items
      .slice(0, 10)
      .map((n) => {
        const href = String(n.url || "").startsWith("https://") ? n.url : "#";
        return `<a class="news-item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
          <strong>${escapeHtml(n.title)}</strong>
          <span>${escapeHtml(n.source || "wire")} · ${escapeHtml(n.when || "")}</span>
        </a>`;
      })
      .join("");
  }

  async function refreshNews() {
    try {
      const r = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=XRP");
      const j = await r.json();
      const rows = Array.isArray(j.Data) ? j.Data : [];
      const items = rows
        .filter((n) => {
          const blob = ((n.title || "") + " " + (n.body || "") + " " + (n.categories || "")).toLowerCase();
          return /xrp|ripple|xrpl/.test(blob);
        })
        .slice(0, 10)
        .map((n) => ({
          title: String(n.title || "XRP update").slice(0, 160),
          source: String(n.source || n.source_info && n.source_info.name || "CryptoCompare").slice(0, 40),
          url: String(n.url || n.guid || "").slice(0, 300),
          when: n.published_on ? new Date(n.published_on * 1000).toLocaleString() : "",
        }));
      const use = items.length ? items : rows.slice(0, 8).map((n) => ({
        title: String(n.title || "").slice(0, 160),
        source: String(n.source || "wire").slice(0, 40),
        url: String(n.url || "").slice(0, 300),
        when: n.published_on ? new Date(n.published_on * 1000).toLocaleString() : "",
      }));
      renderNews(use, "Updated " + new Date().toLocaleTimeString());
    } catch (_) {
      renderNews([], "Wire offline — retrying");
    }
  }

  function makeSnake(opts) {
    const pts = [];
    for (let i = 0; i < opts.len; i++) {
      pts.push({ x: opts.x - i * 8, y: opts.y });
    }
    return {
      id: opts.id,
      name: opts.name,
      isPlayer: !!opts.isPlayer,
      pts,
      dir: 0,
      speed: opts.speed || 2.35,
      radius: 7,
      alive: true,
      colorA: opts.a,
      colorB: opts.b,
      pattern: opts.pattern || "banded",
      eyes: opts.eyes || "#fff",
      species: opts.species || "cobra",
      horn: opts.horn || "none",
      tail: opts.tail || "none",
      stake: opts.stake,
      boost: false,
    };
  }

  function dayKey() {
    return new Date().toISOString().slice(0, 10);
  }
  function weekKey() {
    const d = new Date();
    const day = d.getDay();
    const sun = new Date(d);
    sun.setDate(d.getDate() - day);
    return sun.toISOString().slice(0, 10);
  }
  function ensureContracts() {
    if (!state.meta.weekKey || state.meta.weekKey !== weekKey()) {
      state.meta.weekKey = weekKey();
      state.meta.weekFees = 0;
      state.meta.seasonPot = 0;
      state.meta.weekContracts = [];
      state.meta.tickets = 0;
      state.meta.ticketIds = [];
    }
    if (state.meta.contractsDay !== dayKey() || !state.meta.contracts.length) {
      state.meta.contractsDay = dayKey();
      state.meta.contracts = [
        { id: "cash2", t: "Cash out 2 XRP today", need: 2, have: 0, kind: "cash", exp: 80 },
        { id: "kills", t: "Land 2 fangs in one den", need: 2, have: 0, kind: "kills", exp: 70 },
        { id: "live45", t: "Survive 45s", need: 1, have: 0, kind: "alive", exp: 50 },
      ];
    }
    if (!state.meta.weekContracts || !state.meta.weekContracts.length) {
      state.meta.weekContracts = [
        { id: "w-cash", t: "Cash out 8 XRP this week", need: 8, have: 0, kind: "cash", exp: 220 },
        { id: "w-live", t: "Finish 5 dens this week", need: 5, have: 0, kind: "den", exp: 160 },
      ];
    }
  }
  function rankBand(exp) {
    const r = rankOf(exp);
    if (!r.next) return r.cur.name + " III";
    const span = r.next.exp - r.cur.exp;
    const p = (exp - r.cur.exp) / Math.max(1, span);
    const roman = p < 0.34 ? "I" : p < 0.67 ? "II" : "III";
    return r.cur.name + " " + roman;
  }
  function hissSfx(full) {
    try {
      let a = hissSfx.el;
      if (!a) {
        a = hissSfx.el = document.getElementById("hiss-audio") || new Audio("hiss.mp3");
        a.preload = "auto";
      }
      a.pause();
      a.currentTime = 0;
      a.volume = full ? 0.9 : 0.4;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      clearTimeout(hissSfx.cut);
      if (!full) {
        hissSfx.cut = setTimeout(() => { try { a.pause(); } catch (_) {} }, 700);
      }
    } catch (_) {}
  }
  function renderMetaPanels() {
    ensureContracts();
    const c = document.getElementById("contracts");
    if (c) {
      const line = (x) => `${x.have >= x.need ? "✓" : "○"} ${escapeHtml(x.t)} <b>+${x.exp} EXP</b>`;
      c.innerHTML =
        "<b>Daily</b><br>" + state.meta.contracts.map(line).join("<br>") +
        "<br><b>Weekly</b><br>" + (state.meta.weekContracts || []).map(line).join("<br>");
    }
    const wp = document.getElementById("week-pot");
    if (wp) wp.textContent = (state.meta.seasonPot || 0).toFixed(3);
    const j = document.getElementById("journal");
    if (j) {
      const g = state.meta.journal;
      j.innerHTML = `Best cash-out ${g.bestCash} XRP<br>Longest coil ${g.longest}<br>Greediest death ${g.greediest} XRP left on the floor`;
    }
    const tick = document.getElementById("treasury-ticker");
    if (tick) tick.textContent = "Pit take this week: " + (state.meta.weekFees || 0).toFixed(3) + " XRP";
    const hs = document.getElementById("hud-streak");
    if (hs) hs.textContent = String(state.meta.streak || 0) + (state.meta.hotFang ? " 🔥" : "");
    const ds = document.getElementById("drop-skins");
    if (ds) ds.textContent = "Unlocked trails: " + (state.meta.unlocked || []).join(", ");
    const ch = document.getElementById("charm");
    if (ch && ch.value !== state.meta.charm) ch.value = state.meta.charm || "none";
  }
  function creditContract(kind, amt) {
    ensureContracts();
    const bags = [state.meta.contracts, state.meta.weekContracts || []];
    for (const bag of bags) {
    for (const x of bag) {
      if (x.kind !== kind || x.have >= x.need) continue;
      x.have = Math.min(x.need, x.have + amt);
      if (x.have >= x.need) {
        state.exp += x.exp;
        state.meta.seasonExp += x.exp;
        if (String(x.id || "").startsWith("w-")) {
          state.meta.tickets = (state.meta.tickets || 0) + 1;
          state.meta.ticketIds = state.meta.ticketIds || [];
          state.meta.ticketIds.push(1000 + state.meta.tickets + Math.floor(Math.random() * 8000));
          state.meta.seasonPot = +(state.meta.seasonPot + 0.05).toFixed(3);
          toast("Weekly hunt done · ticket #" + state.meta.tickets);
        } else {
          toast("Hunt done +" + x.exp + " EXP");
        }
        pushChat("den", "Hunt complete: " + x.t + " (+" + x.exp + " EXP)", true);
      }
    }
    }
  }
  function maybeDropSkin(cashed, net, w) {
    const add = (id, label) => {
      if (state.meta.unlocked.includes(id)) return;
      state.meta.unlocked.push(id);
      toast("Skin flake: " + label);
      pushChat("den", "Unlocked " + label, true);
    };
    if (cashed && net >= 20) add("albino", "Albino hood");
    if (cashed && (w.matchTrees || 0) >= 8) add("moss", "Moss coil");
    if (rankOf(state.exp).cur.name === "Last Hiss") add("goldhood", "Gold hood");
  }

  function startMatch(opts) {
    const duel = opts && opts.duel;
    const allIn = !duel && !!(document.getElementById("opt-allin") && document.getElementById("opt-allin").checked);
    if (opts && opts.watch && state.mode === "play" && state.world && !state.world.watch && state.world.snakes[0] && state.world.snakes[0].alive) {
      toast("Watch after you drop.");
      return;
    }
    if (!opts || !opts.watch) {
      if (state.world && state.mode === "play" && state.world.watch) {
        toast("Leave the den before you hunt.");
        return;
      }
    }
    const watchOnly = !!(opts && opts.watch);
    const insure = !watchOnly && !duel && !!(document.getElementById("opt-insure") && document.getElementById("opt-insure").checked);
    const side = watchOnly || duel ? 0 : clampNum((document.getElementById("side-bet") || {}).value, 0, 0, 0.25);
    const stake = watchOnly ? 0 : (duel ? duel.amt : state.tier.stakeXrp * (allIn ? 2 : 1));
    if (!duel && !watchOnly) {
      if (insure && state.exp < 40) { toast("Insurance needs 40 EXP."); return; }
      if (state.balanceXrp < stake + side) {
        toast("Not enough simulated XRP for this server.");
        return;
      }
      state.balanceXrp = +(state.balanceXrp - stake - side).toFixed(6);
      if (insure) state.exp -= 40;
    }
    state.matchKills = 0;
    save();

    const spec = SPECIES.find((s) => s.id === state.skin.species) || SPECIES[2];
    const map = duel ? 2800 : state.tier.map;
    const player = makeSnake({
      id: "you",
      name: state.playerName,
      isPlayer: true,
      x: map / 2,
      y: map / 2,
      len: 18,
      a: state.skin.a,
      b: state.skin.b,
      pattern: state.skin.pattern,
      eyes: state.skin.eyes,
      species: spec.id,
      horn: state.skin.horn || "none",
      tail: state.skin.tail || "none",
      stake,
      speed: 2.4 * spec.speed,
    });

    const snakes = [player];
    if (duel) {
      const pal = PRESET_SKINS[1];
      const rival = makeSnake({
        id: "rival",
        name: duel.name,
        x: map * 0.72,
        y: map * 0.28,
        len: 20,
        a: pal.a,
        b: pal.b,
        pattern: "diamond",
        species: "mamba",
        stake: duel.amt,
        speed: 2.45,
      });
      rival.isRival = true;
      rival.bounty = true;
      rival.hotFang = true;
      player.bounty = true;
      snakes.push(rival);
    } else for (let i = 0; i < state.tier.bots; i++) {
      const pal = PRESET_SKINS[i % PRESET_SKINS.length];
      snakes.push(
        makeSnake({
          id: "bot" + i,
          name: BOT_NAMES[i % BOT_NAMES.length],
          x: Math.random() * map,
          y: Math.random() * map,
          len: 12 + Math.floor(Math.random() * 24),
          a: pal.a,
          b: pal.b,
          pattern: PATTERNS[i % PATTERNS.length],
          species: SPECIES[i % SPECIES.length].id,
          stake: 0,
          speed: 2.1 + Math.random() * 0.5,
        })
      );
    }

    const food = [];
    for (let i = 0; i < 280; i++) {
      food.push({
        x: Math.random() * map,
        y: Math.random() * map,
        r: 3 + Math.random() * 2,
        c: "#9fe7c2",
        value: 0,
      });
    }

    const trees = plantTrees(map, TRAILER ? Math.min(12, state.tier.trees || 0) : (state.tier.trees || 0), player.pts[0]);
    state.world = {
      map,
      biome: state.tier.biome,
      trees,
      snakes,
      food,
      cam: { x: player.pts[0].x, y: player.pts[0].y },
      prizePool: duel ? +(duel.amt * 2).toFixed(4) : stake + (state.challengePot || 0),
      duel: duel ? duel.name : null,
      dropped: [],
      tape: [],
      grace: true,
      startedAt: performance.now(),
      starveAt: 0,
      allIn,
      insure,
      side,
      sideWon: false,
      matchTrees: 0,
      bounty: null,
      emoteUntil: 0,
    };
    if (state.meta.hotFang) {
      player.bounty = true;
      state.world.bounty = player.name;
      pushChat("den", "Bounty: " + player.name + " is on a cash-out streak. Drop them for extra XRP.", true);
      toast("Hot fang — bounty is on you.");
    } else {
      toast(state.tier.name + " — bots drop length only. Yellow XRP is players.");
    }
    setTimeout(() => {
      if (state.world) state.world.grace = false;
    }, 2200);
    if (state.challengePot) {
      pushChat("den", "Challenge pot " + state.challengePot + " XRP is in this den.", true);
      state.challengePot = 0;
    }
    state.mode = "play";
    overlay.classList.add("hidden");
    setPlayingLayout(true);
    applyWatchUi(false);
    resize();
    renderMeta();
    toast(state.tier.name + " — hunt. Trees shove; bodies still kill.");
  }

  function killSnake(s, world) {
    if (!s.alive) return;
    s.alive = false;
    if (s.isPlayer && window.apexSock && window.apexSock.readyState === 1) {
      window.apexSock.send(JSON.stringify({ t: "dead", name: state.playerName, by: s.killedBy || "", stake: s.stake || 0 }));
    }
    const body = s.pts || [];
    const playerDrop = !!s.isPlayer;
    const n = Math.min(body.length, playerDrop ? Math.max(6, Math.floor(body.length / 2)) : Math.min(10, body.length));
    const pile = playerDrop ? (s.bounty ? s.stake * 1.25 + 1 : s.stake) : 0;
    if (s.bounty && playerDrop) pushChat("den", "Bounty dropped: " + s.name + ". Yellow sheds are fat.", true);
    for (let i = 0; i < n; i++) {
      const p = body[Math.floor((i / Math.max(1, n - 1)) * (body.length - 1))] || body[0];
      world.dropped.push({
        x: p.x,
        y: p.y,
        r: playerDrop ? 5 : 4,
        c: playerDrop && pile > 0 ? "#e7c56a" : "#9fe7c2",
        value: playerDrop && pile > 0 ? +(pile / n).toFixed(4) : 0,
        fromPlayer: !!(playerDrop && pile > 0),
      });
    }
    if (s.isPlayer && window.apexSock && window.apexSock.readyState === 1 && pile > 0) {
      window.apexSock.send(JSON.stringify({
        t: "shed",
        name: state.playerName,
        drops: world.dropped.slice(-n).map((d) => ({ x: d.x, y: d.y, value: d.value })),
      }));
    }
  }   
  function update(dt) {
    const w = state.world;
    if (!w) return;
    const you = w.snakes[0];

    for (const s of w.snakes) {
      if (!s.alive) continue;
      if (s.isPlayer) {
        if (state.stick && state.stick.on) {
          s.dir = Math.atan2(state.stick.y, state.stick.x);
        } else {
          const hx = w.cam.x + state.mouse.x - canvas.width / 2;
          const hy = w.cam.y + state.mouse.y - canvas.height / 2;
          s.dir = Math.atan2(hy - s.pts[0].y, hx - s.pts[0].x);
        }
        s.boost = state.boosting && s.pts.length > 12;
      } else {
        if (Math.random() < 0.03) s.dir += (Math.random() - 0.5) * 1.2;
        s.boost = Math.random() < 0.01;
        const look = hitTree(
          s.pts[0].x + Math.cos(s.dir) * 40,
          s.pts[0].y + Math.sin(s.dir) * 40,
          w.trees,
          8
        );
        if (look) s.dir += 0.7;
      }

      const spd = s.speed * (s.boost ? 1.85 : 1) * dt * 60;
      const nx = s.pts[0].x + Math.cos(s.dir) * spd;
      const ny = s.pts[0].y + Math.sin(s.dir) * spd;
      const mid = w.map / 2;
      const gate = 260;
      const hx = s.pts[0].x, hy = s.pts[0].y;
      const onY = Math.abs(hy - mid) <= gate;
      const onX = Math.abs(hx - mid) <= gate;
      let px = nx, py = ny, wrapped = false;
      if (onY && nx <= 36) { px = w.map - 40; wrapped = true; }
      else if (onY && nx >= w.map - 36) { px = 40; wrapped = true; }
      if (onX && ny <= 36) { py = w.map - 40; wrapped = true; }
      else if (onX && ny >= w.map - 36) { py = 40; wrapped = true; }
      if (!wrapped) {
        px = Math.max(22, Math.min(w.map - 22, nx));
        py = Math.max(22, Math.min(w.map - 22, ny));
      }
      const clamped = { x: px, y: py };
      if (wrapped && s.isPlayer) {
        w.cam.x = px;
        w.cam.y = py;
      }
      if (hitTree(clamped.x, clamped.y, w.trees, s.radius * 0.85)) {
        s.dir += 1.15;
        if (s.isPlayer) w.matchTrees = (w.matchTrees || 0) + 1;
        continue;
      }
      const hold = s.pts.length;
      s.pts.unshift(clamped);
      s._boostTick = (s._boostTick || 0) + 1;
      const burn = s.boost && s._boostTick % 8 === 0 ? 1 : 0;
      const keep = Math.max(10, hold - burn);
      while (s.pts.length > keep) s.pts.pop();
      s.radius = 6 + Math.min(10, s.pts.length / 18);
    }

    function eatFrom(bucket, isDrop) {
      for (const s of w.snakes) {
        if (!s.alive) continue;
        const hx = s.pts[0].x, hy = s.pts[0].y;
        for (let i = bucket.length - 1; i >= 0; i--) {
          const f = bucket[i];
          const dx = hx - f.x, dy = hy - f.y;
          const rr = s.radius + f.r;
          if (dx * dx + dy * dy < rr * rr) {
            const green = !(f.fromPlayer && f.value > 0);
            if (green && s.pts.length < 90) s.pts.push({ ...s.pts[s.pts.length - 1] });
            if (s.isPlayer && isDrop && f.fromPlayer && f.value > 0) {
              w.prizePool = +(w.prizePool + f.value).toFixed(4);
            }
            bucket.splice(i, 1);
            if (!isDrop) {
              while (w.food.length < 280) {
                w.food.push({
                  x: Math.random() * w.map,
                  y: Math.random() * w.map,
                  r: 3 + Math.random() * 2,
                  c: "#9fe7c2",
                  value: 0,
                });
                if (w.food.length > 278) break;
              }
            }
          }
        }
      }
    }
    eatFrom(w.food, false);
    eatFrom(w.dropped, true);
    let refill = 0;
    while (w.food.length < 280 && refill < 8) {
      w.food.push({
        x: Math.random() * w.map,
        y: Math.random() * w.map,
        r: 3 + Math.random() * 2,
        c: "#9fe7c2",
        value: 0,
      });
      refill++;
    }

    for (const a of w.snakes) {
      if (!a.alive) continue;
      for (const b of w.snakes) {
        if (a === b || !b.alive) continue;
        if (w.grace && a.isPlayer) continue;
        const hdx = a.pts[0].x - b.pts[0].x;
        const hdy = a.pts[0].y - b.pts[0].y;
        const headR = (a.radius + (b.radius || 6)) * 0.58;
        if (hdx * hdx + hdy * hdy < headR * headR && a.pts.length < b.pts.length) {
          killSnake(a, w);
          a.death = "head";
          if (b.isPlayer) {
            w.prizePool = +(w.prizePool + a.stake * 0.9 + (a.bounty ? 1 : 0)).toFixed(4);
            state.matchKills += 1;
          }
          continue;
        }
        const stepB = 1;
        const hitR = a.radius * 0.75 + (b.radius || 6) * 0.58;
        const hitR2 = hitR * hitR;
        const nearR2 = (hitR + 12) * (hitR + 12);
        const startSeg = b.pts.length < 16 ? 2 : 3;
        for (let i = startSeg; i < b.pts.length; i += stepB) {
          const p = b.pts[i];
          const dx = a.pts[0].x - p.x;
          const dy = a.pts[0].y - p.y;
          const d2 = dx * dx + dy * dy;
          if (a.isPlayer && d2 < nearR2 && d2 >= hitR2 && (!w._hissAt || w._tick - w._hissAt > 18)) {
            w._hissAt = w._tick;
            hissSfx();
          }
          if (d2 < hitR2) {
            killSnake(a, w);
            a.death = "body";
            if (b.isPlayer) {
              let add = a.stake * 0.9;
              if (a.bounty) add += 1;
              w.prizePool = +(w.prizePool + add).toFixed(4);
              state.matchKills += 1;
              if (a.bounty) {
                pushChat("den", "Bounty claimed: " + a.name, true);
                toast("Bounty claimed");
              }
            }
            break;
          }
        }
      }
    }
    if (you && you.alive && you.isPlayer && !w.watch && !w.grace) {
      const rem = window.apexPeers || {};
      const hx = you.pts[0].x, hy = you.pts[0].y;
      const hitR2 = 8 * 8;
      const names = Object.keys(rem);
      for (let n = 0; n < names.length && you.alive; n++) {
        const r = rem[names[n]];
        if (!r || Date.now() - r.at > 3000) continue;
        const pts = r.trail || [{ x: r.x, y: r.y }];
        for (let i = 0; i < Math.max(0, pts.length - 6); i++) {
          const dx = hx - pts[i].x, dy = hy - pts[i].y;
          if (dx * dx + dy * dy < hitR2) {
            you.killedBy = names[n];
            killSnake(you, w);
            you.death = "body";
            toast("Hit " + names[n]);
            break;
          }
        }
      }
    }

    if (you.alive) {
      if (!w.tape) w.tape = [];
      if ((w._tick || 0) % 2 === 0) {
        w.tape.push({
          cam: { x: w.cam.x, y: w.cam.y },
          you: you.pts.map((p) => ({ x: p.x, y: p.y })),
          others: w.snakes.filter((s) => s.alive && !s.isPlayer).map((s) => ({
            name: s.name,
            a: s.colorA,
            pts: s.pts.filter((_, i) => i % 3 === 0).slice(0, 36).map((p) => ({ x: p.x, y: p.y })),
          })),
          peers: Object.keys(window.apexPeers || {}).map((nm) => {
            const r = window.apexPeers[nm];
            return { name: nm, pts: (r.trail || [{ x: r.x, y: r.y }]).map((p) => ({ x: p.x, y: p.y })) };
          }),
        });
        if (w.tape.length > 300) w.tape.shift();
      }
      const focus = (w.watch && w.snakes[w.watchFocus]) || you;
      const fp = focus && focus.alive && focus.pts[0] ? focus.pts[0] : you.pts[0];
      w.cam.x += (fp.x - w.cam.x) * 0.12;
      w.cam.y += (fp.y - w.cam.y) * 0.12;
      const lived = (performance.now() - (w.startedAt || performance.now())) / 1000;
      if (lived >= 45 && !w.sideWon && w.side) {
        w.sideWon = true;
        const pay = +(w.side * 1.6).toFixed(4);
        state.balanceXrp = +(state.balanceXrp + pay).toFixed(6);
        toast("Side bet hit +" + pay + " XRP");
      }
      if (lived >= 45) creditContract("alive", 1);
      const hissEl = document.getElementById("hud-hiss");
      if (hissEl) hissEl.textContent = "—";
    }
    w._tick = (w._tick || 0) + 1;
    if (w._tick % 6 === 0) renderMeta();
  }

  function drawSnake(s, cam) {
    const ox = canvas.width / 2 - cam.x;
    const oy = canvas.height / 2 - cam.y;
    const pts = s.pts;
    if (!pts.length) return;
    const pad = 160;
    let onScreen = false;
    for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(pts.length / 12))) {
      const sx = pts[i].x + ox, sy = pts[i].y + oy;
      if (sx > -pad && sy > -pad && sx < canvas.width + pad && sy < canvas.height + pad) {
        onScreen = true;
        break;
      }
    }
    if (!onScreen) return;

    const n = pts.length;
    const stride = 1;
    for (let i = n - 1; i >= 1; i -= stride) {
      const p = pts[i];
      const nxt = pts[Math.max(0, i - stride)];
      if (Math.hypot(nxt.x - p.x, nxt.y - p.y) > 280) continue;
      const ang = Math.atan2(nxt.y - p.y, nxt.x - p.x);
      const t = i / n;
      const rad = s.radius * (1.12 - t * 0.68);
      const col = patternColor(i, s.pattern, s.colorA, s.colorB);
      ctx.save();
      ctx.translate(p.x + ox, p.y + oy);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 1.45, rad * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,226,170,0.22)";
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 0.85, rad * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const hx = pts[0].x + ox;
    const hy = pts[0].y + oy;
    const R = s.radius * 1.35;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(s.dir);
    const spec = s.species || "cobra";
    if (spec === "cobra") {
      ctx.fillStyle = s.colorB;
      ctx.beginPath();
      ctx.moveTo(-R * 0.15, 0);
      ctx.quadraticCurveTo(-R * 1.35, -R * 2.15, R * 0.15, -R * 2.55);
      ctx.quadraticCurveTo(R * 1.55, -R * 0.15, R * 0.2, R * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(-R * 0.05, -R * 1.15, R * 0.22, R * 0.55, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (spec === "python") {
      ctx.fillStyle = s.colorB;
      ctx.beginPath();
      ctx.ellipse(-R * 0.2, 0, R * 1.1, R * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = s.colorA;
    ctx.beginPath();
    ctx.ellipse(R * 0.4, 0, R * 1.55, R * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.eyes;
    ctx.beginPath();
    ctx.ellipse(R * 0.75, -R * 0.36, R * 0.24, R * 0.15, 0.25, 0, Math.PI * 2);
    ctx.ellipse(R * 0.75, R * 0.36, R * 0.24, R * 0.15, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(R * 0.9, -R * 0.36, R * 0.08, 0, Math.PI * 2);
    ctx.arc(R * 0.9, R * 0.36, R * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c23b4a";
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(R * 1.85, 0);
    ctx.lineTo(R * 2.55, -3.2);
    ctx.moveTo(R * 1.85, 0);
    ctx.lineTo(R * 2.55, 3.2);
    ctx.stroke();
    const horn = s.horn || "none";
    if (horn !== "none") {
      ctx.fillStyle = "#e8d7a8";
      const h1 = horn === "crown" ? R * 1.15 : R * 0.85;
      ctx.beginPath();
      ctx.moveTo(R * 0.15, -R * 0.55);
      ctx.lineTo(R * 0.05, -R * 0.55 - h1);
      ctx.lineTo(R * 0.45, -R * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(R * 0.15, R * 0.55);
      ctx.lineTo(R * 0.05, R * 0.55 + h1);
      ctx.lineTo(R * 0.45, R * 0.4);
      ctx.closePath();
      ctx.fill();
      if (horn === "crown") {
        ctx.beginPath();
        ctx.moveTo(-R * 0.1, -R * 0.15);
        ctx.lineTo(-R * 0.35, -R * 1.05);
        ctx.lineTo(R * 0.15, -R * 0.2);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();

    if ((s.tail || "none") === "rattle" && pts.length > 2) {
      const tail = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const tang = Math.atan2(tail.y - prev.y, tail.x - prev.x);
      ctx.save();
      ctx.translate(tail.x + ox, tail.y + oy);
      ctx.rotate(tang);
      ctx.fillStyle = "#c4a36a";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(-6 - k * 5, 0, 4.2 - k * 0.4, 3.2 - k * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (s.bounty) {
      ctx.strokeStyle = "#e7c56a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, s.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (s.isPlayer && state.meta.hotFang) {
      ctx.strokeStyle = "rgba(231,197,106,0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, s.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (s.isPlayer && state.world && state.world.emoteUntil > performance.now()) {
      ctx.fillStyle = "#e7c56a";
      ctx.font = "16px Trebuchet MS";
      ctx.fillText("ssss", hx, hy - s.radius - 28);
    }
    if (s.isPlayer && state.meta.charm && state.meta.charm !== "none") {
      const col = state.meta.charm === "motes" ? "#00aae4" : state.meta.charm === "sparks" ? "#e7c56a" : "#9fe7c2";
      ctx.fillStyle = col;
      for (let k = 0; k < 5; k++) {
        const ang = (performance.now() / 180 + k) % (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(hx + Math.cos(ang) * (14 + k * 3), hy + Math.sin(ang) * (10 + k * 2), 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#d7efe4";
    ctx.font = "12px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText((s.bounty ? "★ " : "") + s.name, hx, hy - s.radius - 14);
  }

  function worldToScreen(x, y, cam) {
    return { x: x - cam.x + canvas.width / 2, y: y - cam.y + canvas.height / 2 };
  }

  function drawTree(t, cam) {
    const p = worldToScreen(t.x, t.y, cam);
    if (p.x < -80 || p.y < -80 || p.x > canvas.width + 80 || p.y > canvas.height + 80) return;
    ctx.fillStyle = "#3a2614";
    ctx.beginPath();
    ctx.arc(p.x, p.y, t.trunk, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${t.hue}, 42%, 22%, 0.92)`;
    ctx.beginPath();
    ctx.arc(p.x - 10, p.y - 16, t.canopy * 0.62, 0, Math.PI * 2);
    ctx.arc(p.x + 14, p.y - 10, t.canopy * 0.55, 0, Math.PI * 2);
    ctx.arc(p.x, p.y - 28, t.canopy * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${t.hue + 8}, 50%, 30%, 0.55)`;
    ctx.beginPath();
    ctx.arc(p.x - 4, p.y - 22, t.canopy * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLobbyJungle() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = "#050806";
    ctx.fillRect(0, 0, W, H);
    if (lobbyArt.complete && lobbyArt.naturalWidth) {
      const iw = lobbyArt.naturalWidth;
      const ih = lobbyArt.naturalHeight;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(lobbyArt, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    ctx.fillStyle = "rgba(6, 16, 8, 0.38)";
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = "#e7c56a";
    ctx.font = "22px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("APEX.XRP", W / 2, H * 0.88);
    ctx.fillStyle = "#d7efe4";
    ctx.font = "14px Trebuchet MS";
    ctx.fillText("Apex Predator. Hunt the canopy.", W / 2, H * 0.88 + 22);
  }

  function render() {
    const w = state.world;
    const biome = (w && w.biome) || "jungle";
    if (!w) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLobbyJungle();
      return;
    }
    ctx.fillStyle = biome === "night" ? "#05070a" : biome === "river" ? "#0a1614" : "#0a160c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cam = w.cam;
    ctx.strokeStyle = biome === "night" ? "#121820" : biome === "river" ? "#16332c" : "#16351c";
    ctx.lineWidth = 1;
    const step = biome === "jungle" ? 120 : 100;
    const ox = -((cam.x - canvas.width / 2) % step);
    const oy = -((cam.y - canvas.height / 2) % step);
    ctx.beginPath();
    for (let x = ox; x < canvas.width; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    }
    for (let y = oy; y < canvas.height; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    const sx0 = canvas.width / 2 - cam.x;
    const sy0 = canvas.height / 2 - cam.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(sx0, sy0, w.map, w.map);
    ctx.fillStyle = biome === "night" ? "#020308" : biome === "river" ? "#03100e" : "#040805";
    ctx.fill("evenodd");
    const wall = biome === "night" ? "#6ad0ff" : biome === "river" ? "#7cf0c2" : "#e7c56a";
    ctx.strokeStyle = wall;
    ctx.lineWidth = 8;
    ctx.strokeRect(sx0, sy0, w.map, w.map);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(sx0 + 28, sy0 + 28, w.map - 56, w.map - 56);
    ctx.setLineDash([]);
    const midX = sx0 + w.map / 2;
    const midY = sy0 + w.map / 2;
    const gate = 260;
    ctx.fillStyle = "#040805";
    ctx.fillRect(sx0 - 10, midY - gate, 20, gate * 2);
    ctx.fillRect(sx0 + w.map - 10, midY - gate, 20, gate * 2);
    ctx.fillRect(midX - gate, sy0 - 10, gate * 2, 20);
    ctx.fillRect(midX - gate, sy0 + w.map - 10, gate * 2, 20);
    ctx.strokeStyle = "#7cf0c2";
    ctx.lineWidth = 3;
    const rings = [
      [sx0, midY],
      [sx0 + w.map, midY],
      [midX, sy0],
      [midX, sy0 + w.map],
    ];
    for (const [px, py] of rings) {
      ctx.beginPath();
      ctx.ellipse(px, py, 18, 52, px === midX ? Math.PI / 2 : 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (biome === "jungle") {
      ctx.fillStyle = "rgba(18, 50, 22, 0.35)";
      for (let i = 0; i < 8; i++) {
        const gx = ((i * 173) % w.map) - cam.x + canvas.width / 2;
        const gy = ((i * 291) % w.map) - cam.y + canvas.height / 2;
        ctx.beginPath();
        ctx.ellipse(gx, gy, 70, 28, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const t of w.trees) drawTree(t, cam);

    const sx = canvas.width / 2 - cam.x;
    const sy = canvas.height / 2 - cam.y;
    for (const f of w.food) {
      f.value = 0;
      f.c = "#9fe7c2";
      const fx = f.x + sx, fy = f.y + sy;
      if (fx < -8 || fy < -8 || fx > canvas.width + 8 || fy > canvas.height + 8) continue;
      ctx.beginPath();
      ctx.fillStyle = "#9fe7c2";
      ctx.arc(fx, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const f of (state.mode === "killcam" ? [] : w.dropped)) {
      const pay = !!(f.fromPlayer && f.value > 0);
      ctx.beginPath();
      ctx.fillStyle = pay ? "#e7c56a" : "#9fe7c2";
      ctx.arc(f.x + sx, f.y + sy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const s of w.snakes) if (s.alive) drawSnake(s, cam);
    const rem = state.mode === "play" ? (window.apexPeers || {}) : {};
    const now = Date.now();
    Object.keys(rem).forEach((nm) => {
      const r = rem[nm];
      if (!r || now - r.at > 3000) return;
      const trail = r.trail || [{ x: r.x, y: r.y }];
      if (trail.length) {
        ctx.strokeStyle = "#e7c56a";
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        trail.forEach((pt, i) => {
          const hx = pt.x - cam.x + canvas.width / 2;
          const hy = pt.y - cam.y + canvas.height / 2;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        });
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(nm, r.x - cam.x + canvas.width / 2 + 10, r.y - cam.y + canvas.height / 2);
    });
    if (state.mode === "killcam" && w.kcPeers) {
      w.kcPeers.forEach((peer) => {
        const trail = peer.pts || [];
        if (!trail.length) return;
        ctx.strokeStyle = "#e7c56a";
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        trail.forEach((pt, i) => {
          const hx = pt.x - cam.x + canvas.width / 2;
          const hy = pt.y - cam.y + canvas.height / 2;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        });
        ctx.stroke();
        const last = trail[trail.length - 1];
        ctx.fillStyle = "#fff";
        ctx.font = "12px sans-serif";
        ctx.fillText(peer.name, last.x - cam.x + canvas.width / 2 + 10, last.y - cam.y + canvas.height / 2);
      });
    }
    drawMinimap(w);

    if (w.snakes[0] && !w.snakes[0].alive && state.mode === "play" && !w.watch) {
      const gained = grantMatchExp(false, w);
      state.meta.streak = 0;
      state.meta.hotFang = false;
      state.meta.journal.greediest = Math.max(state.meta.journal.greediest || 0, w.prizePool || 0);
      if (w.insure) {
        const back = +(state.tier.stakeXrp * 0.2).toFixed(4);
        state.balanceXrp = +(state.balanceXrp + back).toFixed(6);
        toast("Insurance shed +" + back + " XRP");
      }
      save();
      beginKillCam(w, gained);
    }
  }

  function beginKillCam(w, gained) {
    state.mode = "killcam";
    state.killcam = { frames: (w.tape && w.tape.slice()) || [], i: 0, gained };
    const tag = document.getElementById("killcam-tag");
    if (tag) tag.classList.remove("hidden");
    toast("Kill cam");
  }

  function stepKillCam() {
    const kc = state.killcam;
    const w = state.world;
    if (!kc || !w) {
      state.mode = "dead";
      return;
    }
    kc.hold = (kc.hold || 0) + 1;
    if (kc.hold % 2 === 1) return;
    const frame = kc.frames[kc.i];
    kc.i += 1;
    if (!frame) {
      const tag = document.getElementById("killcam-tag");
      if (tag) tag.classList.add("hidden");
      if (w.snakes[0]) w.snakes[0].alive = false;
      state.mode = "dead";
      showEnd(false, { exp: kc.gained });
      return;
    }
    w.cam.x = frame.cam.x;
    w.cam.y = frame.cam.y;
    if (w.snakes[0] && frame.you) {
      w.snakes[0].alive = true;
      w.snakes[0].pts = frame.you;
      if (frame.you.length > 1) {
        const a = frame.you[0], b = frame.you[1];
        w.snakes[0].dir = Math.atan2(a.y - b.y, a.x - b.x);
      }
      w.kcPeers = frame.peers || [];
    }
  }

  function drawMinimap(w) {
    if (!w || (state.mode !== "play" && state.mode !== "killcam")) return;
    const size = Math.min(148, Math.max(110, canvas.width * 0.16));
    const pad = 12;
    const x = canvas.width - size - pad;
    const y = pad;
    const sc = size / w.map;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(6,12,8,0.82)";
    ctx.strokeStyle = "#e7c56a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, size, size, 10) : ctx.rect(x, y, size, size);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(124,240,194,0.7)";
    ctx.lineWidth = 2;
    const mid = size / 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + mid);
    ctx.lineTo(x + 16, y + mid);
    ctx.moveTo(x + size - 16, y + mid);
    ctx.lineTo(x + size - 6, y + mid);
    ctx.moveTo(x + mid, y + 6);
    ctx.lineTo(x + mid, y + 16);
    ctx.moveTo(x + mid, y + size - 16);
    ctx.lineTo(x + mid, y + size - 6);
    ctx.stroke();
    for (const s of w.snakes) {
      if (!s.alive || !s.pts[0]) continue;
      const px = x + s.pts[0].x * sc;
      const py = y + s.pts[0].y * sc;
      ctx.beginPath();
      ctx.fillStyle = s.isPlayer ? "#3dff9a" : (s.bounty || s.hotFang) ? "#c77dff" : "#ff5d6c";
      ctx.arc(px, py, s.isPlayer ? 4.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#e8f0ea";
    ctx.font = "10px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText("YOU · HUNT · HOT", x + 8, y + 14);
    ctx.restore();
  }

  function loop(t) {
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
  }

  function grantMatchExp(cashed, w) {
    const you = w && w.snakes && w.snakes[0];
    const len = you ? you.pts.length : 10;
    const kills = state.matchKills || 0;
    const stake = state.tier.stakeXrp;
    let gained = cashed
      ? 28 + stake * 6 + Math.floor(len * 1.6) + kills * 22 + Math.floor((w.prizePool || 0) * 12)
      : 8 + Math.floor(len * 0.7) + kills * 14;
    gained = Math.max(1, Math.floor(gained));
    const before = rankOf(state.exp).cur.name;
    state.exp += gained;
    const after = rankOf(state.exp);
    upsertBoardExp();
    pushChat("system", `+${gained} EXP` + (after.cur.name !== before ? ` — promoted to ${after.cur.name}` : ""), true);
    return gained;
  }
  function upsertBoardExp() {
    let row = state.board.find((b) => b.name === state.playerName);
    if (!row) {
      row = { name: state.playerName, xrp: 0, exp: state.exp, server: state.tier.name };
      state.board.push(row);
    }
    row.exp = state.exp;
    row.server = state.tier.name;
    state.board.sort((a, b) => (b.exp || 0) - (a.exp || 0) || (b.xrp || 0) - (a.xrp || 0));
  }
  function pushChat(who, text, sys, tip) {
    const line = {
      who: cleanName(who),
      text: String(text).replace(/[<>]/g, "").slice(0, 160),
      sys: !!sys,
      tip: !!tip,
    };
    if (!line.text) return;
    state.chat.push(line);
    if (state.chat.length > 40) state.chat = state.chat.slice(-40);
    save();
    renderChat();
  }
  function findHunter(name) {
    const key = nameKey(name);
    if (!key) return null;
    if (nameKey(state.playerName) === key) return { name: state.playerName, self: true };
    const row = (state.board || []).find((b) => nameKey(b.name) === key);
    if (row) return { name: row.name, self: false, row };
    const bot = BOT_NAMES.find((n) => nameKey(n) === key);
    if (bot) return { name: bot, self: false, row: null };
    return null;
  }
  function handleTipCommand(raw) {
    const text = String(raw || "").trim();
    const help = /^\/?(tip|tipbot)\s*(help|\?|$)/i;
    if (help.test(text) && !/^\/tip\s+\S+\s+/i.test(text)) {
      pushChat("TipBot", "Usage: /tip Username 0.5  — min 0.01 XRP, max 20. Target must be on the board or in the den.", true, true);
      return true;
    }
    const m = text.match(/^\/tip(?:bot)?\s+@?([A-Za-z0-9_\-]{2,16})\s+([0-9]+(?:\.[0-9]{1,6})?)$/i);
    if (!m) {
      if (/^\/tip/i.test(text)) {
        pushChat("TipBot", "Could not read that. Try /tip Username 0.5", true, true);
        return true;
      }
      return false;
    }
    const target = findHunter(m[1]);
    const amt = +Number(m[2]).toFixed(6);
    if (!target) {
      pushChat("TipBot", "No hunter named " + cleanName(m[1]) + ".", true, true);
      return true;
    }
    if (target.self) {
      pushChat("TipBot", "You cannot tip yourself.", true, true);
      return true;
    }
    if (!Number.isFinite(amt) || amt < 0.01) {
      pushChat("TipBot", "Minimum tip is 0.01 XRP.", true, true);
      return true;
    }
    if (amt > 20) {
      pushChat("TipBot", "Maximum tip is 20 XRP.", true, true);
      return true;
    }
    if (state.balanceXrp < amt) {
      pushChat("TipBot", "Not enough XRP in your stack.", true, true);
      return true;
    }
    if (state.mode === "play") {
      pushChat("TipBot", "Finish the den before you tip.", true, true);
      return true;
    }
    state.balanceXrp = +(state.balanceXrp - amt).toFixed(6);
    let row = target.row || (state.board || []).find((b) => nameKey(b.name) === nameKey(target.name));
    if (!row) {
      row = { name: target.name, xrp: 0, exp: 0, server: "Den" };
      state.board.push(row);
    }
    row.xrp = +(Number(row.xrp || 0) + amt).toFixed(4);
    save();
    renderMeta();
    renderBoard();
    pushChat(
      "TipBot",
      state.playerName + " tipped " + target.name + " " + amt + " XRP  (" + usd(amt) + ")",
      false,
      true
    );
    if (state.meta.tipsDay !== dayKey()) { state.meta.tipsDay = dayKey(); state.meta.tipsCount = 0; }
    state.meta.tipsCount += 1;
    if (state.meta.tipsCount >= 3) {
      pushChat("TipBot", state.playerName + " is on a tip streak (" + state.meta.tipsCount + " today).", false, true);
    }
    toast("Tipped " + target.name + " " + amt + " XRP");
    return true;
  }
  function formatChatText(text) {
    return escapeHtml(text).replace(/:xrp:/g, '<img class="chat-xrp" src="logo.png" alt="XRP">');
  }
  function renderChat() {
    const el = document.getElementById("chat-log");
    if (!el) return;
    el.innerHTML = state.chat
      .slice(-40)
      .map((m) => {
        const kind = m.tip ? " tip" : m.sys ? " sys" : "";
        return m.sys && !m.tip
          ? `<div class="chat-line sys">${escapeHtml(m.text)}</div>`
          : `<div class="chat-line${kind}"><span class="who">${escapeHtml(m.who)}</span> ${formatChatText(m.text)}</div>`;
      })
      .join("");
    el.scrollTop = el.scrollHeight;
  }
  function renderRank() {
    const el = document.getElementById("rank-card");
    if (!el) return;
    const r = rankOf(state.exp);
    const floor = r.cur.exp;
    const ceil = r.next ? r.next.exp : r.cur.exp;
    const span = Math.max(1, ceil - floor);
    const pct = r.next ? Math.min(100, ((state.exp - floor) / span) * 100) : 100;
    el.innerHTML = `<b>${escapeHtml(rankBand(state.exp))}</b>
      ${state.exp.toLocaleString()} EXP · ${state.meta.tickets || 0} ticket${(state.meta.tickets || 0) === 1 ? "" : "s"}
      <div class="rank-bar"><i style="width:${pct.toFixed(1)}%"></i></div>
      ${r.next ? `Next ${escapeHtml(r.next.name)} · ${Math.max(0, r.next.exp - state.exp).toLocaleString()} EXP to go` : "Peak rank."}`;
  }

  function openRankLadder() {
    const box = document.getElementById("rank-modal");
    const list = document.getElementById("rank-ladder");
    const nextEl = document.getElementById("rank-modal-next");
    if (!box || !list) return;
    const r = rankOf(state.exp);
    const need = r.next ? Math.max(0, r.next.exp - state.exp) : 0;
    if (nextEl) {
      nextEl.textContent = r.next
        ? `You are ${r.cur.name} · ${state.exp.toLocaleString()} EXP · ${need.toLocaleString()} EXP until ${r.next.name}`
        : `You are ${r.cur.name} · peak of the ladder`;
    }
    list.innerHTML = RANKS.map((rk, i) => {
      const cls = state.exp >= rk.exp ? (r.cur.name === rk.name ? "now" : "have") : "wait";
      const mark = r.cur.name === rk.name ? "●" : state.exp >= rk.exp ? "✓" : String(i + 1);
      const extra = r.cur.name === rk.name && r.next ? ` · ${need.toLocaleString()} EXP to next` : `${rk.exp.toLocaleString()} EXP`;
      return `<div class="rank-row ${cls}"><span>${mark}</span><span>${escapeHtml(rk.name)}</span><span>${extra}</span></div>`;
    }).join("");
    box.classList.remove("hidden");
  }

  function cashOut() {
    const w = state.world;
    if (!w || state.mode !== "play" || !w.snakes[0].alive || w.watch) return;
    if (w.allIn && w.snakes[0].pts.length < 28) {
      toast("All-in coil: grow to 28 first.");
      return;
    }
    const gross = w.prizePool;
    const fee = +(gross * FEE_RATE).toFixed(4);
    const net = +(gross - fee).toFixed(4);
    state.balanceXrp = +(state.balanceXrp + net).toFixed(6);
    state.feePaidTotal = +(state.feePaidTotal + fee).toFixed(4);
    state.meta.weekFees = +(state.meta.weekFees + fee).toFixed(4);
    state.meta.seasonPot = +(state.meta.seasonPot + fee * 0.02).toFixed(4);
    state.meta.streak = (state.meta.streak || 0) + 1;
    state.meta.hotFang = state.meta.streak >= 3;
    state.meta.journal.bestCash = Math.max(state.meta.journal.bestCash || 0, net);
    state.meta.journal.longest = Math.max(state.meta.journal.longest || 0, w.snakes[0].pts.length);
    creditContract("cash", net);
    creditContract("kills", state.matchKills);
    maybeDropSkin(true, net, w);
    state.meta.seasonExp += 15;
    
    const rx = "sim:" + Math.random().toString(16).slice(2, 10);
    pushChat("den", "Cash-out receipt " + rx + " · " + net + " XRP", true);
    state.sheds = [{ name: state.playerName, xrp: net, at: Date.now() }].concat(state.sheds || []).slice(0, 30);
    renderSheds();
    const row = state.board.find((b) => b.name === state.playerName);
    if (row) row.xrp = +(row.xrp + net).toFixed(2);
    else state.board.unshift({ name: state.playerName, xrp: net, server: state.tier.name });
    state.board.sort((a, b) => b.xrp - a.xrp);
    const gained = grantMatchExp(true, w);
    save();
    state.mode = "cashed";
    showEnd(true, { gross, fee, net, exp: gained });
  }

  function showEnd(win, money) {
    overlay.classList.remove("hidden");
    const box = document.getElementById("modal-body");
    const expLine = money && money.exp ? ` +${money.exp} EXP (${escapeHtml(rankOf(state.exp).cur.name)})` : "";
    if (win) {
      box.innerHTML = `
        <h3>Shed and leave</h3>
        <p>Gross ${money.gross} XRP (${usd(money.gross)}). Fee ${money.fee} XRP to treasury. You keep ${money.net} XRP.${expLine}</p>
        <button class="btn primary" id="strike">Strike again</button>
        <button class="btn" id="again">Back to dens</button>`;
    } else {
      box.innerHTML = `
        <h3>You were dropped</h3>
        <p>Head met another snake's body. Buy-in is gone. Shed mass stays in the pit.${expLine}</p>
        <button class="btn primary" id="strike">Strike again</button>
        <button class="btn" id="watch-after">Watch den</button>
        <button class="btn" id="again">Back to dens</button>`;
    }
    creditContract("den", 1);
    const strike = document.getElementById("strike");
    if (strike) strike.onclick = () => {
      overlay.classList.add("hidden");
      startMatch();
    };
    const watchAfter = document.getElementById("watch-after");
    if (watchAfter) watchAfter.onclick = () => {
      overlay.classList.add("hidden");
      startMatch({ watch: true });
      const w = state.world;
      if (!w) return;
      w.watch = true;
      w.watchFocus = 1;
      w.snakes[0].isPlayer = false;
      w.snakes[0].stake = 0;
      applyWatchUi(true);
      cycleWatch(1);
    };
        document.getElementById("again").onclick = () => {
      fetch("https://apex-xrp-server-production.up.railway.app/room/jungle/leave?name=" + encodeURIComponent(state.playerName)).catch(() => {});
      state.world = null;
      state.mode = "lobby";
      overlay.classList.add("hidden");
      applyWatchUi(false);
      setPlayingLayout(false);
      resize();
      renderMeta();
      renderBoard();
      renderRank();
      renderChat();
    };
  }

  function setPlayingLayout(on) {
    const app = document.getElementById("app");
    app.classList.toggle("playing", on);
    app.classList.remove("sheet-left", "sheet-right");
    document.body.style.overflow = on ? "hidden" : "auto";
    document.body.style.touchAction = on ? "none" : "manipulation";
    const boost = document.getElementById("touch-ui");
    if (boost && !on) boost.style.display = "none";
    setArenaFullscreen(on);
  }
  function setArenaFullscreen(on) {
    const root = document.documentElement;
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (on && !fs) {
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        if (req) req.call(root);
      } else if (!on && fs) {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex) ex.call(document);
      }
    } catch (_) {}
  }

  function pointFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    state.mouse.x = t.clientX - r.left;
    state.mouse.y = t.clientY - r.top;
  }

  function renderQueue() {
    const el = document.getElementById("queue-banner");
    if (!el) return;
    if (state.mode === "play" || state.mode === "killcam") {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    const m = new Date().getMinutes();
    const j = 3 + (m % 6);
    const r = 1 + (m % 4);
    const n = m % 3;
    el.textContent = "Queue · Jungle " + j + " · River Coil " + r + " · Night Apex " + n;
  }
  function renderMeta() {
    document.getElementById("bal").textContent = state.balanceXrp.toFixed(3) + " XRP";
    document.getElementById("bal-usd").textContent = usd(state.balanceXrp);
    const et = document.getElementById("exp-tickets");
    if (et) et.textContent = state.exp.toLocaleString() + " EXP · " + (state.meta.tickets || 0) + " Sunday tickets";
    const px = document.getElementById("price");
    if (px) px.textContent = "$" + state.xrpUsd.toFixed(4);
    const age = document.getElementById("price-age");
    if (age) age.textContent = state.priceAt ? "live" : "cached";
    document.getElementById("name-out").textContent = state.playerName;
    document.getElementById("net-out").textContent = state.network;
    document.getElementById("fee-out").textContent = state.feePaidTotal.toFixed(3) + " XRP";
    document.getElementById("treasury-out").textContent = state.treasury || "not set — open Treasury";
    const w = state.world;
    document.getElementById("hud-server").textContent = (w && w.watch) ? "Watch" : ((w && w.duel) ? ("1v1 vs " + w.duel) : state.tier.name);
    document.getElementById("hud-stake").textContent = (w && w.watch) ? "—" : ((w && w.duel) ? (w.snakes[0].stake + " XRP") : (state.tier.stakeXrp + " XRP"));
    document.getElementById("hud-pool").textContent = w ? w.prizePool.toFixed(3) + " XRP" : "—";
    const focus = w && w.watch ? (w.snakes[w.watchFocus] || w.snakes[0]) : (w && w.snakes[0]);
    document.getElementById("hud-len").textContent = focus ? String(focus.pts.length) : "—";
    const pov = document.getElementById("watch-pov");
    if (pov && focus) pov.textContent = focus.name;
    renderMetaPanels();
    renderQueue();
    renderSheds();
  }

  function renderSheds() {
    const tb = document.getElementById("shed-body");
    if (!tb) return;
    const rows = state.sheds || [];
    tb.innerHTML = rows.length
      ? rows.slice(0, 16).map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${Number(s.xrp).toFixed(3)}</td><td>${usd(s.xrp)}</td></tr>`).join("")
      : `<tr><td colspan="3">No sheds yet.</td></tr>`;
  }
  function renderBoard() {
    const tb = document.getElementById("board-body");
    tb.innerHTML = state.board
      .slice(0, 10)
      .map((r, i) => {
        const rk = rankOf(r.exp || 0).cur.name;
        const cashed = Number(r.xrp) || 0;
        return `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(rk)}</td><td>${Math.floor(r.exp || 0)}</td></tr>`;
      })
      .join("");
  }

  function renderTiers() {
    const el = document.getElementById("tiers");
    el.innerHTML = TIERS.map(
      (t) => `
      <div class="tier ${t.id === state.tier.id ? "active" : ""}" data-id="${t.id}">
        <div>
          <div>${t.name} den</div>
          <small style="color:#8aa094">${t.biome} · ${t.bots} hunters</small>
        </div>
        <b>${t.stakeXrp} XRP</b>
      </div>`
    ).join("");
    el.querySelectorAll(".tier").forEach((n) => {
      n.onclick = () => {
        state.tier = TIERS.find((t) => t.id === n.dataset.id);
        renderTiers();
        renderMeta();
      };
    });
  }

  function renderSkins() {
    const el = document.getElementById("skins");
    el.innerHTML = PRESET_SKINS.map(
      (s, i) =>
        `<div class="skin ${state.skin.a === s.a ? "sel" : ""}" data-i="${i}" style="background:linear-gradient(90deg,${s.a},${s.b})"></div>`
    ).join("");
    el.querySelectorAll(".skin").forEach((n) => {
      n.onclick = () => {
        const s = PRESET_SKINS[+n.dataset.i];
        state.skin.a = s.a;
        state.skin.b = s.b;
        save();
        renderSkins();
      };
    });
    document.getElementById("species").value = state.skin.species;
    document.getElementById("pattern").value = state.skin.pattern;
    const hornEl = document.getElementById("horn");
    const tailEl = document.getElementById("tail");
    if (hornEl) hornEl.value = state.skin.horn || "none";
    if (tailEl) tailEl.value = state.skin.tail || "none";
    paintPreview();
  }

  function paintPreview(now) {
    if (typeof now === "number") paintPreview.t = now;
    const c = document.getElementById("skin-preview");
    if (!c) return;
    const g = c.getContext("2d");
    g.fillStyle = "#07140c";
    g.fillRect(0, 0, c.width, c.height);
    const t = (typeof paintPreview.t === "number" ? paintPreview.t : performance.now()) / 220;
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const x = 250 - i * 11 + Math.sin(t * 0.4) * 8;
      const y = 70 + Math.sin(i * 0.42 - t) * 18;
      pts.push({ x, y });
    }
    const rad0 = 8;
    const pat = state.skin.pattern;
    for (let i = pts.length - 1; i >= 1; i--) {
      const p = pts[i], nxt = pts[i - 1];
      const ang = Math.atan2(nxt.y - p.y, nxt.x - p.x);
      const t = i / pts.length;
      const rad = rad0 * (1.12 - t * 0.68);
      const col = patternColor(i, pat, state.skin.a, state.skin.b);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(ang);
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(0, 0, rad * 1.45, rad * 0.7, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if ((state.skin.tail || "none") === "rattle") {
      const tail = pts[pts.length - 1];
      g.fillStyle = "#c4a36a";
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(tail.x - 8 - k * 5, tail.y, 4.2 - k * 0.4, 3.1 - k * 0.2, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    const hx = pts[0].x, hy = pts[0].y, R = rad0 * 1.35;
    g.save();
    g.translate(hx, hy);
    if (state.skin.species === "cobra") {
      g.fillStyle = state.skin.b;
      g.beginPath();
      g.moveTo(-R * 0.15, 0);
      g.quadraticCurveTo(-R * 1.2, -R * 2, R * 0.1, -R * 2.3);
      g.quadraticCurveTo(R * 1.4, 0, R * 0.2, R * 0.4);
      g.closePath();
      g.fill();
    }
    g.fillStyle = state.skin.a;
    g.beginPath();
    g.ellipse(R * 0.35, 0, R * 1.45, R * 0.8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = state.skin.eyes || "#ffe9a8";
    g.beginPath();
    g.ellipse(R * 0.7, -R * 0.32, R * 0.22, R * 0.14, 0.2, 0, Math.PI * 2);
    g.ellipse(R * 0.7, R * 0.32, R * 0.22, R * 0.14, -0.2, 0, Math.PI * 2);
    g.fill();
    const horn = state.skin.horn || "none";
    if (horn !== "none") {
      g.fillStyle = "#e8d7a8";
      const h1 = horn === "crown" ? R * 1.1 : R * 0.8;
      g.beginPath();
      g.moveTo(R * 0.1, -R * 0.5);
      g.lineTo(0, -R * 0.5 - h1);
      g.lineTo(R * 0.4, -R * 0.35);
      g.fill();
      g.beginPath();
      g.moveTo(R * 0.1, R * 0.5);
      g.lineTo(0, R * 0.5 + h1);
      g.lineTo(R * 0.4, R * 0.35);
      g.fill();
    }
    g.restore();
    g.fillStyle = "#d7efe4";
    g.font = "12px Trebuchet MS";
    g.textAlign = "center";
    g.fillText(state.playerName, hx, hy - 22);
  }

  function resize() {
    const wrap = canvas.parentElement;
    const vv = window.visualViewport;
    canvas.width = wrap.clientWidth || window.innerWidth;
    canvas.height = wrap.clientHeight || (vv ? vv.height : window.innerHeight);
    const app = document.getElementById("app");
    if (app && window.innerWidth <= 980 && state.mode !== "play") {
      const s = Math.min(window.innerWidth / 1100, window.innerHeight / 720);
      app.style.transform = "scale(" + s + ")";
    } else if (app) app.style.transform = "";
  }
  window.addEventListener("resize", resize);
  if (window.visualViewport) visualViewport.addEventListener("resize", resize);
  document.addEventListener("fullscreenchange", resize);
  document.addEventListener("webkitfullscreenchange", resize);

  canvas.addEventListener("mousemove", pointFromEvent);
  canvas.addEventListener("mousedown", (e) => {
    pointFromEvent(e);
  });
  canvas.addEventListener("touchstart", (e) => {
    if (e.target.closest && e.target.closest("#boost-btn, #cash")) return;
    e.preventDefault();
    pointFromEvent(e);
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    pointFromEvent(e);
  }, { passive: false });

  const stickEl = document.getElementById("stick");
  const knobEl = document.getElementById("stick-knob");
  function moveStick(e) {
    if (!stickEl) return;
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    const r = stickEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const max = r.width * 0.32;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    state.stick.on = true;
    state.stick.x = dx / max;
    state.stick.y = dy / max;
    if (knobEl) {
      knobEl.style.transform = "translate(" + dx + "px," + dy + "px)";
    }
  }
  function endStick() {
    state.stick.on = false;
    if (knobEl) knobEl.style.transform = "";
  }
  if (stickEl) {
    stickEl.addEventListener("touchstart", (e) => { e.preventDefault(); moveStick(e); }, { passive: false });
    stickEl.addEventListener("touchmove", (e) => { e.preventDefault(); moveStick(e); }, { passive: false });
    stickEl.addEventListener("touchend", endStick);
    stickEl.addEventListener("touchcancel", endStick);
  }
  const boostBtn = document.getElementById("boost-btn");
  function boostOn(e) {
    if (e) e.preventDefault();
    state.boosting = true;
    boostBtn.classList.add("held");
  }
  function boostOff(e) {
    if (e) e.preventDefault();
    state.boosting = false;
    boostBtn.classList.remove("held");
  }
  boostBtn.addEventListener("mousedown", boostOn);
  boostBtn.addEventListener("touchstart", boostOn, { passive: false });
  window.addEventListener("mouseup", boostOff);
  window.addEventListener("touchend", boostOff);
  window.addEventListener("touchcancel", boostOff);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); state.boosting = true; }
    if (e.key === "e" || e.key === "E") doEmote();
    if ((e.key === "q" || e.key === "Q") && !e.repeat) beginCashHold();
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") state.boosting = false;
    if (e.key === "q" || e.key === "Q") cancelCashHold();
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = () => {
      const app = document.getElementById("app");
      const cls = btn.dataset.panel === "left" ? "sheet-left" : "sheet-right";
      const on = !app.classList.contains(cls);
      app.classList.remove("sheet-left", "sheet-right");
      if (on) app.classList.add(cls);
    };
  });

  function thisSundayDusk() {
    const d = new Date();
    const sun = new Date(d);
    sun.setDate(d.getDate() - d.getDay());
    sun.setHours(18, 0, 0, 0);
    return sun;
  }
  function nextSunday() {
    const dusk = thisSundayDusk();
    if (Date.now() < dusk.getTime()) return dusk;
    const n = new Date(dusk);
    n.setDate(n.getDate() + 7);
    return n;
  }
  function coilWindowOpen() {
    return Date.now() >= thisSundayDusk().getTime();
  }
  function npcTicketCount() {
    const seed = (weekKey() || "w").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 18 + (seed % 40);
  }
  function fluteSfx() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const now = ac.currentTime;
      [523, 587, 659, 698, 659, 587, 523].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.28);
        g.gain.exponentialRampToValueAtTime(0.08, now + i * 0.28 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.28 + 0.26);
        o.connect(g);
        g.connect(ac.destination);
        o.start(now + i * 0.28);
        o.stop(now + i * 0.28 + 0.28);
      });
    } catch (_) {}
  }
  function refreshCoilPage() {
    const left = nextSunday() - Date.now();
    const el = document.getElementById("coil-count");
    if (el) {
      if (left <= 0) el.textContent = "The coil is ready to shed.";
      else {
        const h = Math.floor(left / 3600000);
        const m = Math.floor((left % 3600000) / 60000);
        const s = Math.floor((left % 60000) / 1000);
        el.textContent = "Draw in " + h + "h " + m + "m " + s + "s";
      }
    }
    const yours = state.meta.tickets || 0;
    const pool = yours + npcTicketCount();
    const potEl = document.getElementById("coil-pot");
    if (potEl) potEl.textContent = (state.meta.seasonPot || 0).toFixed(3);
    const usdEl = document.getElementById("coil-pot-usd");
    if (usdEl) usdEl.textContent = usd(state.meta.seasonPot || 0);
    const tEl = document.getElementById("coil-tickets");
    if (tEl) tEl.textContent = String(pool);
    const yEl = document.getElementById("coil-yours");
    if (yEl) yEl.textContent = String(yours);
    const res = document.getElementById("coil-result");
    if (res && state.meta.lastCoilWeek === weekKey() && state.meta.lastCoilWin) {
      res.textContent = "This Sunday's ticket: #" + state.meta.lastCoilWin + " (locked)";
    }
    const btn = document.getElementById("coil-draw");
    if (btn) {
      if (state.meta.lastCoilWeek === weekKey() && state.meta.lastCoilWin) btn.textContent = "Drawn this Sunday";
      else if (!coilWindowOpen()) btn.textContent = "The coil still sleeps";
      else btn.textContent = "Play the flute";
    }
    const wb = document.getElementById("coil-winners");
    if (wb) {
      const rows = state.coilWins || [];
      wb.innerHTML = rows.length
        ? rows.slice(0, 12).map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${Number(s.xrp).toFixed(3)}</td><td>${usd(s.xrp)}</td></tr>`).join("")
        : `<tr><td colspan="3">No sheds yet.</td></tr>`;
    }
  }
  function playCoilBite() {
    const vid = document.getElementById("coil-vid");
    const snake = document.getElementById("coil-snake");
    const num = document.getElementById("coil-num");
    const res = document.getElementById("coil-result");
    hissSfx(true);
    if (snake) snake.classList.add("hidden");
    if (vid) {
      try { vid.currentTime = 0; vid.play(); } catch (_) {}
    }
    const lines = [
      "The coil still sleeps. Come back after dusk.",
      "Too early to shed, hunter.",
      "Fang closed. Sunday after 6.",
    ];
    const line = lines[Math.floor(Math.random() * lines.length)];
    setTimeout(() => {
      if (snake) {
        snake.innerHTML = "Not dusk yet.";
        snake.classList.remove("hidden");
      }
      if (res) res.textContent = line;
      toast(line);
    }, 5200);
  }
  function runCoilDraw() {
    const already = state.meta.lastCoilWeek === weekKey() && state.meta.lastCoilWin;
    if (already) {
      const res = document.getElementById("coil-result");
      const snake = document.getElementById("coil-snake");
      const vid = document.getElementById("coil-vid");
      if (vid) { try { vid.pause(); } catch (_) {} }
      if (snake) snake.classList.add("hidden");
      if (res) res.textContent = "Already shed this Sunday. Ticket #" + state.meta.lastCoilWin + ". Try again next week.";
      toast("Try again next Sunday.");
      return;
    }
    const yours = state.meta.ticketIds && state.meta.ticketIds.length
      ? state.meta.ticketIds.slice()
      : Array.from({ length: state.meta.tickets || 0 }, (_, i) => 1001 + i);
    const npc = npcTicketCount();
    const pool = yours.concat(Array.from({ length: npc }, (_, i) => 5000 + i));
    if (!already && !coilWindowOpen()) {
      playCoilBite();
      return;
    }
    if (!already && !pool.length) {
      toast("No tickets in the pot.");
      return;
    }
    fluteSfx();
    const vid = document.getElementById("coil-vid");
    const snake = document.getElementById("coil-snake");
    const num = document.getElementById("coil-num");
    const res = document.getElementById("coil-result");
    if (snake) snake.classList.add("hidden");
    if (vid) {
      try { vid.currentTime = 0; vid.muted = false; vid.play(); } catch (_) {}
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const win = already ? state.meta.lastCoilWin : pool[Math.floor(Math.random() * pool.length)];
      if (snake) {
        snake.innerHTML = "Ticket <span id=\"coil-num\">#" + win + "</span>";
        snake.classList.remove("hidden");
      }
      if (already) {
        if (res) res.textContent = "This Sunday already shed ticket #" + win + ". One draw a week.";
        toast("Same ticket — next Sunday.");
        return;
      }
      const mine = yours.map(String).indexOf(String(win)) >= 0;
      state.meta.lastCoilWeek = weekKey();
      state.meta.lastCoilWin = String(win);
      const prize = state.meta.seasonPot || 0;
      const who = mine ? state.playerName : BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      if (mine) {
        state.balanceXrp = +(state.balanceXrp + prize).toFixed(6);
        if (res) res.textContent = "Your ticket #" + win + " · pot paid " + prize.toFixed(3) + " XRP";
        toast("Coil shed — you won");
      } else {
        if (res) res.textContent = "Ticket #" + win + " was drawn. Locked until next Sunday.";
        toast("Coil shed — another hunter");
      }
      state.meta.seasonPot = 0;
      state.coilWins = [{ name: who, xrp: prize, at: Date.now() }].concat(state.coilWins || []).slice(0, 30);
      const btn = document.getElementById("coil-draw");
      if (btn) btn.textContent = "Drawn this Sunday";
      save();
      renderMeta();
    };
    if (vid) {
      vid.onended = finish;
      setTimeout(finish, 6500);
    } else setTimeout(finish, 2200);
  }
  const openCoil = document.getElementById("open-coil");
  if (openCoil) openCoil.onclick = () => {
    const p = document.getElementById("coil-page");
    if (p) p.classList.remove("hidden");
    refreshCoilPage();
  };
  function closeCoil() {
    const p = document.getElementById("coil-page");
    if (p) p.classList.add("hidden");
  }
  document.querySelectorAll(".coil-close-btn").forEach((b) => { b.onclick = closeCoil; });
  const coilPage = document.getElementById("coil-page");
  if (coilPage) coilPage.addEventListener("click", (e) => { if (e.target === coilPage) closeCoil(); });
  const coilDraw = document.getElementById("coil-draw");
  if (coilDraw) coilDraw.onclick = runCoilDraw;
  setInterval(refreshCoilPage, 1000);

  tap(document.getElementById("join"), () => {
    if (state.world && state.mode === "play" && state.world.watch) {
      toast("Leave the den before you hunt.");
      return;
    }
    if (state.mode === "play" && state.world && !state.world.watch) {
      toast("You're already in the pit.");
      return;
    }
            fetch("https://apex-xrp-server-production.up.railway.app/room/jungle?name=" + encodeURIComponent(state.playerName))
      .then((r) => r.json())
      .then((j) => {
        toast("Jungle: " + ((j && j.who) ? j.who.join(", ") : state.playerName));
        startMatch();
      })
      .catch(() => {
        toast("Den server not reached — local pit");
        startMatch();
      });
  });
  
  let incomingChal = null;
  function hideChalBanner() {
    const b = document.getElementById("chal-banner");
    if (b) b.classList.add("hidden");
    incomingChal = null;
  }
  function showChalBanner(from, amt) {
    incomingChal = { from, amt };
    const b = document.getElementById("chal-banner");
    const t = document.getElementById("chal-banner-text");
    if (t) t.textContent = "You have been challenged by " + from + " for " + amt + " XRP. Accept?";
    if (b) b.classList.remove("hidden");
  }
  ["chal-name", "chal-amt", "chat-in"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchend", (e) => {
      e.stopPropagation();
      setTimeout(() => el.focus(), 0);
    });
  });
  const chalSend = document.getElementById("chal-send");
  tap(chalSend, () => {
    const who = cleanName((document.getElementById("chal-name") || {}).value || "");
    const amt = clampNum((document.getElementById("chal-amt") || {}).value, 1, 0.25, 20);
    if (!who || nameKey(who) === nameKey(state.playerName)) {
      toast("Pick another hunter.");
      return;
    }
    const target = findHunter(who);
    if (!target) {
      toast("No hunter by that username.");
      return;
    }
    if (state.balanceXrp < amt) {
      toast("Not enough XRP to post that pot.");
      return;
    }
    if (state.mode === "play") {
      toast("Finish the den first.");
      return;
    }
    pushChat("den", state.playerName + " challenged " + target.name + " for " + amt + " XRP.", true);
    toast("Challenge sent to " + target.name);
    setTimeout(() => {
      if (state.mode === "play") return;
      showChalBanner(target.name, amt);
    }, 900);
  });
  const chalYes = document.getElementById("chal-yes");
  const chalNo = document.getElementById("chal-no");
  if (chalYes) chalYes.onclick = () => {
    if (!incomingChal) return;
    const amt = incomingChal.amt;
    const from = incomingChal.from;
    if (state.balanceXrp < amt) {
      toast("Not enough XRP to accept.");
      hideChalBanner();
      return;
    }
    state.balanceXrp = +(state.balanceXrp - amt).toFixed(6);
    state.challengePot = +(amt * 2).toFixed(4);
    save();
    renderMeta();
    pushChat("den", state.playerName + " accepted " + from + " · pot " + state.challengePot + " XRP.", true);
    hideChalBanner();
    toast("Private 1v1 vs " + from);
    startMatch({ duel: { name: from, amt } });
  };
  if (chalNo) chalNo.onclick = () => {
    if (incomingChal) pushChat("den", state.playerName + " denied " + incomingChal.from + ".", true);
    hideChalBanner();
    toast("Challenge denied.");
  };
  const specBtn = document.getElementById("spectate");
  if (specBtn) specBtn.onclick = () => {
    if (state.mode === "play" && state.world && !state.world.watch && state.world.snakes[0] && state.world.snakes[0].alive) {
      toast("Watch after you drop. Hunt or die first.");
      return;
    }
    if (state.mode === "play" && state.world && state.world.watch) {
      toast("Already watching. Leave den first.");
      return;
    }
    startMatch({ watch: true });
    const w = state.world;
    if (!w) return;
    w.watch = true;
    w.watchFocus = 1;
    w.snakes[0].isPlayer = false;
    w.snakes[0].stake = 0;
    applyWatchUi(true);
    cycleWatch(1);
    toast("Watching free. No stake.");
  };

  function applyWatchUi(on) {
    const cash = document.getElementById("cash");
    const emote = document.getElementById("emote");
    const watch = document.getElementById("watch-ui");
    const boost = document.getElementById("touch-ui");
    if (cash) cash.style.display = on ? "none" : "";
    if (emote) emote.style.display = on ? "none" : "";
    if (watch) {
      watch.classList.toggle("hidden", !on);
      watch.style.display = on ? "block" : "none";
    }
    if (boost) {
      if (on) boost.style.display = "none";
      else boost.style.display = "";
    }
  }
  function watchTarget() {
    const w = state.world;
    if (!w) return null;
    const alive = w.snakes.filter((s) => s.alive && s.pts[0]);
    if (!alive.length) return null;
    if (w.watchFocus == null || !w.snakes[w.watchFocus] || !w.snakes[w.watchFocus].alive) {
      w.watchFocus = w.snakes.indexOf(alive[0]);
    }
    return w.snakes[w.watchFocus];
  }
  function cycleWatch(dir) {
    const w = state.world;
    if (!w) return;
    const idxs = [];
    w.snakes.forEach((s, i) => { if (s.alive && s.pts[0]) idxs.push(i); });
    if (!idxs.length) return;
    let p = idxs.indexOf(w.watchFocus);
    if (p < 0) p = 0;
    w.watchFocus = idxs[(p + dir + idxs.length) % idxs.length];
    const s = w.snakes[w.watchFocus];
    const el = document.getElementById("watch-pov");
    if (el && s) el.textContent = s.name;
    if (s.pts[0]) {
      w.cam.x = s.pts[0].x;
      w.cam.y = s.pts[0].y;
    }
  }
  function leaveWatch() {
    applyWatchUi(false);
    state.world = null;
    state.mode = "lobby";
    setPlayingLayout(false);
    resize();
    renderMeta();
    renderBoard();
    toast("Left the den.");
  }
  const povPrev = document.getElementById("pov-prev");
  const povNext = document.getElementById("pov-next");
  const leaveDen = document.getElementById("leave-den");
  if (povPrev) povPrev.onclick = () => cycleWatch(-1);
  if (povNext) povNext.onclick = () => cycleWatch(1);
  if (leaveDen) leaveDen.onclick = leaveWatch;
  const charmEl = document.getElementById("charm");
  if (charmEl) charmEl.onchange = () => {
    state.meta.charm = charmEl.value;
    save();
  };
  const emoteBtn = document.getElementById("emote");
  function doEmote() {
    if (!state.world || state.mode !== "play") return;
    state.world.emoteUntil = performance.now() + 1200;
    hissSfx(true);
  }
  if (emoteBtn) emoteBtn.onclick = doEmote;
  const cashBtn = document.getElementById("cash");
  let cashHold = null;
  let cashStarted = 0;
  function cashBtnLabel(t) {
    cashBtn.textContent = t == null ? "Hold 5s to cash out" : "Cashing out " + t.toFixed(1) + "s";
  }
  function beginCashHold(e) {
    if (e) e.preventDefault();
    if (state.mode !== "play" || cashHold) return;
    cashStarted = performance.now();
    cashBtnLabel(5);
    cashHold = setInterval(() => {
      const left = 5 - (performance.now() - cashStarted) / 1000;
      if (state.mode !== "play") { cancelCashHold(); return; }
      if (left <= 0) {
        cancelCashHold();
        cashOut();
        return;
      }
      cashBtnLabel(left);
    }, 80);
  }
  function cancelCashHold() {
    if (cashHold) clearInterval(cashHold);
    cashHold = null;
    cashBtnLabel(null);
  }
  cashBtn.addEventListener("mousedown", beginCashHold);
  cashBtn.addEventListener("touchstart", beginCashHold, { passive: false });
  cashBtn.addEventListener("mouseup", cancelCashHold);
  cashBtn.addEventListener("mouseleave", cancelCashHold);
  cashBtn.addEventListener("touchend", cancelCashHold);
  cashBtn.addEventListener("touchcancel", cancelCashHold);
  document.getElementById("species").onchange = (e) => {
    state.skin.species = e.target.value;
    save();
    paintPreview();
  };
  document.getElementById("pattern").onchange = (e) => {
    state.skin.pattern = e.target.value;
    save();
    paintPreview();
  };
  const hornEl = document.getElementById("horn");
  if (hornEl) hornEl.onchange = () => {
    state.skin.horn = hornEl.value;
    save();
    paintPreview();
  };
  const tailEl = document.getElementById("tail");
  if (tailEl) tailEl.onchange = () => {
    state.skin.tail = tailEl.value;
    save();
    paintPreview();
  };
  document.getElementById("rename").onclick = () => {
    const n = prompt("Username", state.playerName);
    if (!n) return;
    const next = cleanName(n);
    if (usernameTaken(next, true)) {
      toast("That username is taken.");
      return;
    }
    const row = state.board.find((b) => b.name === state.playerName);
    state.playerName = next;
    if (row) row.name = next;
    save();
    renderMeta();
    renderBoard();
    toast("Username set to " + next);
  };
  function tap(el, fn) {
    if (!el) return;
    el.addEventListener("click", fn);
  }
  document.addEventListener("touchend", (e) => {
    if (e.target.closest("input, select, textarea, label, option")) return;
    const hit = e.target.closest("button, .btn, .tier, .skin, .wallet-btn, #intro-skip, .tab-btn, .sheet-x");
    if (!hit) return;
    hit.click();
  });
  document.querySelectorAll("select, input[type=checkbox], input[type=text], input[type=number], textarea").forEach((el) => {
    el.addEventListener("touchend", (e) => {
      e.stopPropagation();
      try { el.focus(); } catch (_) {}
    });
  });
  tap(document.getElementById("add-funds"), () => {
    state.balanceXrp = +(state.balanceXrp + 25).toFixed(3);
    save();
    renderMeta();
    toast("Simulated +25 XRP (test chips only)");
  });
  const rankView = document.getElementById("rank-view");
  const rankClose = document.getElementById("rank-close");
  const rankModal = document.getElementById("rank-modal");
  if (rankView) rankView.onclick = openRankLadder;
  function closeRanks() { if (rankModal) rankModal.classList.add("hidden"); }
  if (rankClose) rankClose.onclick = closeRanks;
  document.querySelectorAll(".rank-close-btn").forEach((b) => { b.onclick = closeRanks; });
  if (rankModal) rankModal.addEventListener("click", (e) => {
    if (e.target === rankModal) rankModal.classList.add("hidden");
  });

  const SLOT_FACES = ["💀", "🌿", "🦷", "✕", "👑"];
  let slotBusy = false;
  function rollHouseSlots() {
    const r = Math.random();
    if (r < 0.68) return { faces: [SLOT_FACES[0], SLOT_FACES[1], SLOT_FACES[2]], mult: 0 };
    if (r < 0.94) return { faces: [SLOT_FACES[1], SLOT_FACES[1], SLOT_FACES[2]], mult: 0.2 };
    if (r < 0.98) return { faces: [SLOT_FACES[1], SLOT_FACES[1], SLOT_FACES[1]], mult: 0.45 };
    if (r < 0.995) return { faces: [SLOT_FACES[2], SLOT_FACES[2], SLOT_FACES[2]], mult: 1.1 };
    if (r < 0.999) return { faces: [SLOT_FACES[3], SLOT_FACES[3], SLOT_FACES[3]], mult: 2.2 };
    return { faces: [SLOT_FACES[4], SLOT_FACES[4], SLOT_FACES[4]], mult: 5 };
  }
  if (document.getElementById("slots-spin")) document.getElementById("slots-spin").onclick = () => {
    if (slotBusy || state.mode === "play") {
      toast(state.mode === "play" ? "Finish the den first." : "Reels are spinning.");
      return;
    }
    const bet = clampNum(document.getElementById("slots-bet").value, 0.25, 0.25, 5);
    const expCost = 25;
    if (state.balanceXrp < bet) { toast("Not enough XRP for that stake."); return; }
    if (state.exp < expCost) { toast("Need 25 EXP to pull the lever."); return; }
    slotBusy = true;
    state.balanceXrp = +(state.balanceXrp - bet).toFixed(6);
    state.exp -= expCost;
    upsertBoardExp();
    save();
    renderMeta();
    renderRank();
    const reels = [...document.querySelectorAll("#slots-reels .reel")];
    reels.forEach((el) => el.classList.remove("win"));
    let ticks = 0;
    const flicker = setInterval(() => {
      reels.forEach((el) => { el.textContent = SLOT_FACES[Math.floor(Math.random() * SLOT_FACES.length)]; });
      ticks++;
      if (ticks > 10) {
        clearInterval(flicker);
        const hit = rollHouseSlots();
        reels.forEach((el, i) => { el.textContent = hit.faces[i]; });
        const payout = +(bet * hit.mult).toFixed(4);
        if (payout > 0) {
          state.balanceXrp = +(state.balanceXrp + payout).toFixed(6);
          reels.forEach((el) => el.classList.add("win"));
          document.getElementById("slots-out").textContent = `Hit ${hit.mult}x · +${payout} XRP`;
          toast("The pit pays. +" + payout + " XRP");
        } else {
          state.feePaidTotal = +(state.feePaidTotal + bet).toFixed(4);
          document.getElementById("slots-out").textContent = "The coils miss. Stake slips into the den.";
          toast("No line this time.");
        }
        save();
        renderMeta();
        renderBoard();
        slotBusy = false;
      }
    }, 70);
  };
  document.getElementById("save-treasury").onclick = () => {
    toast("Treasury is baked into the build. Edit OWNER_TREASURY in game.js.");
  };
  if (OWNER_TREASURY) state.treasury = OWNER_TREASURY;
  const tin = document.getElementById("treasury-in");
  if (tin) {
    tin.value = OWNER_TREASURY || "(set OWNER_TREASURY in game.js)";
    tin.readOnly = true;
  }
  document.getElementById("network").value = state.network;

  const WALLETS = [
    { id: "xaman", name: "Xaman", via: "XRP Ledger · sign in app" },
    { id: "ledger", name: "Ledger", via: "USB / Bluetooth + XRP app" },
    { id: "bifrost", name: "Bifrost Wallet", via: "WalletConnect deep link" },
    { id: "dcent", name: "D'CENT", via: "WalletConnect / biometric" },
    { id: "walletconnect", name: "WalletConnect", via: "QR or in-app approve" },
  ];

  function mockClassicAddress(seed) {
    const alphabet = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";
    let s = "r";
    let n = Math.abs(hashStr(seed + String(Date.now())));
    for (let i = 0; i < 24; i++) {
      s += alphabet[n % alphabet.length];
      n = (n * 1664525 + 1013904223) >>> 0;
    }
    return s;
  }
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h;
  }

  function renderWallets() {
    const grid = document.getElementById("wallet-grid");
    const disc = document.getElementById("wallet-disconnect");
    const status = document.getElementById("wallet-status");
    if (!grid) return;
    grid.innerHTML = "";
    for (const w of WALLETS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wallet-btn" + (state.wallet && state.wallet.id === w.id ? " on" : "");
      btn.innerHTML = `<strong>${w.name}</strong><small>${w.via}</small>`;
      tap(btn, () => connectWallet(w));
      grid.appendChild(btn);
    }
    if (state.wallet) {
      disc.style.display = "block";
      status.textContent = `${state.wallet.name} · ${state.wallet.address.slice(0, 8)}…${state.wallet.address.slice(-5)} · session only, no mainnet send`;
      document.getElementById("net-out").textContent = state.wallet.id;
    } else {
      disc.style.display = "none";
      status.textContent = "No wallet linked. Test chips only. Mainnet send is off.";
    }
  }

  function connectWallet(w) {
    toast("Opening " + w.name + "…");
    overlay.classList.remove("hidden");
    const box = document.getElementById("modal-body");
    if (w.id === "xaman") {
      box.innerHTML = `
        <h3>Xaman</h3>
        <p>Open Xaman, then paste the classic r-address for this session. Live dens will push a Xaman Sign payload (needs a Xumm API key on the server).</p>
        <p class="tiny"><a href="${XAMAN_APP_URL}" target="_blank" rel="noopener noreferrer">Open Xaman</a>
        · <a href="https://xumm.app/detect" target="_blank" rel="noopener noreferrer">Detect app</a></p>
        <input id="xaman-addr" type="text" placeholder="rYourXamanAddress..." style="width:100%;margin:10px 0" />
        <button class="btn primary" id="wc-ok">Link Xaman</button>
        <button class="btn ghost" id="wc-no">Cancel</button>`;
      document.getElementById("wc-no").onclick = () => overlay.classList.add("hidden");
      document.getElementById("wc-ok").onclick = () => {
        const addr = (document.getElementById("xaman-addr").value || "").trim();
        if (addr && !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr)) {
          toast("That is not a classic XRP address.");
          return;
        }
        state.wallet = {
          id: "xaman",
          name: "Xaman",
          address: addr || mockClassicAddress("xaman" + state.playerName),
          connectedAt: Date.now(),
        };
        save();
        overlay.classList.add("hidden");
        renderWallets();
        toast("Xaman linked (session). Payloads sign in the app when the server is live.");
      };
      return;
    }
    if (w.id === "ledger") {
      box.innerHTML = `
        <h3>Ledger</h3>
        <p>Unlock the device, open the XRP app, then confirm. Live Ledger uses WebHID. This build stores a session address only — it will not sign or send XRP.</p>
        <button class="btn primary" id="wc-ok">Device confirmed</button>
        <button class="btn ghost" id="wc-no">Cancel</button>`;
    } else {
      const uri = "wc:apex-xrp@" + Math.random().toString(16).slice(2, 10) + "@2?relay=wss://relay.walletconnect.com";
      box.innerHTML = `
        <h3>${w.name}</h3>
        <p>Approve the XRPL session in ${w.name}. Live WalletConnect needs a Cloud project ID plus an XRPL signer. This prototype keeps the session in the browser and does not broadcast.</p>
        <p class="tiny addr">${uri}</p>
        <button class="btn primary" id="wc-ok">I approved in ${w.name}</button>
        <button class="btn ghost" id="wc-no">Cancel</button>`;
    }
    document.getElementById("wc-no").onclick = () => overlay.classList.add("hidden");
    document.getElementById("wc-ok").onclick = () => {
      state.wallet = {
        id: w.id,
        name: w.name,
        address: mockClassicAddress(w.id + state.playerName),
        connectedAt: Date.now(),
      };
      save();
      overlay.classList.add("hidden");
      renderWallets();
      toast(w.name + " linked (session). Mainnet send still off.");
    };
  }

  document.getElementById("wallet-disconnect").onclick = () => {
    state.wallet = null;
    save();
    renderWallets();
    document.getElementById("net-out").textContent = state.network;
    toast("Wallet disconnected");
  };

  const emojiBar = document.getElementById("emoji-bar");
  if (emojiBar) {
    const pack = ["🐍", "👑", "🔥", "💀", "💰", "🍀", "⚡", "🎯", ":xrp:"];
    emojiBar.innerHTML = pack.map((e) =>
      e === ":xrp:"
        ? `<button type="button" data-e=":xrp:" title="XRP"><img src="logo.png" alt="XRP"></button>`
        : `<button type="button" data-e="${e}">${e}</button>`
    ).join("");
    emojiBar.onclick = (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      const inp = document.getElementById("chat-in");
      if (!inp) return;
      inp.value = (inp.value + " " + b.getAttribute("data-e")).trim();
      inp.focus();
    };
  }
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const inp = document.getElementById("chat-in");
      const text = (inp.value || "").trim();
      inp.value = "";
      if (!text) return;
      if (handleTipCommand(text)) return;
      pushChat(state.playerName, text, false);
    };
  }
  if (!state.chat.length) {
    state.chat = [
      { who: "den", text: "Welcome to the Apex.XRP den.", sys: true },
      { who: "NileFang", text: "Jungle den is open. Watch the trees.", sys: false },
      { who: "TipBot", text: "I am online. /tip Username 0.5 sends XRP.", sys: false, tip: true },
    ];
  }
  setInterval(() => {
    if (state.mode !== "lobby") return;
    if (Math.random() > 0.35) return;
    pushChat(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)], false);
  }, 18000);

  if (usernameTaken(state.playerName, false)) {
    state.playerName = uniqueName(state.playerName);
    save();
  }

  resize();
  renderTiers();
  renderSkins();
  renderMeta();
  renderBoard();
  renderSheds();
  renderRank();
  renderChat();
  renderWallets();
  fetch("https://apex-xrp-server-production.up.railway.app/")
    .then((r) => r.text())
        .then(() => {})
    .catch(() => {});
    fetch("https://apex-xrp-server-production.up.railway.app/hello?name=" + encodeURIComponent(state.playerName))
    .then((r) => r.json())
    .then((j) => {
      const el = document.getElementById("wallet-status");
      if (el && j && j.ok) el.textContent = "Den server linked · checked in as " + state.playerName;
      fetch("https://apex-xrp-server-production.up.railway.app/who")
        .then((r) => r.json())
        .then((w) => {
          if (w && w.who) {
            pushChat("den", "Online: " + w.who.join(", "), true);
            renderChat();
          }
        })
        .catch(() => {});
    })
    try {
    const sock = new WebSocket("wss://apex-xrp-server-production.up.railway.app");
    window.apexSock = sock;
    sock.onopen = () => {
      sock.send(JSON.stringify({ t: "name", name: state.playerName }));
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m && m.t === "hi") {
          const el = document.getElementById("wallet-status");
          if (el) el.textContent = "Den server linked · socket live";
        }
        if (m && m.t === "dead" && m.name) {
          if (window.apexPeers) delete window.apexPeers[m.name];
          if (m.by && m.by === state.playerName) {
            toast("Fanged " + m.name);
            if (state.world && state.mode === "play") {
              const add = +(Number(m.stake) || 0).toFixed(4);
              state.world.prizePool = +(state.world.prizePool + add).toFixed(4);
              state.matchKills += 1;
            }
          } else toast(m.name + " dropped");
        }
        if (m && m.t === "shed" && state.world && Array.isArray(m.drops)) {
          m.drops.forEach((d) => {
            state.world.dropped.push({
              x: Number(d.x) || 0,
              y: Number(d.y) || 0,
              r: 5,
              c: "#e7c56a",
              value: Number(d.value) || 0,
              fromPlayer: true,
            });
          });
          toast(m.name + " shed gold");
        }
          if (m && m.t === "pos" && m.name && m.name !== state.playerName) {
          window.apexPeers = window.apexPeers || {};
          const prev = window.apexPeers[m.name] || { trail: [] };
          const trail = (prev.trail || []).concat([{ x: m.x, y: m.y }]).slice(-18);
          window.apexPeers[m.name] = { x: m.x, y: m.y, at: Date.now(), trail: trail };
        }
        if (m && m.t === "peers" && m.who) {
          pushChat("den", "Sockets: " + m.who.join(", "), true);
          renderChat();
        }
      } catch (_) {}
    };
    setInterval(() => {
      if (!window.apexSock || window.apexSock.readyState !== 1) return;
      if (state.mode !== "play" || !state.world || !state.world.snakes[0]) return;
      const p = state.world.snakes[0].pts[0];
      if (!p) return;
      window.apexSock.send(JSON.stringify({ t: "pos", name: state.playerName, x: Math.round(p.x), y: Math.round(p.y) }));
    }, 50);
  } catch (_) {}
  
  refreshPrice();
  refreshNews();
  setInterval(refreshNews, 180000);
  setInterval(refreshPrice, 12000);
  requestAnimationFrame(loop);
  function resetPageZoom() {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    window.scrollTo(0, 0);
    setTimeout(() => {
      meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover");
    }, 80);
  }
  resetPageZoom();
  function runBiteIntro() {
    resetPageZoom();
    const wrap = document.getElementById("intro");
    const vid = document.getElementById("intro-vid");
    const app = document.getElementById("app");
    if (!wrap || !vid || TRAILER) {
      if (wrap) wrap.remove();
      if (app) app.classList.remove("waiting-intro");
      return;
    }
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      try { vid.pause(); } catch (_) {}
      if (app) app.classList.remove("waiting-intro");
      wrap.classList.add("gone");
      setTimeout(() => wrap.remove(), 600);
    }
    vid.muted = true;
    vid.playsInline = true;
    vid.onended = finish;
    vid.onerror = () => {
      wrap.style.background = '#030806 url("lobby-bg.jpg") center / cover no-repeat';
      setTimeout(finish, 3500);
    };
    const skip = document.getElementById("intro-skip");
    if (skip) {
      skip.onclick = finish;
      skip.addEventListener("touchend", (e) => { e.preventDefault(); e.stopPropagation(); finish(); }, { passive: false });
    }
    wrap.addEventListener("click", finish);
    wrap.addEventListener("touchend", (e) => { e.preventDefault(); finish(); }, { passive: false });
    const play = vid.play();
    if (play && play.catch) play.catch(() => {});
    setTimeout(finish, 9000);
  }

  runBiteIntro();

})();
