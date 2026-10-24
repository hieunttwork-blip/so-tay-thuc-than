// Kho & chợ, Sổ tay món ăn, Bản đồ khám phá.
import { icon } from '../art/icons.js';
import { mapSVG, sceneSVG } from '../art/scenes.js';
import { DISHES, DISH_BY_ID, CATEGORIES, EXTRAS, GARNISHES } from '../data/dishes.js';
import { INGREDIENTS, INGREDIENT_GROUPS, SPECIAL_ITEMS, RARE_ITEMS, RARITY, RARE_BY_LOC, RARE_BY_REGION, itemName } from '../data/ingredients.js';
import { levelMult, masteryOf, ascendStatus, ascend, MASTERY_NAMES, MASTERY_MULT, MASTERY_POINTS } from '../core/mastery.js';
import { HEATS, methodOf, tasteOf, TASTE_DIMS } from '../core/cooking.js';
import { REGIONS, REGION_ORDER, LOCATIONS, LOCATION_BY_ID } from '../data/locations.js';
import { NPCS } from '../data/npcs.js';
import { getState, commit } from '../core/store.js';
import { stock, storageCap, isBuyable, ingredientPrice, buyCart, cartTotal, hasAll, dishCostNow } from '../core/economy.js';
import { menuAdd, menuRemove, menuPrice, priceMult, dishEconomics } from '../core/service.js';
import { bonus } from '../core/progression.js';
import { regionStatus, locationStatus, visit, learnStatus, learnDish, npcOf, topicsOf, askTopic, requestOf } from '../core/explore.js';
import { collections, milestoneState, claimCollection, describeReward } from '../core/quests.js';
import { emit } from '../core/bus.js';
import { ACT, SCREENS, ui, go, refresh, mutate } from './app.js';
import { openModal, closeModal, updateModal, toast, floatAt, confirmDialog } from './kit.js';
import { esc, money, num, dishArt, person, bar, tabs, diffDots, stars, emptyState, catChip, regionChip, dishStatus } from './util.js';
import { startCook } from './cook.js';
import { ingIcon } from '../art/ingicons.js';
import { openDraw, hasPendingDraw, infoBtn, menuManager } from './extras.js';

// ================= Kho & chợ =================
const GROUP_IDS = Object.keys(INGREDIENT_GROUPS);

function rareRow(s, id) {
  const it = RARE_ITEMS[id];
  return `<li class="row-item"><span class="ri-ic ${RARITY[it.rarity].cls}">${icon('sparkle', 26)}</span><span class="ri-main"><b>${esc(it.name)}</b><small><span class="rare ${RARITY[it.rarity].cls}">${RARITY[it.rarity].name}</span> · ${it.loc ? esc(LOCATION_BY_ID[it.loc].name) : esc(REGIONS[it.region].name)}</small></span><b>×${s.items[id] || 0}</b></li>`;
}
function ingRow(s, id, mode) {
  const ing = INGREDIENTS[id];
  const have = stock(s, id), cap = storageCap(s);
  const room = cap - have;
  const price = ingredientPrice(id);
  const inCart = ui.market.cart[id] || 0;
  const canAdd = (q) => room - inCart >= q && cartTotal(ui.market.cart) + price * q <= s.cash;
  return `<li class="row-item ${inCart ? 'incart' : ''}"><span class="ri-ic">${ingIcon(id, 30)}</span>
  <span class="ri-main"><b>${esc(ing.name)}</b><small>${mode === 'market' ? `${money(price)} / SL · Kho ${have}/${cap}` : `Còn ${have}`}</small>${inCart ? `<small class="cart-n">Trong giỏ: <b>${inCart}</b> SL · ${money(price * inCart)}</small>` : ''}</span>
  ${mode === 'market' ? `<span class="ri-act">${inCart ? `<button type="button" class="btn small ghost" data-act="cart-add" data-id="${id}" data-q="-1" aria-label="Bớt 1 ${esc(ing.name)}">−1</button>` : ''}<button type="button" class="btn small" data-act="cart-add" data-id="${id}" data-q="1" ${canAdd(1) ? '' : 'disabled'}>+1</button><button type="button" class="btn small" data-act="cart-add" data-id="${id}" data-q="5" ${canAdd(5) ? '' : 'disabled'}>+5</button></span>` : ''}</li>`;
}
function cartBar(s) {
  const cart = ui.market.cart;
  const n = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = cartTotal(cart);
  return `<div class="cartbar ${n ? 'has' : ''}" role="region" aria-label="Giỏ hàng">
    <div class="cart-sum">${icon('shop', 20)}<div><b>Giỏ hàng: ${n} SL</b><small>Tổng ${money(total)} · Tiền có ${money(s.cash)}${total > s.cash ? ' · <span class="warn">vượt quá số tiền</span>' : ''}</small></div></div>
    <div class="row"><button type="button" class="btn ghost small" data-act="cart-clear" ${n ? '' : 'disabled'}>Bỏ hết</button><button type="button" class="btn primary" data-act="cart-pay" ${n && total <= s.cash ? '' : 'disabled'}>${icon('money', 18)}<span>Thanh toán ${n ? money(total) : ''}</span></button></div></div>`;
}

