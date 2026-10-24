// Cấp độ, kinh nghiệm, danh tiếng, kỹ năng, nâng cấp, mở rộng cơ sở và các hệ số thưởng tổng hợp.
import { UPGRADES, SKILLS, VENUES, REP_RANKS, LEVEL_TITLES, MAX_LEVEL } from '../data/upgrades.js';
import { emit, toast } from './bus.js';
import { spend } from './economy.js';

export const bump = (state, key, n = 1) => { state.stats[key] = (state.stats[key] || 0) + n; return state.stats[key]; };

export const xpForLevel = (level) => Math.round(60 + 38 * (level - 1) + 6 * (level - 1) ** 2);
export const maxStamina = (state) => 8 + Math.floor(state.level / 5);

export function levelTitle(level) {
  let t = LEVEL_TITLES[0][1];
  for (const [l, name] of LEVEL_TITLES) if (level >= l) t = name;
  return t;
}
export function repRank(rep) {
  let idx = 0;
  REP_RANKS.forEach(([min], i) => { if (rep >= min) idx = i; });
  const next = REP_RANKS[idx + 1];
  return { index: idx, name: REP_RANKS[idx][1], next: next ? next[0] : null, nextName: next ? next[1] : null, min: REP_RANKS[idx][0] };
}

export function addXp(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (!amount) return 0;
  state.xp += amount;
  bump(state, 'xp', amount);
  while (state.level < MAX_LEVEL && state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
    state.skillPoints += 1;
    state.stamina = Math.max(state.stamina, Math.min(maxStamina(state), state.stamina + 2));
    emit('levelup', { level: state.level, title: levelTitle(state.level) });
  }
  if (state.level >= MAX_LEVEL) state.xp = Math.min(state.xp, xpForLevel(MAX_LEVEL - 1));
  return amount;
}

export function addRep(state, amount) {
  const before = repRank(state.rep).index;
  state.rep = Math.min(100, Math.max(0, Math.round((state.rep + amount) * 10) / 10));
  if (amount > 0) bump(state, 'repGained', Math.round(amount));
  const after = repRank(state.rep);
  if (after.index > before) emit('rank', { name: after.name });
  return state.rep;
}

export const shopName = (state) => state.shopName || `Quán ${state.name}`;

// Thể lực hồi dần theo thời gian thực: 1 điểm mỗi STAMINA_SECS giây.
export const STAMINA_SECS = 150;
export function regenStamina(state, now = Date.now()) {
  const max = maxStamina(state);
  if (state.stamina >= max) { state.staminaAt = now; return 0; }
  if (!state.staminaAt || state.staminaAt > now) { state.staminaAt = now; return 0; }
  const n = Math.floor((now - state.staminaAt) / (STAMINA_SECS * 1000));
  if (n <= 0) return 0;
  const add = Math.min(n, max - state.stamina);
  state.stamina += add;
  state.staminaAt = state.stamina >= max ? now : state.staminaAt + n * STAMINA_SECS * 1000;
  return add;
}
export function spendStamina(state, n = 1, now = Date.now()) {
  regenStamina(state, now);
  if (state.stamina < n) return false;
  if (state.stamina >= maxStamina(state)) state.staminaAt = now;
  state.stamina -= n;
  return true;
}
export function staminaInfo(state, now = Date.now()) {
  const max = maxStamina(state);
  if (state.stamina >= max) return { cur: state.stamina, max, secs: 0, full: true };
  const left = STAMINA_SECS - Math.floor((now - (state.staminaAt || now)) / 1000);
  return { cur: state.stamina, max, secs: Math.max(0, Math.min(STAMINA_SECS, left)), full: false };
}

export function venueOf(state) { return VENUES[state.venue] || VENUES[0]; }

