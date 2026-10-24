// Tiền, kho nguyên liệu, mua bán, cứu trợ khi kẹt vốn. Mọi thay đổi tiền/kho của game đều đi qua đây.
import { vnd } from './fmt.js';
import { INGREDIENTS, isItem } from '../data/ingredients.js';
import { DISH_BY_ID } from '../data/dishes.js';
import { bonus, bump } from './progression.js';
import { toast, emit } from './bus.js';

/** kind='sale': doanh thu bán món (tính vào thống kê 'earn'); loại khác (thưởng...) chỉ cộng tiền. */
/** Sổ thu chi trong ngày (tự reset khi sang ngày mới). inc: sale/tips/reward; exp: ingredients/hint/fare/learn/upgrade/wage/other. */
export function ledgerOf(state) {
  if (!state.ledger || state.ledger.day !== state.day) state.ledger = { day: state.day, startCash: state.cash, inc: {}, exp: {} };
  return state.ledger;
}
export function earn(state, amount, kind = 'sale') {
  amount = Math.round(amount);
  if (amount <= 0) return 0;
  const lg = ledgerOf(state);
  const cat = kind === 'sale' ? 'sale' : kind === 'tips' ? 'tips' : 'reward';
  lg.inc[cat] = (lg.inc[cat] || 0) + amount;
  state.cash += amount;
  bump(state, kind === 'sale' ? 'earn' : kind, amount);
  return amount;
}
export function spend(state, amount, why = 'other') {
  amount = Math.round(amount);
  if (amount < 0 || state.cash < amount) return false;
  const lg = ledgerOf(state);
  lg.exp[why] = (lg.exp[why] || 0) + amount;
  state.cash -= amount;
  bump(state, 'spent', amount);
  return true;
}

export function ingredientPrice(id) {
  const ing = INGREDIENTS[id];
  if (!ing) return 0;
  return ing.avail === 'base' || ing.avail === 'hiem' ? ing.price : Math.ceil(ing.price * 1.15);
}
export function isBuyable(state, id) {
  const ing = INGREDIENTS[id];
  if (!ing || ing.avail === 'hiem') return false;
  return ing.avail === 'base' || Boolean(state.regions[ing.avail]);
}
export const stock = (state, id) => state.inv[id] || 0;
export const storageCap = (state) => bonus(state).storageCap;

/** Thêm vào kho, bị giới hạn bởi sức chứa. Trả về số thực sự thêm được. */
export function gain(state, id, qty) {
  qty = Math.floor(qty);
  if (qty <= 0 || !INGREDIENTS[id]) return 0;
  const room = Math.max(0, storageCap(state) - stock(state, id));
  const added = Math.min(room, qty);
  if (added > 0) state.inv[id] = stock(state, id) + added;
  return added;
}
export function gainItem(state, id, qty) {
  if (!isItem(id)) return 0;
  state.items[id] = (state.items[id] || 0) + qty;
  return qty;
}

export function buy(state, id, qty = 1) {
  qty = Math.floor(qty);
  if (!(qty >= 1)) return { ok: false, reason: 'Số lượng không hợp lệ.' };
  if (!isBuyable(state, id)) return { ok: false, reason: 'Nguyên liệu này chưa có ở chợ.' };
  const room = storageCap(state) - stock(state, id);
  if (room <= 0) return { ok: false, reason: 'Kho đã đầy nguyên liệu này. Hãy nâng cấp Kho lạnh.' };
  qty = Math.min(qty, room);
  const cost = ingredientPrice(id) * qty;
  if (state.cash < cost) return { ok: false, reason: 'Chưa đủ tiền.' };
  spend(state, cost, 'ingredients');
  state.inv[id] = stock(state, id) + qty;
  bump(state, 'bought', qty);
  bump(state, 'buyActions');
  emit('sfx', 'coin');
  return { ok: true, qty, cost };
}