function marketTab(s) {
  const g = ui.market.group;
  const chips = `<div class="chips" role="group" aria-label="Lọc nhóm nguyên liệu"><button type="button" class="chip btnchip ${g === '' ? 'on' : ''}" data-act="mk-group" data-g="">Tất cả</button>${GROUP_IDS.map((id) => `<button type="button" class="chip btnchip ${g === id ? 'on' : ''}" data-act="mk-group" data-g="${id}">${icon(INGREDIENT_GROUPS[id].icon, 16)}${esc(INGREDIENT_GROUPS[id].name)}</button>`).join('')}</div>`;
  const all = Object.keys(INGREDIENTS).filter((id) => !g || INGREDIENTS[id].group === g);
  const buyable = all.filter((id) => isBuyable(s, id));
  const locked = all.filter((id) => !isBuyable(s, id));
  const quick = `<div class="quickbuy"><b>Mua nhanh</b><small>mỗi loại đang hiện:</small><button type="button" class="btn small" data-act="quick-all" data-q="1">SL 1</button><button type="button" class="btn small" data-act="quick-all" data-q="5">SL 5</button></div>`;
  return `${chips}${quick}<ul class="list">${buyable.map((id) => ingRow(s, id, 'market')).join('') || '<li class="muted">Không có nguyên liệu nào trong nhóm này.</li>'}</ul>
  ${locked.length ? `<details class="card"><summary>Chưa có ở chợ (${locked.length})</summary><ul class="list plain">${locked.map((id) => {
    const a = INGREDIENTS[id].avail;
    return `<li class="row-item"><span class="ri-ic">${icon('lock', 22)}</span><span class="ri-main"><b>${esc(INGREDIENTS[id].name)}</b><small>${a === 'hiem' ? 'Nguyên liệu hiếm, chỉ kiếm được khi khám phá.' : `Mở khóa ${REGIONS[a].name} để mua.`}</small></span></li>`;
  }).join('')}</ul></details>` : ''}${cartBar(s)}`;
}
function forageTab(s) {
  const locs = LOCATIONS.filter((l) => s.visited[l.id]);
  const g = ui.gatherResult;
  return `<div class="card"><h3>${icon('g-rau', 22)} Đi thu thập nguyên liệu</h3>
  <p>Mỗi lần thu thập tốn <b>1 thể lực</b> (còn ${s.stamina}, hồi dần theo thời gian) và bạn <b>lật 1 trong 3 thẻ úp</b> để nhận thưởng. Bạn nhận nguyên liệu thường để nấu, và có cơ hội nhặt <b>nguyên liệu thăng hoa</b> dùng để nâng món lên cấp 5.</p>
  <div class="rarity-legend"><span class="rare r-hiem">Hiếm</span> riêng từng địa điểm, khoảng 1 trong 4 lần <span class="rare r-quy">Quý</span> riêng từng miền, hiếm hơn nhiều. Có bảo hiểm: chắc chắn rơi sau 5 lần (Hiếm) và 12 lần (Quý) ở cùng một địa điểm.</div></div>
  ${g ? `<div class="note good" aria-live="polite">${icon('sparkle', 18)}<div><b>${esc(LOCATION_BY_ID[g.loc].name)}:</b> ${g.got.map((x) => `${x.added < x.qty ? `${x.added}/${x.qty}` : x.qty} ${esc(INGREDIENTS[x.id].name)}`).join(', ')}${g.rare && g.rare.length ? `<br>${g.rare.map((id) => `<b class="rare ${RARITY[RARE_ITEMS[id].rarity].cls}">${RARITY[RARE_ITEMS[id].rarity].name}: ${esc(RARE_ITEMS[id].name)}</b>`).join(', ')}` : ''}${g.page ? `<br><b>Nhặt được ${esc(SPECIAL_ITEMS[g.page].name)}!</b>` : ''}${g.got.some((x) => x.added < x.qty) ? '<br><small>Kho đầy nên một phần bị bỏ lại.</small>' : ''}</div></div>` : ''}
  <ul class="list">${locs.map((l) => {
    const rid = RARE_BY_LOC[l.id], gp = s.gather[l.id] || {};
    return `<li class="row-item forage-row"><span class="ri-main"><b>${esc(l.name)}</b><small>Có thể gặp: ${l.gather.map((id) => esc(INGREDIENTS[id].name)).join(', ')}</small><small><span class="rare r-hiem">Hiếm</span> ${esc(RARE_ITEMS[rid].name)} (đang có ${s.items[rid] || 0}) · lần thu thập: ${gp.count || 0}</small></span>
    <button type="button" class="btn primary" data-act="forage" data-id="${l.id}" ${s.stamina < 1 && !s.draw ? 'disabled' : ''}>${icon('g-rau', 18)}<span>${s.draw && s.draw.loc === l.id ? 'Tiếp tục lật thẻ' : 'Lật thẻ'}</span></button></li>`;
  }).join('')}</ul>
  ${['bac', 'trung', 'nam'].filter((r) => s.regions[r]).map((r) => `<p class="muted"><span class="rare r-quy">Quý</span> ${esc(RARE_ITEMS[RARE_BY_REGION[r]].name)} (${esc(REGIONS[r].name)}): đang có ${s.items[RARE_BY_REGION[r]] || 0}</p>`).join('')}`;
}
ACT.forage = (el) => openDraw(el.dataset.id);
function storeTab(s) {
  const ids = Object.keys(INGREDIENTS).filter((id) => stock(s, id) > 0);
  const specials = Object.keys(SPECIAL_ITEMS).filter((id) => (s.items[id] || 0) > 0);
  const rares = Object.keys(RARE_ITEMS).filter((id) => (s.items[id] || 0) > 0);
  return `<p class="muted">Sức chứa tối đa ${storageCap(s)} SL cho mỗi loại nguyên liệu. ${s.upgrades.storage < 3 ? 'Nâng cấp Kho lạnh để chứa thêm.' : ''}</p>
  ${rares.length ? `<div class="card"><h3>${icon('sparkle', 20)} Nguyên liệu thăng hoa</h3><p class="muted">Dùng để nâng món lên cấp 5 THỰC THẦN (xem trong Sổ tay). Không tốn chỗ trong kho.</p><ul class="list plain">${rares.map((id) => rareRow(s, id)).join('')}</ul></div>` : ''}
  ${specials.length ? `<div class="card"><h3>${icon('scroll', 20)} Vật phẩm đặc biệt</h3><ul class="list plain">${specials.map((id) => `<li class="row-item"><span class="ri-ic">${icon('page', 28)}</span><span class="ri-main"><b>${esc(SPECIAL_ITEMS[id].name)}</b><small>Có ${s.items[id]}/3 để ghép công thức bí mật</small></span></li>`).join('')}</ul></div>` : ''}
  ${ids.length ? `<ul class="list">${ids.map((id) => ingRow(s, id, 'store')).join('')}</ul>` : emptyState('shop', 'Kho đang trống', 'Hãy mua nguyên liệu ở tab Chợ hoặc thu thập khi khám phá.')}`;
}
function menuTab(s) { return menuManager(s); }
SCREENS.pantry = {
  render(s) {
    const t = ui.tab.pantry;
    return `<h1>Kho & chợ</h1>${tabs([['market', 'Chợ'], ['forage', 'Thu thập'], ['store', 'Kho'], ['menu', 'Thực đơn']], t, 'tab-pantry')}
    <div class="tabpane">${t === 'market' ? marketTab(s) : t === 'forage' ? forageTab(s) : t === 'store' ? storeTab(s) : menuTab(s)}</div>`;
  },
};
ACT['tab-pantry'] = (el) => { ui.tab.pantry = el.dataset.tab; refresh(); };
ACT['mk-group'] = (el) => { ui.market.group = el.dataset.g; refresh(); };
ACT['cart-add'] = (el) => {
  const s = getState(), id = el.dataset.id, q = Number(el.dataset.q), cart = ui.market.cart;
  const price = ingredientPrice(id), room = storageCap(s) - stock(s, id);
  if (q > 0) {
    if ((cart[id] || 0) + q > room) { toast('Kho không đủ chỗ cho số lượng này.', 'bad'); return; }
    if (cartTotal(cart) + price * q > s.cash) { toast('Giỏ hàng sẽ vượt quá số tiền đang có.', 'bad'); return; }
  }
  cart[id] = Math.max(0, (cart[id] || 0) + q);
  if (!cart[id]) delete cart[id];
  emit('sfx', 'pick');
  refresh();
};
ACT['cart-clear'] = () => { ui.market.cart = {}; refresh(); };
ACT['cart-pay'] = async () => {
  const s = getState(), cart = ui.market.cart;
  const n = Object.values(cart).reduce((a, b) => a + b, 0), total = cartTotal(cart);
  if (!n) return;
  const ok = await confirmDialog({ title: 'Thanh toán giỏ hàng?', text: `Mua ${n} SL nguyên liệu, tổng ${money(total)}. Bạn còn ${money(s.cash - total)} sau khi mua.`, ok: `Trả ${money(total)}`, cancel: 'Xem lại' });
  if (!ok) return;
  const r = mutate((st) => buyCart(st, cart));
  if (r.ok) { ui.market.cart = {}; toast(`Đã mua ${r.n} SL, chi ${money(r.cost)}.`, 'good'); }
  refresh();
};
// Mua nhanh: mỗi loại đang hiện lấy SL 1 hoặc 5 (có hỏi lại trước khi trả tiền).
ACT['quick-all'] = async (el) => {
  const s = getState(), q = Number(el.dataset.q), g = ui.market.group;
  const ids = Object.keys(INGREDIENTS).filter((id) => (!g || INGREDIENTS[id].group === g) && isBuyable(s, id));
  const cart = {};
  let skipped = 0, total = 0;
  for (const id of ids) {
    const room = storageCap(s) - stock(s, id), p = ingredientPrice(id);
    const k = Math.min(q, room);
    if (k <= 0 || total + p * k > s.cash) { skipped++; continue; }
    cart[id] = k; total += p * k;
  }
  const n = Object.values(cart).reduce((a, b) => a + b, 0);
  if (!n) { toast('Không mua được: kho đầy hoặc chưa đủ tiền.', 'bad'); return; }
  const ok = await confirmDialog({ title: `Mua nhanh mỗi loại SL ${q}?`, text: `${Object.keys(cart).length} loại, ${n} SL, tổng ${money(total)}.${skipped ? ` Bỏ qua ${skipped} loại vì kho đầy hoặc hết tiền.` : ''}`, ok: `Trả ${money(total)}`, cancel: 'Thôi' });
  if (!ok) return;
  const r = mutate((st) => buyCart(st, cart));
  if (r.ok) toast(`Đã mua ${r.n} SL, chi ${money(r.cost)}.`, 'good');
  refresh();
};
ACT.price = (el) => mutate((s) => menuPrice(s, el.dataset.id, priceMult(s, el.dataset.id) + Number(el.dataset.d)), false);
ACT['menu-rm'] = (el) => mutate((s) => menuRemove(s, el.dataset.id));
ACT['menu-add'] = (el) => mutate((s) => menuAdd(s, el.dataset.id));

