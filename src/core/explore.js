// Khám phá: đi đến địa điểm, thu thập nguyên liệu, học nghề, trò chuyện và nấu tặng nhân vật, tìm công thức bí mật.
import { vnd } from './fmt.js';
import { LOCATIONS, LOCATION_BY_ID, REGIONS, REGION_UNLOCK } from '../data/locations.js';
import { DISHES, DISH_BY_ID } from '../data/dishes.js';
import { INGREDIENTS, SPECIAL_ITEMS, RARE_BY_LOC, RARE_BY_REGION, RARE_ITEMS } from '../data/ingredients.js';
import { NPCS } from '../data/npcs.js';
import { MAIN_QUESTS } from '../data/quests.js';
import { bump, addXp, addRep, maxStamina, spendStamina, regenStamina, bonus } from './progression.js';
import { spend, gain, gainItem, stock } from './economy.js';
import { applyReward, refreshQuests } from './quests.js';
import { randInt, pick, chance, shuffle } from './rng.js';
import { toast, emit } from './bus.js';

const mainTitle = Object.fromEntries(MAIN_QUESTS.map((q) => [q.id, q.title]));

export function regionStatus(state, region) {
  if (state.regions[region]) return { open: true };
  const u = REGION_UNLOCK[region];
  const needQuest = u.quest && state.quests[u.quest]?.status !== 'claimed';
  const reasons = [];
  if (state.level < u.level) reasons.push(`đạt cấp độ ${u.level}`);
  if (needQuest) reasons.push(`nhận thưởng nhiệm vụ "${mainTitle[u.quest]}"`);
  return { open: false, reason: `Để mở ${REGIONS[region].name}: ${reasons.join(' và ') || 'nhận thưởng nhiệm vụ chính'}.` };
}

export function locationStatus(state, loc) {
  if (state.visited[loc.id]) return { visited: true, open: true };
  const rs = regionStatus(state, loc.region);
  if (!rs.open) return { open: false, reason: rs.reason };
  if (state.level < loc.level) return { open: false, reason: `Cần đạt cấp độ ${loc.level}.` };
  const inRegion = LOCATIONS.filter((l) => l.region === loc.region);
  const i = inRegion.findIndex((l) => l.id === loc.id);
  if (i > 0 && !state.visited[inRegion[i - 1].id]) return { open: false, reason: `Hãy ghé ${inRegion[i - 1].name} trước.` };
  return { open: true, visited: false };
}

export function visit(state, locId) {
  const loc = LOCATION_BY_ID[locId];
  if (!loc) return { ok: false, reason: 'Địa điểm không tồn tại.' };
  const st = locationStatus(state, loc);
  if (st.visited) return { ok: true, already: true };
  if (!st.open) return { ok: false, reason: st.reason };
  if (state.cash < loc.fare) return { ok: false, reason: `Cần ${vnd(loc.fare)} tiền tàu xe.` };
  if (!spendStamina(state, 1)) return { ok: false, reason: 'Hết thể lực. Chờ hồi thể lực hoặc qua ngày mới.' };
  spend(state, loc.fare, 'fare');
  state.visited[locId] = true;
  for (const d of DISHES) if (d.loc === locId) state.seen[d.id] = true;
  bump(state, 'visited');
  toast(`Bạn đã đến ${loc.name}!`, 'good');
  emit('sfx', 'travel');
  refreshQuests(state);
  return { ok: true, first: true };
}

const SECRET_OF = { bac: 'pho-ganh-hoa-sua', trung: 'banh-la-mo-co-do', nam: 'che-song-dem-trang' };

export const BOARD_SIZE = 15;

/** Mở bảng thẻ úp (miễn phí): 15 thẻ, mỗi lần lật một thẻ tốn 1 thể lực. Bảng được giữ lại cho tới khi lật hết. */
export function gatherDraw(state, locId) {
  const loc = LOCATION_BY_ID[locId];
  if (!loc || !state.visited[locId]) return { ok: false, reason: 'Bạn chưa đến địa điểm này.' };
  if (state.draw && state.draw.loc === locId) return { ok: true, pending: true, draw: state.draw };
  if (state.draw) return { ok: false, reason: 'Bạn đang có một bảng thẻ ở nơi khác, hãy lật xong hoặc bỏ qua trước.' };
  state.draw = { loc: locId, n: BOARD_SIZE, flipped: {} };
  return { ok: true, draw: state.draw };
}

