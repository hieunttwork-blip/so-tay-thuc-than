// Tiện ích kiểm thử: kho lưu giả, đầu bếp hoàn hảo và "bot" chơi tự động.
import { newState } from '../src/core/state.js';
import * as eco from '../src/core/economy.js';
import * as svc from '../src/core/service.js';
import * as ex from '../src/core/explore.js';
import * as Q from '../src/core/quests.js';
import * as P from '../src/core/progression.js';
import { DISH_BY_ID, DISHES } from '../src/data/dishes.js';
import { LOCATIONS } from '../src/data/locations.js';
import { UPGRADES, UPGRADE_ORDER } from '../src/data/upgrades.js';
import { extraOf } from '../src/core/cooking.js';

export function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

export function freshState(seed = 1) {
  const s = newState('Tester');
  s.rng = seed;
  Q.ensureQuests(s);
  return s;
}

/** Nấu một đơn của khách với số sao mong muốn (mặc định 3), có trừ nguyên liệu thật. Trả về false nếu không nấu được. */
export function cookFor(state, cust, stars = 3) {
  const dish = DISH_BY_ID[cust.dish];
  const need = eco.needFor(dish, cust.extra ? extraOf(dish).ing : null);
  if (!eco.hasAll(state, need)) {
    const r = eco.quickBuy(state, need);
    if (!r.ok) return false;
  }
  if (!eco.consume(state, need)) return false;
  const r = svc.applyCookToCustomer(state, cust.id, stars, stars === 3 ? 95 : stars === 2 ? 75 : 50);
  return r.ok;
}

export function runShift(state, { stars = 3 } = {}) {
  svc.openShift(state);
  let guard = 0;
  while (state.shift && guard++ < 20000) {
    for (const c of [...state.shift.customers]) {
      if (c.status === 'waiting') svc.takeOrder(state, c.id);
      if (c.status === 'ordered') { if (!cookFor(state, c, stars)) svc.declineOrder(state, c.id); }
      if (c.status === 'ready') svc.serve(state, c.id);
    }
    if (svc.tick(state, 1) === 'done') svc.finishShift(state);
  }
  return state.report;
}

export function claimAll(state) {
  for (const [id, q] of Object.entries(state.quests)) if (q.status === 'done') Q.claimQuest(state, id);
  for (const col of Q.collections(state)) for (const m of Q.milestoneState(state, col)) if (m.reached && !m.claimed) Q.claimCollection(state, m.key);
  Q.claimEvent(state);
}

/** Bot chơi một ngày: học nghề, khám phá, nâng cấp, bán hàng. */
export function playDay(state, opts = {}) {
  Q.refreshQuests(state);
  claimAll(state);
  // khám phá địa điểm kế tiếp nếu được
  for (const loc of LOCATIONS) {
    if (!state.visited[loc.id] && ex.locationStatus(state, loc).open && state.cash > loc.fare + 150) { ex.visit(state, loc.id); }
  }
  // học nghề nếu dư tiền, ưu tiên món đắt nhất
  const learnable = DISHES.filter((d) => !d.secret && !state.learned[d.id] && ex.learnStatus(state, d).affordable).sort((a, b) => b.price - a.price);
  for (const d of learnable) { if (state.cash >= d.learnCost + 250) ex.learnDish(state, d.id); }
  // thực đơn: món đắt nhất trong khả năng
  const slots = P.bonus(state).menuSlots;
  state.menu.ids = Object.keys(state.learned).map((id) => DISH_BY_ID[id]).sort((a, b) => b.price - a.price).slice(0, slots).map((d) => d.id);
  // nâng cấp: mua cái rẻ nhất có thể, giữ lại 300 vốn
  for (const key of UPGRADE_ORDER) {
    const st = P.upgradeStatus(state, key);
    if (!st.maxed && !st.locked && state.cash >= st.cost + 300) P.buyUpgrade(state, key);
  }
  const vs = P.venueStatus(state);
  if (!vs.maxed && !vs.locked && state.cash >= vs.next.cost + 500) P.buyVenue(state);
  for (const k of ['dao', 'lua', 'vi', 'bay']) while (state.skillPoints > 0 && P.upgradeSkill(state, k).ok) { /* dồn điểm */ }
  // nấu tặng nhân vật (mỗi người tối đa 1 lời nhờ/ngày)
  for (const loc of LOCATIONS) {
    if (!state.visited[loc.id]) continue;
    const rq = ex.requestOf(state, loc.npc);
    if (rq.full || !rq.learned) continue;
    const need = eco.needFor(rq.dish);
    if (!eco.hasAll(state, need) && !eco.quickBuy(state, need).ok) continue;
    eco.consume(state, need);
    ex.completeRequest(state, loc.npc, 3);
  }
  // thu thập nguyên liệu bằng thể lực còn lại
  for (const loc of LOCATIONS) { while (state.stamina > 0 && state.visited[loc.id] && opts.gather && ex.gatherAt(state, loc.id).ok) { /* thu thập */ } }
  const report = runShift(state, opts);
  claimAll(state);
  svc.nextDay(state);
  Q.refreshQuests(state);
  return report;
}
