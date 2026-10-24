// Nhiệm vụ (chính, ngày, tuần), thành tựu, bộ sưu tập và lễ hội. Phần thưởng chỉ nhận được đúng một lần.
import { vnd } from './fmt.js';
import { MAIN_QUESTS, DAILY_TEMPLATES, WEEKLY_TEMPLATES, ACHIEVEMENTS, FESTIVALS, FESTIVAL_CYCLE } from '../data/quests.js';
import { DISHES, DISH_BY_ID, CATEGORIES } from '../data/dishes.js';
import { LOCATIONS } from '../data/locations.js';
import { REGION_ORDER } from '../data/locations.js';
import { addXp, addRep, bump } from './progression.js';
import { earn, gain, gainItem } from './economy.js';
import { toast, emit } from './bus.js';
import { weightedPick, shuffle } from './rng.js';
import { INGREDIENTS } from '../data/ingredients.js';

const REG_DISHES = DISHES.filter((d) => !d.secret);

export function valueOf(state, key) {
  const learned = Object.keys(state.learned);
  switch (key) {
    case 'level': return state.level;
    case 'rep': return state.rep;
    case 'cash': return state.cash;
    case 'day': return state.day;
    case 'learnedCount': return learned.length;
    case 'learnedRegular': return learned.filter((id) => !DISH_BY_ID[id].secret).length;
    case 'learnedTrung': return learned.filter((id) => DISH_BY_ID[id].region === 'trung' && !DISH_BY_ID[id].secret).length;
    case 'learnedNam': return learned.filter((id) => DISH_BY_ID[id].region === 'nam' && !DISH_BY_ID[id].secret).length;
    case 'cookedCount': return Object.values(state.dishStats).filter((s) => s.cooked > 0).length;
    case 'visitedCount': return Object.keys(state.visited).length;
    case 'visitedBac': return LOCATIONS.filter((l) => l.region === 'bac' && state.visited[l.id]).length;
    case 'visitedTrung': return LOCATIONS.filter((l) => l.region === 'trung' && state.visited[l.id]).length;
    case 'visitedNam': return LOCATIONS.filter((l) => l.region === 'nam' && state.visited[l.id]).length;
    case 'friendsDone': return Object.values(state.npc).reduce((s, n) => s + n.friend, 0);
    case 'friendsFull': return Object.values(state.npc).filter((n) => n.friend >= 3).length;
    case 'regionTrung': return state.regions.trung ? 1 : 0;
    case 'regionNam': return state.regions.nam ? 1 : 0;
    case 'ascendedCount': return Object.values(state.dishStats).filter((s) => s.asc).length;
    case 'secretsFound': return learned.filter((id) => DISH_BY_ID[id].secret).length;
    case 'collectionsFull': return collections(state).filter((c) => c.done === c.total && c.total > 0).length;
    default: return 0;
  }
}

function condProgress(state, cond, base = 0) {
  const cur = cond.v ? valueOf(state, cond.v) : (state.stats[cond.k] || 0) - base;
  return Math.max(0, Math.min(cond.n, cur));
}

// XP thưởng từ nhiệm vụ/thành tựu/quà chỉ bằng một phần để việc nấu và bán hàng vẫn là nguồn tiến cấp chính.
export const XP_SCALE = 0.35;
export const scaledXp = (n) => (n > 0 ? Math.max(1, Math.round(n * XP_SCALE)) : 0);

/** Mô tả phần thưởng cho giao diện (khớp chính xác với số nhận thật). */
export function describeReward(reward = {}) {
  const parts = [];
  if (reward.money) parts.push(vnd(reward.money));
  if (reward.xp) parts.push(`${scaledXp(reward.xp)} XP`);
  if (reward.rep) parts.push(`${reward.rep} danh tiếng`);
  for (const [id, q] of Object.entries(reward.items || {})) if (INGREDIENTS[id]) parts.push(`${q} ${INGREDIENTS[id].name}`);
  return parts.join(' · ');
}

export function applyReward(state, reward = {}) {
  const parts = [];
  if (reward.money) { earn(state, reward.money, 'questMoney'); parts.push(`+${vnd(reward.money)}`); }
  if (reward.xp) { const x = scaledXp(reward.xp); addXp(state, x); parts.push(`+${x} XP`); }
  if (reward.rep) { addRep(state, reward.rep); parts.push(`+${reward.rep} danh tiếng`); }
  for (const [id, q] of Object.entries(reward.items || {})) {
    if (INGREDIENTS[id]) { const n = gain(state, id, q); if (n) parts.push(`+${n} ${INGREDIENTS[id].name}`); }
  }
  return parts.join(', ');
}

// ---------- Nhiệm vụ ----------
const mainById = Object.fromEntries(MAIN_QUESTS.map((q) => [q.id, q]));