// ================= Sổ tay =================
const SORTS = { level: 'Cấp độ', name: 'Tên A-Z', price: 'Giá bán cao nhất', profit: 'Lãi cao nhất', region: 'Miền', stars: 'Số lần nấu' };
const econ = (s, d) => (s.learned[d.id] ? dishEconomics(s, d.id) : (() => { const cost = dishCostNow(d); return { price: d.price, cost, profit: d.price - cost, margin: Math.round(((d.price - cost) / d.price) * 100) }; })());
function nbFilter(s) {
  const f = ui.nb;
  const q = f.q.trim().toLowerCase();
  let list = DISHES.filter((d) => {
    const st = dishStatus(s, d).id;
    if (d.secret && st === 'unknown') return f.status === '' || f.status === 'unknown';
    if (f.region && d.region !== f.region) return false;
    if (f.cat && d.cat !== f.cat) return false;
    if (f.status && st !== f.status) return false;
    if (q) { if (st === 'unknown') return false; if (!(d.name.toLowerCase().includes(q) || Object.keys(d.ingredients).some((i) => INGREDIENTS[i].name.toLowerCase().includes(q)))) return false; }
    return true;
  });
  const cmp = {
    level: (a, b) => a.level - b.level || a.name.localeCompare(b.name, 'vi'),
    name: (a, b) => a.name.localeCompare(b.name, 'vi'),
    price: (a, b) => econ(s, b).price - econ(s, a).price || a.level - b.level,
    profit: (a, b) => econ(s, b).profit - econ(s, a).profit || a.level - b.level,
    region: (a, b) => a.region.localeCompare(b.region) || a.level - b.level,
    stars: (a, b) => (s.dishStats[b.id]?.cooked || 0) - (s.dishStats[a.id]?.cooked || 0),
  }[f.sort];
  return list.sort(cmp);
}
function dishCard(s, d) {
  const st = dishStatus(s, d);
  const known = st.id !== 'unknown';
  const best = s.dishStats[d.id]?.best || 0;
  const ml = s.learned[d.id] ? masteryOf(s, d.id) : null;
  return `<div class="dwrap">${infoBtn(d.id, 'corner')}<button type="button" class="dcard ${st.cls} ${ml && ml.asc ? 'lv5' : ''}" data-act="dish-open" data-id="${d.id}" aria-label="${known ? esc(d.name) : 'Món chưa khám phá'}">
    <span class="dart ${known ? '' : 'veil'}">${dishArt(d, 84)}${known ? '' : `<i class="lockmark">${icon('lock', 22)}</i>`}</span>
    <b>${known ? esc(d.name) : 'Món chưa biết'}</b>
    ${known ? (() => { const e = econ(s, d); return `<span class="dprice"><span>Giá <b>${money(e.price)}</b></span><span class="pf">Lãi <b>${money(e.profit)}</b></span><span>${e.margin}%</span></span>`; })() : ''}
    <span class="dmeta">${regionChip(d.region)}${known ? catChip(d.cat) : ''}</span>${ml ? `<span class="mlv lv${ml.level}">${ml.asc ? `<span class="asc-stars">${stars(3, 3, 15)}</span><em>THỰC THẦN</em>` : `Lv ${ml.level}`}</span>` : ''}
    <span class="dstate"><em>${st.label}</em>${best ? `<span class="stars">${stars(best, 3, 12)}</span>` : ''}</span></button></div>`;
}
function notebookDishes(s) {
  const f = ui.nb;
  const list = nbFilter(s);
  const learned = Object.keys(s.learned).filter((id) => !DISH_BY_ID[id].secret).length;
  const secrets = Object.keys(s.learned).filter((id) => DISH_BY_ID[id].secret).length;
  const cooked = Object.values(s.dishStats).filter((x) => x.cooked > 0).length;
  return `<div class="nb-sum"><span class="chip">${icon('book', 16)}Đã học ${learned}/90</span><span class="chip">${icon('cook', 16)}Đã nấu ${cooked}</span><span class="chip">${icon('scroll', 16)}Bí mật ${secrets}/3</span></div>
  <div class="filters">
    <label class="search">${icon('search', 18)}<input type="search" data-input="nb-q" placeholder="Tìm món hoặc nguyên liệu" value="${esc(f.q)}" aria-label="Tìm kiếm món"></label>
    <select data-change="nb-region" aria-label="Lọc theo miền"><option value="">Mọi miền</option>${REGION_ORDER.map((r) => `<option value="${r}" ${f.region === r ? 'selected' : ''}>${REGIONS[r].name}</option>`).join('')}</select>
    <select data-change="nb-cat" aria-label="Lọc theo loại món"><option value="">Mọi loại</option>${Object.entries(CATEGORIES).map(([id, c]) => `<option value="${id}" ${f.cat === id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
    <select data-change="nb-status" aria-label="Lọc theo trạng thái"><option value="">Mọi trạng thái</option>${[['learned', 'Đã học'], ['cooked', 'Đã nấu'], ['mastered', 'Làm chủ'], ['seen', 'Đã khám phá'], ['unknown', 'Chưa biết']].map(([id, l]) => `<option value="${id}" ${f.status === id ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select data-change="nb-sort" aria-label="Sắp xếp">${Object.entries(SORTS).map(([id, l]) => `<option value="${id}" ${f.sort === id ? 'selected' : ''}>Xếp theo: ${l}</option>`).join('')}</select>
  </div>
  <p class="muted" aria-live="polite">${list.length} món${f.q || f.region || f.cat || f.status ? ' phù hợp' : ''}</p>
  ${list.length ? `<div class="dgrid">${list.slice(0, f.limit).map((d) => dishCard(s, d)).join('')}</div>${list.length > f.limit ? `<div class="row center"><button type="button" class="btn" data-act="nb-more">Xem thêm (${list.length - f.limit})</button></div>` : ''}` : emptyState('search', 'Không tìm thấy món nào', 'Hãy thử bỏ bớt bộ lọc hoặc đổi từ khóa.', '<button type="button" class="btn" data-act="nb-reset">Xóa bộ lọc</button>')}`;
}
function notebookCollections(s) {
  return `<div class="col-list">${collections(s).map((c) => {
    const title = c.kind === 'region' ? REGIONS[c.key].name : CATEGORIES[c.key].name;
    const ico = c.kind === 'region' ? 'r-' + c.key : CATEGORIES[c.key].icon;
    return `<div class="card"><h3>${icon(ico, 24)} ${esc(title)}</h3><p class="muted">Đã nấu ${c.done}/${c.total} món khác nhau</p>${bar((c.done / c.total) * 100, '', title)}
    <ul class="ms">${milestoneState(s, c).map((m) => `<li class="${m.claimed ? 'is-done' : ''}"><span>${m.need} món · ${esc(describeReward(m.reward))}</span>${m.claimed ? '<small>Đã nhận</small>' : `<button type="button" class="btn small ${m.reached ? 'primary' : ''}" data-act="col-claim" data-key="${m.key}" ${m.reached ? '' : 'disabled'}>Nhận</button>`}</li>`).join('')}</ul></div>`;
  }).join('')}</div>`;
}
SCREENS.notebook = {
  render(s) {
    return `<h1>Sổ tay</h1>${tabs([['dishes', 'Món ăn'], ['collections', 'Bộ sưu tập']], ui.nb.tab, 'tab-nb')}<div class="tabpane">${ui.nb.tab === 'dishes' ? notebookDishes(s) : notebookCollections(s)}</div>`;
  },
};
ACT['tab-nb'] = (el) => { ui.nb.tab = el.dataset.tab; refresh(); };
ACT['input:nb-q'] = (el) => { ui.nb.q = el.value; ui.nb.limit = 24; refresh(); };
for (const k of ['region', 'cat', 'status', 'sort']) ACT[`change:nb-${k}`] = (el) => { ui.nb[k] = el.value; ui.nb.limit = 24; refresh(); };
ACT['nb-more'] = () => { ui.nb.limit += 24; refresh(); };
ACT['nb-reset'] = () => { Object.assign(ui.nb, { q: '', cat: '', region: '', status: '', limit: 24 }); refresh(); };
ACT['col-claim'] = (el) => mutate((s) => claimCollection(s, el.dataset.key));

// ----- Hướng dẫn nấu A-Z và thông thạo -----
function guideHtml(s, d) {
  const m = methodOf(d), H = m.heat ? HEATS[m.heat] : null, ex = EXTRAS[d.cat];
  const li = [
    `<li><b>Nguyên liệu (điền sẵn):</b> ${Object.entries(d.ingredients).map(([id, q]) => `${q} ${esc(INGREDIENTS[id].name)}`).join(', ')}. Dư hoặc thiếu đều lệch vị. Khách có thể gọi thêm ${esc(ex.label)} (+1 ${esc(INGREDIENTS[ex.ing].name)}).${d.spicy ? ' Món có cay: chọn đúng độ cay khách yêu cầu.' : ''}</li>`,
    `<li><b>Sơ chế:</b> ${esc(m.verb)}, chạm nhanh vào các mục tiêu hiện ra (hoặc nhờ phụ bếp).</li>`,
    H ? `<li><b>Canh lửa:</b> ${esc(H.label)} (game tự chỉnh lửa ${H.temps[H.correct].toLowerCase()}), bấm Dừng khi chấm tròn nằm trong vùng xanh nhỏ. Trúng 3 lần là đủ 100 điểm.</li>` : '',
    `<li><b>Nêm vị:</b> ${TASTE_DIMS.map(([k, l]) => `${l} <b>${tasteOf(d)[k]}/4</b>`).join(', ')}.${d.spicy ? ' Khách gọi không cay thì Cay 0, gọi thật cay thì tăng thêm 1.' : ''} Đây là bước dùng trí nhớ, quên thì mua gợi ý.</li>`,
  ].join('');
  return `<h4>${icon('scroll', 18)} Cách nấu</h4><ol class="guide">${li}</ol><p class="muted">Quên mức vị thì bấm "Gợi ý vị" lúc nêm: 3 lần đầu miễn phí cho mỗi món, từ lần thứ 4 tốn tiền và bị trừ điểm. Nấu thử luôn miễn phí.</p>`;
}
function masteryHtml(s, d) {
  const m = masteryOf(s, d.id);
  const st = ascendStatus(s, d);
  let body = `<div class="mrow"><span class="mlv lv${m.level}">${m.asc ? `<span class="asc-stars">${stars(3, 3, 18)}</span><em>THỰC THẦN</em>` : `Lv ${m.level}`}</span><b>${esc(MASTERY_NAMES[m.level])}</b><small>Giá bán ×${MASTERY_MULT[m.level - 1].toFixed(2)}</small></div>`;
  if (m.asc) body += `<p class="good">Món đã đạt cấp tối đa, đóng khung vàng.</p>`;
  else {
    body += `${bar(m.pct, 'xp', 'Điểm thông thạo')}<small>${m.mp} điểm tích lũy${m.level < 4 ? ` · cấp ${m.level + 1} cần ${MASTERY_POINTS[m.level]}` : ` · cần ${MASTERY_POINTS[4]} để lên THỰC THẦN`}. Phục vụ khách đạt 1/2/3 sao được 1/2/4 điểm.</small>`;
    if (m.level >= 4 && st.needs) body += `<div class="note ${st.ok ? 'good' : ''}">${icon('sparkle', 18)}<div><b>Nâng lên THỰC THẦN (cấp 5):</b> cần đủ ${MASTERY_POINTS[4]} điểm và nguyên liệu thăng hoa:<ul class="ing-list">${st.needs.map((n) => `<li class="${n.have >= n.qty ? 'ok' : 'warn'}"><span><span class="rare ${RARITY[n.rarity].cls}">${RARITY[n.rarity].name}</span> ${n.qty} ${esc(n.name)}</span><small>Có ${n.have}</small></li>`).join('')}</ul><button type="button" class="btn primary" data-act="dish-ascend" data-id="${d.id}" ${st.ok ? '' : 'disabled'}>Thăng hoa thành THỰC THẦN</button>${st.ok ? '' : `<small>${esc(st.reason)}</small>`}</div></div>`;
  }
  return `<div class="mastery">${body}</div>`;
}
ACT['dish-ascend'] = (el) => { mutate((s) => ascend(s, el.dataset.id)); redrawDetail(); };

// ----- Chi tiết món -----
let detail = null;
function bars(d) {
  const t = tasteOf(d);
  return TASTE_DIMS.map(([k, l]) => `<li><span>${l}</span><div class="pips">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < t[k] ? 'on' : ''}"></i>`).join('')}</div></li>`).join('');
}
function detailHtml(s, d) {
  const st = dishStatus(s, d);
  const loc = LOCATION_BY_ID[d.loc];
  const stat = s.dishStats[d.id] || { cooked: 0, stars3: 0, sold: 0, best: 0 };
  if (st.id === 'unknown') {
    return `<div class="detail"><div class="dart veil big">${dishArt(d, 150)}<i class="lockmark">${icon('lock', 36)}</i></div><h2>Món chưa khám phá</h2>
    <div class="dmeta">${regionChip(d.region)}${catChip(d.cat)}</div>
    <p>${d.secret ? 'Đây là công thức bí mật. Hãy thu thập và nấu tặng nhân vật để gom đủ 3 trang sổ rách.' : `Hãy đến <b>${esc(loc.name)}</b> để biết thêm về món này.`}</p>
    <div class="row end"><button type="button" class="btn" data-act="modal-close" data-autofocus>Đóng</button></div></div>`;
  }
  const ls = learnStatus(s, d);
  const inMenu = s.menu.ids.includes(d.id);
  const ings = Object.entries(d.ingredients).map(([id, q]) => `<li class="${stock(s, id) >= q ? 'ok' : 'warn'}"><span>${q} ${esc(INGREDIENTS[id].name)}</span><small>Có ${stock(s, id)}</small></li>`).join('');
  let action = '';
  if (s.learned[d.id]) {
    action = `<button type="button" class="btn primary" data-act="dish-cook" data-id="${d.id}">${icon('cook', 18)}<span>Nấu thử (miễn phí)</span></button>
    ${inMenu ? `<button type="button" class="btn ghost" data-act="dish-menu-rm" data-id="${d.id}">Gỡ khỏi thực đơn</button>` : `<button type="button" class="btn" data-act="dish-menu-add" data-id="${d.id}">Thêm vào thực đơn</button>`}`;
  } else if (ls.locked) action = `<div class="note warn">${icon('lock', 18)}<div>${esc(ls.reason)}</div></div>`;
  else action = `<button type="button" class="btn primary" data-act="dish-learn" data-id="${d.id}" ${ls.affordable ? '' : 'disabled'}>${icon('book', 18)}<span>Học công thức (${money(ls.cost)})</span></button>${ls.affordable ? '' : `<small class="warn">${esc(ls.reason)}</small>`}`;
  const ml = masteryOf(s, d.id);
  return `<div class="detail"><div class="dart big ${s.learned[d.id] && ml.asc ? 'lv5' : ''}">${dishArt(d, 150)}</div><h2>${esc(d.name)} ${infoBtn(d.id)}</h2>
  <div class="dmeta">${regionChip(d.region)}${catChip(d.cat)}<span class="chip ${st.cls}">${st.label}</span>${d.spicy ? `<span class="chip warn">${icon('chili', 14)}Có cay</span>` : ''}${d.secret ? '<span class="chip gold">Bí mật</span>' : ''}</div>
  <p>${esc(d.desc)}</p><p class="cult">${icon('lantern', 16)} ${esc(d.cult)}</p>
  <div class="two"><div><h4>Nguyên liệu</h4><ul class="ing-list">${ings}</ul></div><div><h4>Hương vị</h4><ul class="tastes">${bars(d)}</ul><h4>Độ khó</h4><div class="diff">${diffDots(d.diff)}</div></div></div>
  ${s.learned[d.id] ? masteryHtml(s, d) + guideHtml(s, d) : `<div class="note">${icon('lock', 18)}<div>Học công thức để xem cách nấu từ A đến Z và theo dõi cấp thông thạo của món.</div></div>`}
  <ul class="facts"><li><span>Giá bán</span><b>${money(d.price)}</b></li><li><span>Giá vốn</span><b>${money(dishCostNow(d))}</b></li><li><span>Học phí</span><b>${d.learnCost ? money(d.learnCost) : 'Miễn phí'}</b></li><li><span>Cấp mở khóa</span><b>${d.level}</b></li><li><span>Xuất xứ</span><b>${esc(loc.name)}</b></li><li><span>Đã nấu</span><b>${stat.cooked} lần</b></li><li><span>Số lần 3 sao</span><b>${stat.stars3}</b></li><li><span>Đã bán</span><b>${stat.sold}</b></li></ul>
  <div class="row end wrap">${action}<button type="button" class="btn ghost" data-act="modal-close">Đóng</button></div></div>`;
}
function redrawDetail() { if (detail) { const d = DISH_BY_ID[detail.id]; updateModal(detail.modalId, detailHtml(getState(), d)); } }
export function openDish(id) {
  const d = DISH_BY_ID[id];
  if (!d) return;
  detail = { id, modalId: 0 };
  detail.modalId = openModal({ cls: 'dish-modal', label: d.name, html: detailHtml(getState(), d), onClose: () => { detail = null; } });
}
ACT['dish-open'] = (el) => openDish(el.dataset.id);
ACT['dish-learn'] = (el) => { const r = mutate((s) => learnDish(s, el.dataset.id)); if (r.ok) closeModal(); else redrawDetail(); };
ACT['dish-menu-add'] = (el) => { mutate((s) => menuAdd(s, el.dataset.id)); redrawDetail(); };
ACT['dish-menu-rm'] = (el) => { mutate((s) => menuRemove(s, el.dataset.id)); redrawDetail(); };
ACT['dish-cook'] = (el) => { const id = el.dataset.id; closeModal(); startCook({ dishId: id, mode: 'practice' }); };

// ================= Bản đồ =================
function regionTabs(s) {
  return `<div class="tabs" role="tablist">${REGION_ORDER.map((r) => {
    const open = regionStatus(s, r).open;
    return `<button type="button" role="tab" class="tab ${ui.mapRegion === r ? 'on' : ''}" aria-selected="${ui.mapRegion === r}" data-act="map-region" data-r="${r}">${open ? icon('r-' + r, 18) : icon('lock', 16)}${REGIONS[r].name}</button>`;
  }).join('')}</div>`;
}
function mapView(s, region) {
  const locs = LOCATIONS.filter((l) => l.region === region);
  return `<div class="map-wrap">${mapSVG(region)}${locs.map((l) => {
    const st = locationStatus(s, l);
    const cls = st.visited ? 'visited' : st.open ? 'open' : 'locked';
    return `<button type="button" class="node ${cls} ${ui.selLoc === l.id ? 'sel' : ''}" style="left:${l.pos[0]}%;top:${l.pos[1]}%" data-act="map-sel" data-id="${l.id}" aria-label="${esc(l.name)}${st.visited ? ', đã đến' : st.open ? '' : ', chưa mở'}"><span class="pin">${icon(st.visited ? 'check' : st.open ? 'lantern' : 'lock', 18)}</span><em>${esc(l.name)}</em></button>`;
  }).join('')}</div>`;
}
function locPanel(s) {
  const loc = LOCATION_BY_ID[ui.selLoc];
  if (!loc || loc.region !== ui.mapRegion) return `<div class="card muted-card">${icon('map', 28)}<div><b>Chọn một địa điểm trên bản đồ</b><p>Đến nơi mới để học món, thu thập nguyên liệu và gặp gỡ người dân. Mỗi chuyến đi tốn 1 thể lực.</p></div></div>`;
  const st = locationStatus(s, loc);
  const head = `<div class="scene">${sceneSVG(loc.scene)}</div><h2>${esc(loc.name)}</h2><p>${esc(loc.blurb)}</p>`;
  if (!st.visited) {
    return `<div class="card loc">${head}${st.open
      ? `<div class="row"><button type="button" class="btn primary" data-act="map-go" data-id="${loc.id}" ${s.stamina < 1 || s.cash < loc.fare ? 'disabled' : ''}>${icon('arrow-right', 18)}<span>Đi đến (${loc.fare ? money(loc.fare) : 'miễn phí'}, 1 thể lực)</span></button></div>${s.stamina < 1 ? '<small class="warn">Hết thể lực. Hãy kết thúc ngày để nghỉ.</small>' : s.cash < loc.fare ? '<small class="warn">Chưa đủ tiền tàu xe.</small>' : ''}`
      : `<div class="note warn">${icon('lock', 18)}<div>${esc(st.reason)}</div></div>`}</div>`;
  }
  const npc = NPCS[loc.npc], n = npcOf(s, loc.npc), rq = requestOf(s, loc.npc);
  const g = ui.gatherResult && ui.gatherResult.loc === loc.id ? ui.gatherResult : null;
  const dialog = ui.dialog && ui.dialog.npc === loc.npc ? ui.dialog : null;
  const dishes = DISHES.filter((d) => d.loc === loc.id && !d.secret);
  return `<div class="card loc">${head}
  <div class="row wrap"><button type="button" class="btn primary" data-act="map-gather" data-id="${loc.id}" ${s.stamina < 1 && !s.draw ? 'disabled' : ''}>${icon('g-rau', 18)}<span>${s.draw && s.draw.loc === loc.id ? 'Tiếp tục lật thẻ' : 'Lật thẻ thu thập (1 thể lực)'}</span></button></div>
  ${g ? `<div class="note good">${icon('sparkle', 18)}<div><b>Thu được:</b> ${g.got.map((x) => `${x.added < x.qty ? `${x.added}/${x.qty}` : x.qty} ${esc(INGREDIENTS[x.id].name)}`).join(', ')}${g.rare && g.rare.length ? `<br>${g.rare.map((id) => `<b class="rare ${RARITY[RARE_ITEMS[id].rarity].cls}">${RARITY[RARE_ITEMS[id].rarity].name}: ${esc(RARE_ITEMS[id].name)}</b>`).join(', ')}` : ''}${g.page ? `<br><b>Nhặt được ${esc(SPECIAL_ITEMS[g.page].name)}!</b>` : ''}${g.got.some((x) => x.added < x.qty) ? '<br><small>Kho đầy nên một phần bị bỏ lại.</small>' : ''}</div></div>` : ''}
  <h3>${icon('heart', 20)} ${esc(npc.name)} <small>${esc(npc.title)}</small></h3>
  <div class="npc">${person(npc.look, 72, npc.name)}<div class="bubble">${dialog ? esc(dialog.text) : esc(npc.greet.replace('{name}', s.name))}${dialog && dialog.reward ? `<small class="good">Quà: ${esc(dialog.reward)}</small>` : ''}</div></div>
  <div class="friend" aria-label="Độ thân thiết ${n.friend} trên 3">${[0, 1, 2].map((i) => icon(i < n.friend ? 'heart' : 'star-off', 18)).join('')}</div>
  <div class="topics">${topicsOf(s, loc.npc).map((t) => `<button type="button" class="btn ghost small" data-act="map-topic" data-npc="${loc.npc}" data-i="${t.i}">${esc(t.q)}${t.done ? ' ✓' : ''}</button>`).join('')}</div>
  ${rq.full ? `<div class="note good">${icon('heart', 18)}<div>Bạn và ${esc(npc.name)} đã là bạn thân.</div></div>`
    : `<div class="request"><b>Lời nhờ:</b> ${esc(rq.text)}<div class="row">${dishArt(rq.dish, 44)}<span><b>${esc(rq.dish.name)}</b><small>Cần nấu từ 2 sao</small></span>${rq.learned ? `<button type="button" class="btn primary" data-act="map-gift" data-npc="${loc.npc}" data-dish="${rq.dish.id}">${icon('cook', 18)}<span>Nấu tặng</span></button>` : `<button type="button" class="btn" data-act="dish-open" data-id="${rq.dish.id}">Học món này trước</button>`}</div></div>`}
  <h4>Món đặc sản nơi đây</h4>
  <ul class="list plain">${dishes.map((d) => { const ls = learnStatus(s, d); return `<li class="row-item">${dishArt(d, 44)}<span class="ri-main"><b>${esc(d.name)}</b><small>${s.learned[d.id] ? 'Đã học' : ls.locked ? esc(ls.reason) : `Học phí ${money(d.learnCost)}`}</small></span>${s.learned[d.id] ? `<span class="chip ok">${icon('check', 14)}</span>` : `<button type="button" class="btn small ${ls.locked || !ls.affordable ? '' : 'primary'}" data-act="map-learn" data-id="${d.id}" ${ls.locked || !ls.affordable ? 'disabled' : ''}>Học</button>`}<button type="button" class="btn ghost small" data-act="dish-open" data-id="${d.id}" aria-label="Chi tiết ${esc(d.name)}">${icon('search', 16)}</button></li>`; }).join('')}</ul></div>`;
}
SCREENS.map = {
  render(s) {
    const r = ui.mapRegion;
    const rs = regionStatus(s, r);
    return `<h1>Bản đồ ba miền</h1>${regionTabs(s)}
    ${rs.open ? `<p class="muted">${esc(REGIONS[r].tone)}</p><div class="map-layout">${mapView(s, r)}<div class="map-side">${locPanel(s)}</div></div>`
      : `<div class="card center-card">${icon('lock', 48)}<h2>${esc(REGIONS[r].name)} chưa mở khóa</h2><p>${esc(rs.reason)}</p></div>`}`;
  },
};
ACT['map-region'] = (el) => { ui.mapRegion = el.dataset.r; ui.selLoc = null; refresh(); };
ACT['map-sel'] = (el) => { ui.selLoc = el.dataset.id; ui.dialog = null; ui.gatherResult = null; refresh(); setTimeout(() => document.querySelector('.map-side')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); };
ACT['map-go'] = (el) => mutate((s) => visit(s, el.dataset.id));
ACT['map-gather'] = (el) => openDraw(el.dataset.id);
ACT['map-topic'] = (el) => {
  const r = mutate((s) => askTopic(s, el.dataset.npc, Number(el.dataset.i)));
  if (r.ok) { ui.dialog = { npc: el.dataset.npc, text: r.text, reward: r.reward }; refresh(); }
};
ACT['map-gift'] = (el) => startCook({ dishId: el.dataset.dish, mode: 'gift', npcId: el.dataset.npc });
ACT['map-learn'] = (el) => mutate((s) => learnDish(s, el.dataset.id));
