// Hệ thống chế biến: mỗi nhóm món có một quy trình riêng. Toàn bộ chấm điểm là hàm thuần để kiểm thử được.
import { INGREDIENTS } from '../data/ingredients.js';
import { EXTRAS, GARNISHES } from '../data/dishes.js';
import { bonus, bump } from './progression.js';
import { spend, ingredientPrice } from './economy.js';
import { nextFloat, shuffle } from './rng.js';

export const TOOLS = {
  dao: { name: 'Dao & thớt', icon: 't-dao' },
  coi: { name: 'Cối giã', icon: 't-coi' },
  ray: { name: 'Rây & vợt', icon: 't-ray' },
  la: { name: 'Lá gói', icon: 't-la' },
  tre: { name: 'Que xiên', icon: 't-tre' },
  xay: { name: 'Máy xay', icon: 't-xay' },
};

export const HEATS = {
  boil: { label: 'Đun sôi', temps: ['Nhỏ', 'Vừa', 'Lớn'], correct: 2, icon: 'h-boil' },
  simmer: { label: 'Om liu riu', temps: ['Nhỏ', 'Vừa', 'Lớn'], correct: 0, icon: 'h-simmer' },
  fry: { label: 'Chiên rán', temps: ['Nhỏ', 'Vừa', 'Lớn'], correct: 2, icon: 'h-fry' },
  grill: { label: 'Nướng than', temps: ['Nhỏ', 'Vừa', 'Lớn'], correct: 1, icon: 'h-grill' },
  steam: { label: 'Hấp', temps: ['Nhỏ', 'Vừa', 'Lớn'], correct: 1, icon: 'h-steam' },
};

export const STEP_NAMES = { select: 'Khay nguyên liệu', prep: 'Sơ chế', heat: 'Nấu chín', season: 'Nêm nếm', plate: 'Trình bày' };

// Quy trình gọn: nguyên liệu (điền sẵn), sơ chế, canh lửa, nêm vị bằng trí nhớ (món không cần lửa bỏ bước canh lửa).
const STD = ['select', 'prep', 'heat', 'season'];
const NOHEAT = ['select', 'prep', 'season'];
export const METHODS = {
  soup: { label: 'Nấu nước dùng', steps: STD, heat: 'boil', tool: 'dao', verb: 'thái lát và chuẩn bị thành phần' },
  dry: { label: 'Chần và trộn', steps: STD, heat: 'boil', tool: 'ray', verb: 'chần và vớt sợi cho ráo' },
  grill: { label: 'Nướng', steps: STD, heat: 'grill', tool: 'tre', verb: 'ướp gia vị và xiên que' },
  fry: { label: 'Chiên rán', steps: STD, heat: 'fry', tool: 'coi', verb: 'giã nhỏ và trộn nhân' },
  steam: { label: 'Hấp / gói', steps: STD, heat: 'steam', tool: 'la', verb: 'tráng bột và gói bánh' },
  rice: { label: 'Cơm & món kèm', steps: STD, heat: 'steam', tool: 'dao', verb: 'chuẩn bị phần ăn kèm' },
  simmer: { label: 'Kho / om', steps: STD, heat: 'simmer', tool: 'dao', verb: 'cắt khúc nguyên liệu' },
  sweet: { label: 'Nấu chè', steps: STD, heat: 'simmer', tool: 'ray', verb: 'lọc đậu và rây bột' },
  drink: { label: 'Pha chế', steps: NOHEAT, heat: null, tool: 'xay', verb: 'xay và ép nguyên liệu' },
  roll: { label: 'Cuốn / trộn', steps: NOHEAT, heat: null, tool: 'la', verb: 'cuốn và trộn đều' },
};

const WEIGHTS = { select: 25, prep: 20, heat: 25, season: 30, plate: 10 };
export const STAR_MIN = [0, 45, 68, 88];

