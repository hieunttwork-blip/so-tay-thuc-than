// Tính năng bổ sung: nút "!" tiểu sử món, rút thẻ úp khi thu thập, quản lý thực đơn theo lợi nhuận.
import { icon } from '../art/icons.js';
import { ingIcon } from '../art/ingicons.js';
import { DISH_BY_ID } from '../data/dishes.js';
import { INGREDIENTS, SPECIAL_ITEMS, RARE_ITEMS, RARITY } from '../data/ingredients.js';
import { LOCATION_BY_ID } from '../data/locations.js';
import { loreOf } from '../data/lore.js';
import { getState } from '../core/store.js';
import { gatherDraw, gatherFlip, gatherFlipMany } from '../core/explore.js';
import { menuAdd, menuRemove, menuPrice, priceMult, menuAuto, dishEconomics } from '../core/service.js';
import { bonus, staminaInfo } from '../core/progression.js';
import { masteryOf } from '../core/mastery.js';
import { hasAll } from '../core/economy.js';
import { ACT, ui, refresh, mutate } from './app.js';
import { openModal, closeModal, updateModal, toast } from './kit.js';
import { esc, money, dishArt, regionChip, catChip, stars } from './util.js';

// ================= Tiểu sử món ("!") =================
export const infoBtn = (id, cls = '') => `<button type="button" class="info-btn ${cls}" data-act="dish-info" data-id="${id}" aria-label="Tiểu sử món ăn" title="Tiểu sử món ăn">!</button>`;

function infoHtml(s, d) {
  const known = s.seen[d.id] || s.learned[d.id];
  if (!known) {
    return `<div class="info"><div class="dart veil big">${dishArt(d, 120)}<i class="lockmark">${icon('lock', 32)}</i></div><h2>Món chưa khám phá</h2><p>Hãy đến ${esc(LOCATION_BY_ID[d.loc].name)} để biết thêm câu chuyện về món này.</p><div class="row end"><button type="button" class="btn" data-act="modal-close" data-autofocus>Đóng</button></div></div>`;
  }
  const l = loreOf(d);
  const loc = LOCATION_BY_ID[d.loc];
  return `<div class="info"><div class="info-head">${dishArt(d, 110)}<div><h2>${esc(d.name)}</h2><div class="dmeta">${regionChip(d.region)}${catChip(d.cat)}${d.secret ? '<span class="chip gold">Bí mật</span>' : ''}</div><small>${icon('map', 14)} ${esc(loc.name)}</small></div></div>
  <section><h4>${icon('scroll', 18)} Tiểu sử</h4><p>${esc(l.origin)}</p></section>
  <section><h4>${icon('heart', 18)} Hương vị</h4><p>${esc(l.flavor)}</p><p class="muted">${esc(d.desc)}</p></section>
  <section><h4>${icon('g-bot', 18)} Thành phần chính</h4><ul class="parts">${Object.entries(d.ingredients).map(([id, q]) => `<li>${ingIcon(id, 30)}<span>${esc(INGREDIENTS[id].name)}<small>×${q}</small></span></li>`).join('')}</ul></section>
  ${l.tip ? `<section><h4>${icon('sparkle', 18)} Cách thưởng thức</h4><p>${esc(l.tip)}</p></section>` : ''}
  <p class="cult">${icon('lantern', 16)} ${esc(d.cult)}</p>
  <div class="row end"><button type="button" class="btn" data-act="modal-close" data-autofocus>Đóng</button></div></div>`;
}
ACT['dish-info'] = (el) => {
  const d = DISH_BY_ID[el.dataset.id];
  if (!d) return;
  openModal({ cls: 'info-modal', label: `Tiểu sử ${d.name}`, html: infoHtml(getState(), d) });
};

