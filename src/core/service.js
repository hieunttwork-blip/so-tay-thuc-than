// Kinh doanh: ca bán hàng, khách, đơn, thanh toán, thực đơn, tổng kết ngày.
import { DISH_BY_ID, EXTRAS } from '../data/dishes.js';
import { addXp, addRep, bonus, bump, maxStamina, regenStamina } from './progression.js';
import { CERTS } from '../data/certs.js';
import { REVIEWS, SLOW, FAST, PRICEY, CHEAP, TASTE_UNDER, TASTE_OVER, JUDGE_OK, JUDGE_FAIL, CRITIC_5, CRITIC_LOW } from '../data/reviews.js';
import { earn, spend, ledgerOf, hasAll, rescueIfStuck, dishCostNow, ingredientPrice } from './economy.js';
import { festivalOn, festivalMatches, eventStatKey, refreshQuests } from './quests.js';
import { nextFloat, randInt, pick, chance, weightedPick } from './rng.js';
import { STAR_PAY, assistantPrepScore, randomTaste } from './cooking.js';
import { levelMult, addMastery } from './mastery.js';
import { toast, emit } from './bus.js';

export const REG_NAMES = ['Bác Hùng', 'Cô Lan', 'Anh Quân', 'Chị Mai', 'Cậu Bình', 'Dì Thu'];
const NAMES = ['Anh Tuấn', 'Chị Hoa', 'Em Nam', 'Bạn Linh', 'Chú Cường', 'Bà Hạnh', 'Cô Phượng', 'Anh Đạt', 'Chị Thảo', 'Bác Sơn', 'Em Vy', 'Anh Khoa', 'Cô Diệp', 'Chú Lâm', 'Bạn Trang', 'Anh Hải'];
const SKINS = ['#f0c9a0', '#e2b48c', '#d39a6a', '#c28a5a', '#f6d6b4'];
const HAIRS = ['#1a1210', '#2a1e18', '#4a3426', '#6a6058', '#b8b0a8'];
const OUTFITS = ['#c24a32', '#3a6a8a', '#6f9a5a', '#d9a23c', '#7a4a8a', '#4f7a78', '#a8583a'];

/** Độ dài một ngày (giây thật): 07:00 đến 21:00. */
export const DAY_LEN = 330;
/** Khoảng cách trung bình giữa hai khách (giây): uy tín, cấp độ, bàn ghế, quán lớn đều làm khách đến dày hơn. Không giới hạn số khách hay số ghế. */
export function arrivalGap(state) {
  const b = bonus(state);
  const g = 34 - (state.rep - 30) * 0.22 - state.level * 0.25 - b.customerBonus * 0.6 - (b.seats - 3) * 0.5;
  return Math.max(11, Math.min(40, g));
}
/** Số khách dự kiến trong ngày (chỉ để hiển thị; số khách thật do lịch đến quyết định). */
export const customersFor = (state) => Math.max(3, Math.round((DAY_LEN * 0.9) / arrivalGap(state)));

/** Chứng nhận kế tiếp đủ điều kiện để giám khảo ghé thăm (đã đạt cấp độ và có chứng nhận trước đó). */
export function pendingCert(state) {
  const i = CERTS.findIndex((c) => !state.certs[c.id]);
  if (i < 0) return null;
  return CERTS[i].level <= state.level ? { cert: CERTS[i], idx: i } : null;
}
export const menuDishes = (state) => state.menu.ids.map((id) => DISH_BY_ID[id]).filter((d) => d && state.learned[d.id]);

