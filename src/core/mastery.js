// Cấp thông thạo của từng món (1 đến 5). Cấp 1-4 lên bằng điểm tích lũy khi phục vụ; cấp 5 (Thực Thần) cần đủ điểm VÀ nguyên liệu thăng hoa đi săn.
import { RARE_BY_LOC, RARE_BY_REGION, RARE_ITEMS, itemName } from '../data/ingredients.js';
import { DISH_BY_ID } from '../data/dishes.js';
import { bump } from './progression.js';
import { toast, emit } from './bus.js';

export const MASTERY_MAX = 5;
/** Điểm tích lũy tối thiểu cho cấp 1, 2, 3, 4 và điều kiện điểm để thăng cấp 5. */
export const MASTERY_POINTS = [0, 18, 54, 126, 260];
export const MASTERY_MULT = [1, 1.04, 1.08, 1.13, 1.25];
export const MASTERY_NAMES = ['', 'Mới học', 'Quen tay', 'Thành thạo', 'Tinh thông', 'THỰC THẦN'];
/** Điểm cộng mỗi lần phục vụ theo số sao (nấu thử không có điểm). */
export const SERVE_POINTS = [0, 1, 2, 4];
export const ASCEND_NEED = { hiem: 2, quy: 1 };

const entry = (state, id) => (state.dishStats[id] ||= { cooked: 0, stars3: 0, sold: 0, best: 0 });

export function levelFromPoints(mp) {
  let lv = 1;
  for (let i = 1; i <= 3; i++) if (mp >= MASTERY_POINTS[i]) lv = i + 1;
  return lv;
}
export function masteryOf(state, id) {
  const e = state.dishStats[id] || {};
  const mp = e.mp || 0;
  const asc = Boolean(e.asc);
  const level = asc ? 5 : levelFromPoints(mp);
  const next = asc ? null : level < 4 ? MASTERY_POINTS[level] : MASTERY_POINTS[4];
  const base = asc ? MASTERY_POINTS[4] : MASTERY_POINTS[level - 1];
  return { level, mp, asc, next, pct: asc ? 100 : Math.min(100, Math.round(((mp - base) / (next - base)) * 100)), ready: !asc && level === 4 && mp >= MASTERY_POINTS[4] };
}
export const levelMult = (state, id) => MASTERY_MULT[masteryOf(state, id).level - 1];

export function addMastery(state, dish, stars) {
  const gain = SERVE_POINTS[stars] || 0;
  if (!gain) return { gain: 0 };
  const e = entry(state, dish.id);
  const before = masteryOf(state, dish.id).level;
  e.mp = (e.mp || 0) + gain;
  const after = masteryOf(state, dish.id);
  if (after.level > before) {
    toast(`${dish.name} lên cấp ${after.level}: ${MASTERY_NAMES[after.level]}!`, 'good');
    emit('sfx', 'upgrade');
  } else if (after.ready && before === 4 && e.mp - gain < MASTERY_POINTS[4]) {
    toast(`${dish.name} đã đủ điểm lên THỰC THẦN. Hãy đi săn nguyên liệu thăng hoa!`, 'good');
  }
  return { gain, level: after.level };
}

export function ascendNeeds(dish) {
  return [
    { id: RARE_BY_LOC[dish.loc], qty: ASCEND_NEED.hiem },
    { id: RARE_BY_REGION[dish.region], qty: ASCEND_NEED.quy },
  ].map((n) => ({ ...n, name: itemName(n.id), rarity: RARE_ITEMS[n.id].rarity }));
}
export function ascendStatus(state, dish) {
  const m = masteryOf(state, dish.id);
  if (!state.learned[dish.id]) return { ok: false, reason: 'Bạn chưa học món này.', m };
  if (m.asc) return { ok: false, done: true, reason: 'Món đã đạt THỰC THẦN.', m };
  const needs = ascendNeeds(dish).map((n) => ({ ...n, have: state.items[n.id] || 0 }));
  if (m.level < 4) return { ok: false, reason: 'Cần đạt cấp 4 trước.', m, needs };
  if (m.mp < MASTERY_POINTS[4]) return { ok: false, reason: `Cần ${MASTERY_POINTS[4]} điểm tích lũy (đang có ${m.mp}).`, m, needs };
  if (needs.some((n) => n.have < n.qty)) return { ok: false, reason: 'Chưa đủ nguyên liệu thăng hoa. Hãy đi thu thập.', m, needs };
  return { ok: true, m, needs };
}
export function ascend(state, id) {
  const dish = DISH_BY_ID[id];
  if (!dish) return { ok: false, reason: 'Món không tồn tại.' };
  const st = ascendStatus(state, dish);
  if (!st.ok) return { ok: false, reason: st.reason };
  state.vip = Math.min(99, (state.vip || 0) + 1);
  entry(state, id).asc = true; // đặt cờ trước khi trừ vật phẩm
  for (const n of st.needs) state.items[n.id] -= n.qty;
  bump(state, 'ascended');
  toast(`${dish.name} đạt THỰC THẦN! Giá bán tăng và món được đóng khung vàng.`, 'good');
  emit('sfx', 'levelup');
  return { ok: true };
}