/** Tổng tiền của một giỏ hàng {id: số phần}. */
export function cartTotal(cart) {
  return Object.entries(cart).reduce((s, [id, q]) => s + ingredientPrice(id) * q, 0);
}
/** Thanh toán cả giỏ một lần: kiểm tra hết rồi mới trừ tiền (hoặc không mua gì cả). */
export function buyCart(state, cart) {
  const items = Object.entries(cart).filter(([, q]) => q > 0);
  if (!items.length) return { ok: false, reason: 'Giỏ hàng đang trống.' };
  for (const [id, q] of items) {
    if (!isBuyable(state, id)) return { ok: false, reason: 'Có nguyên liệu chưa bán ở chợ.' };
    if (q > storageCap(state) - stock(state, id)) return { ok: false, reason: 'Kho không đủ chỗ cho giỏ hàng này.' };
  }
  const cost = cartTotal(Object.fromEntries(items));
  if (cost > state.cash) return { ok: false, reason: 'Giỏ hàng vượt quá số tiền đang có.' };
  let n = 0;
  for (const [id, q] of items) { spend(state, ingredientPrice(id) * q, 'ingredients'); state.inv[id] = stock(state, id) + q; n += q; }
  bump(state, 'bought', n);
  bump(state, 'buyActions');
  emit('sfx', 'coin');
  return { ok: true, n, cost };
}

/** Nguyên liệu cần cho một đơn (gồm topping thêm nếu có). */
export function needFor(dish, extraIng = null) {
  const need = { ...dish.ingredients };
  if (extraIng) need[extraIng] = (need[extraIng] || 0) + 1;
  return need;
}
export function shortage(state, need) {
  const out = {};
  for (const [id, q] of Object.entries(need)) {
    const miss = q - stock(state, id);
    if (miss > 0) out[id] = miss;
  }
  return out;
}
export const hasAll = (state, need) => Object.keys(shortage(state, need)).length === 0;
export function consume(state, need) {
  if (!hasAll(state, need)) return false;
  for (const [id, q] of Object.entries(need)) state.inv[id] = stock(state, id) - q;
  return true;
}
export function shortageCost(state, need) {
  let cost = 0, buyable = true;
  for (const [id, q] of Object.entries(shortage(state, need))) {
    if (!isBuyable(state, id)) buyable = false;
    cost += ingredientPrice(id) * q;
  }
  return { cost, buyable };
}
/** Mua nhanh tất cả phần còn thiếu của một công thức. */
export function quickBuy(state, need) {
  const { cost, buyable } = shortageCost(state, need);
  if (!buyable) return { ok: false, reason: 'Có nguyên liệu hiếm chỉ kiếm được khi khám phá.' };
  if (cost > state.cash) return { ok: false, reason: `Cần thêm ${vnd(cost - state.cash)} để mua đủ nguyên liệu.` };
  for (const [id, q] of Object.entries(shortage(state, need))) {
    const r = buy(state, id, q);
    if (!r.ok) return r;
  }
  return { ok: true, cost };
}

export function dishCostNow(dish) {
  return Object.entries(dish.ingredients).reduce((s, [id, q]) => s + ingredientPrice(id) * q, 0);
}

/** Cứu trợ: nếu không thể nấu món nào và không đủ tiền mua nguyên liệu rẻ nhất, tặng ít tiền chợ (tối đa 1 lần/ngày). */
export function rescueIfStuck(state) {
  if (state.rescueDay === state.day) return 0;
  const menu = state.menu.ids.map((id) => DISH_BY_ID[id]).filter(Boolean);
  if (!menu.length) return 0;
  if (menu.some((d) => hasAll(state, d.ingredients))) return 0;
  const cheapest = Math.min(...menu.map((d) => shortageCost(state, d.ingredients).cost));
  if (state.cash >= cheapest) return 0;
  const amount = Math.max(80, cheapest * 2);
  state.cash += amount;
  state.rescueDay = state.day;
  bump(state, 'rescues');
  toast(`Cô hàng xóm gửi bạn ${vnd(amount)} tiền chợ để quán không phải đóng cửa.`, 'good');
  return amount;
}