export const starsFromScore = (score) => (score >= STAR_MIN[3] ? 3 : score >= STAR_MIN[2] ? 2 : score >= STAR_MIN[1] ? 1 : 0);
export const STAR_PAY = [0, 0.7, 1, 1.2];
export const STAR_LABEL = ['Hỏng món', 'Tạm được', 'Ngon', 'Xuất sắc'];

export const methodOf = (dish) => METHODS[dish.method] || METHODS.soup;

export function extraOf(dish) { return EXTRAS[dish.cat]; }

/** Độ chua của món (0 đến 4): suy ra từ nguyên liệu chua và kiểu nước chấm. */
const SOUR_ING = { chanh: 2, quat: 2, 'ca-chua': 1, 'dua-thom': 1, 'mit-non': 1 };
export function sourOf(dish) {
  let v = dish.cat === 'kho' || dish.cat === 'banh' || dish.cat === 'nuong' ? 1 : 0;
  for (const id of Object.keys(dish.ingredients)) v += SOUR_ING[id] || 0;
  if (dish.id === 'nhut-thanh-chuong') v += 2;
  return Math.max(0, Math.min(4, v));
}
export const TASTE_DIMS = [['salt', 'Mặn', 'Muối, nước mắm'], ['sweet', 'Ngọt', 'Đường, mật'], ['sour', 'Chua', 'Chanh, giấm, me'], ['spice', 'Cay', 'Ớt, tiêu']];
export const tasteOf = (dish) => ({ salt: dish.taste.salt, sweet: dish.taste.sweet, sour: sourOf(dish), spice: dish.taste.spice });

/** Vị chia 3 mức theo yêu cầu khách: 0 = ít, 1 = vừa, 2 = nhiều. */
export const tierOf = (v) => (v <= 1 ? 0 : v === 2 ? 1 : 2);
export const TIER_LABEL = {
  salt: ['Ít mặn', 'Mặn vừa', 'Mặn nhiều'], sweet: ['Ít ngọt', 'Ngọt vừa', 'Ngọt nhiều'],
  sour: ['Ít chua', 'Chua vừa', 'Chua nhiều'], spice: ['Không cay', 'Cay vừa', 'Thật cay'],
};
export const SPICE_LABELS = TIER_LABEL.spice;
/** Các vị áp dụng cho món (món không cay thì bỏ qua vị cay). */
export const dimsFor = (dish) => TASTE_DIMS.filter(([k]) => k !== 'spice' || dish.spicy);
export function defaultTaste(dish) {
  const t = tasteOf(dish);
  return Object.fromEntries(TASTE_DIMS.map(([k]) => [k, k === 'spice' && !dish.spicy ? 0 : tierOf(t[k])]));
}
/** Yêu cầu vị của một khách: lấy theo công thức nhưng hay đổi ý (ít/vừa/nhiều). */
export function randomTaste(state, dish, spiceTier = null) {
  const t = defaultTaste(dish);
  for (const [k] of dimsFor(dish)) {
    if (nextFloat(state) < 0.4) t[k] = Math.max(0, Math.min(2, t[k] + (nextFloat(state) < 0.5 ? -1 : 1)));
  }
  if (spiceTier != null && dish.spicy) t.spice = spiceTier;
  return t;
}
/** Khách chỉ dặn 1 đến 2 vị: ưu tiên vị khác công thức; nếu không có thì hỏi vị đặc trưng (cay hoặc mặn). */
export function asksOf(dish, taste) {
  const def = defaultTaste(dish);
  const dims = dimsFor(dish).map((d) => d[0]);
  const diff = dims.filter((k) => (taste?.[k] ?? def[k]) !== def[k]);
  const order = ['spice', 'salt', 'sweet', 'sour'];
  const list = diff.sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, 2);
  if (!list.length) list.push(dish.spicy ? 'spice' : 'salt');
  return list;
}
export const tasteOrderText = (dish, taste) => asksOf(dish, taste).map((k) => TIER_LABEL[k][taste?.[k] ?? defaultTaste(dish)[k]]).join(' · ');
/** Mục tiêu vị = đúng yêu cầu của khách. */
export function seasonTarget(dish, order = {}) {
  const t = defaultTaste(dish);
  if (order.taste) for (const [k] of TASTE_DIMS) if (Number.isInteger(order.taste[k])) t[k] = Math.max(0, Math.min(2, order.taste[k]));
  return t;
}

