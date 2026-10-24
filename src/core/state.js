// Trạng thái trung tâm của game: tạo mới và kiểm tra/sửa dữ liệu lưu. Mọi thay đổi kinh tế đều đi qua các module core.
import { INGREDIENTS, isItem } from '../data/ingredients.js';
import { DISH_BY_ID, START_DISHES } from '../data/dishes.js';
import { LOCATION_BY_ID } from '../data/locations.js';
import { UPGRADES, SKILLS, VENUES, MAX_LEVEL } from '../data/upgrades.js';

export const SAVE_VERSION = 1;
export const START_CASH = 400;

export function newState(name = 'Minh Anh') {
  const inv = {};
  for (const id of START_DISHES) {
    for (const [ing, q] of Object.entries(DISH_BY_ID[id].ingredients)) inv[ing] = (inv[ing] || 0) + q * 2;
  }
  return {
    v: SAVE_VERSION,
    name: String(name).trim().slice(0, 18) || 'Minh Anh',
    createdAt: Date.now(),
    savedAt: 0,
    day: 1,
    cash: START_CASH,
    level: 1,
    xp: 0,
    rep: 30,
    shopName: '',
    staminaAt: 0,
    reviews: [],
    certs: {},
    vip: 0,
    draw: null,
    skillPoints: 0,
    skills: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])),
    stamina: 8,
    inv,
    items: {},
    learned: Object.fromEntries(START_DISHES.map((id) => [id, true])),
    seen: Object.fromEntries(START_DISHES.map((id) => [id, true])),
    visited: { b1: true },
    regions: { bac: true },
    dishStats: {},
    menu: { ids: [...START_DISHES], mult: {} },
    upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])),
    venue: 0,
    quests: {},
    stats: {},
    achievements: {},
    collections: {},
    npc: {},
    gather: {},
    dialog: {},
    shift: null,
    report: null,
    ledger: null,
    daily: { day: 0, ids: [] },
    weekly: { week: 0, ids: [] },
    eventsDone: {},
    history: [],
    regulars: {},
    settings: { sound: true, motion: true, fx: true, tutorial: false, music: true, musicVol: 0.8, theme: 'cream', accent: '' },
    rescueDay: 0,
    rng: (Math.floor(Math.random() * 4294967295) + 1) >>> 0,
  };
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const num = (v, min, max, dflt) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : dflt);
const int = (v, min, max, dflt) => Math.floor(num(v, min, max, dflt));

function cleanMap(raw, validKey, min, max) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) if (validKey(k) && Number.isFinite(v)) out[k] = int(v, min, max, 0);
  return out;
}
function cleanFlags(raw, validKey) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) if (validKey(k) && v) out[k] = true;
  return out;
}