/** Tổng hợp mọi hệ số từ nâng cấp, kỹ năng, cơ sở. */
export function bonus(state) {
  const u = state.upgrades, k = state.skills, v = venueOf(state);
  return {
    heatZone: u.stove * 3 + k.lua * 2 + (u.assistant >= 2 ? 4 : 0),
    tapFactor: Math.max(0.4, 1 - 0.1 * u.tools - 0.08 * k.dao),
    seats: 3 + u.seats + (VENUES.slice(0, state.venue + 1).reduce((s, x) => s + x.seats, 0)),
    patienceMult: 1 + 0.08 * u.decor,
    repMult: 1 + 0.05 * u.decor + 0.03 * u.sign + VENUES.slice(0, state.venue + 1).reduce((s, x) => s + x.rep, 0),
    storageCap: 20 + 10 * u.storage,
    menuSlots: 4 + 2 * u.menu,
    customerBonus: u.sign + VENUES.slice(0, state.venue + 1).reduce((s, x) => s + x.customers, 0),
    assistant: u.assistant,
    wage: u.assistant ? UPGRADES.assistant.wage[u.assistant - 1] : 0,
    seasonBonus: 6 * k.vi,
    plateBonus: 5 * k.bay,
    tipMult: 1 + 0.08 * k.bay,
    venue: v,
  };
}

export function upgradeStatus(state, key) {
  const def = UPGRADES[key];
  const lvl = state.upgrades[key];
  if (lvl >= def.max) return { maxed: true, level: lvl };
  return { maxed: false, level: lvl, cost: def.cost[lvl], req: def.req[lvl], locked: state.level < def.req[lvl], affordable: state.cash >= def.cost[lvl] };
}

export function buyUpgrade(state, key) {
  const def = UPGRADES[key];
  if (!def) return { ok: false, reason: 'Nâng cấp không tồn tại.' };
  const st = upgradeStatus(state, key);
  if (st.maxed) return { ok: false, reason: 'Đã đạt cấp tối đa.' };
  if (st.locked) return { ok: false, reason: `Cần đạt cấp độ ${st.req}.` };
  if (state.cash < st.cost) return { ok: false, reason: 'Chưa đủ tiền.' };
  spend(state, st.cost, 'upgrade');
  state.upgrades[key] += 1;
  bump(state, 'upgrades');
  toast(`Đã nâng cấp ${def.name} lên cấp ${state.upgrades[key]}.`, 'good');
  emit('sfx', 'upgrade');
  return { ok: true, level: state.upgrades[key] };
}

export function venueStatus(state) {
  const next = VENUES[state.venue + 1];
  if (!next) return { maxed: true };
  return { maxed: false, next, locked: state.level < next.level, affordable: state.cash >= next.cost };
}
export function buyVenue(state) {
  const st = venueStatus(state);
  if (st.maxed) return { ok: false, reason: 'Đã là cơ sở lớn nhất.' };
  if (st.locked) return { ok: false, reason: `Cần đạt cấp độ ${st.next.level}.` };
  if (state.cash < st.next.cost) return { ok: false, reason: 'Chưa đủ tiền.' };
  spend(state, st.next.cost, 'upgrade');
  state.venue += 1;
  bump(state, 'venueUp');
  state.vip = Math.min(99, (state.vip || 0) + 1);
  toast(`Chúc mừng! Quán đã mở rộng thành "${st.next.name}".`, 'good');
  emit('sfx', 'levelup');
  return { ok: true };
}

export function upgradeSkill(state, key) {
  const def = SKILLS[key];
  if (!def) return { ok: false, reason: 'Kỹ năng không tồn tại.' };
  if (state.skills[key] >= def.max) return { ok: false, reason: 'Kỹ năng đã tối đa.' };
  if (state.skillPoints < 1) return { ok: false, reason: 'Hết điểm kỹ năng. Lên cấp để nhận thêm.' };
  state.skillPoints -= 1;
  state.skills[key] += 1;
  bump(state, 'skillUps');
  return { ok: true, level: state.skills[key] };
}