export function questDef(state, id) {
  return mainById[id] || state.quests[id]?.def || null;
}

/** Kích hoạt nhiệm vụ chính kế tiếp và tạo nhiệm vụ ngày/tuần khi sang ngày/tuần mới. */
export function ensureQuests(state) {
  for (let i = 0; i < MAIN_QUESTS.length; i++) {
    const q = MAIN_QUESTS[i];
    if (state.quests[q.id]) continue;
    const prev = MAIN_QUESTS[i - 1];
    if (!prev || state.quests[prev.id]?.status === 'claimed') {
      state.quests[q.id] = { status: 'active', base: q.cond.k ? state.stats[q.cond.k] || 0 : 0, day: state.day };
    }
    break;
  }
  if (state.daily.day !== state.day) generateDaily(state);
  const week = Math.floor((state.day - 1) / 7) + 1;
  if (state.weekly.week !== week) generateWeekly(state, week);
}

function makeDynamic(state, id, tpl, cond, scale, kind) {
  const n = cond.n;
  const reward = kind === 'daily'
    ? { money: Math.round(40 + state.level * 6 + n * 2), xp: 20 + state.level * 3, rep: 0 }
    : { money: Math.round(260 + state.level * 40), xp: 120 + state.level * 8, rep: 3, items: scale };
  state.quests[id] = {
    status: 'active', base: cond.k ? state.stats[cond.k] || 0 : 0, day: state.day,
    def: { id, kind, title: tpl.title(n), desc: kind === 'daily' ? 'Nhiệm vụ trong ngày.' : 'Nhiệm vụ trong tuần.', cond, reward },
  };
}

function generateDaily(state) {
  for (const id of state.daily.ids) { if (state.quests[id] && state.quests[id].status !== 'done') delete state.quests[id]; }
  state.daily = { day: state.day, ids: state.daily.ids.filter((id) => state.quests[id]) };
  const pool = DAILY_TEMPLATES.map((t) => [t, t.weight]);
  const chosen = [];
  while (chosen.length < 3 && pool.length) {
    const t = weightedPick(state, pool);
    chosen.push(t);
    pool.splice(pool.findIndex((e) => e[0] === t), 1);
  }
  for (const tpl of chosen) {
    const id = `d${state.day}-${tpl.id}`;
    if (state.quests[id]) continue;
    makeDynamic(state, id, tpl, tpl.cond(state.level), null, 'daily');
    state.daily.ids.push(id);
  }
}
function generateWeekly(state, week) {
  for (const id of state.weekly.ids) { if (state.quests[id] && state.quests[id].status !== 'done') delete state.quests[id]; }
  state.weekly = { week, ids: state.weekly.ids.filter((id) => state.quests[id]) };
  const tpls = shuffle(state, WEEKLY_TEMPLATES).slice(0, 2);
  for (const tpl of tpls) {
    const id = `w${week}-${tpl.id}`;
    if (state.quests[id]) continue;
    makeDynamic(state, id, tpl, tpl.cond(state.level), { 'nuoc-dung': 4, 'thit-bo': 3 }, 'weekly');
    state.weekly.ids.push(id);
  }
}

export function questProgress(state, id) {
  const q = state.quests[id], def = questDef(state, id);
  if (!q || !def) return null;
  const cur = q.status === 'active' ? condProgress(state, def.cond, q.base) : def.cond.n;
  return { cur, n: def.cond.n, pct: Math.floor((cur / def.cond.n) * 100) };
}

/** Gọi sau mỗi hành động: đánh dấu nhiệm vụ đã đủ điều kiện, mở thành tựu, và kích hoạt nhiệm vụ kế tiếp. */
export function refreshQuests(state) {
  ensureQuests(state);
  for (const [id, q] of Object.entries(state.quests)) {
    if (q.status !== 'active') continue;
    const def = questDef(state, id);
    if (!def) { delete state.quests[id]; continue; }
    if (condProgress(state, def.cond, q.base) >= def.cond.n) {
      q.status = 'done';
      toast(`Nhiệm vụ hoàn thành: ${def.title}`, 'good');
      emit('sfx', 'quest');
    }
  }
  checkAchievements(state);
}

export function claimQuest(state, id) {
  const q = state.quests[id], def = questDef(state, id);
  if (!q || !def) return { ok: false, reason: 'Không tìm thấy nhiệm vụ.' };
  if (q.status === 'claimed') return { ok: false, reason: 'Đã nhận thưởng rồi.' };
  if (q.status !== 'done') return { ok: false, reason: 'Chưa hoàn thành nhiệm vụ.' };
  q.status = 'claimed'; // đặt cờ trước khi phát thưởng để không thể nhận hai lần
  const text = applyReward(state, def.reward);
  bump(state, 'questsClaimed');
  if (def.unlocks) unlockRegion(state, def.unlocks);
  toast(`Nhận thưởng: ${text}`, 'good');
  emit('sfx', 'coin');
  refreshQuests(state);
  return { ok: true, text };
}

