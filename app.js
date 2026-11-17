/* =========================================================
   РАНДОМ СИТИ — v2 «Тебе пишут»
   Миссии приходят сообщениями от контактов из Леониды.
   Без сервера: прогресс в облаке Telegram (CloudStorage) + в браузере.
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.CONFIG;
  const M = window.MISSIONS;
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const inTelegram = !!(tg && tg.initData);
  const root = document.documentElement;
  const V = window.APP_VERSION || "1";

  // ---------- языки ----------
  const LANGS = window.I18N, RU = LANGS.ru;
  let L = RU;
  const RU_LIKE = ["ru", "be", "kk", "ky", "uz", "tg", "hy", "az"];
  function detectLang() {
    const u = inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user;
    const code = ((u && u.language_code) || navigator.language || "ru").toLowerCase().slice(0, 2);
    if (LANGS[code]) return code;
    return RU_LIKE.includes(code) ? "ru" : (LANGS.en ? "en" : "ru");
  }
  function setLang(code) { L = LANGS[code] || RU; root.lang = L.code; document.title = t("app"); }
  function t(key, vars = {}) {
    let v = L.ui[key] !== undefined ? L.ui[key] : RU.ui[key] !== undefined ? RU.ui[key] : key;
    if (typeof v === "object") {
      const cat = new Intl.PluralRules(L.ui[key] !== undefined ? L.locale : RU.locale).select(vars.n || 0);
      v = v[cat] || v.other || v.many || Object.values(v)[0];
    }
    return String(v).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : "{" + k + "}"));
  }
  const tx = (o) => (o ? (o[L.code] !== undefined ? o[L.code] : o.ru) : "");
  const fmtDate = (d) => new Intl.DateTimeFormat(L.locale, { day: "2-digit", month: "2-digit" }).format(new Date(d + "T12:00:00Z"));

  // ---------- константы ----------
  const STARS = { 1: { pts: 10, min: 30 }, 3: { pts: 25, min: 20 }, 6: { pts: 50, min: 15 } };
  const DAILY_BONUS = 15;
  const RANK_AT = [0, 60, 200, 500, 1200, 3000];
  const REL_AT = [1, 3, 6, 10, 15]; // сколько миссий с контактом для 1..5 сердец
  const MAX_REROLLS = 5;
  const CONTACTS = Object.keys(M.contacts);
  const MOODS = [["any", "dice"], ["hard", "zap"], ["fun", "smile"], ["chill", "sun"]];
  const BADGES = [
    ["first", "target"], ["season1", "trophy"], ["streak3", "fire"], ["streak7", "fire"], ["hard10", "star"], ["daily5", "calendar"],
    ["duelist", "send"], ["duelwin", "flag"], ["ten", "check"], ["unk1", "question"], ["allc", "users"],
  ].map(([id, ic]) => ({ id, ic }));
  const SEASON1_END = "2026-12-19";
  const catImg = (c) => `assets/cats/${c}.webp?v=${V}`;
  const rankImg = (i) => `assets/ranks/${i}.webp?v=${V}`;

  // ---------- иконки ----------
  const ICONS = {
    dice: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15c2.5 0 4.5 1.3 5.5 4"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    flag: '<path d="M4 22V4M4 4h12l-2 4 2 4H4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    fire: '<path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-11-2 2-3 4-3 6-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    camera: '<rect x="2" y="7" width="14" height="12" rx="3"/><path d="M16 11l6-3v10l-6-3"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 12.5h4M9 10.5v4"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9.5" r="1" fill="currentColor"/><circle cx="15" cy="9.5" r="1" fill="currentColor"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>',
    heart: '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  };
  const ic = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
  const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z";
  const stars = (n, of = 6) => `<span class="stars">${Array.from({ length: of }, (_, i) => `<svg viewBox="0 0 24 24"><path class="${i < n ? "on" : "off"}" d="${STAR}"/></svg>`).join("")}</span>`;

  // ---------- сцена «Вайс-закат» (1 утро/день, 2 закат, 3 ночь) ----------
  const LEAVES = [[75, 25, 35, -25, 35, -5], [82, -10, 40, -42, 40, -18], [38, -58, 6, -52, 22, -38], [-32, -52, -6, -54, -16, -36], [-78, -6, -40, -42, -38, -16], [-66, 36, -36, -22, -30, 0]];
  function palm(x, y, s, flip, color) {
    const k = flip ? -1 : 1, top = [x + k * 26 * s, y - 150 * s];
    const trunk = `<path d="M${x} ${y} C ${x + k * 6 * s} ${y - 60 * s}, ${x + k * 12 * s} ${y - 110 * s}, ${top[0]} ${top[1]}" stroke="${color}" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>`;
    return trunk + LEAVES.map(([tx_, ty, c1x, c1y, c2x, c2y]) => {
      const T = (dx, dy) => `${top[0] + k * dx * s} ${top[1] + dy * s}`;
      return `<path d="M${T(0, 0)} Q ${T(c1x, c1y)} ${T(tx_, ty)} Q ${T(c2x, c2y)} ${T(0, 0)} Z" fill="${color}"/>`;
    }).join("");
  }
  function skyline(color, neon) {
    const b = [[0, 40, 26], [24, 30, 40], [60, 22, 30], [86, 34, 52], [130, 26, 36], [160, 38, 62], [205, 30, 44], [240, 24, 34], [268, 40, 58], [312, 28, 40], [344, 34, 48], [380, 30, 36]];
    let s = b.map(([x, w, h]) => `<rect x="${x}" y="${215 - h}" width="${w - 3}" height="${h}" fill="${color}"/>` + (h > 50 ? `<rect x="${x + w / 2 - 3}" y="${215 - h - 10}" width="4" height="10" fill="${color}"/>` : "")).join("");
    if (neon) s += b.filter((_, i) => i % 2).map(([x, w, h]) => `<rect x="${x + 4}" y="${215 - h + 8}" width="${w - 11}" height="2" fill="${neon}" opacity=".9"/>`).join("");
    return s;
  }
  function sceneSVG(tod) {
    const stripes = `<mask id="sunm"><rect width="400" height="300" fill="#fff"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="0" y="${192 + i * 8}" width="400" height="${2 + i}" fill="#000"/>`).join("")}</mask>`;
    const body = tod === 1 ? `<rect width="400" height="300" fill="url(#sk1)"/><circle cx="318" cy="70" r="30" fill="#FFF3B0"/><circle cx="318" cy="70" r="46" fill="#FFF3B0" opacity=".25"/>
        ${skyline("#5A9DB5")}<rect y="214" width="400" height="86" fill="url(#sea1)"/>${palm(30, 310, 1.15, false, "#0F5953")}${palm(372, 310, .9, true, "#0F5953")}`
      : tod === 2 ? `<rect width="400" height="300" fill="url(#sk2)"/><circle cx="200" cy="200" r="78" fill="url(#sun2)" mask="url(#sunm)"/>
        ${skyline("#5A1D5E")}<rect y="214" width="400" height="86" fill="url(#sea2)"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${150 + i * 6}" y="${224 + i * 12}" width="${100 - i * 12}" height="3" rx="1.5" fill="#FFC24B" opacity="${0.75 - i * 0.12}"/>`).join("")}
        ${palm(30, 310, 1.15, false, "#2A0B2E")}${palm(372, 310, .9, true, "#2A0B2E")}`
      : `<rect width="400" height="300" fill="url(#sk3)"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 150}" r="${i % 3 ? 0.9 : 1.6}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`).join("")}
        <circle cx="310" cy="62" r="22" fill="#F3EAFF"/><circle cx="320" cy="56" r="20" fill="#1A0B45"/>${skyline("#170A33", "#FF2E88")}<rect y="214" width="400" height="86" fill="url(#sea3)"/>
        ${palm(30, 310, 1.15, false, "#07020F")}${palm(372, 310, .9, true, "#07020F")}`;
    return `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
      <linearGradient id="sk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD3F3"/><stop offset=".7" stop-color="#BDF0F2"/><stop offset="1" stop-color="#FFE6C7"/></linearGradient>
      <linearGradient id="sk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B2BE0"/><stop offset=".45" stop-color="#FF4D8D"/><stop offset=".72" stop-color="#FF8A4C"/><stop offset="1" stop-color="#FFC24B"/></linearGradient>
      <linearGradient id="sk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0620"/><stop offset=".6" stop-color="#2B1166"/><stop offset="1" stop-color="#C2187A"/></linearGradient>
      <linearGradient id="sun2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FF4D8D"/></linearGradient>
      <linearGradient id="sea1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18C3C6"/><stop offset="1" stop-color="#0E8FA8"/></linearGradient>
      <linearGradient id="sea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C2306F"/><stop offset="1" stop-color="#4A1A7A"/></linearGradient>
      <linearGradient id="sea3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A0F5E"/><stop offset="1" stop-color="#0B0620"/></linearGradient>${stripes}</defs>${body}</svg>`;
  }
  function nowTod() { const h = new Date().getHours(); return h >= 5 && h < 11 ? "morning" : h < 17 ? "day" : h < 21 ? "evening" : "night"; }
  const todLayer = (tod) => (tod === "evening" ? 2 : tod === "night" ? 3 : 1);

  // ---------- утилиты ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const dayKey = (tm = Date.now()) => new Date(tm + 3 * 3600e3).toISOString().slice(0, 10);
  const prevDay = (d) => dayKey(Date.parse(d + "T09:00:00Z") - 86400e3);
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function hash32(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const randSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  const seedCode = (s) => (s >>> 0).toString(36).toUpperCase();
  const codeSeed = (c) => parseInt(c, 36) >>> 0;
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

  // ---------- звук ----------
  const Sound = (() => {
    let ctx = null;
    const ac = () => { if (!S.sound) return null; try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); } catch (e) { return null; } return ctx; };
    function tone(f, dur, type = "sine", vol = 0.06, when = 0) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), tm = c.currentTime + when;
      o.type = type; o.frequency.setValueAtTime(f, tm); g.gain.setValueAtTime(vol, tm); g.gain.exponentialRampToValueAtTime(0.0001, tm + dur);
      o.connect(g).connect(c.destination); o.start(tm); o.stop(tm + dur + 0.02);
    }
    function noise(dur, vol, cut) {
      const c = ac(); if (!c) return;
      const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = "lowpass"; f.frequency.value = cut; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
    }
    return {
      msg: () => { tone(880, 0.09, "sine", 0.07); tone(1320, 0.12, "sine", 0.06, 0.08); },
      sent: () => tone(660, 0.06, "triangle", 0.05),
      tick: () => tone(1500 + Math.random() * 200, 0.02, "triangle", 0.03),
      tap: () => tone(880, 0.05, "triangle", 0.05),
      passed: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.08, i * 0.08)),
      wasted: () => { noise(0.5, 0.6, 400); [196, 165, 131].forEach((f, i) => tone(f, 0.5, "sawtooth", 0.04, 0.1 + i * 0.18)); },
    };
  })();

  // ---------- хранилище ----------
  const KEY = "rc_state_v1";
  const fresh = () => ({ v: 2, ts: 0, platform: null, sound: true, lang: null, onb: false, mood: "any",
    points: 0, done: 0, failed: 0, hard: 0, dailyCount: 0, streak: 0, bestStreak: 0, lastDay: null,
    badges: {}, rel: {}, played: [], unk: 0, recent: [], hist: [], rerollDay: null, rerollsUsed: 0,
    pending: null, active: null, dailyDone: null });
  let S = fresh();
  function migrate(o) {
    if (!o) return null;
    if (o.v === 2) return Object.assign(fresh(), o);
    const n = fresh(); // со старой версии переносим только прогресс
    ["platform", "sound", "lang", "points", "done", "failed", "hard", "dailyCount", "streak", "bestStreak", "lastDay", "ts"].forEach((k) => { if (o[k] !== undefined) n[k] = o[k]; });
    Object.keys(o.badges || {}).forEach((k) => { if (BADGES.some((b) => b.id === k)) n.badges[k] = o.badges[k]; });
    return n;
  }
  function loadLocal() { try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) {} return null; }
  function loadCloud() {
    return new Promise((res) => {
      if (!inTelegram || !tg.CloudStorage) return res(null);
      try { tg.CloudStorage.getItem(KEY, (err, val) => { if (err || !val) return res(null); try { res(migrate(JSON.parse(val))); } catch (e) { res(null); } }); } catch (e) { res(null); }
    });
  }
  function save() {
    S.ts = Date.now(); S.hist = S.hist.slice(0, 15); S.recent = S.recent.slice(-8);
    let raw = JSON.stringify(S);
    while (raw.length >= 4000 && S.hist.length > 3) { S.hist.pop(); raw = JSON.stringify(S); }
    try { localStorage.setItem(KEY, raw); } catch (e) {}
    if (inTelegram && tg.CloudStorage && raw.length < 4000) { try { tg.CloudStorage.setItem(KEY, raw, () => {}); } catch (e) {} }
  }

  // ---------- генератор миссий ----------
  const tplOf = (m) => M.templates.find((x) => x.id === m.tpl);
  const tplIndex = (id) => M.templates.findIndex((x) => x.id === id);
  const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  // opt: mood, contact, minStars, maxStars, tpl, noUnk, avoid[]
  function generate(seed, opt = {}) {
    const r1 = mulberry32(seed), r2 = mulberry32((seed ^ 0x9e3779b9) >>> 0);
    let pool = M.templates;
    if (opt.tpl) pool = pool.filter((x) => x.id === opt.tpl);
    else if (opt.contact) pool = pool.filter((x) => x.c === opt.contact);
    else {
      const mood = opt.mood || "any", roll = r1();
      if (!opt.noUnk && (mood === "any" || mood === "hard") && roll < 0.08) pool = pool.filter((x) => x.mood === "unk");
      else pool = pool.filter((x) => x.mood !== "unk" && (mood === "any" || x.mood === mood));
    }
    if (opt.minStars) { const p = pool.filter((x) => x.st >= opt.minStars); pool = p.length ? p : M.templates.filter((x) => x.mood !== "unk" && x.st >= opt.minStars); }
    if (opt.maxStars) { const p = pool.filter((x) => x.st <= opt.maxStars); if (p.length) pool = p; }
    if (opt.avoid && opt.avoid.length) { const p = pool.filter((x) => !opt.avoid.includes(x.id)); if (p.length) pool = p; }
    const tp = pick(r1, pool);
    const Vv = M.vars, ri = (a) => Math.floor(r2() * a.length);
    const places = Vv.place.map((p, i) => i).filter((i) => !(Vv.place[i].foot && ["car", "boat", "bike"].some((u) => tp.uses.includes(u))));
    const slots = { car: ri(Vv.car), color: ri(Vv.color), place: places[Math.floor(r2() * places.length)], time: ri(Vv.time), prop: ri(Vv.prop), n: ri(Vv.n) };
    let twist = null;
    if (tp.st >= 3 && r2() < 0.75) {
      const tw = M.twists.filter((x) => x.st <= tp.st && !(x.bans || []).some((b) => tp.uses.includes(b)) && (x.needs || []).every((n) => tp.uses.includes(n)));
      if (tw.length) twist = pick(r2, tw).id;
    }
    let fin = null;
    if (!tp.fin) { const fs = M.finales.filter((f) => (f.needs || []).every((n) => tp.uses.includes(n))); fin = pick(r2, fs).id; }
    return { seed: seed >>> 0, tpl: tp.id, c: tp.c, st: tp.st, slots, twist, fin, min: Math.max(STARS[tp.st].min, tp.min || 0) };
  }
  function fill(s, m) {
    const Vv = M.vars, sl = m.slots, en = L.code === "en";
    const car = Vv.car[sl.car], col = Vv.color[sl.color], pl = Vv.place[sl.place];
    const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    const map = { car: en ? car.en : car.ru, carOn: en ? car.en : car.on, color: en ? col.en : col.ru, colorPl: en ? col.en : col.pl,
      colorNom: en ? cap(col.en) : col.nom, placeTo: tx(pl.to), placeAt: tx(pl.at), time: tx(Vv.time[sl.time]), prop: tx(Vv.prop[sl.prop]), n: Vv.n[sl.n] };
    return s.replace(/\{(\w+)\}/g, (x, k) => (map[k] !== undefined ? map[k] : x));
  }
  function mtext(m) {
    const tp = tplOf(m);
    return { tp, title: fill(tx(tp.title), m), intro: tp.intro.map((x) => fill(tx(x), m)), steps: tp.steps.map((x) => fill(tx(x), m)),
      fin: tp.fin ? fill(tx(tp.fin), m) : tx(M.finales.find((f) => f.id === m.fin)), twist: m.twist ? tx(M.twists.find((x) => x.id === m.twist)) : null };
  }
  const reward = (m) => STARS[m.st].pts + (m.src === "daily" ? DAILY_BONUS : 0);
  const cName = (c) => tx(M.contacts[c].name);
  const cRole = (c) => tx(M.contacts[c].role);
  function cLine(c, kind, seed) { const arr = (M.lines[c] && M.lines[c][kind]) || []; return arr.length ? tx(arr[(seed >>> 0) % arr.length]) : ""; }
  const dailySeed = (day) => hash32("daily-" + day);
  const dailyMission = () => Object.assign(generate(dailySeed(dayKey()), { noUnk: true, minStars: 3 }), { src: "daily" });
  function rollFor(opt) { let m; for (let i = 0; i < 12; i++) { m = generate(randSeed(), Object.assign({ avoid: S.recent }, opt)); if (!S.recent.includes(m.tpl)) break; } return m; }

  // ---------- ранги, отношения, награды ----------
  function rankOf(p) {
    let i = 0; RANK_AT.forEach((a, k) => { if (p >= a) i = k; });
    const cur = { at: RANK_AT[i], name: t("rank." + i) }, next = i + 1 < RANK_AT.length ? { at: RANK_AT[i + 1], name: t("rank." + (i + 1)) } : null;
    return { i, cur, next, pct: next ? Math.round(((p - cur.at) / (next.at - cur.at)) * 100) : 100 };
  }
  const relLevel = (c) => REL_AT.filter((x) => (S.rel[c] || 0) >= x).length;
  const hearts = (c) => `<span class="hearts">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= relLevel(c) ? "on" : ""}"></i>`).join("")}</span>`;
  const bName = (b) => t("badge." + b.id), bHint = (b) => t("badge." + b.id + ".hint");
  function giveBadge(id) { if (S.badges[id]) return null; S.badges[id] = dayKey(); return BADGES.find((b) => b.id === id); }
  function rerollsLeft() { if (S.rerollDay !== dayKey()) { S.rerollDay = dayKey(); S.rerollsUsed = 0; } return Math.max(0, MAX_REROLLS - S.rerollsUsed); }

  // ---------- аватарки ----------
  const avImg = (c) => `assets/contacts/${c}.webp?v=${V}`;
  const stickerImg = (c, kind) => `assets/stickers/${c}-${kind}.webp?v=${V}`;
  function avatar(c, size = 48) {
    const col = M.contacts[c].color, letter = c === "unk" ? "?" : cName(c).replace(/^(Капитан|Коуч|Captain|Coach)\s+/, "")[0];
    return `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px;background:linear-gradient(135deg,${col[0]},${col[1]})">${esc(letter)}<img src="${avImg(c)}" alt="" loading="lazy"></span>`;
  }

  // ---------- дуэль ----------
  const duelLink = (m) => `https://t.me/${CFG.BOT_USERNAME}/${CFG.APP_SHORT_NAME}?startapp=d_${seedCode(m.seed)}_${tplIndex(m.tpl).toString(36)}`;
  function readStartParam() {
    let sp = inTelegram && tg.initDataUnsafe ? tg.initDataUnsafe.start_param : null;
    if (!sp) { const q = new URLSearchParams(location.search); sp = q.get("tgWebAppStartParam") || q.get("startapp"); }
    const m = sp && /^d_([0-9A-Z]{1,7})_([0-9a-z]{1,3})$/.exec(sp);
    if (!m) return null;
    const tp = M.templates[parseInt(m[2], 36)];
    return tp ? { seed: codeSeed(m[1]), tpl: tp.id } : null;
  }
  async function shareMission(m, prefixKey) {
    const x = mtext(m), link = duelLink(m);
    const text = t(prefixKey, { app: t("app") }) + "\n\n" + t("share.lines", { title: x.title, stars: "★".repeat(m.st), steps: x.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), fin: x.fin });
    if (inTelegram && tg.openTelegramLink) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    else if (navigator.share) { try { await navigator.share({ text: text + "\n" + link }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(text + "\n" + link); toast(t("toast.copied")); } catch (e) { toast(link); } }
    const nb = giveBadge("duelist"); if (nb) toast(t("toast.newBadge", { name: bName(nb) }));
    save();
  }
  function playerName() { const u = inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user; return u ? (u.first_name || u.username || t("player")) : t("player"); }

  // =========================================================
  //  НАВИГАЦИЯ
  // =========================================================
  let view = "home", viewArg = null, tick = null, busy = false;
  const screen = () => $("#screen");
  const NAV = [["home", "chat", "nav.chats"], ["collection", "grid", "nav.collection"], ["me", "user", "nav.me"]];
  function go(v, arg) {
    view = v; viewArg = arg; clearInterval(tick); tick = null;
    const tab = v === "chat" ? null : v;
    $("#nav").innerHTML = NAV.map(([k, i, key]) => `<button data-go="${k}" class="${k === tab ? "active" : ""}" aria-label="${t(key)}">${ic(i)}<span>${t(key)}</span></button>`).join("");
    $$("#nav button").forEach((b) => b.onclick = () => { if (busy) return; haptic(); go(b.dataset.go); });
    $("#nav").classList.toggle("hidden", v === "chat" || v === "onb");
    document.body.classList.toggle("in-chat", v === "chat" || v === "onb");
    if (inTelegram && tg.BackButton) v === "chat" ? tg.BackButton.show() : tg.BackButton.hide();
    if (inTelegram) { try { S.active ? tg.enableClosingConfirmation() : tg.disableClosingConfirmation(); } catch (e) {} }
    ({ home: vHome, chat: vChat, collection: vCollection, me: vMe, onb: vOnb }[v] || vHome)(arg);
    if (v !== "chat") window.scrollTo(0, 0);
  }

  // =========================================================
  //  ГЛАВНАЯ — ЧАТЫ
  // =========================================================
  function timeLeft(m) { const ms = m.startedAt + m.min * 60e3 - Date.now(); const a = Math.abs(ms); return { ms, txt: String(Math.floor(a / 60e3)).padStart(2, "0") + ":" + String(Math.floor((a % 60e3) / 1e3)).padStart(2, "0") }; }
  function preview(c) {
    if (S.active && S.active.c === c) return { txt: mtext(S.active).title, hot: true };
    if (S.pending && S.pending.c === c) return { txt: mtext(S.pending).intro[0], hot: true, unread: !S.pending.read };
    const h = S.hist.find((x) => x.c === c);
    if (h) { const tp = M.templates.find((x) => x.id === h.tp); return { txt: "✓ " + (tp ? fill(tx(tp.title), { slots: h.sl || { car: 0, color: 0, place: 0, time: 0, prop: 0, n: 0 } }) : "") }; }
    return { txt: cRole(c) };
  }
  function vHome() {
    if (!S.onb) return go("onb");
    const tod = nowTod(), r = rankOf(S.points);
    const day = new Intl.DateTimeFormat(L.locale, { weekday: "long" }).format(new Date());
    const dm = dailyMission(), dx = mtext(dm), dailyDone = S.dailyDone === dayKey();
    const known = CONTACTS.filter((c) => c !== "unk" || S.unk > 0 || (S.pending && S.pending.c === "unk") || (S.active && S.active.c === "unk"));
    const order = known.sort((a, b) => (preview(b).hot ? 1 : 0) - (preview(a).hot ? 1 : 0));
    let main = "";
    if (S.active) {
      const x = mtext(S.active), tl = timeLeft(S.active);
      main = `<button class="hero-card active" data-open="${S.active.c}">
        <div class="row">${avatar(S.active.c, 52)}<div class="grow"><div class="cap">${t("home.active")} · ${esc(cName(S.active.c))}</div><div class="t3">${esc(x.title)}</div></div>
        <div class="clockpill ${tl.ms < 0 ? "over" : ""}" id="hclock">${ic("clock")}<b>${tl.txt}</b></div></div></button>`;
    } else if (S.pending) {
      const x = mtext(S.pending);
      main = `<button class="hero-card new" data-open="${S.pending.c}">
        <div class="row">${avatar(S.pending.c, 52)}<div class="grow"><div class="cap">${S.pending.read ? esc(cName(S.pending.c)) : t("home.newFrom", { name: esc(cName(S.pending.c)) })}</div>
        <div class="bubble-prev">${esc(x.intro[0])}</div></div>${S.pending.read ? "" : '<span class="dot"></span>'}</div></button>`;
    } else {
      main = `<div class="hero-card spin">
        <div class="t2">${t("home.who")}</div><div class="cap" style="margin:4px 0 12px">${t("home.whoSub")}</div>
        <div class="moods">${MOODS.map(([k, i]) => `<button class="mood ${k === S.mood ? "on" : ""}" data-m="${k}">${ic(i)}${t("mood." + k)}</button>`).join("")}</div>
        <button class="btn main" id="spin" style="margin-top:14px">${ic("dice")}${t("home.who")}</button></div>`;
    }
    screen().innerHTML = `
      <div class="scene">${sceneSVG(todLayer(tod))}
        <div class="over"><span class="logo">${esc(t("app"))}</span><span class="pill"><img src="${rankImg(r.i)}" alt="">${S.points}</span></div>
        <div class="hello"><h1 class="t1 cap1">${t("home.status", { day, tod: t("tod." + tod) })}</h1><div class="cap">${S.streak ? t("streak", { n: S.streak }) + " 🔥" : t("slogan")}</div></div>
      </div>
      <div class="lift">${main}</div>
      ${!dailyDone && !S.active && !S.pending ? `<button class="daily-card" id="daily">
        <img src="${catImg(dx.tp.cat)}" alt=""><div class="dc-body"><div class="cap">${t("home.daily")} · ${t("home.dailySub", { n: reward(dm) })}</div>
        <div class="t3">${esc(dx.title)}</div><div class="row" style="gap:6px;margin-top:6px">${avatar(dm.c, 22)}<span class="cap">${esc(cName(dm.c))}</span>${stars(dm.st)}</div></div></button>` : ""}
      <div class="sec"><h2 class="t2">${t("home.contacts")}</h2></div>
      <div class="card list contacts">${order.map((c) => { const p = preview(c);
        return `<button class="li contact" data-open="${c}">${avatar(c, 50)}<div class="grow"><div class="row between"><b>${esc(cName(c))}</b>${hearts(c)}</div>
          <span class="prev ${p.hot ? "hot" : ""}">${esc(p.txt)}</span></div>${p.unread ? '<span class="dot"></span>' : ""}</button>`; }).join("")}</div>
      ${CFG.ONLINE_ENABLED ? "" : `<p class="legal">${t("home.online")}</p>`}`;
    $$("[data-open]").forEach((b) => b.onclick = () => { haptic(); go("chat", b.dataset.open); });
    $$("[data-m]").forEach((b) => b.onclick = () => { S.mood = b.dataset.m; save(); haptic("tick"); Sound.tap(); $$("[data-m]").forEach((x) => x.classList.toggle("on", x === b)); });
    const sp = $("#spin"); if (sp) sp.onclick = () => spin();
    const dl = $("#daily"); if (dl) dl.onclick = () => { S.pending = Object.assign(dailyMission(), { read: false }); save(); go("chat", S.pending.c); };
    if (S.active) tick = setInterval(() => { const el = $("#hclock b"); if (!el) return; const tl = timeLeft(S.active); el.textContent = tl.txt; $("#hclock").classList.toggle("over", tl.ms < 0); }, 1000);
  }

  // «Кто свободен?» — перебор аватарок, остановка на контакте
  async function spin(opt) {
    if (busy) return; busy = true;
    const m = Object.assign(rollFor(opt || { mood: S.mood }), { src: "solo", read: false });
    const ov = $("#overlay"); ov.className = "overlay dim spinov";
    ov.innerHTML = `<div class="ring-av" id="ra"></div><div class="t2" id="rn" style="color:#fff;margin-top:18px">&nbsp;</div><div class="cap" id="rs" style="color:rgba(255,255,255,.7)">${t("typing")}</div>`;
    const seq = CONTACTS.filter((c) => c !== "unk");
    let i = 0, step = 60;
    while (step < 260) {
      const c = seq[i++ % seq.length];
      $("#ra").innerHTML = avatar(c, 140); $("#rn").textContent = cName(c);
      Sound.tick(); haptic("tick"); await wait(step); step *= 1.16;
    }
    $("#ra").innerHTML = avatar(m.c, 140); $("#ra").classList.add("landed"); $("#rn").textContent = cName(m.c);
    $("#rs").textContent = t("home.newFrom", { name: cName(m.c) });
    Sound.msg(); haptic("heavy");
    S.pending = m; S.recent.push(m.tpl); save();
    await wait(800);
    ov.className = "overlay hidden"; busy = false;
    go("chat", m.c);
  }

  // =========================================================
  //  ЧАТ С КОНТАКТОМ
  // =========================================================
  const bubble = (from, html, cls = "") => `<div class="b ${from} ${cls}">${html}</div>`;
  function missionCard(m, active) {
    const x = mtext(m), done = (active && m.steps) || [];
    return `<div class="b them card-b"><div class="mcard">
      <img class="mimg" src="${catImg(x.tp.cat)}" alt="">
      <div class="mbody">
        <div class="row between">${stars(m.st)}<span class="cap">#${seedCode(m.seed)}</span></div>
        <h3 class="mtitle">${esc(x.title)}</h3>
        <ol class="steps">${x.steps.map((s, i) => `<li class="${done[i] ? "ok" : ""}" ${active ? `data-step="${i}"` : ""}><span class="ck">${ic("check")}</span><span>${esc(s)}</span></li>`).join("")}</ol>
        ${x.twist ? `<div class="mline">${ic("ban")}<span><b>${t("card.twist")}:</b> ${esc(x.twist)}</span></div>` : ""}
        <div class="mline">${ic("camera")}<span><b>${t("card.fin")}:</b> ${esc(x.fin)}</span></div>
        <div class="chips"><span class="chip">${ic("clock")}${t("chip.min", { n: m.min })}</span><span class="chip">${ic("medal")}${t("respect", { n: reward(m) })}</span></div>
      </div></div></div>`;
  }
  function preBubbles(m) { // реплики перед миссией (вопрос игрока, «давай жёстче» и т. п.)
    return (m.pre || []).map(([who, key, seed]) => who === "me" ? bubble("me", esc(t(key))) : bubble("them", esc(cLine(m.c, key, seed)))).join("");
  }
  function vChat(c) {
    if (!M.contacts[c]) return go("home");
    const mine = (x) => x && x.c === c;
    const pend = mine(S.pending) ? S.pending : null, act = mine(S.active) ? S.active : null;
    const past = S.hist.filter((h) => h.c === c).slice(0, 5).reverse();
    screen().innerHTML = `
      <div class="chead"><button class="hbtn" id="cback" aria-label="${t("btn.back")}">${ic("back")}</button>${avatar(c, 40)}
        <div class="grow"><b>${esc(cName(c))}</b><span class="cap" id="cstat">${esc(cRole(c))}</span></div>${act ? `<div class="clockpill" id="cclock">${ic("clock")}<b>--:--</b></div>` : hearts(c)}</div>
      <div class="cbody" id="cbody">
        ${past.map((h) => { const tp = M.templates.find((x) => x.id === h.tp); return tp ? `<div class="b sys">✓ ${esc(fill(tx(tp.title), { slots: h.sl || { car: 0, color: 0, place: 0, time: 0, prop: 0, n: 0 } }))} · ${t("respect", { n: h.pts })} · ${fmtDate(h.d)}</div>` : ""; }).join("")}
        <div id="thread"></div>
      </div>
      <div class="cbar" id="cbar"></div>`;
    $("#cback").onclick = () => { if (!busy) go("home"); };
    renderThread(c, pend, act);
  }
  async function renderThread(c, pend, act) {
    const th = $("#thread"), bar = $("#cbar");
    const m = act || pend;
    if (!m) {
      const tease = S.hist.find((h) => h.c === c) ? cLine(c, "tease", S.done) : "";
      th.innerHTML = (tease ? bubble("them", esc(tease)) : "") + `<div class="b sys">${t("chat.empty")}</div>`;
      bar.innerHTML = `<button class="btn main" id="ask">${ic("send")}${t("rep.ask")}</button>`;
      $("#ask").onclick = () => {
        if (S.active || S.pending) { toast(t("chat.busy")); return; }
        S.pending = Object.assign(rollFor({ contact: c }), { src: "solo", read: false, pre: [["me", "u.ask"]] }); save();
        Sound.sent(); renderThread(c, S.pending, null);
      };
      scrollChat(); return;
    }
    const x = mtext(m);
    const duelSys = m.src === "duel" ? `<div class="b sys">${t("duel.line")}</div>` : m.src === "daily" ? `<div class="b sys">${t("home.daily")}</div>` : "";
    const items = [duelSys, preBubbles(m), ...x.intro.map((s) => bubble("them", esc(s))), missionCard(m, !!act)];
    if (act) items.push(bubble("me", esc(t("u.go"))), bubble("them", esc(cLine(c, "accept", m.seed))), `<div class="b sys tip">${ic("camera")} ${t("card.clip")}</div>`);
    bar.innerHTML = "";
    if (pend && !pend.read) {
      // «печатает…» — сообщения приходят по одному
      busy = true; th.innerHTML = "";
      for (const it of items) {
        if (!it) continue;
        if (it.includes('class="b them')) { $("#cstat").textContent = t("typing"); th.insertAdjacentHTML("beforeend", `<div class="b them typing"><i></i><i></i><i></i></div>`); scrollChat(); await wait(it.includes("card-b") ? 700 : 550 + Math.min(900, it.length * 6)); $(".typing", th) && $(".typing", th).remove(); }
        th.insertAdjacentHTML("beforeend", it.replace('class="b ', 'class="b pop ')); Sound.msg(); haptic("light"); scrollChat(); await wait(120);
      }
      $("#cstat").textContent = cRole(c); pend.read = true; save(); busy = false;
    } else th.innerHTML = items.join("");
    scrollChat();
    if (act) bindActive(c, act); else bindPending(c, pend);
  }
  function scrollChat() { const b = $("#cbody"); if (b) requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })); }
  function bindPending(c, m) {
    const solo = m.src === "solo", left = rerollsLeft();
    $("#cbar").innerHTML = `<div class="replies">
      <button class="rep main" id="rgo">${t("rep.go")}</button>
      ${solo && m.st < 6 ? `<button class="rep" id="rhard">${t("rep.harder")}</button>` : ""}
      ${solo ? `<button class="rep" id="rother" ${left ? "" : "disabled"}>${t("rep.other")}</button>` : ""}
      <button class="rep ghost" id="rlater">${t("rep.later")}</button></div>`;
    $("#rgo").onclick = () => {
      S.active = Object.assign({}, m, { startedAt: Date.now(), steps: m.steps && m.steps.length ? m.steps : [] }); S.pending = null; save();
      Sound.sent(); haptic("medium");
      if (inTelegram) { try { tg.enableClosingConfirmation(); } catch (e) {} }
      vChat(c);
    };
    const h = $("#rhard"); if (h) h.onclick = () => {
      const nm = Object.assign(rollFor({ contact: c, minStars: m.st === 1 ? 3 : 6 }), { src: "solo", read: false, pre: [["me", "u.harder"], ["them", "harder", randSeed()]] });
      S.pending = nm; save(); Sound.sent(); vChat(nm.c);
    };
    const o = $("#rother"); if (o) o.onclick = () => {
      if (!rerollsLeft()) return toast(t("toast.noRerolls"));
      S.rerollsUsed++;
      const nm = Object.assign(rollFor({ contact: c, avoid: [m.tpl, ...S.recent] }), { src: "solo", read: false, pre: [["me", "u.other"]] });
      S.pending = nm; S.recent.push(nm.tpl); save(); Sound.sent(); vChat(c);
    };
    $("#rlater").onclick = () => { S.pending = null; save(); go("home"); };
  }
  function bindActive(c, m) {
    $("#cbar").innerHTML = `<button class="btn main" id="done">${ic("check")}${t("btn.done")}</button>
      <div class="links"><button class="link" id="share">${ic("send")}${t("btn.duel")}</button><button class="link" id="fail">${ic("flag")}${t("btn.giveup")}</button></div>`;
    $$("[data-step]").forEach((li) => li.onclick = () => {
      const i = +li.dataset.step; S.active.steps = S.active.steps || []; S.active.steps[i] = !S.active.steps[i]; save();
      li.classList.toggle("ok", !!S.active.steps[i]); haptic(S.active.steps[i] ? "medium" : "tick"); if (S.active.steps[i]) Sound.tap();
    });
    const upd = () => { const el = $("#cclock"); if (!el) return; const tl = timeLeft(S.active); $("b", el).textContent = (tl.ms < 0 ? "+" : "") + tl.txt; el.classList.toggle("over", tl.ms < 0); };
    upd(); tick = setInterval(upd, 1000);
    $("#done").onclick = async () => { if (await confirmBox(t("confirm.done"))) complete(); };
    $("#share").onclick = () => shareMission(m, "share.duel");
    $("#fail").onclick = async () => {
      if (!(await confirmBox(t("confirm.fail")))) return;
      const line = cLine(c, "fail", m.seed);
      S.failed++; S.active = null; save(); clearInterval(tick); busy = true;
      const ov = $("#overlay"); ov.className = "overlay wasted";
      ov.innerHTML = `<div class="big slam">${t("wasted.title")}</div><img class="sticker pop" style="animation-delay:.5s" src="${stickerImg(c, "fail")}" alt=""><div class="said">${avatar(c, 36)}<span>${esc(line)}</span></div>`;
      Sound.wasted(); haptic("error");
      await wait(2400); ov.className = "overlay hidden"; busy = false; go("chat", c);
    };
  }

  // ---------- выполнение ----------
  function complete() {
    const m = S.active, x = mtext(m), late = Date.now() > m.startedAt + m.min * 60e3;
    let pts = reward(m); if (late) pts = Math.ceil(pts / 2);
    const before = rankOf(S.points).i, today = dayKey(), prevRel = relLevel(m.c);
    S.points += pts; S.done++; if (m.st === 6) S.hard++;
    S.rel[m.c] = (S.rel[m.c] || 0) + 1;
    if (!S.played.includes(m.tpl)) S.played.push(m.tpl);
    if (S.lastDay !== today) { S.streak = S.lastDay === prevDay(today) ? S.streak + 1 : 1; S.lastDay = today; S.bestStreak = Math.max(S.bestStreak, S.streak); }
    if (m.src === "daily") { S.dailyDone = today; S.dailyCount++; }
    let story = null;
    if (x.tp.mood === "unk" && S.unk < M.unkStory.length) { story = tx(M.unkStory[S.unk]); S.unk++; }
    S.hist.unshift({ d: today, c: m.c, tp: m.tpl, pts, st: m.st, sl: m.slots });
    const nb = [], tryB = (cond, id) => { if (cond) { const b = giveBadge(id); if (b) nb.push(b); } };
    tryB(true, "first"); tryB(today < SEASON1_END, "season1"); tryB(S.streak >= 3, "streak3"); tryB(S.streak >= 7, "streak7");
    tryB(S.hard >= 10, "hard10"); tryB(S.dailyCount >= 5, "daily5"); tryB(S.done >= 10, "ten"); tryB(m.src === "duel", "duelwin");
    tryB(x.tp.mood === "unk", "unk1"); tryB(CONTACTS.filter((k) => k !== "unk").every((k) => (S.rel[k] || 0) > 0), "allc");
    const done = m; S.active = null; save();
    if (inTelegram) { try { tg.disableClosingConfirmation(); } catch (e) {} }
    const after = rankOf(S.points);
    passed(done, pts, late, after.i > before ? after : null, nb, story, relLevel(done.c) > prevRel);
  }
  async function passed(m, pts, late, rankUp, nb, story, relUp) {
    clearInterval(tick); busy = true;
    const ov = $("#overlay"); ov.className = "overlay passed";
    ov.innerHTML = `<div class="big slam">${t("passed.title")}</div>
      <div class="burst">${Array.from({ length: Math.min(m.st, 6) }, (_, i) => `<svg viewBox="0 0 24 24" style="animation-delay:${0.45 + i * 0.1}s"><path d="${STAR}"/></svg>`).join("")}</div>
      <div class="resp" id="resp">${t("respect", { n: 0 })}</div>
      <div class="resp-sub">${late ? t("passed.late") + " · " : ""}${t("streak", { n: S.streak })}</div>
      <img class="sticker pop" style="animation-delay:.8s" src="${stickerImg(m.c, "win")}" alt="">
      <div class="said pop" style="animation-delay:.9s">${avatar(m.c, 36)}<span>${esc(cLine(m.c, "win", m.seed))}${relUp ? " ❤️" : ""}</span></div>
      ${story ? `<div class="said unk pop" style="animation-delay:1.1s">${avatar("unk", 36)}<span>${esc(story)}</span></div>` : ""}
      <div class="awards">${nb.map((b, i) => `<div class="award" style="animation-delay:${1.2 + i * 0.12}s"><div class="ic">${ic(b.ic)}</div><div><b>${t("award.new", { name: bName(b) })}</b><span>${bHint(b)}</span></div></div>`).join("")}</div>
      <div class="actions hidden" id="acts"><button class="btn light" id="poster">${ic("image")}${t("btn.poster")}</button>
        <button class="btn ghost" id="duel">${ic("send")}${t("btn.duel")}</button><button class="btn text" id="next" style="color:#fff">${t("btn.next")}</button></div>`;
    Sound.passed(); haptic("heavy"); setTimeout(() => haptic("ok"), 400);
    await wait(500);
    const el = $("#resp"), t0 = performance.now();
    await new Promise((res) => { const f = (ts) => { const k = Math.min(1, (ts - t0) / 800); el.textContent = t("respect", { n: Math.round(pts * (1 - Math.pow(1 - k, 3))) }); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    $("#acts").classList.remove("hidden"); busy = false;
    $("#poster").onclick = () => showPoster(m);
    $("#duel").onclick = () => shareMission(m, "share.done");
    $("#next").onclick = () => { if (rankUp) showRankUp(rankUp); else { ov.className = "overlay hidden"; go("home"); } };
  }
  function showRankUp(r) {
    const ov = $("#overlay"); ov.className = "overlay dim rankup";
    ov.innerHTML = `<div class="badge-big slam"><img src="${rankImg(r.i)}" alt=""></div><div class="cap" style="color:rgba(255,255,255,.7);margin-top:18px">${t("rankup.new")}</div><h1 class="t1">${r.cur.name}</h1>
      <div class="resp-sub" style="opacity:.7;margin-top:8px">${r.next ? t("rankup.next", { rank: r.next.name, n: r.next.at }) : t("rankup.top")}</div>
      <div class="actions"><button class="btn sun" id="ok">${t("btn.cool")}</button></div>`;
    Sound.passed(); haptic("ok"); confetti();
    $("#ok").onclick = () => { ov.className = "overlay hidden"; go("home"); };
  }
  function confetti() {
    const c = document.createElement("canvas"); c.className = "confetti"; const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
    const x = c.getContext("2d"), cols = ["#FF4D8D", "#FF8A4C", "#FFC24B", "#12B5A6", "#5B2BE0", "#fff"];
    const ps = Array.from({ length: 150 }, () => ({ x: c.width / 2, y: c.height * .38, vx: (Math.random() - .5) * 26 * dpr, vy: (-Math.random() * 26 - 6) * dpr, s: (Math.random() * 8 + 6) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, col: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    const f = (ts) => { x.clearRect(0, 0, c.width, c.height); ps.forEach((p) => { p.vy += .8 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.col; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); ts - t0 < 2600 ? requestAnimationFrame(f) : c.remove(); };
    requestAnimationFrame(f);
  }

  // =========================================================
  //  ОНБОРДИНГ — переписка с Лео
  // =========================================================
  async function vOnb() {
    screen().innerHTML = `<div class="onb">
      <div class="scene photo tall"><img class="art" src="assets/hero-couple.webp?v=${V}" alt="" fetchpriority="high">
        <div class="over"><span class="logo">${esc(t("app"))}</span><button class="pill" id="lang">${ic("globe")}${L.code.toUpperCase()}</button></div>
        <div class="hello"><h1 class="t1">${t("onb.hero")}</h1><div class="cap">${t("onb.sub")}</div></div></div>
      <div style="padding:18px 0"><button class="btn main" id="start">${t("onb.start")}</button></div></div>`;
    $("#lang").onclick = () => langSheet(() => go("onb"));
    $("#start").onclick = () => onbChat();
  }
  async function onbChat() {
    busy = true;
    screen().innerHTML = `<div class="chead">${avatar("leo", 40)}<div class="grow"><b>${esc(cName("leo"))}</b><span class="cap" id="cstat">${esc(cRole("leo"))}</span></div></div>
      <div class="cbody" id="cbody"><div id="thread"></div></div><div class="cbar" id="cbar"></div>`;
    const th = $("#thread");
    const say = async (txt) => { $("#cstat").textContent = t("typing"); th.insertAdjacentHTML("beforeend", `<div class="b them typing"><i></i><i></i><i></i></div>`); scrollChat(); await wait(500 + Math.min(800, txt.length * 12)); $(".typing", th).remove(); th.insertAdjacentHTML("beforeend", bubble("them pop", esc(txt))); Sound.msg(); haptic("light"); $("#cstat").textContent = cRole("leo"); scrollChat(); await wait(150); };
    const ask = (opts) => new Promise((res) => {
      $("#cbar").innerHTML = `<div class="replies">${opts.map(([k, label]) => `<button class="rep" data-k="${k}">${label}</button>`).join("")}</div>`;
      $$("#cbar [data-k]").forEach((b) => b.onclick = () => { $("#cbar").innerHTML = ""; th.insertAdjacentHTML("beforeend", bubble("me pop", esc(b.textContent))); Sound.sent(); haptic("tick"); scrollChat(); res(b.dataset.k); });
    });
    await say(t("onb.1")); await say(t("onb.2")); await say(t("onb.3"));
    S.platform = await ask([["xbox", "Xbox"], ["ps", "PlayStation"]]);
    await say(t("onb.4"));
    S.mood = await ask([["hard", "🔥 " + t("mood.hard")], ["fun", "😂 " + t("mood.fun")], ["chill", "🌴 " + t("mood.chill")], ["any", "🎲 " + t("mood.any")]]);
    await say(t("onb.5"));
    S.onb = true; save(); busy = false;
    await wait(500);
    if (pendingDuel) return go("chat", startDuel());
    spin({ mood: S.mood, maxStars: 3, noUnk: true });
  }
  function startDuel() {
    const d = pendingDuel; pendingDuel = null;
    if (S.active) { toast(t("chat.busy")); return S.active.c; }
    S.pending = Object.assign(generate(d.seed, { tpl: d.tpl }), { src: "duel", read: false }); save();
    return S.pending.c;
  }

  // =========================================================
  //  СЮЖЕТЫ (коллекция)
  // =========================================================
  function vCollection() {
    const total = M.templates.length;
    const groups = ["hard", "fun", "chill", "unk"];
    const dsl = { car: 0, color: 0, place: 0, time: 0, prop: 0, n: 0 };
    screen().innerHTML = `
      <div style="padding-top:calc(24px + env(safe-area-inset-top))"><h1 class="t1">${t("col.title")}</h1><div class="cap" style="margin-top:6px">${t("col.sub", { a: S.played.length, b: total })}</div>
        <div class="bar" style="margin-top:10px"><div style="width:${Math.round(S.played.length / total * 100)}%"></div></div></div>
      ${groups.map((g) => { const list = M.templates.filter((x) => x.mood === g); const got = list.filter((x) => S.played.includes(x.id)).length;
        return `<div class="sec"><h2 class="t2">${g === "unk" ? esc(cName("unk")) : t("mood." + g)}</h2><span class="cap">${got}/${list.length}</span></div>
        <div class="cgrid">${list.map((x) => { const ok = S.played.includes(x.id); const hidden = g === "unk" && !ok;
          return `<div class="ctile ${ok ? "ok" : ""}"><img src="${catImg(x.cat)}" alt=""><div class="ct"><b>${hidden ? "???" : esc(fill(tx(x.title), { slots: dsl }))}</b>
          <span>${ok ? ic("check") : ""}${stars(x.st)}</span></div></div>`; }).join("")}</div>`; }).join("")}`;
  }

  // =========================================================
  //  Я (профиль)
  // =========================================================
  function vMe() {
    const r = rankOf(S.points);
    screen().innerHTML = `
      <div class="prof-top"><img class="ava img" src="${rankImg(r.i)}" alt=""><h1 class="t1">${esc(playerName())}</h1>
        <div class="cap">${t("me.line", { rank: r.cur.name, n: S.points, pf: S.platform === "ps" ? "PlayStation" : "Xbox" })}</div></div>
      <div class="card lift">
        <div class="ranks">${RANK_AT.map((_, i) => `<div class="${i <= r.i ? "on" : ""} ${i === r.i ? "now" : ""}"><img src="${rankImg(i)}" alt="">${t("rank." + i)}</div>`).join("")}</div>
        <div class="bar" style="margin-top:14px"><div style="width:${r.pct}%"></div></div>
        <div class="cap" style="margin-top:6px">${r.next ? t("toNext", { n: r.next.at - S.points, rank: r.next.name }) : t("top")}</div>
        <div class="kpis"><div class="kpi"><b>${S.done}</b><span>${t("kpi.missions")}</span></div><div class="kpi"><b>${S.bestStreak}</b><span>${t("kpi.best")}</span></div><div class="kpi"><b>${S.hard}</b><span>${t("kpi.hard")}</span></div></div>
      </div>
      <div style="margin-top:14px"><button class="btn" id="poster">${ic("image")}${t("btn.poster")}</button></div>
      <div class="sec"><h2 class="t2">${t("me.contacts")}</h2></div>
      <div class="card list">${CONTACTS.filter((c) => c !== "unk" || S.unk > 0).map((c) => `<button class="li contact" data-open="${c}">${avatar(c, 44)}<div class="grow"><b>${esc(cName(c))}</b><span class="prev">${t("missions", { n: S.rel[c] || 0 })}</span></div>${hearts(c)}</button>`).join("")}</div>
      ${S.unk ? `<div class="sec"><h2 class="t2">${t("me.unk")}</h2><span class="cap">${S.unk}/${M.unkStory.length}</span></div>
        <div class="card story">${M.unkStory.slice(0, S.unk).map((s) => `<p>${esc(tx(s))}</p>`).join("")}</div>` : ""}
      <div class="sec"><h2 class="t2">${t("me.awards")}</h2><span class="cap">${t("me.awardsOf", { a: Object.keys(S.badges).length, b: BADGES.length })}</span></div>
      <div class="medals">${BADGES.map((b) => `<button class="medal ${S.badges[b.id] ? "" : "locked"}" data-b="${b.id}"><div class="ic">${ic(S.badges[b.id] ? b.ic : "lock")}</div><span>${bName(b)}</span></button>`).join("")}</div>
      <div class="sec"><h2 class="t2">${t("me.settings")}</h2></div>
      <div class="card" style="padding:4px 18px">
        <button class="set" id="lng">${ic("globe")}<span class="grow">${t("me.language")}</span><span class="muted">${L.name}</span>${ic("chevron")}</button>
        <button class="set" id="snd">${ic("volume")}<span class="grow">${t("me.sound")}</span><span class="tgl ${S.sound ? "on" : ""}"></span></button>
        <button class="set" id="pf">${ic("gamepad")}<span class="grow">${t("me.platform")}</span><span class="muted">${S.platform === "ps" ? "PlayStation" : "Xbox"}</span>${ic("chevron")}</button>
      </div>
      <div class="sec"><h2 class="t2">${t("me.how")}</h2></div>
      <div class="card how">${[1, 2, 3, 4, 5].map((i) => `<p>${t("how." + i)}</p>`).join("")}</div>
      <p class="legal">${t("legal")}</p>`;
    $$("[data-open]").forEach((b) => b.onclick = () => go("chat", b.dataset.open));
    $$("[data-b]").forEach((el) => el.onclick = () => { const b = BADGES.find((x) => x.id === el.dataset.b); toast(S.badges[b.id] ? t("toast.badgeGot", { name: bName(b), date: fmtDate(S.badges[b.id]) }) : bHint(b)); });
    $("#poster").onclick = () => showPoster(null);
    $("#lng").onclick = () => langSheet(() => go("me"));
    $("#snd").onclick = () => { S.sound = !S.sound; save(); vMe(); if (S.sound) Sound.tap(); };
    $("#pf").onclick = () => { S.platform = S.platform === "ps" ? "xbox" : "ps"; save(); vMe(); };
  }
  function langSheet(after) {
    const ov = $("#overlay"); ov.className = "overlay dim";
    ov.innerHTML = `<h2 class="t2" style="color:#fff">${t("me.language")}</h2><div class="actions">${Object.values(LANGS).map((l) => `<button class="btn ${l.code === L.code ? "sun" : "ghost"}" data-l="${l.code}">${l.name}</button>`).join("")}</div>`;
    $$("[data-l]", ov).forEach((b) => b.onclick = () => { S.lang = b.dataset.l; save(); setLang(S.lang); haptic("tick"); ov.className = "overlay hidden"; after(); });
  }

  // ---------- постер-скриншот переписки (1080×1920) ----------
  function wrapLines(ctx, text, maxW) { const w = String(text).split(" "); const out = []; let line = ""; for (const s of w) { const tt = line ? line + " " + s : s; if (ctx.measureText(tt).width > maxW && line) { out.push(line); line = s; } else line = tt; } if (line) out.push(line); return out; }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function loadImg(src) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im);
      im.onerror = () => { if (/\.webp/.test(im.src)) { const j = new Image(); j.onload = () => res(j); j.onerror = () => res(null); j.src = im.src.replace(".webp", ".jpg"); } else res(null); };
      im.src = src; });
  }
  // Постер для сторис: рука держит телефон на закате, на экране — переписка
  async function showPoster(m) {
    try { await document.fonts.ready; } catch (e) {}
    const W = 1080, H = 1935, SC = { x: 336, y: 620, w: 408, h: 888, r: 46 }; // экран телефона на фоне
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const bg = await loadImg(`assets/poster-phone.webp?v=${V}`);
    if (bg) x.drawImage(bg, 0, 0, W, H); else { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#5B2BE0"); g.addColorStop(1, "#FF8A4C"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    // заголовок в небе
    x.textAlign = "center"; x.shadowColor = "rgba(30,10,50,.45)"; x.shadowBlur = 24;
    x.fillStyle = "rgba(255,255,255,.92)"; x.font = "800 40px Unbounded"; x.fillText(t("app"), W / 2, 120);
    x.fillStyle = "#fff"; x.font = "800 78px Unbounded";
    const head = m ? t("poster.passed").split(" ") : [rankOf(S.points).cur.name.toUpperCase()];
    head.forEach((l, i) => x.fillText(l, W / 2, 255 + i * 92 - (head.length - 1) * 20));
    x.fillStyle = "#FFD36B"; x.font = "700 40px Manrope"; x.fillText("★".repeat(m ? m.st : 6), W / 2, 255 + head.length * 92 - (head.length - 1) * 20 + 4);
    x.shadowBlur = 0;
    // экран телефона
    x.save(); rr(x, SC.x - 4, SC.y - 4, SC.w + 8, SC.h + 8, SC.r); x.clip();
    const dark = root.dataset.theme === "dark";
    x.fillStyle = dark ? "#130B21" : "#FFF5EF"; x.fillRect(SC.x - 4, SC.y - 4, SC.w + 8, SC.h + 8);
    const P = 16, X0 = SC.x + P, CW = SC.w - P * 2, txt = dark ? "#F7EEFF" : "#1D1033", mut = dark ? "#A898C2" : "#7A6B8F", card = dark ? "#1F1533" : "#FFFFFF";
    let y = SC.y + 22;
    const circleImg = (im, cx, cy, r) => { if (!im) return; x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip(); x.drawImage(im, cx - r, cy - r, r * 2, r * 2); x.restore(); };
    x.textAlign = "left";
    if (m) {
      const tx_ = mtext(m), [av, cat, stk] = await Promise.all([loadImg(avImg(m.c)), loadImg(catImg(tx_.tp.cat)), loadImg(stickerImg(m.c, "win"))]);
      // шапка чата
      circleImg(av, X0 + 26, y + 26, 26);
      x.fillStyle = txt; x.font = "800 24px Manrope"; x.fillText(cName(m.c), X0 + 64, y + 22);
      x.fillStyle = mut; x.font = "600 18px Manrope"; x.fillText(cRole(m.c), X0 + 64, y + 46); y += 72;
      x.fillStyle = dark ? "rgba(255,255,255,.08)" : "rgba(29,16,51,.08)"; x.fillRect(SC.x, y, SC.w, 2); y += 18;
      // сообщение контакта
      const bub = (s, fill, color, alignRight) => { x.font = "600 21px Manrope"; const ls = wrapLines(x, s, CW - 70); const bw = Math.min(CW - 30, Math.max(...ls.map((l) => x.measureText(l).width)) + 34), bh = ls.length * 28 + 22;
        const bx = alignRight ? X0 + CW - bw : X0; x.fillStyle = fill; rr(x, bx, y, bw, bh, 18); x.fill(); x.fillStyle = color; ls.forEach((l, i) => x.fillText(l, bx + 17, y + 33 + i * 28)); y += bh + 10; };
      bub(tx_.intro[0], card, txt);
      // карточка миссии
      x.font = "800 27px Unbounded"; const tlN = Math.min(2, wrapLines(x, tx_.title, CW - 32).length); const cardH = 182 + tlN * 36 + 14 + tx_.steps.length * 30 + 22; x.fillStyle = card; rr(x, X0, y, CW, cardH, 22); x.fill();
      x.save(); rr(x, X0, y, CW, 150, 22); x.clip(); if (cat) x.drawImage(cat, X0, y - 20, CW, CW * cat.height / cat.width); x.restore();
      let yy = y + 182; x.fillStyle = "#FF6A3D"; x.font = "700 20px Manrope"; x.fillText("★".repeat(m.st), X0 + 16, yy);
      x.fillStyle = txt; x.font = "800 27px Unbounded"; wrapLines(x, tx_.title, CW - 32).slice(0, 2).forEach((l) => { yy += 36; x.fillText(l, X0 + 16, yy); });
      x.font = "700 18px Manrope"; yy += 14;
      tx_.steps.forEach((s) => { yy += 30; x.fillStyle = "#FF6A3D"; rr(x, X0 + 16, yy - 18, 22, 22, 6); x.fill(); x.fillStyle = "#fff"; x.font = "800 16px Manrope"; x.fillText("✓", X0 + 21, yy - 1);
        x.fillStyle = mut; x.font = "700 18px Manrope"; x.fillText(wrapLines(x, s, CW - 70)[0], X0 + 48, yy); });
      y += cardH + 12;
      bub(t("u.done"), "#FF4D8D", "#fff", true);
      bub(cLine(m.c, "win", m.seed), card, txt);
      if (stk) x.drawImage(stk, X0 + CW - 150, Math.min(y - 20, SC.y + SC.h - 160), 140, 140);
    } else {
      const r = rankOf(S.points), rk = await loadImg(rankImg(r.i));
      circleImg(rk, SC.x + SC.w / 2, SC.y + 230, 140);
      x.textAlign = "center"; x.fillStyle = txt; x.font = "800 36px Unbounded"; x.fillText(r.cur.name, SC.x + SC.w / 2, SC.y + 430);
      x.font = "700 24px Manrope"; x.fillStyle = mut;
      [`${S.points} · ${t("kpi.missions")}: ${S.done}`, `${t("kpi.best")}: ${S.bestStreak}`, `${t("col.sub", { a: S.played.length, b: M.templates.length })}`].forEach((l, i) => x.fillText(l, SC.x + SC.w / 2, SC.y + 490 + i * 40));
      const fl = await loadImg(stickerImg("flamingo", "2")); if (fl) x.drawImage(fl, SC.x + SC.w / 2 - 90, SC.y + 620, 180, 180);
    }
    x.restore();
    // призыв внизу
    x.textAlign = "center"; x.fillStyle = "rgba(255,255,255,.95)"; rr(x, 150, 1700, W - 300, 132, 66); x.fill();
    x.fillStyle = "#1D1033"; x.font = "800 42px Unbounded"; x.fillText(m ? t("poster.can") : t("poster.catch"), W / 2, 1760);
    x.font = "700 28px Manrope"; x.fillStyle = "#FF2E88"; x.fillText(`t.me/${CFG.BOT_USERNAME}`, W / 2, 1804);
    let url; try { url = c.toDataURL("image/jpeg", 0.92); } catch (e) { toast(t("poster.hold")); return; }
    const ov = $("#overlay"); ov.className = "overlay dim";
    ov.innerHTML = `<img src="${url}" alt=""><div class="resp-sub" style="opacity:.7;margin-top:12px">${t("poster.hold")}</div>
      <div class="actions"><button class="btn sun" id="ovShare">${ic("send")}${t("btn.share")}</button><button class="btn ghost" id="ovClose">${t("btn.close")}</button></div>`;
    $("#ovClose").onclick = () => { ov.className = "overlay hidden"; if (m) go("home"); };
    $("#ovShare").onclick = async () => {
      try { const blob = await (await fetch(url)).blob(), file = new File([blob], "random-city.jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) {}
      if (m) shareMission(m, "share.done"); else toast(t("poster.hold"));
    };
  }

  // =========================================================
  //  СТАРТ
  // =========================================================
  document.addEventListener("error", (e) => {
    const im = e.target; if (!(im instanceof HTMLImageElement)) return;
    if (/\.webp(\?|$)/.test(im.src)) { im.src = im.src.replace(".webp", ".jpg"); return; }
    im.classList.add("broken");
  }, true);
  function preloadImages() {
    const list = ["hero-couple.webp?v=" + V, ...["travel", "sport", "thrill", "love", "nature", "chill", "lux", "crime"].map((c) => `cats/${c}.webp?v=${V}`), ...RANK_AT.map((_, i) => `ranks/${i}.webp?v=${V}`), ...CONTACTS.map((c) => `contacts/${c}.webp?v=${V}`), "poster-phone.webp?v=" + V];
    list.forEach((src, k) => setTimeout(() => { const im = new Image(); im.src = "assets/" + src; }, 300 + k * 60));
  }
  function applyTheme() {
    const dark = inTelegram ? tg.colorScheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "dark" : "light";
    const bg = dark ? "#130B21" : "#FFF5EF";
    if (inTelegram) { try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (e) {} }
  }
  let pendingDuel = null;
  async function init() {
    if (inTelegram) {
      tg.ready(); tg.expand();
      try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (e) {}
      tg.onEvent && tg.onEvent("themeChanged", applyTheme);
      if (tg.BackButton) tg.BackButton.onClick(() => { if (!busy) go("home"); });
    } else window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
    applyTheme();
    root.dataset.diff = "2";
    const local = loadLocal(); if (local) S = local;
    const cloud = await loadCloud(); if (cloud && cloud.ts > S.ts) S = cloud;
    const valid = (m) => m && tplOf(m);
    if (S.pending && !valid(S.pending)) S.pending = null;
    if (S.active && !valid(S.active)) S.active = null;
    setLang(S.lang || detectLang());
    pendingDuel = readStartParam();
    if (!S.onb) go("onb");
    else if (pendingDuel) go("chat", startDuel());
    else go("home");
    preloadImages();
  }
  window.__rc = { generate, mtext, tplOf, dayKey, seedCode, setLang, t, get state() { return S; } };
  init();
})();