export function menuAdd(state, id) {
  if (!state.learned[id]) return { ok: false, reason: 'Bạn chưa học món này.' };
  if (state.menu.ids.includes(id)) return { ok: false, reason: 'Món đã có trong thực đơn.' };
  if (state.menu.ids.length >= bonus(state).menuSlots) return { ok: false, reason: 'Thực đơn đã đầy. Hãy gỡ bớt món hoặc nâng cấp Bảng thực đơn.' };
  state.menu.ids.push(id);
  return { ok: true };
}
export function menuRemove(state, id) {
  if (state.menu.ids.length <= 1) return { ok: false, reason: 'Thực đơn cần ít nhất một món.' };
  state.menu.ids = state.menu.ids.filter((x) => x !== id);
  return { ok: true };
}
export function menuPrice(state, id, mult) {
  if (!state.learned[id]) return { ok: false };
  state.menu.mult[id] = Math.max(0.7, Math.min(1.4, Math.round(mult * 100) / 100));
  return { ok: true };
}
export const priceMult = (state, id) => state.menu.mult[id] ?? 1;

/** Kinh tế của một món trong thực đơn: giá bán hiện tại (theo cấp thông thạo và chỉnh giá), giá vốn, lãi mỗi phần. */
export function dishEconomics(state, id) {
  const d = DISH_BY_ID[id];
  const price = Math.round(d.price * priceMult(state, id) * levelMult(state, id));
  const cost = dishCostNow(d);
  const st = state.dishStats[id] || {};
  return { price, cost, profit: price - cost, margin: price ? Math.round(((price - cost) / price) * 100) : 0, sold: st.sold || 0, rev: st.rev || 0, realProfit: (st.rev || 0) - (st.cost || 0) };
}
/** Tự chọn thực đơn: các món đã học có lãi mỗi phần cao nhất (ưu tiên món đủ nguyên liệu). */
export function menuAuto(state) {
  const slots = bonus(state).menuSlots;
  const list = Object.keys(state.learned).filter((id) => DISH_BY_ID[id]).map((id) => ({ id, e: dishEconomics(state, id), ok: hasAll(state, DISH_BY_ID[id].ingredients) }));
  list.sort((a, b) => (b.ok - a.ok) || (b.e.profit - a.e.profit));
  state.menu.ids = list.slice(0, slots).map((x) => x.id);
  return { ok: true, n: state.menu.ids.length };
}