/** Chấm vị: đúng yêu cầu = 100; lệch 1 mức còn 50; lệch 2 mức = 0. */
export function scoreSeason(target, chosen, bonusPts = 0, dish = null) {
  const dims = dish ? asksOf(dish, target) : TASTE_DIMS.map((d) => d[0]);
  const avg = dims.reduce((s, k) => { const d = Math.abs((chosen[k] ?? 1) - target[k]); return s + (d === 0 ? 100 : d === 1 ? 50 : 0); }, 0) / dims.length;
  return Math.round(avg >= 100 ? 100 : Math.min(100, avg + bonusPts));
}
const HINTS = {
  salt: ['Nhạt', 'Vừa miệng', 'Mặn'],
  sweet: ['Thiếu ngọt', 'Vừa miệng', 'Ngọt quá'],
  sour: ['Thiếu chua', 'Vừa miệng', 'Chua quá'],
  spice: ['Thiếu cay', 'Vừa miệng', 'Cay quá'],
};
export function tasteHints(target, chosen) {
  const out = {};
  for (const [k] of TASTE_DIMS) {
    const d = (chosen[k] || 0) - target[k];
    out[k] = { dir: Math.sign(d), diff: Math.abs(d), text: HINTS[k][d === 0 ? 1 : d < 0 ? 0 : 2] };
  }
  return out;
}
/** Các chiều vị bị lệch, dùng cho nhận xét của khách. */
export function tasteIssues(target, chosen, dish = null) {
  return (dish ? asksOf(dish, target) : TASTE_DIMS.map((d) => d[0])).map((k) => ({ id: null, cat: k, dir: Math.sign((chosen[k] || 0) - target[k]), diff: Math.abs((chosen[k] || 0) - target[k]) })).filter((x) => x.diff > 0);
}

/** Chấm số lượng nguyên liệu người chơi chọn so với công thức. Dư hoặc thiếu đều làm lệch vị. */
export function scoreQuantities(required, chosen, spiceOk = true) {
  const ids = Object.keys(required);
  const issues = [];
  let sum = 0;
  for (const id of ids) {
    const diff = (chosen[id] || 0) - required[id];
    const ad = Math.abs(diff);
    sum += (chosen[id] || 0) === 0 ? 0 : ad === 0 ? 100 : ad === 1 ? 68 : ad === 2 ? 34 : 0; // bỏ hẳn một nguyên liệu là mất trọn phần điểm
    if (diff !== 0) issues.push({ id, cat: INGREDIENTS[id]?.group || 'giavi', dir: Math.sign(diff), diff: ad });
  }
  issues.sort((a, b) => b.diff - a.diff);
  let score = ids.length ? sum / ids.length : 0;
  if (!spiceOk) { score *= 0.88; }
  return { score: Math.round(score), issues, perfect: issues.length === 0 };
}
/** Chi phí nguyên liệu thật của một lần nấu (dư thì tốn thêm). */
export const quantityCost = (chosen) => Object.entries(chosen).reduce((s, [id, q]) => s + ingredientPrice(id) * q, 0);