// ================= Bảng thẻ úp khi thu thập (15 thẻ, mỗi thẻ lật tốn 1 thể lực) =================
let G = null;
function faceHtml(card) {
  const items = card.got.map((x) => `<span class="gi">${ingIcon(x.id, 26)}<b>×${x.qty}</b></span>`);
  for (const r of card.rare) items.push(`<span class="gi rare ${RARITY[RARE_ITEMS[r].rarity].cls}" title="${esc(RARE_ITEMS[r].name)}">${icon('sparkle', 26)}<b>${RARITY[RARE_ITEMS[r].rarity].name}</b></span>`);
  if (card.page) items.push(`<span class="gi rare" title="${esc(SPECIAL_ITEMS[card.page].name)}">${icon('page', 26)}<b>Trang sổ</b></span>`);
  return items.join('');
}
function addSum(card) {
  for (const x of card.got) G.sum[`i:${x.id}`] = (G.sum[`i:${x.id}`] || 0) + x.qty;
  for (const r of card.rare) G.sum[`r:${r}`] = (G.sum[`r:${r}`] || 0) + 1;
  if (card.page) G.sum[`p:${card.page}`] = (G.sum[`p:${card.page}`] || 0) + 1;
}
function sumHtml() {
  const e = Object.entries(G.sum);
  if (!e.length) return '<small class="muted">Chưa lật thẻ nào.</small>';
  const nm = (k) => { const [ty, id] = [k.slice(0, 1), k.slice(2)]; return ty === 'i' ? INGREDIENTS[id].name : ty === 'r' ? RARE_ITEMS[id].name : SPECIAL_ITEMS[id].name; };
  return `<ul class="gsum">${e.map(([k, q]) => `<li class="${k[0] !== 'i' ? 'rare' : ''}">${k[0] === 'i' ? ingIcon(k.slice(2), 20) : icon(k[0] === 'p' ? 'page' : 'sparkle', 20)}<span>${esc(nm(k))} ×${q}</span></li>`).join('')}</ul>`;
}
function stText() {
  const i = staminaInfo(getState());
  return `${i.cur}/${i.max}${i.full ? '' : ` · hồi thêm sau ${Math.floor(i.secs / 60)}:${String(i.secs % 60).padStart(2, '0')}`}`;
}
function boardHtml() {
  const s = getState();
  const d = s.draw;
  const loc = LOCATION_BY_ID[G.loc];
  const n = G.n;
  const flipped = (d && d.flipped) || G.finalFlipped || {};
  const cards = Array.from({ length: n }, (_, i) => {
    const f = flipped[i];
    return `<button type="button" class="gcard sm ${f ? 'flip' : ''}" data-act="gc-flip" data-i="${i}" ${f ? 'disabled' : ''} aria-label="Thẻ số ${i + 1}${f ? ', đã lật' : ''}"><span class="gc-in"><span class="gc-back">${icon('sparkle', 26)}</span><span class="gc-front">${f ? faceHtml(f) : ''}</span></span></button>`;
  }).join('');
  const done = !d;
  return `<div class="gacha"><h2>${icon('g-rau', 24)} Thu thập ở ${esc(loc.name)}</h2>
  <p>${done ? 'Bạn đã lật hết các thẻ!' : `Mỗi thẻ lật tốn <b>1 thể lực</b>. Thể lực: <b id="gc-st">${stText()}</b>`}</p>
  <div class="gboard">${cards}</div>
  <div class="gsum-box"><b>Đã nhận:</b><div id="gc-sum">${sumHtml()}</div></div>
  <div class="row end wrap">${done ? '' : '<button type="button" class="btn primary" data-act="gc-all" data-autofocus>Lật nhanh (dùng hết thể lực)</button>'}<button type="button" class="btn ${done ? 'primary' : 'ghost'}" data-act="modal-close">${done ? 'Xong' : 'Để sau'}</button></div></div>`;
}
export function openDraw(locId) {
  const r = mutate((s) => gatherDraw(s, locId));
  if (!r || !r.ok) return;
  const d = getState().draw;
  G = { loc: locId, n: d.n, sum: {}, modalId: 0 };
  for (const c of Object.values(d.flipped)) addSum(c);
  G.modalId = openModal({ cls: 'gacha-modal', label: 'Bảng thẻ thu thập', html: boardHtml(), onClose: () => { G = null; refresh(); } });
}
export const hasPendingDraw = () => Boolean(getState()?.draw);
function paintFlip(i, card) {
  const el = document.querySelector(`.gacha .gcard[data-i="${i}"]`);
  if (!el) return;
  el.querySelector('.gc-front').innerHTML = faceHtml(card);
  el.disabled = true;
  el.classList.add('flip');
  if (card.rare.length || card.page) el.classList.add('lucky');
}
function paintAfter() {
  const sum = document.getElementById('gc-sum'); if (sum) sum.innerHTML = sumHtml();
  const st = document.getElementById('gc-st'); if (st) st.textContent = stText();
  if (!getState().draw && G) { G.finalFlipped = {}; updateModal(G.modalId, boardHtml().replace(/class="gcard sm /g, 'class="gcard sm flip ')); }
}
ACT['gc-flip'] = (el) => {
  if (!G) return;
  const i = Number(el.dataset.i);
  const r = mutate((s) => gatherFlip(s, i));
  if (!r || !r.ok) return;
  addSum(r.card);
  ui.gatherResult = { loc: G.loc, got: r.got, page: r.page, rare: r.rare };
  paintFlip(i, r.card);
  paintAfter();
};
ACT['gc-all'] = () => {
  if (!G) return;
  const r = mutate((s) => gatherFlipMany(s));
  if (!r || !r.ok) return;
  r.results.forEach((x, k) => setTimeout(() => { if (!G) return; paintFlip(x.index, x.card); }, k * 90));
  for (const x of r.results) addSum(x.card);
  setTimeout(() => { if (G) paintAfter(); }, r.results.length * 90 + 100);
  toast(`Đã lật ${r.results.length} thẻ.`, 'good');
};

// ================= Quản lý thực đơn theo lợi nhuận =================
export const MENU_SORTS = { profit: 'Lãi mỗi phần', margin: 'Tỷ suất lãi (%)', sold: 'Bán chạy', rev: 'Tổng doanh thu', level: 'Cấp thông thạo', name: 'Tên A-Z' };
export function menuManager(s) {
  const b = bonus(s);
  const f = ui.menuView;
  const q = f.q.trim().toLowerCase();
  let list = Object.keys(s.learned).filter((id) => DISH_BY_ID[id]).map((id) => ({ id, d: DISH_BY_ID[id], e: dishEconomics(s, id), inMenu: s.menu.ids.includes(id), ml: masteryOf(s, id) }));
  if (f.only === 'in') list = list.filter((x) => x.inMenu);
  if (f.only === 'out') list = list.filter((x) => !x.inMenu);
  if (q) list = list.filter((x) => x.d.name.toLowerCase().includes(q));
  const cmp = {
    profit: (a, c) => c.e.profit - a.e.profit, margin: (a, c) => c.e.margin - a.e.margin, sold: (a, c) => c.e.sold - a.e.sold,
    rev: (a, c) => c.e.rev - a.e.rev, level: (a, c) => c.ml.level - a.ml.level || c.e.profit - a.e.profit, name: (a, c) => a.d.name.localeCompare(c.d.name, 'vi'),
  }[f.sort];
  list.sort(cmp);
  const maxProfit = Math.max(1, ...list.map((x) => x.e.profit));
  const full = s.menu.ids.length >= b.menuSlots;
  const rows = list.map(({ id, d, e, inMenu, ml }) => {
    const ok = hasAll(s, d.ingredients);
    return `<li class="mrow2 ${inMenu ? 'in' : ''}">
    <div class="m-art">${dishArt(d, 48)}</div>
    <div class="m-main"><b>${esc(d.name)}</b> ${infoBtn(id, 'sm')}<span class="mlv lv${ml.level}">${ml.asc ? 'THỰC THẦN' : `Lv ${ml.level}`}</span>
      <div class="m-nums"><span>Giá <b>${money(e.price)}</b></span><span>Vốn <b>${money(e.cost)}</b></span><span class="pf">Lãi <b>${money(e.profit)}</b></span><span>${e.margin}%</span></div>
      <div class="pbar" aria-hidden="true"><i style="width:${Math.round((e.profit / maxProfit) * 100)}%"></i></div>
      <small class="${ok ? 'ok' : 'warn'}">${ok ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'}${e.sold ? ` · đã bán ${e.sold} · doanh thu ${money(e.rev)}` : ''}</small></div>
    <div class="m-act">${inMenu ? `<span class="price-ctl"><button type="button" class="btn ghost round" data-act="price" data-id="${id}" data-d="-0.05" aria-label="Giảm giá">${icon('minus', 16)}</button><small>${Math.round(priceMult(s, id) * 100)}%</small><button type="button" class="btn ghost round" data-act="price" data-id="${id}" data-d="0.05" aria-label="Tăng giá">${icon('plus', 16)}</button></span>
      <button type="button" class="btn small" data-act="menu-rm" data-id="${id}">Gỡ</button>` : `<button type="button" class="btn small primary" data-act="menu-add" data-id="${id}" ${full ? 'disabled' : ''}>Thêm</button>`}</div></li>`;
  }).join('');
  return `<div class="card menu-head"><div><b>Thực đơn hôm nay: ${s.menu.ids.length}/${b.menuSlots} món</b><small>${s.upgrades.menu < 5 ? 'Nâng cấp Bảng thực đơn để thêm chỗ.' : 'Bảng thực đơn đã tối đa.'} Món lên cấp thông thạo cao bán đắt hơn, còn món nguyên liệu đắt có lãi cao ngay từ cấp 1.</small></div>
  <button type="button" class="btn" data-act="menu-auto">${icon('sparkle', 18)}<span>Tự chọn món lãi nhất</span></button></div>
  <div class="filters"><label class="search">${icon('search', 18)}<input type="search" data-input="menu-q" placeholder="Tìm món" value="${esc(f.q)}" aria-label="Tìm món trong thực đơn"></label>
  <select data-change="menu-sort" aria-label="Sắp xếp thực đơn">${Object.entries(MENU_SORTS).map(([id, l]) => `<option value="${id}" ${f.sort === id ? 'selected' : ''}>Xếp theo: ${l}</option>`).join('')}</select>
  <select data-change="menu-only" aria-label="Lọc"><option value="all" ${f.only === 'all' ? 'selected' : ''}>Tất cả món đã học</option><option value="in" ${f.only === 'in' ? 'selected' : ''}>Đang bán</option><option value="out" ${f.only === 'out' ? 'selected' : ''}>Chưa bán</option></select></div>
  <ul class="mlist">${rows || '<li class="muted">Không có món phù hợp.</li>'}</ul>`;
}
ACT['input:menu-q'] = (el) => { ui.menuView.q = el.value; refresh(); };
ACT['change:menu-sort'] = (el) => { ui.menuView.sort = el.value; refresh(); };
ACT['change:menu-only'] = (el) => { ui.menuView.only = el.value; refresh(); };
ACT['menu-auto'] = () => { const r = mutate((s) => menuAuto(s)); if (r?.ok) toast(`Đã chọn ${r.n} món có lãi mỗi phần cao nhất.`, 'good'); };
export { stars };
