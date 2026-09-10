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
  const OWNER_TREASURY = "rL1KqdhZqvbs5rbWSGGS9paYLoM9Qo44zD";
  const OWNER_KEY = "";
  const XAMAN_APP_URL = "https://xaman.app";
  const XUMM_API_KEY = ""; // never put secrets in Pages; SignIn uses DEN_SERVER
  const DEN_SERVER = "https://apex-xrp-server-production.up.railway.app";
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
    // Ledger balance only while a wallet is linked; no ghost bal after disconnect/refresh.
    balanceXrp: (function () {
      const w = safeParse(localStorage.getItem("apex-io-wallet"), null);
      if (w && w.address) return clampNum(localStorage.getItem("apex-io-bal"), 0, 0, 1e6);
      // Simulated chips only when not in a wallet session.
      if ((localStorage.getItem("apex-io-network") || "simulated") !== "testnet") {
        return clampNum(localStorage.getItem("apex-io-bal"), 40, 0, 1e6);
      }
      return 0;
    })(),
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
  function rankLevel(exp) {
    const r = rankOf(exp);
    const idx = RANKS.findIndex((x) => x.name === r.cur.name);
    return (idx < 0 ? 0 : idx) + 1; // 1 = Hatchling
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

   function plantTrees(map, count) {
    let s = 0xA9E4 ^ map;
    const rand = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const trees = [];
    let guard = 0;
    while (trees.length < count && guard < count * 20) {
      guard++;
      const t = {
        x: 180 + rand() * (map - 360),
        y: 180 + rand() * (map - 360),
        trunk: 16 + rand() * 10,
        canopy: 48 + rand() * 28,
        hue: 110 + rand() * 30,
      };
      const farMid = Math.hypot(t.x - map / 2, t.y - map / 2) > 160;
      const farOther = trees.every((o) => Math.hypot(o.x - t.x, o.y - t.y) > 130);
      if (farMid && farOther) trees.push(t);
    }
    return trees;
  }
  function foodSpot(map, i) {
    return {
      x: 40 + ((i * 137 + 19) % (map - 80)),
      y: 40 + ((i * 97 + 41) % (map - 80)),
      r: 3 + (i % 3) * 0.6,
      c: "#9fe7c2",
      value: 0,
    };
  }
  function bunnyPos(map) {
    const hop = Math.floor(Date.now() / 20000);
    const a = foodSpot(map, 900 + hop * 17);
    const b = foodSpot(map, 1400 + hop * 29);
    const u = Math.min(1, (Date.now() % 20000) / 4000);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, hop };
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
    if (state.wallet) localStorage.setItem("apex-io-bal", String(state.balanceXrp));
    else localStorage.removeItem("apex-io-bal");
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
    const bags = [state.meta.c