/** Kiểm tra và sửa dữ liệu lưu. Trả về state hợp lệ (đã vá các trường thiếu/sai), hoặc null nếu không thể cứu. */
export function validateState(raw) {
  if (!isObj(raw)) return null;
  if (!Number.isFinite(raw.v) || raw.v > SAVE_VERSION || raw.v < 1) return null;
  const d = newState(typeof raw.name === 'string' ? raw.name : undefined);
  const s = d;
  s.createdAt = num(raw.createdAt, 0, 8.64e15, d.createdAt);
  s.savedAt = num(raw.savedAt, 0, 8.64e15, 0);
  s.day = int(raw.day, 1, 100000, 1);
  s.cash = int(raw.cash, 0, 1e9, d.cash);
  s.level = int(raw.level, 1, MAX_LEVEL, 1);
  s.xp = int(raw.xp, 0, 1e9, 0);
  s.rep = int(raw.rep, 0, 100, 30);
  s.shopName = typeof raw.shopName === 'string' ? raw.shopName.trim().slice(0, 24) : '';
  s.staminaAt = num(raw.staminaAt, 0, 8.64e15, 0);
  s.vip = int(raw.vip, 0, 99, 0);
  s.certs = cleanFlags(raw.certs, (k) => /^c[1-6]$/.test(k));
  s.reviews = Array.isArray(raw.reviews) ? raw.reviews.filter(isObj).slice(-40).map((r) => ({ day: int(r.day, 0, 1e6, 0), name: String(r.name || 'Khách').slice(0, 24), dish: String(r.dish || '').slice(0, 40), rating: int(r.rating, 1, 5, 3), text: String(r.text || '').slice(0, 160), kind: String(r.kind || 'normal').slice(0, 10) })) : [];
  s.draw = null;
  if (isObj(raw.draw) && raw.draw.loc && LOCATION_BY_ID[raw.draw.loc]) {
    const n = int(raw.draw.n, 10, 20, 15), flipped = {};
    if (isObj(raw.draw.flipped)) {
      for (const [k, c] of Object.entries(raw.draw.flipped)) {
        const idx = Number(k);
        if (!(Number.isInteger(idx) && idx >= 0 && idx < n) || !isObj(c)) continue;
        flipped[idx] = { got: Array.isArray(c.got) ? c.got.filter((g) => isObj(g) && INGREDIENTS[g.id]).slice(0, 4).map((g) => ({ id: g.id, qty: int(g.qty, 1, 9, 1) })) : [], page: typeof c.page === 'string' && isItem(c.page) ? c.page : null, rare: Array.isArray(c.rare) ? c.rare.filter((r) => typeof r === 'string' && isItem(r)).slice(0, 2) : [] };
      }
    }
    if (Object.keys(flipped).length < n) s.draw = { loc: raw.draw.loc, n, flipped };
  }
  s.skillPoints = int(raw.skillPoints, 0, 99, 0);
  s.skills = Object.fromEntries(Object.entries(SKILLS).map(([k, def]) => [k, int(raw.skills?.[k], 0, def.max, 0)]));
  s.upgrades = Object.fromEntries(Object.entries(UPGRADES).map(([k, def]) => [k, int(raw.upgrades?.[k], 0, def.max, 0)]));
  s.venue = int(raw.venue, 0, VENUES.length - 1, 0);
  s.stamina = int(raw.stamina, 0, 99, d.stamina);
  s.inv = cleanMap(raw.inv, (k) => INGREDIENTS[k], 0, 999);
  s.items = cleanMap(raw.items, (k) => isItem(k), 0, 99);
  s.learned = cleanFlags(raw.learned, (k) => DISH_BY_ID[k]);
  for (const id of START_DISHES) s.learned[id] = true; // ba món khởi đầu luôn có
  s.seen = cleanFlags(raw.seen, (k) => DISH_BY_ID[k]);
  for (const id of Object.keys(s.learned)) s.seen[id] = true;
  s.visited = cleanFlags(raw.visited, (k) => LOCATION_BY_ID[k]);
  s.visited.b1 = true;
  s.regions = cleanFlags(raw.regions, (k) => ['bac', 'trung', 'nam'].includes(k));
  s.regions.bac = true;
  s.dishStats = {};
  if (isObj(raw.dishStats)) {
    for (const [k, v] of Object.entries(raw.dishStats)) {
      if (DISH_BY_ID[k] && isObj(v)) s.dishStats[k] = { cooked: int(v.cooked, 0, 1e7, 0), stars3: int(v.stars3, 0, 1e7, 0), sold: int(v.sold, 0, 1e7, 0), best: int(v.best, 0, 3, 0), mp: int(v.mp, 0, 1e7, 0), asc: Boolean(v.asc), hints: int(v.hints, 0, 1e6, 0), rev: int(v.rev, 0, 1e9, 0), cost: int(v.cost, 0, 1e9, 0) };
    }
  }
  const ids = Array.isArray(raw.menu?.ids) ? raw.menu.ids.filter((id) => s.learned[id]) : [];
  s.menu = { ids: [...new Set(ids)].slice(0, 30), mult: {} };
  if (!s.menu.ids.length) s.menu.ids = [...START_DISHES];
  if (isObj(raw.menu?.mult)) for (const [k, v] of Object.entries(raw.menu.mult)) if (s.learned[k] && Number.isFinite(v)) s.menu.mult[k] = num(v, 0.7, 1.4, 1);
  s.quests = {};
  if (isObj(raw.quests)) {
    for (const [k, v] of Object.entries(raw.quests)) {
      if (isObj(v) && ['active', 'done', 'claimed'].includes(v.status)) {
        const q = { status: v.status, base: num(v.base, 0, 1e9, 0), day: int(v.day, 0, 1e6, 0) };
        const dflt = v.def;
        if (isObj(dflt) && typeof dflt.title === 'string' && isObj(dflt.cond) && Number.isFinite(dflt.cond.n) && isObj(dflt.reward)) q.def = dflt;
        s.quests[k] = q;
      }
    }
  }
  s.stats = cleanMap(raw.stats, () => true, 0, 1e12);
  s.achievements = cleanFlags(raw.achievements, () => true);
  s.collections = cleanFlags(raw.collections, () => true);
  s.dialog = cleanFlags(raw.dialog, () => true);
  s.npc = {};
  if (isObj(raw.npc)) for (const [k, v] of Object.entries(raw.npc)) if (isObj(v)) s.npc[k] = { talked: int(v.talked, 0, 1e6, 0), friend: int(v.friend, 0, 3, 0) };
  s.gather = {};
  if (isObj(raw.gather)) for (const [k, v] of Object.entries(raw.gather)) if (LOCATION_BY_ID[k] && isObj(v)) s.gather[k] = { count: int(v.count, 0, 1e6, 0), pity: int(v.pity, 0, 99, 0), pr: int(v.pr, 0, 99, 0), pq: int(v.pq, 0, 99, 0) };
  s.eventsDone = cleanFlags(raw.eventsDone, () => true);
  s.regulars = cleanMap(raw.regulars, () => true, 0, 1e6);
  s.daily = { day: int(raw.daily?.day, 0, 1e6, 0), ids: Array.isArray(raw.daily?.ids) ? raw.daily.ids.filter((x) => typeof x === 'string').slice(0, 6) : [] };
  s.weekly = { week: int(raw.weekly?.week, 0, 1e6, 0), ids: Array.isArray(raw.weekly?.ids) ? raw.weekly.ids.filter((x) => typeof x === 'string').slice(0, 6) : [] };
  s.history = Array.isArray(raw.history)
    ? raw.history.filter(isObj).slice(-30).map((h) => ({ day: int(h.day, 0, 1e6, 0), revenue: int(h.revenue, 0, 1e9, 0), cost: int(h.cost, 0, 1e9, 0), profit: int(h.profit, -1e9, 1e9, 0), served: int(h.served, 0, 1e6, 0), lost: int(h.lost, 0, 1e6, 0) }))
    : [];
  s.settings = {
    sound: raw.settings?.sound !== false, motion: raw.settings?.motion !== false,
    fx: raw.settings?.fx !== false, tutorial: Boolean(raw.settings?.tutorial),
    music: raw.settings?.music !== false, musicVol: num(raw.settings?.musicVol, 0, 1, 0.5),
    theme: ['cream', 'night', 'fresh', 'rose'].includes(raw.settings?.theme) ? raw.settings.theme : 'cream',
    accent: typeof raw.settings?.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.settings.accent) ? raw.settings.accent : '',
  };
  s.rescueDay = int(raw.rescueDay, 0, 1e6, 0);
  s.rng = Number.isFinite(raw.rng) ? raw.rng >>> 0 : d.rng;
  s.report = isObj(raw.report) ? raw.report : null;
  s.ledger = isObj(raw.ledger) && isObj(raw.ledger.inc) && isObj(raw.ledger.exp) ? raw.ledger : null;
  s.shift = null;
  if (isObj(raw.shift) && Array.isArray(raw.shift.customers)) {
    const sh = raw.shift;
    const custs = sh.customers.filter((c) => isObj(c) && DISH_BY_ID[c.dish] && typeof c.id === "string").slice(0, 60);
    s.shift = {
      day: int(sh.day, 1, 1e6, s.day), total: int(sh.total, 0, 500, 0), arrived: int(sh.arrived, 0, 500, custs.length), resolved: int(sh.resolved, 0, 40, 0),
      nextIn: num(sh.nextIn, 0, 600, 3), nextAt: num(sh.nextAt, 0, 5000, 0), t: num(sh.t, 0, 5000, 0), dayLen: num(sh.dayLen, 60, 5000, 200), closed: Boolean(sh.closed), arr: Array.isArray(sh.arr) ? sh.arr.filter((x) => Number.isFinite(x)).slice(0, 40) : [], revenue: int(sh.revenue, 0, 1e9, 0), tips: int(sh.tips, 0, 1e9, 0), served: int(sh.served, 0, 1e4, 0),
      lost: int(sh.lost, 0, 1e4, 0), rep: int(sh.rep, -1e5, 1e5, 0), xp: int(sh.xp, 0, 1e7, 0), startCash: int(sh.startCash, 0, 1e9, s.cash),
      cogs: int(sh.cogs, 0, 1e9, 0), festival: typeof sh.festival === 'string' ? sh.festival : null,
      criticDone: Boolean(sh.criticDone), judgeDone: Boolean(sh.judgeDone), ratingSum: int(sh.ratingSum, 0, 1e6, 0), ratingN: int(sh.ratingN, 0, 1e5, 0), reviews: Array.isArray(sh.reviews) ? sh.reviews.filter(isObj).slice(-12) : [], certs: Array.isArray(sh.certs) ? sh.certs.filter((x) => typeof x === 'string').slice(0, 6) : [], seq: int(sh.seq, 0, 1e6, custs.length),
      customers: custs.map((c) => ({
        id: c.id, kind: ['normal', 'hurry', 'regular', 'critic', 'tourist', 'judge'].includes(c.kind) ? c.kind : 'normal', name: String(c.name || 'Khách').slice(0, 24), look: isObj(c.look) ? c.look : {},
        dish: c.dish, spice: int(c.spice, 0, 2, 1), taste: isObj(c.taste) ? Object.fromEntries(['salt', 'sweet', 'sour', 'spice'].map((k) => [k, int(c.taste[k], 0, 2, 1)])) : null, extra: Boolean(c.extra),
        status: ['waiting', 'ordered', 'ready'].includes(c.status) ? c.status : 'waiting',
        patience: num(c.patience, 0, 600, 40), maxPatience: num(c.maxPatience, 1, 600, 60),
        need: int(c.need, 0, 3, 0), certIdx: int(c.certIdx, 0, 5, 0), stars: int(c.stars, 0, 3, 0), cost: int(c.cost, 0, 1e6, 0), score: int(c.score, 0, 100, 0), cooked: Boolean(c.cooked),
        prep: isObj(c.prep) && ['none', 'doing', 'done'].includes(c.prep.state) ? { state: c.prep.state, left: num(c.prep.left, 0, 60, 0), score: int(c.prep.score, 0, 100, 0) } : { state: 'none', left: 0, score: 0 },
      })),
    };
  }
  if (s.shift) { const sh = s.shift; for (let i = sh.arr.length; i < sh.total; i++) sh.arr.push(Math.round((sh.t + 3 * (i - sh.arrived + 1)) * 10) / 10); }
  return s;
}