/** Tung phần thưởng cho một thẻ (có bảo hiểm Hiếm/Quý/trang sổ tính theo số lần lật ở địa điểm). */
function rollCard(state, locId) {
  const loc = LOCATION_BY_ID[locId];
  const g = (state.gather[locId] ||= { count: 0, pity: 0, pr: 0, pq: 0 });
  g.count += 1; g.pity += 1; g.pr = (g.pr || 0) + 1; g.pq = (g.pq || 0) + 1;
  const kinds = shuffle(state, loc.gather).slice(0, randInt(state, 2, 3));
  const card = { got: kinds.map((id) => ({ id, qty: randInt(state, 1, 3) })), page: null, rare: [] };
  const secretId = SECRET_OF[loc.region];
  if (!state.learned[secretId] && (g.pity >= 5 || chance(state, 0.12))) { card.page = DISH_BY_ID[secretId].page; g.pity = 0; }
  if (g.pr >= 5 || chance(state, 0.25)) { card.rare.push(RARE_BY_LOC[locId]); g.pr = 0; }
  if (g.pq >= 12 || chance(state, 0.08)) { card.rare.push(RARE_BY_REGION[loc.region]); g.pq = 0; }
  return card;
}

/** Lật thẻ số i: tốn 1 thể lực, nhận thưởng ngay. */
export function gatherFlip(state, i) {
  const d = state.draw;
  if (!d || !(i >= 0 && i < d.n)) return { ok: false, reason: 'Không có bảng thẻ nào đang mở.' };
  if (d.flipped[i]) return { ok: false, reason: 'Thẻ này đã lật rồi.' };
  if (!spendStamina(state, 1)) return { ok: false, reason: 'Hết thể lực. Chờ hồi thể lực hoặc qua ngày mới.' };
  const card = rollCard(state, d.loc);
  card.got = card.got.map((x) => ({ ...x, added: gain(state, x.id, x.qty) }));
  if (card.page) gainItem(state, card.page, 1);
  for (const r of card.rare) gainItem(state, r, 1);
  if (card.rare.length) bump(state, 'rareFound', card.rare.length);
  d.flipped[i] = { got: card.got.map((x) => ({ id: x.id, qty: x.qty })), page: card.page, rare: card.rare };
  bump(state, 'gather');
  emit('sfx', card.rare.length || card.page ? 'unlock' : 'pick');
  checkSecrets(state);
  const left = d.n - Object.keys(d.flipped).length;
  if (left <= 0) state.draw = null;
  refreshQuests(state);
  return { ok: true, card, index: i, got: card.got, page: card.page, rare: card.rare, left };
}

/** Lật nhanh: lật lần lượt các thẻ chưa lật bằng toàn bộ thể lực đang có (tối đa max thẻ). */
export function gatherFlipMany(state, max = 99) {
  const d = state.draw;
  if (!d) return { ok: false, reason: 'Không có bảng thẻ nào đang mở.' };
  const results = [];
  for (let i = 0; i < d.n && results.length < max; i++) {
    if (!state.draw || state.draw.flipped[i]) continue;
    const r = gatherFlip(state, i);
    if (!r.ok) { if (!results.length) return r; break; }
    results.push(r);
  }
  return { ok: true, results };
}
export function gatherDiscard(state) { state.draw = null; return { ok: true }; }

/** Thu thập nhanh: mở bảng và lật một thẻ (dùng cho kiểm thử/bot). */
export function gatherAt(state, locId) {
  const r = gatherDraw(state, locId);
  if (!r.ok) return r;
  const i = Array.from({ length: state.draw.n }, (_, k) => k).find((k) => !state.draw.flipped[k]);
  const f = gatherFlip(state, i);
  if (state.draw && state.draw.loc === locId && !Object.keys(state.draw.flipped).length) state.draw = null;
  return f.ok ? { ok: true, got: f.got, page: f.page, rare: f.rare } : f;
}

/** Đủ 3 trang sổ rách của một miền thì ghép thành công thức bí mật. */
export function checkSecrets(state) {
  for (const d of DISHES) {
    if (!d.secret || state.learned[d.id]) continue;
    if ((state.items[d.page] || 0) >= 3) {
      state.items[d.page] -= 3;
      state.learned[d.id] = true;
      state.seen[d.id] = true;
      bump(state, 'learned');
      toast(`Ghép đủ ba trang sổ: mở khóa công thức bí mật "${d.name}"!`, 'good');
      emit('unlock', { dish: d, secret: true });
    }
  }
}