export const FREE_HINTS = 3;
export const HINT_PENALTY = 10;
export const hintsUsed = (state, dishId) => state.dishStats[dishId]?.hints || 0;
export function hintPrice(state, dish) { return hintsUsed(state, dish.id) < FREE_HINTS ? 0 : hintCost(dish); }
/** Dùng một gợi ý: 3 lần đầu miễn phí, sau đó tốn tiền và bị trừ điểm. Nấu thử (practice) luôn miễn phí. */
export function useHint(state, dish, practice = false) {
  if (practice) return { ok: true, cost: 0, penalty: 0 };
  const cost = hintPrice(state, dish);
  if (cost > 0 && !spend(state, cost, 'hint')) return { ok: false, reason: 'Chưa đủ tiền mua gợi ý.' };
  const s = (state.dishStats[dish.id] ||= { cooked: 0, stars3: 0, sold: 0, best: 0 });
  s.hints = (s.hints || 0) + 1;
  bump(state, 'hints');
  return { ok: true, cost, penalty: cost > 0 ? HINT_PENALTY : 0 };
}

/** Khay nguyên liệu: chọn đúng món, game tự lấy số lượng theo công thức. */
export function scoreTray(required, picked) {
  const ids = Object.keys(required);
  const correct = picked.filter((id) => id in required).length;
  const extra = picked.filter((id) => !(id in required));
  const issues = [
    ...ids.filter((id) => !picked.includes(id)).map((id) => ({ id, cat: INGREDIENTS[id]?.group || 'giavi', dir: -1, diff: 2 })),
    ...extra.map((id) => ({ id, cat: INGREDIENTS[id]?.group || 'giavi', dir: 1, diff: 2 })),
  ];
  const score = ids.length ? Math.max(0, Math.round((100 * correct) / ids.length - 10 * extra.length)) : 0;
  return { score, issues, perfect: !issues.length };
}
/** Lượng thật lấy từ kho: đúng món lấy đủ theo công thức, món chọn nhầm lấy 1. */
export const trayChosen = (required, picked) => Object.fromEntries(picked.map((id) => [id, required[id] || 1]));
/** Thời gian chờ (ms) của sơ chế và nấu chín: món khó chờ lâu hơn, dụng cụ/bếp tốt chờ ít hơn. */
/** Mỗi bước nấu gồm vài vòng: chờ thanh tròn chạy hết rồi chạm để làm động tác (lật, khuấy, thái...). */
export const PREP_VERB = { dao: 'thái', coi: 'giã', ray: 'rây', la: 'gói', tre: 'xiên', xay: 'xay' };
export const HEAT_ACT = {
  boil: { verb: 'khuấy', doing: 'Đang đun sôi', kind: 'stir' }, simmer: { verb: 'khuấy', doing: 'Đang om liu riu', kind: 'stir' },
  fry: { verb: 'lật', doing: 'Đang chiên', kind: 'flip' }, grill: { verb: 'lật', doing: 'Đang nướng', kind: 'flip' },
  steam: { verb: 'mở nắp', doing: 'Đang hấp', kind: 'lid' },
};
export const prepCycles = () => 2;
export const heatCycles = (dish) => (dish.diff >= 4 ? 3 : 2);
export const GARNISH_EMOJI = { herb: '🌿', lime: '🍋', chili: '🌶️', shallot: '🧅', peanut: '🥜', sauce: '🥣', pickle: '🥕', egg: '🥚', ice: '🧊', pepper: '⚫' };
export const GARNISH_COLOR = { herb: '#4f9a3c', lime: '#b8d23a', chili: '#d9402b', shallot: '#c98a2b', peanut: '#b27a3c', sauce: '#8a4a22', pickle: '#e8923a', egg: '#f2d36b', ice: '#cfe9f5', pepper: '#333' };
export const prepMs = (dish, b) => Math.round((2200 + 350 * dish.diff) * (0.75 + 0.25 * b.tapFactor));
export const heatMs = (dish, b) => Math.round((3600 + 450 * dish.diff) * (1 - Math.min(0.4, (b.heatZone || 0) / 60)));