/** Lịch khách đến trong ngày: rải theo giờ cao điểm trưa và tối, cách nhau tối thiểu vài giây. */
/** Giờ khách kế tiếp đến, tính theo uy tín hiện tại (uy tín đổi giữa ngày thì nhịp khách đổi theo), có giờ cao điểm trưa và tối. */
export function nextArrivalAt(state, t, dayLen, fest = false) {
  const u = t / dayLen;
  const peak = 1 + 0.35 * Math.exp(-Math.pow((u - 0.35) / 0.1, 2)) + 0.35 * Math.exp(-Math.pow((u - 0.75) / 0.1, 2));
  const gap = arrivalGap(state) * (fest ? 0.9 : 1);
  return t + (gap / peak) * (0.8 + nextFloat(state) * 0.4);
}
export function scheduleArrivals(state, gap, dayLen) {
  const times = [1.5];
  const end = dayLen * 0.92;
  let t = 1.5;
  for (;;) {
    const u = t / dayLen;
    // giờ cao điểm trưa (khoảng 35%) và tối (khoảng 75%): khách đến dày hơn
    const peak = 1 + 0.45 * Math.exp(-Math.pow((u - 0.35) / 0.1, 2)) + 0.45 * Math.exp(-Math.pow((u - 0.75) / 0.1, 2));
    t += (gap / peak) * (0.6 + nextFloat(state) * 0.8);
    if (t > end) break;
    times.push(Math.round(t * 10) / 10);
  }
  return times;
}
/** Đồng hồ trong ngày: 0 đến dayLen giây ứng với 07:00 đến 21:00. */
export function clockText(sh) {
  const f = Math.max(0, Math.min(1, sh.t / sh.dayLen));
  const m = Math.round(7 * 60 + f * 14 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export const shiftOver = (sh) => Boolean(sh && sh.closed);

export function openShift(state) {
  if (state.shift) return { ok: false, reason: 'Quán đang mở cửa.' };
  if (!menuDishes(state).length) return { ok: false, reason: 'Thực đơn chưa có món nào.' };
  rescueIfStuck(state);
  const fest = festivalOn(state.day);
  const dayLen = DAY_LEN;
  const arr = [];
  const total = 0;
  state.report = null;
  state.shift = {
    day: state.day, total, arrived: 0, resolved: 0, nextIn: 0, t: 0, dayLen, arr, closed: false, revenue: 0, tips: 0, served: 0, lost: 0, rep: 0, xp: 0,
    startCash: state.cash, nextAt: 1.5, cogs: 0, festival: fest ? fest.key : null, criticDone: false, judgeDone: false, ratingSum: 0, ratingN: 0, reviews: [], certs: [], seq: 0, customers: [],
  };
  bump(state, 'shifts');
  return { ok: true };
}

function makeLook(state) {
  return {
    skin: pick(state, SKINS), hair: pick(state, HAIRS), outfit: pick(state, OUTFITS),
    style: pick(state, ['short', 'long', 'bun', 'braid', 'short']), hat: pick(state, ['none', 'none', 'none', 'cap', 'nonla', 'bere']), acc: pick(state, ['none', 'none', 'glasses', 'mustache', 'flower']),
  };
}

function pickDish(state, kind, fest) {
  const menu = menuDishes(state);
  let pool = menu;
  if (kind === 'tourist') {
    const away = menu.filter((d) => d.region !== 'bac');
    if (away.length) pool = away;
  }
  const entries = pool.map((d) => {
    let w = hasAll(state, d.ingredients) ? 3 : 1;
    if (fest && festivalMatches(fest.f, d)) w *= 2;
    return [d, w];
  });
  return weightedPick(state, entries);
}

export function spawnCustomer(state) {
  const sh = state.shift;
  const fest = festivalOn(sh.day);
  let kind = 'normal';
  const r = nextFloat(state);
  const pc = pendingCert(state);
  if (state.vip > 0 && !sh.criticDone && !sh.judgeDone && sh.arrived >= 1) {
    state.vip -= 1;
    kind = pc ? 'judge' : 'critic';
  } else if (pc && !sh.judgeDone && sh.arrived >= 1 && r < 0.3) kind = 'judge';
  else if (state.rep >= 55 && !sh.criticDone && r < 0.1) kind = 'critic';
  else if (state.rep >= 40 && r < 0.25) kind = 'regular';
  else if (r < 0.4) kind = 'hurry';
  else if (r < 0.5 && menuDishes(state).some((d) => d.region !== 'bac')) kind = 'tourist';
  if (kind === 'critic') sh.criticDone = true;
  if (kind === 'judge') sh.judgeDone = true;
  const dish = pickDish(state, kind, fest);
  const taste = randomTaste(state, dish, dish.spicy ? weightedPick(state, [[0, 2], [1, 6], [2, 2]]) : null);
  const ex = EXTRAS[dish.cat];
  const extra = chance(state, 0.25) && hasAll(state, { ...dish.ingredients, [ex.ing]: (dish.ingredients[ex.ing] || 0) + 1 });
  const b = bonus(state);
  let max = 260 * b.patienceMult;
  if (kind === 'hurry') max *= 0.6;
  if (kind === 'critic') max *= 1.25;
  if (kind === 'judge') max *= 1.6;
  const name = kind === 'regular' ? pick(state, REG_NAMES) : kind === 'critic' ? 'Nhà phê bình ẩm thực' : kind === 'judge' ? (pc?.cert.judge || 'Giám khảo') : pick(state, NAMES);
  const c = {
    id: `c${sh.seq++}`, kind, name, look: makeLook(state), dish: dish.id, taste, spice: taste.spice, extra, status: 'waiting',
    patience: max, maxPatience: max, need: kind === 'judge' ? pc.cert.need : 0, certIdx: kind === 'judge' ? pc.idx : 0, cost: 0, stars: 0, score: 0, cooked: false, prep: { state: 'none', left: 0, score: 0 },
  };
  sh.customers.push(c);
  sh.arrived += 1;
  emit('sfx', 'bell');
  return c;
}

/** Tiến thời gian ca bán hàng. Trả về 'done' khi hết giờ nhận khách hoặc mọi khách đã được xử lý (người chơi tự bấm Kết thúc ngày). */
export function tick(state, dt) {
  const sh = state.shift;
  if (!sh) return null;
  sh.t += dt;
  if (!sh.closed && sh.t >= sh.dayLen) {
    sh.closed = true;
    sh.total = sh.arrived;
    emit('timeup', { day: sh.day });
  }
  while (!sh.closed && sh.t >= sh.nextAt) {
    spawnCustomer(state);
    // khách thứ hai đến sớm để người chơi không phải ngồi chờ; sau đó đều theo uy tín
    sh.nextAt = sh.arrived === 1 ? sh.t + 14 + nextFloat(state) * 5 : nextArrivalAt(state, sh.t, sh.dayLen, Boolean(sh.festival));
  }
  for (const c of [...sh.customers]) {
    if (c.prep && c.prep.state === 'doing') {
      c.prep.left -= dt;
      if (c.prep.left <= 0) { c.prep.state = 'done'; c.prep.left = 0; emit('sfx', 'pick'); }
    }
    c.patience -= dt;
    if (c.patience <= 0) leave(state, c, 'timeout');
  }
  return shiftOver(sh) ? 'done' : null;
}

function pickText(state, arr) { return arr[Math.floor(nextFloat(state) * arr.length) % arr.length]; }

/** Ghi một đánh giá của khách (1 đến 5 sao). issues: danh sách {cat, dir} khi chọn dư/thiếu nguyên liệu. */
function addReview(state, c, rating, issues, extraNote = '') {
  const sh = state.shift, dish = DISH_BY_ID[c.dish];
  let text = c.kind === 'critic' ? pickText(state, rating >= 4 ? CRITIC_5 : CRITIC_LOW) : pickText(state, REVIEWS[rating]).replace('{m}', dish.name);
  if (issues && issues.length) {
    const i = issues[0];
    text += ` Cảm giác ${(i.dir > 0 ? TASTE_OVER : TASTE_UNDER)[i.cat] || (i.dir > 0 ? 'hơi quá tay' : 'hơi thiếu')}.`;
  }
  if (extraNote) text += ` ${extraNote}`;
  const r = { day: sh.day, name: c.name, dish: dish.name, rating, text, kind: c.kind };
  sh.ratingSum += rating; sh.ratingN += 1;
  sh.reviews.push(r); sh.reviews = sh.reviews.slice(-12);
  state.reviews.push(r); state.reviews = state.reviews.slice(-40);
  emit('review', r);
  return r;
}

function leave(state, c, why) {
  const sh = state.shift;
  sh.customers = sh.customers.filter((x) => x.id !== c.id);
  sh.resolved += 1; if (why !== 'close') sh.lost += 1;
  const penalty = c.kind === 'critic' || c.kind === 'judge' ? -4 : why === 'close' ? 0 : why === 'decline' ? -1 : -3;
  if (why === 'timeout') addReview(state, c, 1, null);
  sh.rep += penalty;
  addRep(state, penalty);
  bump(state, 'lost');
  emit('lost', { c, why });
  emit('sfx', 'error');
}

/** Khách đã chờ bao lâu: tier fast/ok/slow/bad quyết định đánh giá tốt hay xấu. pct (100 → 0) dùng cho thanh chờ. */
export function waitInfo(c) {
  const waited = c.maxPatience - c.patience;
  const hurry = c.kind === 'hurry';
  const fastLim = hurry ? 35 : 50, slowLim = hurry ? 80 : 110, badLim = hurry ? 120 : 170;
  const tier = waited <= fastLim ? 'fast' : waited <= slowLim ? 'ok' : waited <= badLim ? 'slow' : 'bad';
  return { waited, tier, pct: Math.max(0, Math.min(100, (1 - waited / badLim) * 100)) };
}
export const findCustomer = (state, id) => state.shift?.customers.find((c) => c.id === id) || null;

export function takeOrder(state, id) {
  const c = findCustomer(state, id);
  if (!c) return { ok: false, reason: 'Khách đã rời đi.' };
  if (c.status !== 'waiting') return { ok: false, reason: 'Đã nhận đơn rồi.' };
  c.status = 'ordered';
  return { ok: true };
}
export function declineOrder(state, id) {
  const c = findCustomer(state, id);
  if (!c) return { ok: false };
  if (c.status === 'ready') return { ok: false, reason: 'Món đã nấu xong, hãy giao cho khách.' };
  leave(state, c, 'decline');
  refreshQuests(state);
  return { ok: true };
}

/** Giao phụ bếp sơ chế sẵn nguyên liệu cho một đơn. Phụ bếp chỉ làm được một (hoặc hai ở cấp 2) đơn cùng lúc. */
export function assignPrep(state, id) {
  const b = bonus(state);
  const c = findCustomer(state, id);
  if (!b.assistant) return { ok: false, reason: 'Bạn chưa thuê phụ bếp.' };
  if (!c) return { ok: false, reason: 'Khách đã rời đi.' };
  if (c.status !== 'ordered') return { ok: false, reason: 'Hãy nhận đơn trước.' };
  if (c.prep && c.prep.state !== 'none') return { ok: false, reason: 'Đơn này đã được giao phụ bếp.' };
  const busy = state.shift.customers.filter((x) => x.prep && x.prep.state === 'doing').length;
  if (busy >= b.assistant) return { ok: false, reason: 'Phụ bếp đang bận, hãy đợi một chút.' };
  c.prep = { state: 'doing', left: b.assistant >= 2 ? 6 : 9, score: assistantPrepScore(state, b) };
  emit('sfx', 'click');
  return { ok: true };
}

/** Ghi nhận một lần nấu (dùng cho cả đơn khách lẫn nấu tặng). */
export function recordCook(state, dishId, stars) {
  if (stars < 1) { bump(state, 'ruined'); return; }
  const s = (state.dishStats[dishId] ||= { cooked: 0, stars3: 0, sold: 0, best: 0 });
  s.cooked += 1;
  s.best = Math.max(s.best, stars);
  bump(state, 'cooked');
  if (stars >= 2) bump(state, 'good');
  if (stars === 3) { s.stars3 += 1; bump(state, 'stars3'); }
  addXp(state, Math.round(DISH_BY_ID[dishId].xp * 0.3));
}

export function applyCookToCustomer(state, id, stars, score, meta = {}) {
  const c = findCustomer(state, id);
  if (!c) return { ok: false, reason: 'Khách đã rời đi trong lúc bạn nấu.' };
  recordCook(state, c.dish, stars);
  if (stars < 1) { c.prep = { state: 'none', left: 0, score: 0 }; return { ok: true, ruined: true }; }
  c.status = 'ready'; c.stars = stars; c.score = score; c.cooked = true; c.cost = Math.max(0, Math.round(meta.cost || 0)); c.issues = meta.issues || [];
  refreshQuests(state);
  return { ok: true, ruined: false };
}

export function serve(state, id) {
  const sh = state.shift;
  const c = findCustomer(state, id);
  if (!c) return { ok: false, reason: 'Khách đã rời đi.' };
  if (c.status !== 'ready') return { ok: false, reason: 'Món chưa nấu xong.' };
  const dish = DISH_BY_ID[c.dish], b = bonus(state), stars = c.stars;
  const fest = festivalOn(sh.day);
  const fm = fest && festivalMatches(fest.f, dish);
  const mult = priceMult(state, dish.id);
  const ex = c.extra ? EXTRAS[dish.cat] : null;
  const lvm = levelMult(state, dish.id);
  const base = Math.round(dish.price * mult * lvm * (fm ? fest.f.priceMult : 1)) + (ex ? ex.price : 0);
  const wait = waitInfo(c).tier;
  let pay = Math.round(base * STAR_PAY[stars] * (wait === 'fast' ? 1.05 : 1));
  if (c.kind === 'hurry') pay = Math.round(pay * 1.3);
  if (c.kind === 'critic') pay = Math.round(pay * 2.5);
  if (c.kind === 'judge') pay = Math.round(pay * 2);
  let tip = 0;
  if (mult <= 1.15 && chance(state, stars === 3 ? 0.6 : stars === 2 ? 0.25 : 0)) {
    tip = Math.round(base * 0.15 * b.tipMult * (c.kind === 'regular' ? 1.5 : 1));
  }
  if (c.kind === 'tourist') tip = Math.round(tip * 1.5) + (stars >= 2 ? 3 : 0);
  // Đánh giá của khách: món ngon, phục vụ nhanh, giá hợp lý thì điểm cao.
  let rating = [1, 3, 4, 5][stars];
  if (wait === 'slow') rating -= 1;
  if (wait === 'bad') rating -= 2;
  if (mult > 1.15) rating -= 1;
  if (c.issues && c.issues.reduce((s, i) => s + (i.diff || 1), 0) >= 4) rating -= 1;
  rating = Math.max(1, Math.min(5, rating));
  let rep = [0, -3, -1, 0, 1, 2][rating] + (wait === 'fast' && rating >= 4 ? 0.5 : 0) + (wait === 'slow' ? -0.5 : wait === 'bad' ? -1.5 : 0);
  let judgeOk = false;
  if (c.kind === 'critic') rep = rating >= 4 ? 6 : rating === 3 ? 2 : -5;
  if (c.kind === 'judge') { judgeOk = stars >= c.need; rep = judgeOk ? 0 : -2; }
  rep = rep > 0 ? Math.round(rep * b.repMult * 10) / 10 : rep;
  const xp = Math.round(dish.xp * [0, 0.6, 1, 1.35][stars] * (fm ? fest.f.xpMult : 1));

  sh.customers = sh.customers.filter((x) => x.id !== c.id);
  sh.resolved += 1; sh.served += 1;
  earn(state, pay, 'sale');
  if (tip) earn(state, tip, 'tips');
  sh.revenue += pay; sh.tips += tip; sh.rep += rep; sh.xp += xp;
  const cogs = c.cost > 0 ? c.cost : dishCostNow(dish) + (ex ? ingredientPrice(ex.ing) : 0);
  sh.cogs += cogs;
  addRep(state, rep);
  addXp(state, xp);
  const mg = addMastery(state, dish, stars);
  bump(state, 'served');
  bump(state, `served:cat:${dish.cat}`);
  bump(state, `served:region:${dish.region}`);
  const ds = (state.dishStats[dish.id] ||= { cooked: 0, stars3: 0, sold: 0, best: 0 });
  ds.sold += 1; ds.rev = (ds.rev || 0) + pay + tip; ds.cost = (ds.cost || 0) + cogs;
  if (fm && sh.festival) bump(state, eventStatKey(sh.festival));
  if (c.kind === 'regular') state.regulars[c.name] = (state.regulars[c.name] || 0) + 1;
  const slowNote = wait === 'slow' || wait === 'bad' ? pickText(state, SLOW) : wait === 'fast' && rating >= 4 ? pickText(state, FAST) : mult > 1.15 ? pickText(state, PRICEY) : mult < 0.9 && rating >= 4 ? pickText(state, CHEAP) : '';
  let cert = null;
  if (c.kind === 'judge') {
    const ct = CERTS[c.certIdx];
    const r = addReview(state, c, judgeOk ? 5 : 2, null, pickText(state, judgeOk ? JUDGE_OK : JUDGE_FAIL));
    if (judgeOk && !state.certs[ct.id]) {
      state.certs[ct.id] = true; sh.certs.push(ct.id); cert = ct;
      earn(state, ct.reward.money, 'reward'); addXp(state, ct.reward.xp); addRep(state, ct.reward.rep); sh.rep += ct.reward.rep;
      bump(state, 'certs');
      emit('cert', ct);
    }
    void r;
  } else addReview(state, c, rating, c.issues, slowNote);
  emit('sale', { c, pay, tip, rep, xp, stars, rating, cert, mp: mg.gain });
  emit('sfx', 'coin');
  refreshQuests(state);
  return { ok: true, pay, tip, rep, xp, stars, rating, cert, mp: mg.gain };
}

function chargeWage(state) {
  const wage = bonus(state).wage;
  if (!wage) return 0;
  if (state.cash >= wage) { spend(state, wage, 'wage'); return wage; }
  return 0;
}

/** Kết thúc ca: lập báo cáo, trừ lương, lưu lịch sử. */
export function finishShift(state) {
  const sh = state.shift;
  if (!sh) return null;
  const wage = chargeWage(state);
  const lg = ledgerOf(state);
  const inc = { ...lg.inc }, exp = { ...lg.exp };
  const revenue = Object.values(inc).reduce((a, b) => a + b, 0);
  const cost = Object.values(exp).reduce((a, b) => a + b, 0);
  const report = {
    day: sh.day, revenue, tips: sh.tips, cogs: sh.cogs, wage, cost, profit: revenue - cost, inc, exp, startCash: lg.startCash,
    served: sh.served, lost: sh.lost, rep: Math.round(sh.rep * 10) / 10, xp: sh.xp, cash: state.cash, festival: sh.festival,
    avgRating: sh.ratingN ? Math.round((sh.ratingSum / sh.ratingN) * 10) / 10 : 0, reviews: sh.reviews.slice(-6), certs: sh.certs, repNow: state.rep,
  };
  state.history.push({ day: sh.day, revenue, cost, profit: report.profit, served: sh.served, lost: sh.lost });
  state.history = state.history.slice(-30);
  state.shift = null;
  state.report = report;
  refreshQuests(state);
  return report;
}

/** Đóng cửa sớm: khách còn lại ra về (không bị phạt), rồi lập báo cáo doanh thu. */
export function closeShop(state) {
  const sh = state.shift;
  if (!sh) return { ok: false, reason: 'Quán chưa mở cửa.' };
  for (const c of [...sh.customers]) leave(state, c, 'close');
  return { ok: true, report: finishShift(state) };
}

/** Kết thúc ngày từ màn hình bất kỳ: đóng ca đang mở, hoặc nghỉ không bán (vẫn trả lương). */
export function endDay(state) {
  if (state.shift) return closeShop(state);
  const wage = chargeWage(state);
  const lg = ledgerOf(state);
  const inc = { ...lg.inc }, exp = { ...lg.exp };
  const revenue = Object.values(inc).reduce((a, b) => a + b, 0), cost = Object.values(exp).reduce((a, b) => a + b, 0);
  const report = { day: state.day, revenue, tips: 0, cogs: 0, wage, cost, profit: revenue - cost, inc, exp, startCash: lg.startCash, served: 0, lost: 0, rep: 0, xp: 0, cash: state.cash, festival: null, avgRating: 0, reviews: [], certs: [], repNow: state.rep };
  state.history.push({ day: state.day, revenue: 0, cost: wage, profit: -wage, served: 0, lost: 0 });
  state.history = state.history.slice(-30);
  state.report = report;
  return { ok: true, report };
}

/** Nghỉ qua ngày mà không mở quán (vẫn trả lương phụ bếp). */
export function skipDay(state) {
  if (state.shift) return { ok: false, reason: 'Hãy hoàn tất ca bán hàng đang diễn ra trước.' };
  const wage = chargeWage(state);
  state.history.push({ day: state.day, revenue: 0, cost: wage, profit: -wage, served: 0, lost: 0 });
  state.history = state.history.slice(-30);
  nextDay(state);
  return { ok: true };
}

export function nextDay(state) {
  if (state.shift) return { ok: false, reason: 'Ca bán hàng chưa kết thúc.' };
  state.day += 1;
  state.report = null;
  state.stamina = Math.max(state.stamina, maxStamina(state));
  state.staminaAt = Date.now();
  // Uy tín thấp thì quán vắng dần.
  bump(state, 'days');
  refreshQuests(state);
  const fest = festivalOn(state.day);
  if (fest) toast(`Hôm nay có lễ hội: ${fest.f.name}!`, 'good');
  return { ok: true };
}