export function learnStatus(state, dish) {
  if (state.learned[dish.id]) return { learned: true };
  if (dish.secret) return { learned: false, locked: true, reason: `Gom đủ 3 ${SPECIAL_ITEMS[dish.page].name} để ghép công thức (${state.items[dish.page] || 0}/3).` };
  if (!state.visited[dish.loc]) return { learned: false, locked: true, reason: 'Hãy đến địa điểm này trước.' };
  if (state.level < dish.level) return { learned: false, locked: true, reason: `Cần đạt cấp độ ${dish.level}.` };
  if (state.cash < dish.learnCost) return { learned: false, locked: false, affordable: false, cost: dish.learnCost, reason: 'Chưa đủ tiền học phí.' };
  return { learned: false, locked: false, affordable: true, cost: dish.learnCost };
}

export function learnDish(state, dishId) {
  const dish = DISH_BY_ID[dishId];
  if (!dish) return { ok: false, reason: 'Món không tồn tại.' };
  const st = learnStatus(state, dish);
  if (st.learned) return { ok: false, reason: 'Bạn đã biết món này.' };
  if (st.locked || !st.affordable) return { ok: false, reason: st.reason };
  spend(state, dish.learnCost, 'learn');
  state.learned[dishId] = true;
  state.seen[dishId] = true;
  bump(state, 'learned');
  if (state.menu.ids.length < bonus(state).menuSlots) state.menu.ids.push(dishId);
  emit('unlock', { dish, secret: false });
  emit('sfx', 'unlock');
  refreshQuests(state);
  return { ok: true, dish };
}

// ---------- Nhân vật ----------
export function npcOf(state, npcId) { return (state.npc[npcId] ||= { talked: 0, friend: 0 }); }

export function topicsOf(state, npcId) {
  return NPCS[npcId].topics.map(([q, a], i) => ({ q, a, i, done: Boolean(state.dialog[`topic:${npcId}:${i}`]) }));
}
export function askTopic(state, npcId, i) {
  const npc = NPCS[npcId];
  if (!npc || !npc.topics[i]) return { ok: false };
  const loc = LOCATION_BY_ID[npc.loc];
  const key = `topic:${npcId}:${i}`;
  let reward = '';
  if (!state.dialog[key]) {
    state.dialog[key] = true; // đặt cờ trước khi phát thưởng
    const t = LOCATIONS.indexOf(loc);
    reward = applyReward(state, { xp: 10 + t * 2, items: { [loc.gather[i % loc.gather.length]]: 2 } });
    npcOf(state, npcId).talked += 1;
    refreshQuests(state);
  }
  return { ok: true, text: npc.topics[i][1], reward };
}

export function requestOf(state, npcId) {
  const npc = NPCS[npcId], loc = LOCATION_BY_ID[npc.loc];
  const f = npcOf(state, npcId).friend;
  if (f >= 3) return { full: true };
  const dish = DISH_BY_ID[loc.wants[f]];
  return { full: false, index: f, dish, text: npc.asks[f][0], learned: Boolean(state.learned[dish.id]) };
}

export function requestReward(state, loc, index) {
  const t = LOCATIONS.indexOf(loc);
  const base = [
    { money: 60 + t * 25, xp: 40 + t * 8 },
    { money: 100 + t * 40, xp: 70 + t * 12, items: { [loc.gather[0]]: 3 } },
    { money: 180 + t * 70, xp: 120 + t * 20, rep: 3 },
  ];
  return base[index];
}

/** Gọi sau khi nấu tặng xong. stars >= 2 mới hoàn thành lời nhờ. */
export function completeRequest(state, npcId, stars) {
  const npc = NPCS[npcId], loc = LOCATION_BY_ID[npc.loc];
  const rq = requestOf(state, npcId);
  if (rq.full) return { ok: false, reason: 'Bạn đã hoàn thành mọi lời nhờ của nhân vật này.' };
  if (stars < 2) return { ok: false, reason: 'Món chưa đủ ngon (cần từ 2 sao). Hãy thử lại!' };
  const n = npcOf(state, npcId);
  const idx = n.friend;
  n.friend += 1; // tăng trước khi phát thưởng để không nhận trùng
  bump(state, 'gifts');
  let text = applyReward(state, requestReward(state, loc, idx));
  if (idx === 2) {
    const page = ({ bac: 'trang-so-bac', trung: 'trang-so-trung', nam: 'trang-so-nam' })[loc.region];
    gainItem(state, page, 1);
    text += `, +1 ${SPECIAL_ITEMS[page].name}`;
    checkSecrets(state);
  }
  refreshQuests(state);
  emit('sfx', 'quest');
  return { ok: true, text, done: npc.asks[idx][1], full: n.friend >= 3 };
}

export function staminaText(state) { return `${state.stamina}/${maxStamina(state)}`; }
export { stock, INGREDIENTS };