export function scoreSelect(required, picked) {
  const req = new Set(Object.keys(required));
  const missing = [...req].filter((k) => !picked.includes(k)).length;
  const wrong = picked.filter((k) => !req.has(k)).length;
  return { score: Math.max(0, 100 - 30 * wrong - 40 * missing), wrong, missing, complete: missing === 0 };
}

/** Sơ chế: số "mục tiêu" phải chạm (3 đến 6). Dụng cụ tốt hơn kéo dài thời gian mỗi mục tiêu. */
export function prepNeeded(dish, b) { return Math.max(3, Math.min(6, Math.round((2 + 0.8 * dish.diff) * (0.6 + 0.4 * b.tapFactor)))); }
export const prepWindowMs = (b) => Math.round(1300 + (1 - b.tapFactor) * 1500);
export function scorePrep({ toolOk, hits, needed }) {
  const base = Math.round((100 * Math.min(hits, needed)) / needed);
  return toolOk ? base : Math.round(base * 0.7);
}
/** Điểm sơ chế của phụ bếp: khá nhưng không tuyệt đối, để người chơi vẫn có lý do tự làm. */
export function assistantPrepScore(state, b) { return Math.min(90, 66 + 10 * (b.assistant - 1) + 3 * state.skills.dao); }
/** Gợi ý ở các bước ghi nhớ: tốn tiền và giới hạn điểm của bước đó. */
export const hintCost = (dish) => Math.max(4, Math.round(dish.price * 0.12));
export const HINT_CAP = 70;

/** Canh lửa: thanh xanh nhỏ, bấm Dừng đúng trong vùng xanh. Cần 3 lần chuẩn để đạt 100 điểm. */
export const HEAT_ROUNDS = 3;
export function heatParams(dish, b, centerRand, tempIdx = null) {
  const heat = HEATS[methodOf(dish).heat];
  const tempOk = heat && tempIdx != null ? tempIdx === heat.correct : true;
  const base = 20 - 1.2 * dish.diff + b.heatZone * 0.35;
  return {
    center: 22 + centerRand * 56,
    width: Math.max(9, Math.min(26, base)) * (tempOk ? 1 : 0.65),
    period: 2700 - 120 * dish.diff,
    tempOk,
  };
}
export const markerPos = (t, period) => 100 * (1 - Math.abs(2 * ((t / period) % 1) - 1));
/** Một lần bấm: trong vùng xanh là trúng (không cần đúng giữa). Trượt gần vùng xanh được chút điểm an ủi. */
export function heatHit(pos, p) {
  const dist = Math.abs(pos - p.center), half = p.width / 2;
  return { hit: dist <= half, near: dist <= p.width };
}
/** Điểm canh lửa từ danh sách kết quả các lần bấm. */
export function scoreHeatRounds(results) {
  let pts = 0;
  for (const r of results) pts += r.hit ? 100 / HEAT_ROUNDS : r.near ? 12 : 0;
  return Math.min(100, Math.round(pts));
}
// Giữ tương thích: chấm một lần bấm theo khoảng cách tới giữa vùng (dùng cho kiểm thử).
export function scoreHeat(pos, p) {
  const dist = Math.abs(pos - p.center), half = p.width / 2;
  let s = dist <= half ? 100 - 10 * (dist / half) : 90 - ((dist - half) / p.width) * 90;
  s = Math.max(0, s);
  return Math.round(p.tempOk ? s : s * 0.85);
}

export function scorePlate(dish, picked, extraDone, order, plateBonus = 0) {
  const G = dish.garnish;
  const correct = picked.filter((k) => G.includes(k)).length;
  const wrong = picked.length - correct;
  let s = (100 * correct) / G.length - 30 * wrong;
  if (s > 0) s += plateBonus;
  if (order?.extra && !extraDone) s -= 30;
  return Math.max(0, Math.min(100, Math.round(s)));
}