export function unlockRegion(state, region) {
  if (state.regions[region]) return;
  state.regions[region] = true;
  state.vip = Math.min(99, (state.vip || 0) + 1); // mở miền mới: khách đặc biệt ghé thăm
  emit('region', { region });
}

// ---------- Thành tựu ----------
export function checkAchievements(state) {
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if (condProgress(state, a.cond, 0) >= a.cond.n) {
      state.achievements[a.id] = true;
      const text = applyReward(state, a.reward);
      toast(`Thành tựu: ${a.name}${text ? ' (' + text + ')' : ''}`, 'good');
      emit('achievement', a);
    }
  }
}

// ---------- Bộ sưu tập ----------
export function collections(state) {
  const list = [];
  for (const r of REGION_ORDER) {
    const ds = REG_DISHES.filter((d) => d.region === r);
    list.push({ id: `reg-${r}`, kind: 'region', key: r, total: ds.length, done: ds.filter((d) => state.dishStats[d.id]?.cooked > 0).length });
  }
  for (const c of Object.keys(CATEGORIES)) {
    const ds = REG_DISHES.filter((d) => d.cat === c);
    list.push({ id: `cat-${c}`, kind: 'cat', key: c, total: ds.length, done: ds.filter((d) => state.dishStats[d.id]?.cooked > 0).length });
  }
  return list;
}
export const COLLECTION_MILESTONES = [
  { pct: 0.25, reward: { money: 150, xp: 60 } },
  { pct: 0.5, reward: { money: 400, xp: 150 } },
  { pct: 1, reward: { money: 1200, xp: 400, rep: 5 } },
];
export function milestoneState(state, c) {
  return COLLECTION_MILESTONES.map((m) => {
    const need = Math.ceil(c.total * m.pct);
    const key = `${c.id}:${m.pct}`;
    return { ...m, need, key, reached: c.done >= need, claimed: Boolean(state.collections[key]) };
  });
}
export function claimCollection(state, key) {
  const [cid, pct] = key.split(':');
  const c = collections(state).find((x) => x.id === cid);
  const m = COLLECTION_MILESTONES.find((x) => String(x.pct) === pct);
  if (!c || !m) return { ok: false, reason: 'Mốc thưởng không tồn tại.' };
  const ms = milestoneState(state, c).find((x) => x.key === key);
  if (state.collections[key]) return { ok: false, reason: 'Đã nhận mốc này rồi.' };
  if (!ms.reached) return { ok: false, reason: 'Chưa đạt mốc.' };
  state.collections[key] = true;
  const text = applyReward(state, m.reward);
  toast(`Mốc bộ sưu tập: ${text}`, 'good');
  emit('sfx', 'coin');
  refreshQuests(state);
  return { ok: true, text };
}

// ---------- Lễ hội ----------
export const cycleDay = (day) => ((day - 1) % FESTIVAL_CYCLE) + 1;
export function festivalOn(day) {
  const cd = cycleDay(day), cycle = Math.floor((day - 1) / FESTIVAL_CYCLE);
  for (const f of FESTIVALS) {
    if (cd >= f.start && cd < f.start + f.len) return { f, cycle, key: `${f.id}:${cycle}`, daysLeft: f.start + f.len - cd };
  }
  return null;
}
export function festivalNext(day) {
  const cd = cycleDay(day);
  let best = null;
  for (const f of FESTIVALS) {
    let wait = f.start - cd;
    if (wait <= 0) wait += FESTIVAL_CYCLE;
    if (!best || wait < best.wait) best = { f, wait };
  }
  return best;
}
export const festivalMatches = (f, dish) => f.cats.includes(dish.cat) || f.regions.includes(dish.region);

export function eventStatKey(key) { return `evt:${key}`; }
export function eventProgress(state, day = state.day) {
  const cur = festivalOn(day);
  if (!cur) return null;
  const n = state.stats[eventStatKey(cur.key)] || 0;
  return { ...cur, n: Math.min(n, cur.f.goal), goal: cur.f.goal, done: n >= cur.f.goal, claimed: Boolean(state.eventsDone[cur.key]) };
}
export function claimEvent(state) {
  const p = eventProgress(state);
  if (!p) return { ok: false, reason: 'Hiện không có lễ hội.' };
  if (state.eventsDone[p.key]) return { ok: false, reason: 'Đã nhận thưởng lễ hội này.' };
  if (!p.done) return { ok: false, reason: 'Chưa hoàn thành mục tiêu lễ hội.' };
  state.eventsDone[p.key] = true;
  const text = applyReward(state, p.f.reward);
  toast(`Thưởng lễ hội: ${text}`, 'good');
  emit('sfx', 'coin');
  return { ok: true, text };
}
