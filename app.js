/* =========================================================
   РАНДОМ СИТИ — v0.3, стиль «Вайс-закат» (см. STYLE.md)
   Без сервера: прогресс в облаке Telegram (CloudStorage) + в браузере.
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.CONFIG;
  const P = window.PARTS;
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const inTelegram = !!(tg && tg.initData);
  const root = document.documentElement;

  // ---------- языки ----------
  const LANGS = window.I18N;
  const RU = LANGS.ru;
  let L = RU;
  const RU_LIKE = ["ru", "be", "kk", "ky", "uz", "tg", "hy", "az"];
  function detectLang() {
    const u = inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user;
    const code = ((u && u.language_code) || navigator.language || "ru").toLowerCase().slice(0, 2);
    if (LANGS[code]) return code;
    return RU_LIKE.includes(code) ? "ru" : (LANGS.en ? "en" : "ru");
  }
  function setLang(code) {
    L = LANGS[code] || RU;
    root.lang = L.code;
    document.title = t("app");
  }
  // t("ключ", {n: 5}) -> строка на текущем языке (если перевода нет — русский)
  function t(key, vars = {}) {
    let v = L.ui[key] !== undefined ? L.ui[key] : RU.ui[key] !== undefined ? RU.ui[key] : key;
    if (typeof v === "object") {
      const lc = L.ui[key] !== undefined ? L.locale : RU.locale;
      const cat = new Intl.PluralRules(lc).select(vars.n || 0);
      v = v[cat] || v.other || v.many || Object.values(v)[0];
    }
    return String(v).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : "{" + k + "}"));
  }
  // текст части задания на текущем языке (без эмодзи)
  const pt = (part) => (L.parts && L.parts[part.id]) || clean(part.t);
  const pd = (task) => (L.parts && L.parts[task.id + "#d"]) || task.d || "";
  const fmtDate = (d) => new Intl.DateTimeFormat(L.locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d + "T12:00:00Z"));

  // ---------- справочники ----------
  const DIFF = {
    1: { stars: 1, pts: 10, min: 30, taskLvl: [1], restrLvl: [0, 1] },
    2: { stars: 3, pts: 25, min: 20, taskLvl: [2], restrLvl: [1, 2] },
    3: { stars: 6, pts: 50, min: 15, taskLvl: [3], restrLvl: [2, 3] },
  };
  const DAILY_BONUS = 15;
  const RANK_AT = [0, 60, 200, 500, 1200, 3000];
  const rankName = (i) => t("rank." + i);
  const dName = (d) => t("diff." + d);
  const BADGES = [
    { id: "first",   ic: "target" },
    { id: "season1", ic: "trophy" },
    { id: "streak3", ic: "fire" },
    { id: "streak7", ic: "fire" },
    { id: "hard10",  ic: "star" },
    { id: "daily5",  ic: "calendar" },
    { id: "duelist", ic: "send" },
    { id: "duelwin", ic: "flag" },
    { id: "ten",     ic: "check" },
    { id: "dream10", ic: "heart" },
    { id: "catfull", ic: "diamond" },
  ];
  const SEASON1_END = "2026-12-19";
  // темы мечт: id + иконка
  const CATS = [["travel", "globe"], ["sport", "medal"], ["thrill", "zap"], ["love", "heart"], ["nature", "leaf"], ["chill", "sun"], ["lux", "diamond"], ["crime", "mask"]];
  // версия ассетов: меняй при каждом обновлении картинок, чтобы Telegram не брал старые из кэша
  const V = window.APP_VERSION || "1";
  const catImg = (c) => `assets/cats/${c}.webp?v=${V}`;
  const rankImg = (i) => `assets/ranks/${i}.webp?v=${V}`;
  const catIcon = (c) => (CATS.find((x) => x[0] === c) || [0, "star"])[1];
  const bName = (b) => t("badge." + b.id), bHint = (b) => t("badge." + b.id + ".hint");

  // ---------- иконки (свои, линейные 2px) ----------
  const ICONS = {
    dice: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    flag: '<path d="M4 22V4M4 4h12l-2 4 2 4H4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-11-2 2-3 4-3 6-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    camera: '<rect x="2" y="7" width="14" height="12" rx="3"/><path d="M16 11l6-3v10l-6-3"/>',
    mask: '<path d="M3 9c0-2 2-3 4-3h10c2 0 4 1 4 3 0 5-3 9-6 9-1.5 0-2-2-3-2s-1.5 2-3 2c-3 0-6-4-6-9z"/><circle cx="8.5" cy="11" r="1.4" fill="currentColor"/><circle cx="15.5" cy="11" r="1.4" fill="currentColor"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 12.5h4M9 10.5v4"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>',
    leaf: '<path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l9-9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    diamond: '<path d="M6 3h12l4 6-10 12L2 9zM2 9h20M9 3l3 6 3-6"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/>',
  };
  const ic = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
  const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z";
  const stars = (n, of = 6) => `<span class="stars">${Array.from({ length: of }, (_, i) => `<svg viewBox="0 0 24 24"><path class="${i < n ? "on" : "off"}" d="${STAR}"/></svg>`).join("")}</span>`;

  // ---------- сцена «Вайс-закат»: утро / закат / ночь ----------
  const LEAVES = [[75, 25, 35, -25, 35, -5], [82, -10, 40, -42, 40, -18], [38, -58, 6, -52, 22, -38], [-32, -52, -6, -54, -16, -36], [-78, -6, -40, -42, -38, -16], [-66, 36, -36, -22, -30, 0]];
  function palm(x, y, s, flip, color) {
    const k = flip ? -1 : 1;
    const top = [x + k * 26 * s, y - 150 * s];
    const trunk = `<path d="M${x} ${y} C ${x + k * 6 * s} ${y - 60 * s}, ${x + k * 12 * s} ${y - 110 * s}, ${top[0]} ${top[1]}" stroke="${color}" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>`;
    const leaves = LEAVES.map(([tx, ty, c1x, c1y, c2x, c2y]) => {
      const T = (dx, dy) => `${top[0] + k * dx * s} ${top[1] + dy * s}`;
      return `<path d="M${T(0, 0)} Q ${T(c1x, c1y)} ${T(tx, ty)} Q ${T(c2x, c2y)} ${T(0, 0)} Z" fill="${color}"/>`;
    }).join("");
    return trunk + leaves;
  }
  function skyline(color, neon) {
    const b = [[0, 40, 26], [24, 30, 40], [60, 22, 30], [86, 34, 52], [130, 26, 36], [160, 38, 62], [205, 30, 44], [240, 24, 34], [268, 40, 58], [312, 28, 40], [344, 34, 48], [380, 30, 36]];
    let s = b.map(([x, w, h]) => `<rect x="${x}" y="${215 - h}" width="${w - 3}" height="${h}" fill="${color}"/>` +
      (h > 50 ? `<rect x="${x + w / 2 - 3}" y="${215 - h - 10}" width="4" height="10" fill="${color}"/>` : "")).join("");
    if (neon) s += b.filter((_, i) => i % 2).map(([x, w, h]) => `<rect x="${x + 4}" y="${215 - h + 8}" width="${w - 11}" height="2" fill="${neon}" opacity=".9"/>`).join("");
    return s;
  }
  function sceneSVG(cls = "art", only) {
    const L = (tod, inner) => (only && only !== tod) ? "" : `<g class="sky" data-tod="${tod}" style="opacity:${only || tod === S.diff ? 1 : 0}">${inner}</g>`;
    const stripes = `<mask id="sunm"><rect width="400" height="300" fill="#fff"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="0" y="${192 + i * 8}" width="400" height="${2 + i}" fill="#000"/>`).join("")}</mask>`;
    return `<svg class="${cls}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD3F3"/><stop offset=".7" stop-color="#BDF0F2"/><stop offset="1" stop-color="#FFE6C7"/></linearGradient>
        <linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B2BE0"/><stop offset=".45" stop-color="#FF4D8D"/><stop offset=".72" stop-color="#FF8A4C"/><stop offset="1" stop-color="#FFC24B"/></linearGradient>
        <linearGradient id="sk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0620"/><stop offset=".6" stop-color="#2B1166"/><stop offset="1" stop-color="#C2187A"/></linearGradient>
        <linearGradient id="sun2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FF4D8D"/></linearGradient>
        <linearGradient id="sea1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18C3C6"/><stop offset="1" stop-color="#0E8FA8"/></linearGradient>
        <linearGradient id="sea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2306F"/><stop offset="1" stop-color="#4A1A7A"/></linearGradient>
        <linearGradient id="sea3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A0F5E"/><stop offset="1" stop-color="#0B0620"/></linearGradient>
        ${stripes}
      </defs>
      ${L(1, `<rect width="400" height="300" fill="url(#sk1)"/>
        <circle cx="318" cy="70" r="30" fill="#FFF3B0"/><circle cx="318" cy="70" r="46" fill="#FFF3B0" opacity=".25"/>
        <path d="M40 60c10-8 24-8 34 0 8-4 18-2 22 6H30c0-4 4-6 10-6z" fill="#fff" opacity=".85"/>
        <path d="M190 40c8-6 20-6 28 0 6-3 14-1 18 5h-54c0-3 3-5 8-5z" fill="#fff" opacity=".7"/>
        ${skyline("#5A9DB5")}<rect y="214" width="400" height="86" fill="url(#sea1)"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${60 + i * 80}" y="${232 + i * 14}" width="${50 - i * 6}" height="2" rx="1" fill="#fff" opacity=".5"/>`).join("")}
        ${palm(30, 310, 1.15, false, "#0F5953")}${palm(372, 310, .9, true, "#0F5953")}`)}
      ${L(2, `<rect width="400" height="300" fill="url(#sk2)"/>
        <circle cx="200" cy="200" r="78" fill="url(#sun2)" mask="url(#sunm)"/>
        ${skyline("#5A1D5E")}<rect y="214" width="400" height="86" fill="url(#sea2)"/>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${150 + i * 6}" y="${224 + i * 12}" width="${100 - i * 12}" height="3" rx="1.5" fill="#FFC24B" opacity="${0.75 - i * 0.12}"/>`).join("")}
        ${palm(30, 310, 1.15, false, "#2A0B2E")}${palm(372, 310, .9, true, "#2A0B2E")}`)}
      ${L(3, `<rect width="400" height="300" fill="url(#sk3)"/>
        ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 150}" r="${i % 3 ? 0.9 : 1.6}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`).join("")}
        <circle cx="310" cy="62" r="22" fill="#F3EAFF"/><circle cx="320" cy="56" r="20" fill="#1A0B45"/>
        ${skyline("#170A33", "#FF2E88")}<rect y="214" width="400" height="86" fill="url(#sea3)"/>
        ${[0, 1, 2].map((i) => `<rect x="${40 + i * 120}" y="${226 + i * 16}" width="70" height="2" rx="1" fill="#FF2E88" opacity=".55"/>`).join("")}
        ${palm(30, 310, 1.15, false, "#07020F")}${palm(372, 310, .9, true, "#07020F")}`)}
    </svg>`;
  }
  function setTod(d) {
    root.dataset.diff = d;
    $$(".sky").forEach((g) => { g.style.transition = "opacity .6s"; g.style.opacity = +g.dataset.tod === d ? 1 : 0; });
  }

  // ---------- утилиты ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const dayKey = (t = Date.now()) => new Date(t + 3 * 3600e3).toISOString().slice(0, 10); // по Москве
  const prevDay = (d) => dayKey(Date.parse(d + "T09:00:00Z") - 86400e3);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const randSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  const seedCode = (s) => (s >>> 0).toString(36).toUpperCase();
  const codeSeed = (c) => parseInt(c, 36) >>> 0;
  // эмодзи из текстов контента не показываем — у нас свои иконки
  const clean = (t) => t.replace(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*/u, "");
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

  function haptic(kind) {
    if (!inTelegram || !tg.HapticFeedback) return;
    try {
      if (kind === "ok" || kind === "error") tg.HapticFeedback.notificationOccurred(kind === "ok" ? "success" : "error");
      else if (kind === "tick") tg.HapticFeedback.selectionChanged();
      else tg.HapticFeedback.impactOccurred(kind || "light");
    } catch (e) {}
  }
  let toastT;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2400); }
  function confirmBox(msg) {
    return new Promise((res) => {
      if (inTelegram && tg.showConfirm) { try { return tg.showConfirm(msg, (ok) => res(!!ok)); } catch (e) {} }
      res(window.confirm(msg));
    });
  }

  // ---------- звук (синтез) ----------
  const Sound = (() => {
    let ctx = null;
    const ac = () => { if (!S.sound) return null; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) { return null; } return ctx; };
    function tone(f, dur, type = "sine", vol = 0.06, when = 0) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
      o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, cut) {
      const c = ac(); if (!c) return;
      const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = "lowpass"; f.frequency.value = cut; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
    }
    return {
      tick: () => tone(1500 + Math.random() * 200, 0.02, "triangle", 0.03),
      stop: () => tone(660, 0.08, "triangle", 0.08),
      spin: () => { noise(0.2, 0.2, 2500); tone(440, 0.12, "triangle", 0.05); },
      tap: () => tone(880, 0.05, "triangle", 0.05),
      passed: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.08, i * 0.08)); },
      wasted: () => { noise(0.5, 0.6, 400); [196, 165, 131].forEach((f, i) => tone(f, 0.5, "sawtooth", 0.04, 0.1 + i * 0.18)); },
    };
  })();

  // ---------- хранилище ----------
  const KEY = "rc_state_v1";
  const fresh = () => ({ v: 1, ts: 0, platform: null, sound: true, points: 0, done: 0, failed: 0, hard: 0, dailyCount: 0,
    streak: 0, bestStreak: 0, lastDay: null, recent: [], hist: [], badges: {}, rerollDay: null, rerollsUsed: 0,
    pending: null, active: null, dailyDone: null, diff: 2, cat: "any", dreams: [] });
  let S = fresh();
  function loadLocal() { try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(fresh(), JSON.parse(raw)); } catch (e) {} return null; }
  function loadCloud() {
    return new Promise((res) => {
      if (!inTelegram || !tg.CloudStorage) return res(null);
      try { tg.CloudStorage.getItem(KEY, (err, val) => { if (err || !val) return res(null); try { res(Object.assign(fresh(), JSON.parse(val))); } catch (e) { res(null); } }); } catch (e) { res(null); }
    });
  }
  function save() {
    S.ts = Date.now(); S.hist = S.hist.slice(0, 15); S.recent = S.recent.slice(-15);
    let raw = JSON.stringify(S);
    // в облаке Telegram на ключ не больше 4096 символов — урезаем историю, но не прогресс
    while (raw.length >= 4000 && S.hist.length > 3) { S.hist.pop(); raw = JSON.stringify(S); }
    try { localStorage.setItem(KEY, raw); } catch (e) {}
    if (inTelegram && tg.CloudStorage && raw.length < 4000) { try { tg.CloudStorage.setItem(KEY, raw, () => {}); } catch (e) {} }
  }

  // ---------- генератор миссий ----------
  function generate(seed, diff, cat) {
    const rnd = mulberry32(seed), pick = (a) => a[Math.floor(rnd() * a.length)], D = DIFF[diff];
    const lvlPool = P.tasks.filter((x) => !x.online && D.taskLvl.includes(x.lvl));
    const catPool = cat && cat !== "any" ? lvlPool.filter((x) => x.cat === cat) : [];
    const task = pick(catPool.length ? catPool : lvlPool);
    const hasVeh = ["car", "bike", "boat", "air", "travel"].some((u) => task.uses.includes(u)) && !task.uses.includes("foot");
    const restrs = P.restrictions.filter((r) => D.restrLvl.includes(r.lvl) && !r.bans.some((b) => task.uses.includes(b)) && (!r.needs || !r.needs.includes("veh") || hasVeh));
    const restr = pick(restrs.length ? restrs : [P.restrictions[0]]);
    const seal = pick(P.seals.filter((s) => s.needs.every((n) => task.uses.includes(n))));
    const role = pick(P.roles);
    return { seed: seed >>> 0, diff, cat: catPool.length ? cat : "any", role: role.id, task: task.id, restr: restr.id, seal: seal.id, min: Math.max(D.min, task.min || 0) };
  }
  const partsOf = (run) => ({ role: byId(P.roles, run.role), task: byId(P.tasks, run.task), restr: byId(P.restrictions, run.restr), seal: byId(P.seals, run.seal) });
  function rollPersonal(diff, cat) {
    let c; for (let i = 0; i < 40; i++) { c = generate(randSeed(), diff, cat); if (!S.recent.includes(c.task) && !S.recent.includes(c.role)) break; } return c;
  }
  const dailySeed = (day) => hash32("daily-" + day);
  const reward = (run) => DIFF[run.diff].pts + (run.src === "daily" ? DAILY_BONUS : 0);

  // ---------- ранги, значки ----------
  function rankOf(p) {
    let i = 0; RANK_AT.forEach((a, k) => { if (p >= a) i = k; });
    const cur = { at: RANK_AT[i], name: rankName(i) };
    const next = i + 1 < RANK_AT.length ? { at: RANK_AT[i + 1], name: rankName(i + 1) } : null;
    return { i, cur, next, pct: next ? Math.round(((p - cur.at) / (next.at - cur.at)) * 100) : 100 };
  }
  function giveBadge(id) { if (S.badges[id]) return null; S.badges[id] = dayKey(); return byId(BADGES, id); }
  function rerollsLeftToday() { if (S.rerollDay !== dayKey()) { S.rerollDay = dayKey(); S.rerollsUsed = 0; } return Math.max(0, CFG.FREE_REROLLS_PER_DAY - S.rerollsUsed); }

  // ---------- дуэль ----------
  const duelLink = (run) => `https://t.me/${CFG.BOT_USERNAME}/${CFG.APP_SHORT_NAME}?startapp=d_${seedCode(run.seed)}_${run.diff}${run.cat && run.cat !== "any" ? "_" + run.cat : ""}`;
  function readStartParam() {
    let sp = inTelegram && tg.initDataUnsafe ? tg.initDataUnsafe.start_param : null;
    if (!sp) { const q = new URLSearchParams(location.search); sp = q.get("tgWebAppStartParam") || q.get("startapp"); }
    const m = sp && /^d_([0-9A-Z]{1,7})_([123])(?:_([a-z]{3,8}))?$/.exec(sp);
    return m ? { seed: codeSeed(m[1]), diff: +m[2], cat: m[3] && CATS.some((c) => c[0] === m[3]) ? m[3] : "any" } : null;
  }
  async function shareRun(run, prefix) {
    const p = partsOf(run), link = duelLink(run), D = DIFF[run.diff];
    const text = `${prefix}\n\n` + t("share.lines", { code: seedCode(run.seed), stars: "★".repeat(D.stars), dream: pd(p.task), role: pt(p.role), task: pt(p.task), restr: pt(p.restr), seal: pt(p.seal), min: run.min });
    if (inTelegram && tg.openTelegramLink) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    else if (navigator.share) { try { await navigator.share({ text: text + "\n" + link }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(text + "\n" + link); toast(t("toast.copied")); } catch (e) { toast(link); } }
    const nb = giveBadge("duelist"); if (nb) toast(t("toast.newBadge", { name: bName(nb) }));
    save();
  }
  function playerName() { const u = inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user; return u ? (u.first_name || u.username || t("player")) : t("player"); }

  // =========================================================
  //  ЭКРАНЫ
  // =========================================================
  let view = "play", tick = null, busy = false;
  const screen = () => $("#screen");
  const NAV = [["play", "dice"], ["profile", "user"], ["rules", "book"]];

  function go(v) {
    view = v; clearInterval(tick); tick = null;
    const tab = v === "profile" || v === "rules" ? v : "play";
    $("#nav").innerHTML = NAV.map(([k, i]) => `<button data-go="${k}" class="${k === tab ? "active" : ""}" aria-label="${t("nav." + k)}">${ic(i)}<span>${t("nav." + k)}</span></button>`).join("");
    $$("#nav button").forEach((b) => b.onclick = () => { if (busy) return; haptic(); go(b.dataset.go); });
    $("#nav").classList.toggle("hidden", v === "onboarding" || v === "active");
    if (inTelegram && tg.BackButton) (v === "roll" || v === "duel") ? tg.BackButton.show() : tg.BackButton.hide();
    // миссия идёт — спрашиваем перед закрытием, чтобы не потерять таймер
    if (inTelegram) { try { S.active ? tg.enableClosingConfirmation() : tg.disableClosingConfirmation(); } catch (e) {} }
    ({ play: vPlay, onboarding: vOnboarding, roll: vRoll, active: vActive, profile: vProfile, rules: vRules, duel: vDuel }[v] || vPlay)();
    window.scrollTo(0, 0);
  }

  const respectPill = () => `<span class="pill">${ic("medal")}${S.points}</span>`;

  // ----- онбординг -----
  function vOnboarding() {
    screen().innerHTML = `<div class="onb">
      <div class="scene photo"><img class="art" src="assets/hero-couple.webp?v=${V}" alt="" fetchpriority="high">
        <div class="over"><span class="logo">${esc(t("app"))}</span><button class="pill" id="lang">${ic("globe")}${L.code.toUpperCase()}</button></div>
        <div class="hello"><h1 class="t1">${t("onb.title")}</h1><div class="cap">${t("onb.sub")}</div></div>
      </div>
      <div class="card lift"><h2 class="t2">${t("onb.q")}</h2><div class="cap" style="margin-top:6px">${t("onb.qsub")}</div>
        <div class="pf"><button class="x" data-pf="xbox"><i></i>Xbox</button><button class="p" data-pf="ps"><i></i>PlayStation</button></div>
      </div></div>`;
    $$("[data-pf]").forEach((b) => b.onclick = () => { S.platform = b.dataset.pf; save(); haptic("medium"); Sound.tap(); go(pendingDuel ? "duel" : "play"); });
    $("#lang").onclick = () => langSheet(() => go("onboarding"));
  }

  // ----- главная -----
  function slotHTML() {
    const reel = (k, i, seal) => `<div class="reel ${seal ? "seal" : ""}" data-k="${k}"><div class="k">${ic(i)}</div><div class="win"><div class="strip"><div><small>${t("reel." + k)}</small><span class="muted">${t("reel.wait")}</span></div></div></div></div>`;
    return `<div class="card slot" id="slot">${reel("role", "mask")}${reel("task", "target")}${reel("restr", "ban")}${reel("seal", "camera", true)}</div>`;
  }
  function vPlay() {
    if (!S.platform) return go("onboarding");
    if (S.active) return go("active");
    if (S.pending && !S.pending.fresh) return go("roll");
    setTod(S.diff);
    const today = dayKey(), daily = generate(dailySeed(today), 2), dp = partsOf(daily), dailyDone = S.dailyDone === today;
    const r = rankOf(S.points);
    screen().innerHTML = `
      <div class="scene">${sceneSVG()}
        <div class="over"><span class="logo">${esc(t("app"))}</span>${respectPill()}</div>
        <div class="hello"><h1 class="t1">${t("home.hello", { name: esc(playerName()) })}</h1><div class="cap">${t("slogan")}</div></div>
      </div>
      <div class="card lift">
        <div class="me"><img class="ava img" src="${rankImg(r.i)}" alt="">
          <div style="flex:1;min-width:0"><div class="row between"><span class="name">${r.cur.name}</span><span class="cap">${S.streak ? t("streak", { n: S.streak }) : t("streak0")}</span></div>
            <div class="bar"><div style="width:${r.pct}%"></div></div>
            <div class="cap" style="margin-top:6px">${r.next ? t("home.toNext", { n: r.next.at - S.points, rank: r.next.name }) : t("home.top")}</div></div></div>
      </div>
      <div class="sec"><h2 class="t2">${t("home.wanted")}</h2></div>
      <div class="wanted">${[1, 2, 3].map((d) => `<button class="lvl ${d === S.diff ? "on" : ""}" data-d="${d}">${stars(DIFF[d].stars)}<div><div class="t3">${dName(d)}</div><div class="cap">${t("lvl.meta", { pts: DIFF[d].pts, min: DIFF[d].min })}</div></div></button>`).join("")}</div>
      <div class="sec"><h2 class="t2">${t("home.mood")}</h2></div>
      <div class="moods">${[["any", "dice"], ...CATS].map(([c, i]) => `<button class="mood ${c === S.cat ? "on" : ""}" data-c="${c}">${c === "any" ? ic(i) : `<img class="mthumb" src="${catImg(c)}" alt="">`}${t("cat." + c)}</button>`).join("")}</div>
      <div class="sec"><h2 class="t2">${t("home.random")}</h2><span class="cap" id="todcap">${t("tod." + S.diff)}</span></div>
      ${slotHTML()}
      <div style="margin-top:14px"><button class="btn main" id="spin">${ic("dice")}${t("home.spin")}</button></div>
      <div class="sec"><h2 class="t2">${t("home.daily")}</h2><span class="cap">${t("home.dailyAll")}</span></div>
      <div class="daily">
        <svg class="palm" viewBox="0 0 120 160">${palm(20, 170, .9, false, "#fff")}</svg>
        <div class="cap">${stars(3)} &nbsp;${t("respect", { n: DIFF[2].pts + DAILY_BONUS })}</div>
        <div class="cap">${t("mission.dream")}: ${esc(pd(dp.task))}</div>
        <div class="t2">${esc(pt(dp.task))}</div>
        <div class="cap">${esc(pt(dp.restr))}</div>
        <button class="btn" id="daily" ${dailyDone ? "disabled" : ""}>${dailyDone ? ic("check") + t("home.dailyDone") : t("home.dailyTake")}</button>
      </div>
      ${CFG.ONLINE_ENABLED ? "" : `<div class="card soon" style="margin-top:14px"><div class="ic">${ic("globe")}</div><div>${t("home.online")}</div></div>`}`;

    $$("[data-d]").forEach((b) => b.onclick = () => {
      if (busy) return; S.diff = +b.dataset.d; save(); haptic("tick"); Sound.tap();
      $$("[data-d]").forEach((x) => x.classList.toggle("on", x === b)); setTod(S.diff); $("#todcap").textContent = t("tod." + S.diff);
    });
    $$("[data-c]").forEach((b) => b.onclick = () => {
      if (busy) return; S.cat = b.dataset.c; save(); haptic("tick"); Sound.tap();
      $$("[data-c]").forEach((x) => x.classList.toggle("on", x === b));
    });
    const mo = $(".mood.on"); if (mo) mo.scrollIntoView({ block: "nearest", inline: "center" });
    $("#spin").onclick = () => startSpin(Object.assign(rollPersonal(S.diff, S.cat), { src: "solo", freeReroll: true }));
    if (!dailyDone) $("#daily").onclick = () => { setTod(2); startSpin(Object.assign(daily, { src: "daily", freeReroll: false })); };
    if (S.pending && S.pending.fresh) startSpin(S.pending, true);
  }

  async function spinReels(run) {
    const slot = $("#slot"); if (!slot) return;
    const p = partsOf(run);
    const data = { role: [P.roles, p.role], task: [P.tasks.filter((x) => !x.online), p.task], restr: [P.restrictions, p.restr], seal: [P.seals, p.seal] };
    Sound.spin(); haptic("medium");
    await Promise.all($$(".reel", slot).map((reel, i) => new Promise((res) => {
      const [pool, fin] = data[reel.dataset.k], lbl = t("reel." + reel.dataset.k), strip = $(".strip", reel), n = 14 + i * 6, items = [];
      for (let k = 0; k < n; k++) items.push(pool[Math.floor(Math.random() * pool.length)]);
      items.push(fin);
      strip.innerHTML = items.map((x) => `<div><small>${lbl}</small><span>${esc(pt(x))}</span></div>`).join("");
      strip.style.transition = "none"; strip.style.transform = "translateY(0)"; void strip.offsetHeight;
      const dur = 900 + i * 450;
      strip.style.transition = `transform ${dur}ms cubic-bezier(.15,.65,.2,1)`; strip.style.transform = `translateY(${-n * 64}px)`;
      let el = 0, step = 45; const clicks = () => { if (el > dur - 140) return; Sound.tick(); if (i === 0) haptic("tick"); el += step; step *= 1.1; setTimeout(clicks, step); };
      setTimeout(clicks, 30);
      setTimeout(() => { reel.classList.add("done"); Sound.stop(); haptic(i === 3 ? "heavy" : "light"); res(); }, dur);
    })));
    await wait(450);
  }
  async function startSpin(run, already) {
    if (busy) return; busy = true;
    run.fresh = true; S.pending = run; save();
    $("#slot").scrollIntoView({ behavior: "smooth", block: "center" });
    $$("#spin, .lvl, .mood, #daily").forEach((b) => b.disabled = true);
    await wait(already ? 400 : 280);
    await spinReels(run);
    run.fresh = false; run.justRolled = true; save(); busy = false; go("roll");
  }

  // ----- карточка миссии -----
  function missionHead(run, inner) {
    const p = partsOf(run), D = DIFF[run.diff];
    return `<div class="mission ${run.justRolled ? "enter" : ""} ${p.task.cat ? "photo" : ""}">${p.task.cat ? `<img class="art" src="${catImg(p.task.cat)}" alt="">` : sceneSVG("art", run.diff)}
      <div class="no">${t("mission.no", { src: t("src." + run.src), code: seedCode(run.seed) })} · ${stars(D.stars)}</div>
      <div class="role"><div class="ic">${ic("mask")}</div><div><div class="cap">${t("mission.role")}</div><div class="t3">${esc(pt(p.role))}</div></div></div>
      ${p.task.d ? `<div class="dream">${ic(catIcon(p.task.cat))}<span>${t("mission.dream")}: ${esc(pd(p.task))}</span></div>` : ""}
      ${inner}</div>`;
  }
  function factsHTML(run, withTask) {
    const p = partsOf(run);
    return `<div class="facts">
      ${withTask ? `<div class="fact"><div class="ic">${ic("target")}</div><div><div class="cap">${t("f.task")}</div><b>${esc(pt(p.task))}</b></div></div>` : ""}
      <div class="fact"><div class="ic">${ic("ban")}</div><div><div class="cap">${t("f.restr")}</div><b>${esc(pt(p.restr))}</b></div></div>
      <div class="fact hl"><div class="ic">${ic("camera")}</div><div><div class="cap">${t("f.seal")}</div><b>${esc(pt(p.seal))}</b></div></div>
    </div>`;
  }
  function vRoll() {
    const run = S.pending; if (!run) return go("play");
    setTod(run.diff);
    const canFree = run.src === "solo" && run.freeReroll, left = rerollsLeftToday(), canReroll = run.src === "solo" && (canFree || left > 0);
    screen().innerHTML = `
      ${missionHead(run, `<h1 class="t1">${esc(pt(partsOf(run).task))}</h1>`)}
      <div class="card lift">${factsHTML(run, false)}
        <div class="chips"><span class="chip">${ic("clock")}${t("chip.min", { n: run.min })}</span><span class="chip">${ic("medal")}${t("respect", { n: reward(run) })}</span><span class="chip">${ic("star")}${dName(run.diff)}</span></div>
      </div>
      <div style="margin-top:18px"><button class="btn main" id="accept">${t("btn.start")}</button></div>
      <div class="links">
        ${run.src === "solo" ? `<button class="link" id="reroll" ${canReroll ? "" : "disabled"}>${ic("shuffle")}${canFree ? t("btn.reroll") : t("btn.rerollLeft", { n: left })}</button>` : ""}
        <button class="link" id="duel">${ic("send")}${t("btn.duel")}</button>
        <button class="link" id="cancel">${t("btn.cancel")}</button>
      </div>`;
    if (run.justRolled) { run.justRolled = false; save(); }
    $("#accept").onclick = () => { run.startedAt = Date.now(); S.active = run; S.pending = null; save(); haptic("medium"); Sound.tap(); go("active"); };
    const rr = $("#reroll");
    if (rr) rr.onclick = () => {
      if (!canReroll) return toast(t("toast.noRerolls"));
      if (canFree) run.freeReroll = false; else S.rerollsUsed++;
      S.pending = Object.assign(rollPersonal(run.diff, run.cat), { src: "solo", freeReroll: false, fresh: true }); save(); go("play");
    };
    $("#duel").onclick = () => shareRun(run, t("share.duel", { app: t("app") }));
    $("#cancel").onclick = () => { S.pending = null; save(); go("play"); };
  }

  // ----- миссия идёт -----
  function vActive() {
    const run = S.active; if (!run) return go("play");
    setTod(run.diff);
    const R = 96, C = 2 * Math.PI * R;
    screen().innerHTML = `
      ${missionHead(run, `<div class="ring" id="ring" style="margin-top:22px"><svg viewBox="0 0 220 220"><circle class="track" cx="110" cy="110" r="${R}" fill="none" stroke-width="12"/>
        <circle class="prog" id="prog" cx="110" cy="110" r="${R}" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="in"><b id="digits">--:--</b><span id="cnote">${t("active.left")}</span></div></div>`)}
      <div class="card lift">${factsHTML(run, true)}</div>
      <div class="card soon" style="margin-top:12px"><div class="ic">${ic("camera")}</div><div>${t("active.clip")}</div></div>
      <div style="margin-top:18px"><button class="btn main" id="done">${ic("check")}${t("btn.done")}</button></div>
      <div class="links"><button class="link" id="share">${ic("send")}${t("btn.duel")}</button><button class="link" id="fail">${ic("flag")}${t("btn.giveup")}</button></div>`;
    const total = run.min * 60e3, end = run.startedAt + total;
    const upd = () => {
      const ms = end - Date.now(), dg = $("#digits"); if (!dg) return;
      const a = Math.abs(ms), m = Math.floor(a / 60e3), s = Math.floor((a % 60e3) / 1e3);
      dg.textContent = (ms < 0 ? "+" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      $("#prog").style.strokeDashoffset = C * (1 - Math.max(0, ms) / total);
      $("#ring").classList.toggle("over", ms < 0);
      $("#cnote").textContent = ms < 0 ? t("active.late") : t("active.left");
    };
    upd(); tick = setInterval(upd, 1000);
    $("#done").onclick = async () => { if (await confirmBox(t("confirm.done"))) complete(); };
    $("#share").onclick = () => shareRun(run, t("share.doing", { app: t("app") }));
    $("#fail").onclick = async () => {
      if (!(await confirmBox(t("confirm.fail")))) return;
      S.failed++; S.active = null; save(); clearInterval(tick); busy = true;
      const ov = $("#overlay"); ov.className = "overlay wasted";
      ov.innerHTML = `<div class="big slam">${t("wasted.title")}</div><div class="resp-sub" style="margin-top:14px;opacity:.7">${t("wasted.sub")}</div>`;
      Sound.wasted(); haptic("error");
      await wait(2200); ov.className = "overlay hidden"; busy = false; go("play");
    };
  }

  function complete() {
    const run = S.active, late = Date.now() > run.startedAt + run.min * 60e3;
    let pts = reward(run); if (late) pts = Math.ceil(pts / 2);
    const before = rankOf(S.points).i, today = dayKey(), prevPts = S.points;
    S.points += pts; S.done++; if (run.diff === 3) S.hard++;
    if (S.lastDay !== today) { S.streak = S.lastDay === prevDay(today) ? S.streak + 1 : 1; S.lastDay = today; S.bestStreak = Math.max(S.bestStreak, S.streak); }
    if (run.src === "daily") { S.dailyDone = today; S.dailyCount++; }
    S.recent.push(run.task, run.role);
    S.hist.unshift({ d: today, c: seedCode(run.seed), task: run.task, pts, diff: run.diff });
    const newDream = !S.dreams.includes(run.task);
    if (newDream) S.dreams.push(run.task);
    const catDone = CATS.some(([c]) => P.tasks.filter((x) => !x.online && x.cat === c).every((x) => S.dreams.includes(x.id)));
    const nb = [], tryB = (c, id) => { if (c) { const b = giveBadge(id); if (b) nb.push(b); } };
    tryB(S.dreams.length >= 10, "dream10"); tryB(catDone, "catfull");
    tryB(true, "first"); tryB(today < SEASON1_END, "season1"); tryB(S.streak >= 3, "streak3"); tryB(S.streak >= 7, "streak7");
    tryB(S.hard >= 10, "hard10"); tryB(S.dailyCount >= 5, "daily5"); tryB(S.done >= 10, "ten"); tryB(run.src === "duel", "duelwin");
    S.active = null; save();
    const after = rankOf(S.points);
    passed(run, pts, late, prevPts, after.i > before ? after : null, nb, newDream);
  }

  async function passed(run, pts, late, prevPts, rankUp, nb, newDream) {
    clearInterval(tick); busy = true;
    const ov = $("#overlay"); ov.className = "overlay passed";
    ov.innerHTML = `<div class="big slam">${t("passed.title")}</div>
      <div class="burst">${Array.from({ length: DIFF[run.diff].stars }, (_, i) => `<svg viewBox="0 0 24 24" style="animation-delay:${0.45 + i * 0.12}s"><path d="${STAR}"/></svg>`).join("")}</div>
      <div class="resp" id="resp">${t("respect", { n: 0 })}</div>
      <div class="resp-sub">${late ? t("passed.late") + " · " : ""}${t("streak", { n: S.streak })}</div>
      <div class="awards">${newDream ? `<div class="award came" style="animation-delay:.9s"><div class="ic">${ic("heart")}</div><div><b>${t("dream.came")}</b><span>${esc(pd(partsOf(run).task))} · ${t("profile.dreamsOf", { a: S.dreams.length, b: dreamTotal() })}</span></div></div>` : ""}${nb.map((b, i) => `<div class="award" style="animation-delay:${1.1 + i * 0.12}s"><div class="ic">${ic(b.ic)}</div><div><b>${t("award.new", { name: bName(b) })}</b><span>${bHint(b)}</span></div></div>`).join("")}</div>
      <div class="actions hidden" id="acts"><button class="btn light" id="poster">${ic("image")}${t("btn.poster")}</button>
        <button class="btn ghost" id="duel">${ic("send")}${t("btn.duel")}</button><button class="btn text" id="next" style="color:#fff">${t("btn.next")}</button></div>`;
    Sound.passed(); haptic("heavy"); setTimeout(() => haptic("ok"), 400);
    await wait(500);
    const el = $("#resp"), t0 = performance.now();
    await new Promise((res) => { const f = (ts) => { const k = Math.min(1, (ts - t0) / 800); el.textContent = t("respect", { n: Math.round(pts * (1 - Math.pow(1 - k, 3))) }); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    $("#acts").classList.remove("hidden"); busy = false;
    $("#poster").onclick = () => showPoster(run);
    $("#duel").onclick = () => shareRun(run, t("share.done", { app: t("app") }));
    $("#next").onclick = () => { if (rankUp) showRankUp(rankUp); else { ov.className = "overlay hidden"; go("play"); } };
  }
  function showRankUp(r) {
    const ov = $("#overlay"); ov.className = "overlay dim rankup";
    ov.innerHTML = `<div class="badge-big slam"><img src="${rankImg(r.i)}" alt=""></div><div class="cap" style="color:rgba(255,255,255,.7);margin-top:18px">${t("rankup.new")}</div><h1 class="t1">${r.cur.name}</h1>
      <div class="resp-sub" style="opacity:.7;margin-top:8px">${r.next ? t("rankup.next", { rank: r.next.name, n: r.next.at }) : t("rankup.top")}</div>
      <div class="actions"><button class="btn sun" id="ok">${t("btn.cool")}</button></div>`;
    Sound.passed(); haptic("ok"); confetti();
    $("#ok").onclick = () => { ov.className = "overlay hidden"; go("play"); };
  }
  function confetti() {
    const c = document.createElement("canvas"); c.className = "confetti"; const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
    const x = c.getContext("2d"), cols = ["#FF4D8D", "#FF8A4C", "#FFC24B", "#12B5A6", "#5B2BE0", "#fff"];
    const ps = Array.from({ length: 150 }, () => ({ x: c.width / 2, y: c.height * .38, vx: (Math.random() - .5) * 26 * dpr, vy: (-Math.random() * 26 - 6) * dpr, s: (Math.random() * 8 + 6) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, col: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    const f = (t) => { x.clearRect(0, 0, c.width, c.height); ps.forEach((p) => { p.vy += .8 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.col; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); t - t0 < 2600 ? requestAnimationFrame(f) : c.remove(); };
    requestAnimationFrame(f);
  }

  // ----- дуэль -----
  let pendingDuel = null;
  function vDuel() {
    const d = pendingDuel; pendingDuel = null; if (!d) return go("play");
    if (S.active) { toast(t("toast.finishFirst")); return go("active"); }
    setTod(d.diff);
    screen().innerHTML = `
      <div class="scene">${sceneSVG()}<div class="over"><span class="logo">${esc(t("app"))}</span>${respectPill()}</div>
        <div class="hello"><h1 class="t1">${t("duel.title")}</h1><div class="cap">${t("duel.sub")}</div></div></div>
      <div class="lift" style="position:relative">${slotHTML()}</div>
      <div style="margin-top:14px"><button class="btn main" id="see">${ic("dice")}${t("duel.open")}</button></div>`;
    $("#see").onclick = async () => {
      if (busy) return; busy = true; $("#see").disabled = true;
      const run = Object.assign(generate(d.seed, d.diff, d.cat), { src: "duel", freeReroll: false }); S.pending = run; save();
      await spinReels(run); run.justRolled = true; save(); busy = false; go("roll");
    };
  }

  // ----- профиль -----
  function vProfile() {
    if (!S.platform) return go("onboarding");
    setTod(S.diff);
    const r = rankOf(S.points);
    screen().innerHTML = `
      <div class="prof-top"><img class="ava img" src="${rankImg(r.i)}" alt=""><h1 class="t1">${esc(playerName())}</h1>
        <div class="cap">${t("profile.line", { rank: r.cur.name, n: S.points, pf: S.platform === "ps" ? "PlayStation" : "Xbox" })}</div></div>
      <div class="card lift">
        <div class="ranks">${RANK_AT.map((x, i) => `<div class="${i <= r.i ? "on" : ""} ${i === r.i ? "now" : ""}"><img src="${rankImg(i)}" alt="">${rankName(i)}</div>`).join("")}</div>
        <div class="bar" style="margin-top:14px"><div style="width:${r.pct}%"></div></div>
        <div class="kpis"><div class="kpi"><b>${S.done}</b><span>${t("kpi.missions")}</span></div><div class="kpi"><b>${S.bestStreak}</b><span>${t("kpi.best")}</span></div><div class="kpi"><b>${S.hard}</b><span>${t("kpi.hard")}</span></div></div>
      </div>
      <div style="margin-top:14px"><button class="btn" id="poster">${ic("image")}${t("btn.myPoster")}</button></div>
      <div class="sec"><h2 class="t2">${t("profile.dreams")}</h2><span class="cap">${t("profile.dreamsOf", { a: S.dreams.length, b: dreamTotal() })}</span></div>
      <div class="card list">${CATS.map(([c, i]) => { const all = P.tasks.filter((x) => !x.online && x.cat === c), done = all.filter((x) => S.dreams.includes(x.id)).length;
        return `<button class="li catrow" data-cat="${c}"><img class="thumb" src="${catImg(c)}" alt=""><div class="grow"><b>${t("cat." + c)}</b><div class="bar"><div style="width:${Math.round(done / all.length * 100)}%"></div></div></div><span class="cap">${done}/${all.length}</span>${ic("chevron")}</button>`; }).join("")}</div>
      <div class="sec"><h2 class="t2">${t("profile.awards")}</h2><span class="cap">${t("profile.awardsOf", { a: Object.keys(S.badges).length, b: BADGES.length })}</span></div>
      <div class="medals">${BADGES.map((b) => `<button class="medal ${S.badges[b.id] ? "" : "locked"}" data-b="${b.id}"><div class="ic">${ic(S.badges[b.id] ? b.ic : "lock")}</div><span>${bName(b)}</span></button>`).join("")}</div>
      <div class="sec"><h2 class="t2">${t("profile.history")}</h2></div>
      <div class="card list">${S.hist.length ? S.hist.map((h) => `<div class="li"><div class="grow"><b>${esc(h.task ? pt(byId(P.tasks, h.task) || { id: h.task, t: h.t }) : h.t)}</b><span class="cap">#${esc(h.c || "—")} · ${fmtDate(h.d)}</span></div><span class="plus">+${h.pts}</span></div>`).join("") : `<div class="li"><div class="grow muted">${t("profile.historyEmpty")}</div></div>`}</div>
      <div class="sec"><h2 class="t2">${t("profile.rating")}</h2><span class="cap">${t("profile.soon")}</span></div>
      <div class="card soon"><div class="ic">${ic("trophy")}</div><div>${t("profile.ratingText")}</div></div>
      <div class="sec"><h2 class="t2">${t("profile.settings")}</h2></div>
      <div class="card" style="padding:4px 18px">
        <button class="set" id="lng">${ic("globe")}<span class="grow">${t("profile.language")}</span><span class="muted">${L.name}</span>${ic("chevron")}</button>
        <button class="set" id="snd">${ic("volume")}<span class="grow">${t("profile.sound")}</span><span class="tgl ${S.sound ? "on" : ""}"></span></button>
        <button class="set" id="pf">${ic("gamepad")}<span class="grow">${t("profile.platform")}</span><span class="muted">${S.platform === "ps" ? "PlayStation" : "Xbox"}</span>${ic("chevron")}</button>
      </div>`;
    $$("[data-b]").forEach((el) => el.onclick = () => { const b = byId(BADGES, el.dataset.b); toast(S.badges[b.id] ? t("toast.badgeGot", { name: bName(b), date: fmtDate(S.badges[b.id]) }) : bHint(b)); });
    $("#lng").onclick = () => langSheet(() => go("profile"));
    $$("[data-cat]").forEach((b) => b.onclick = () => dreamSheet(b.dataset.cat));
    $("#poster").onclick = () => showPoster(null);
    $("#snd").onclick = () => { S.sound = !S.sound; save(); vProfile(); if (S.sound) Sound.tap(); };
    $("#pf").onclick = () => { S.platform = S.platform === "ps" ? "xbox" : "ps"; save(); vProfile(); };
  }

  // ----- правила -----
  function vRules() {
    const st = (i, t, p) => `<div class="step"><div class="ic">${ic(i)}</div><div><div class="t3">${t}</div><p>${p}</p></div></div>`;
    screen().innerHTML = `
      <div style="padding-top:calc(24px + env(safe-area-inset-top))"><h1 class="t1">${t("rules.title")}</h1><div class="cap" style="margin-top:6px">${t("rules.sub")}</div></div>
      <div class="card" style="margin-top:18px;padding:4px 18px">
        ${st("dice", t("rules.1.t"), t("rules.1.p"))}
        ${st("target", t("rules.2.t"), t("rules.2.p"))}
        ${st("camera", t("rules.3.t"), t("rules.3.p"))}
        ${st("medal", t("rules.4.t"), RANK_AT.map((x, i) => rankName(i)).join(" → "))}
        ${st("fire", t("rules.5.t"), t("rules.5.p"))}
        ${st("send", t("rules.6.t"), t("rules.6.p"))}
        ${st("heart", t("rules.7.t"), t("rules.7.p"))}
      </div>
      <div class="sec"><h2 class="t2">${t("rules.soon")}</h2></div>
      <div class="card" style="padding:4px 18px">
        ${st("trophy", t("rules.s1.t"), t("rules.s1.p"))}
        ${st("globe", t("rules.s2.t"), t("rules.s2.p"))}
        ${st("star", t("rules.s3.t"), t("rules.s3.p", { date: fmtDate(SEASON1_END) }))}
      </div>
      <p class="legal">${t("rules.legal")}</p>`;
  }

  // ---------- постер 1080×1920 ----------
  function wrap(ctx, text, x, y, maxW, lh) { const w = text.split(" "); let line = ""; for (const s of w) { const t = line ? line + " " + s : s; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); line = s; y += lh; } else line = t; } ctx.fillText(line, x, y); return y + lh; }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  async function showPoster(run) {
    try { await document.fonts.ready; } catch (e) {}
    const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const tod = run ? run.diff : S.diff;
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sceneSVG("art", tod).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="810" '));
    try { await img.decode(); x.drawImage(img, 0, 0, W, 810); } catch (e) {}
    const bg = x.createLinearGradient(0, 760, 0, H); bg.addColorStop(0, tod === 3 ? "#130B21" : "#FFF5EF"); bg.addColorStop(1, tod === 3 ? "#0B0620" : "#FFE9DD");
    x.fillStyle = bg; x.fillRect(0, 760, W, H - 760);
    const dark = tod === 3, txt = dark ? "#F7EEFF" : "#1D1033", mut = dark ? "#A898C2" : "#7A6B8F", card = dark ? "#1F1533" : "#FFFFFF";
    x.fillStyle = "#fff"; x.font = "800 52px Unbounded"; x.textAlign = "left"; x.fillText(t("app"), 72, 130);
    x.font = "800 96px Unbounded"; x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 30;
    if (run) { const [l1, l2] = t("poster.passed").split("|"); x.fillText(l1, 72, 560); x.fillText(l2 || "", 72, 670); } else { x.fillText(rankOf(S.points).cur.name.toUpperCase(), 72, 640); }
    x.shadowBlur = 0;
    x.fillStyle = card; rr(x, 56, 720, W - 112, 1010, 56); x.fill();
    let y = 820; x.textAlign = "left";
    const field = (lbl, val, big) => { x.fillStyle = mut; x.font = "700 30px Manrope"; x.fillText(lbl, 112, y); y += 58; x.fillStyle = txt; x.font = big ? "700 50px Unbounded" : "700 40px Manrope"; y = wrap(x, val, 112, y, W - 224, big ? 64 : 54) + 30; };
    if (run) {
      const p = partsOf(run);
      x.fillStyle = mut; x.font = "700 30px Manrope"; x.fillText(`${t("poster.no", { code: seedCode(run.seed) })}   ${"★".repeat(DIFF[run.diff].stars)}`, 112, y); y += 90;
      field(t("poster.dream"), pd(p.task)); field(t("poster.task"), pt(p.task), true); field(t("poster.role"), pt(p.role)); field(t("poster.restr"), pt(p.restr)); field(t("poster.seal"), pt(p.seal));
    } else {
      const r = rankOf(S.points);
      field(t("poster.rank"), r.cur.name, true); field(t("poster.respect"), String(S.points)); field(t("poster.done"), String(S.done)); field(t("poster.best"), t("days", { n: S.bestStreak }));
    }
    const gr = x.createLinearGradient(56, 0, W - 56, 0); gr.addColorStop(0, "#FF4D8D"); gr.addColorStop(.55, "#FF8A4C"); gr.addColorStop(1, "#FFC24B");
    x.fillStyle = gr; rr(x, 56, 1770, W - 112, 110, 55); x.fill();
    x.fillStyle = "#fff"; x.textAlign = "center"; x.font = "800 38px Unbounded"; x.fillText(run ? t("poster.can") : t("poster.catch"), W / 2, 1822);
    x.font = "700 28px Manrope"; x.fillText(`t.me/${CFG.BOT_USERNAME}`, W / 2, 1862);
    const url = c.toDataURL("image/png"), ov = $("#overlay"); ov.className = "overlay dim";
    ov.innerHTML = `<img src="${url}" alt=""><div class="resp-sub" style="opacity:.7;margin-top:12px">${t("poster.hold")}</div>
      <div class="actions"><button class="btn sun" id="ovShare">${ic("send")}${t("btn.share")}</button><button class="btn ghost" id="ovClose">${t("btn.close")}</button></div>`;
    $("#ovClose").onclick = () => { ov.className = "overlay hidden"; if (run) go("play"); };
    $("#ovShare").onclick = async () => {
      try { const blob = await (await fetch(url)).blob(), file = new File([blob], "random-city.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) {}
      if (run) shareRun(run, t("share.done", { app: t("app") })); else toast(t("poster.hold"));
    };
  }

  // ---------- список мечт ----------
  const dreamTotal = () => P.tasks.filter((x) => !x.online).length;
  function dreamSheet(cat) {
    const ov = $("#overlay"); ov.className = "overlay dim";
    const all = P.tasks.filter((x) => !x.online && x.cat === cat).sort((x, y) => x.lvl - y.lvl);
    ov.innerHTML = `<div class="sheet"><img class="banner" src="${catImg(cat)}" alt=""><div class="row" style="gap:12px"><div><h2 class="t2">${t("cat." + cat)}</h2><div class="cap">${t("dreams.hint")}</div></div></div>
      <div class="dlist">${all.map((x) => { const ok = S.dreams.includes(x.id); return `<div class="dl ${ok ? "ok" : ""}">${ic(ok ? "check" : "circle")}<div class="grow"><b>${esc(pd(x))}</b><span>${esc(pt(x))}</span></div>${stars(DIFF[x.lvl].stars)}</div>`; }).join("")}</div></div>
      <div class="actions"><button class="btn ghost" id="ovClose">${t("btn.close")}</button></div>`;
    $("#ovClose").onclick = () => { ov.className = "overlay hidden"; };
  }

  // ---------- выбор языка ----------
  function langSheet(after) {
    const ov = $("#overlay"); ov.className = "overlay dim";
    ov.innerHTML = `<h2 class="t2" style="color:#fff">${t("profile.language")}</h2>
      <div class="actions">${Object.values(LANGS).map((l) => `<button class="btn ${l.code === L.code ? "sun" : "ghost"}" data-l="${l.code}">${l.name}</button>`).join("")}</div>`;
    $$("[data-l]", ov).forEach((b) => b.onclick = () => { S.lang = b.dataset.l; save(); setLang(S.lang); haptic("tick"); ov.className = "overlay hidden"; after(); });
  }

  // =========================================================
  //  СТАРТ
  // =========================================================
  function applyTheme() {
    const dark = inTelegram ? tg.colorScheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "dark" : "light";
    const bg = dark ? "#130B21" : "#FFF5EF";
    if (inTelegram) { try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (e) {} }
  }
  // картинки: если WebP не открылся — пробуем JPG, если и он нет — остаётся цветной фон
  document.addEventListener("error", (e) => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement)) return;
    if (/\.webp(\?|$)/.test(im.src)) { im.src = im.src.replace(".webp", ".jpg"); return; }
    im.classList.add("broken");
  }, true);
  document.addEventListener("load", (e) => { if (e.target instanceof HTMLImageElement) e.target.classList.add("ok"); }, true);
  function preloadImages() {
    const list = ["assets/hero-couple.webp?v=" + V, ...CATS.map(([c]) => catImg(c)), ...RANK_AT.map((_, i) => rankImg(i))];
    list.forEach((src, k) => setTimeout(() => { const im = new Image(); im.decoding = "async"; im.src = src; }, 300 + k * 60));
  }

  async function init() {
    if (inTelegram) {
      tg.ready(); tg.expand();
      // не закрывать приложение свайпом вниз при прокрутке (Bot API 7.7+)
      try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (e) {}
      tg.onEvent && tg.onEvent("themeChanged", applyTheme);
      if (tg.BackButton) tg.BackButton.onClick(() => { if (busy) return; S.pending = null; save(); go("play"); });
    } else window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
    applyTheme();
    const local = loadLocal(); if (local) S = local;
    const cloud = await loadCloud(); if (cloud && cloud.ts > S.ts) S = cloud;
    const valid = (r) => r && Object.values(partsOf(r)).every(Boolean);
    if (S.pending && !valid(S.pending)) S.pending = null;
    if (S.active && !valid(S.active)) S.active = null;
    S.recent = S.recent.filter((id) => byId(P.tasks, id) || byId(P.roles, id));
    if (!Array.isArray(S.dreams)) S.dreams = [];
    S.hist.forEach((h) => { if (h.task && byId(P.tasks, h.task) && !S.dreams.includes(h.task)) S.dreams.push(h.task); });
    S.dreams = S.dreams.filter((id) => byId(P.tasks, id));
    if (S.cat !== "any" && !CATS.some((c) => c[0] === S.cat)) S.cat = "any";
    setLang(S.lang || detectLang());
    pendingDuel = readStartParam();
    if (!S.platform) go("onboarding"); else if (pendingDuel) go("duel"); else go("play");
    preloadImages();
  }
  window.__rc = { dreamTotal, generate, partsOf, dayKey, prevDay, seedCode, codeSeed, setLang, t, get state() { return S; } };
  init();
})();