export function combine(method, scores) {
  const steps = METHODS[method]?.steps || STD;
  let num = 0, den = 0;
  for (const st of steps) { if (scores[st] == null) continue; num += WEIGHTS[st] * scores[st]; den += WEIGHTS[st]; }
  const score = den ? Math.round(num / den) : 0;
  // Công tâm: một bước làm ẩu thì không thể đạt sao cao dù các bước khác hoàn hảo.
  const weakest = Math.min(...steps.map((st) => (scores[st] == null ? 100 : scores[st])));
  let stars = starsFromScore(score);
  if (weakest < 90) stars = Math.min(stars, 2);
  if (weakest < 50) stars = Math.min(stars, 1);
  return { score, stars, weakest };
}

export const GARNISH_ALL = Object.keys(GARNISHES);

/** Tạo phiên nấu (chỉ nằm trong bộ nhớ giao diện, không lưu). */
export function createSession(state, dish, order = {}) {
  const b = bonus(state);
  const ex = order.extra ? extraOf(dish) : null;
  const required = { ...dish.ingredients };
  if (ex) required[ex.ing] = (required[ex.ing] || 0) + 1;
  const ids = Object.keys(INGREDIENTS).filter((id) => !(id in required) && INGREDIENTS[id].avail !== 'hiem');
  const same = ids.filter((id) => Object.keys(required).some((r) => INGREDIENTS[r].group === INGREDIENTS[id].group));
  const pool = shuffle(state, same.length >= 3 ? same : ids).slice(0, 3);
  const options = shuffle(state, [...Object.keys(required), ...pool]);
  const garnishPool = shuffle(state, GARNISH_ALL.filter((g) => !dish.garnish.includes(g))).slice(0, 2);
  const method = methodOf(dish);
  const taste = order.taste ? seasonTarget(dish, order) : randomTaste(state, dish);
  return {
    dishId: dish.id, order: { taste, spice: taste.spice, extra: Boolean(order.extra) },
    steps: method.steps, index: 0, scores: order.prepScore != null ? { prep: order.prepScore } : {}, preprepped: order.prepScore != null, required, options, committed: false,
    needed: prepNeeded(dish, b), centerRand: nextFloat(state), prepWindow: prepWindowMs(b),
    garnishOptions: shuffle(state, [...dish.garnish, ...garnishPool]),
    extra: ex, bonus: b,
  };
}

/** Nhận xét vị theo lượng nguyên liệu dư/thiếu và độ cay. */
export function tasteNote(issues, spiceWrong = false) {
  const under = { giavi: 'hơi nhạt', thit: 'hơi ít nhân', haisan: 'hơi ít hải sản', bot: 'hơi ít cái', rau: 'thiếu rau', ngot: 'thiếu ngọt', uong: 'hơi nhạt', dacsan: 'thiếu hương đặc trưng' };
  const over = { giavi: 'hơi mặn gắt', thit: 'hơi ngấy', haisan: 'hơi tanh nồng', bot: 'hơi nhiều cái', rau: 'rau át vị', ngot: 'ngọt gắt', uong: 'hơi đậm', dacsan: 'vị đặc sản lấn át' };
  const TS = { salt: ['hơi nhạt', 'hơi mặn'], sweet: ['thiếu ngọt', 'ngọt gắt'], sour: ['thiếu chua', 'chua quá'], spice: ['thiếu cay', 'cay quá'] };
  const parts = issues.slice().sort((a, b) => (b.diff || 1) - (a.diff || 1)).slice(0, 3).map((i) => (i.id ? `${INGREDIENTS[i.id].name} ${i.dir > 0 ? 'dư' : 'thiếu'} nên món ${(i.dir > 0 ? over : under)[i.cat] || 'lệch vị'}` : `vị ${TS[i.cat][i.dir > 0 ? 1 : 0]}`));
  if (spiceWrong) parts.push('độ cay chưa đúng yêu cầu khách');
  return parts.length ? `Vị bị lệch: ${parts.join('; ')}.` : 'Vị đúng công thức, rất cân bằng.';
}
