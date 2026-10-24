// Tiện ích giao diện: thoát HTML, định dạng, các mảnh HTML dùng lại.
import { icon } from '../art/icons.js';
import { dishSVG } from '../art/dish.js';
import { personSVG } from '../art/people.js';
import { CATEGORIES } from '../data/dishes.js';
import { REGIONS } from '../data/locations.js';
import { xpForLevel, repRank } from '../core/progression.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
import { vnd } from '../core/fmt.js';
export const money = vnd;
export const num = (n) => Math.round(n).toLocaleString('vi-VN');
/** Bỏ dấu tiếng Việt và viết thường để tìm kiếm gõ không dấu vẫn ra kết quả. */
export const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const $ = (sel, root = document) => root.querySelector(sel);

const artCache = new Map();
export function dishArt(dish, size = 72) {
  const k = `${dish.id}:${size}`;
  if (!artCache.has(k)) artCache.set(k, dishSVG(dish.art, size, dish.name));
  return artCache.get(k);
}
export const person = (look, size = 56, label = '') => personSVG(look, size, label);

export const stars = (n, max = 3, size = 16) => Array.from({ length: max }, (_, i) => icon(i < n ? 'star' : 'star-off', size)).join('');
export const diffDots = (d) => Array.from({ length: 5 }, (_, i) => `<span class="dot ${i < d ? 'on' : ''}"></span>`).join('');

export function bar(pct, cls = '', label = '') {
  const p = clamp(pct, 0, 100);
  return `<div class="bar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}" ${label ? `aria-label="${esc(label)}"` : ''}><i style="width:${p}%"></i></div>`;
}

export function btn(label, act, { cls = '', data = {}, disabled = false, ico = '', title = '' } = {}) {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button type="button" class="btn ${cls}" data-act="${act}" ${attrs} ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${ico ? icon(ico, 18) : ''}<span>${label}</span></button>`;
}

export function tabs(list, current, act) {
  return `<div class="tabs" role="tablist">${list.map(([id, label, badge]) => `<button type="button" role="tab" class="tab ${id === current ? 'on' : ''}" aria-selected="${id === current}" data-act="${act}" data-tab="${id}">${label}${badge ? `<b class="dotbadge">${badge}</b>` : ''}</button>`).join('')}</div>`;
}

export function statChip(ico, value, label) {
  return `<span class="chip stat" title="${esc(label)}" aria-label="${esc(label)}: ${esc(value)}">${icon(ico, 18)}<b>${esc(value)}</b></span>`;
}

export function xpBar(state) {
  const need = xpForLevel(state.level);
  return state.level >= 30 ? bar(100, 'xp', 'Kinh nghiệm') : bar((state.xp / need) * 100, 'xp', 'Kinh nghiệm');
}
/** Thanh uy tín 0 đến 100: 4 vùng màu, con trỏ chỉ vị trí hiện tại, kèm hạng và xu hướng hôm nay. */
export function repMeter(state, { big = false, trend = null } = {}) {
  const r = repRank(state.rep);
  const v = clamp(state.rep, 0, 100);
  const tr = trend == null || trend === 0 ? '' : `<span class="rm-trend ${trend > 0 ? 'up' : 'down'}">${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}</span>`;
  return `<div class="repm ${big ? 'big' : ''}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v)}" aria-label="Uy tín quán ${Math.round(v)} trên 100, hạng ${esc(r.name)}">
    ${big ? `<div class="rm-top"><b>${esc(r.name)}</b><span class="rm-num">${Math.round(v)}<small>/100</small></span>${tr}</div>` : ''}
    <div class="rm-track"><i class="z1"></i><i class="z2"></i><i class="z3"></i><i class="z4"></i><span class="rm-fill" style="width:${v}%"></span><span class="rm-pin" style="left:${v}%"></span></div>
    ${big ? `<div class="rm-scale"><span>Vắng khách</span><span>Bình thường</span><span>Đông khách</span><span>Nổi tiếng</span></div>` : ''}</div>`;
}
export const ratingStars = (n, size = 14) => Array.from({ length: 5 }, (_, i) => icon(i < n ? 'star' : 'star-off', size)).join('');

export function repInfo(state) {
  const r = repRank(state.rep);
  const pct = r.next ? ((state.rep - r.min) / (r.next - r.min)) * 100 : 100;
  return { ...r, pct };
}

export const catChip = (cat) => `<span class="chip cat">${icon(CATEGORIES[cat].icon, 16)}${CATEGORIES[cat].name}</span>`;
export const regionChip = (r) => `<span class="chip reg reg-${r}">${icon('r-' + r, 16)}${REGIONS[r].short}</span>`;

export function dishStatus(state, dish) {
  const st = state.dishStats[dish.id];
  if (state.learned[dish.id]) {
    if (st && st.stars3 >= 3) return { id: 'mastered', label: 'Làm chủ', cls: 'st-master' };
    if (st && st.cooked > 0) return { id: 'cooked', label: 'Đã nấu', cls: 'st-cooked' };
    return { id: 'learned', label: 'Đã học', cls: 'st-learned' };
  }
  if (state.seen[dish.id]) return { id: 'seen', label: 'Đã khám phá', cls: 'st-seen' };
  return { id: 'unknown', label: 'Chưa biết', cls: 'st-unknown' };
}

export function emptyState(ico, title, text, actionHtml = '') {
  return `<div class="empty">${icon(ico, 48)}<h3>${esc(title)}</h3><p>${text}</p>${actionHtml}</div>`;
}

export const TIPS = [
  'Nấu đúng quy trình từng bước sẽ cho món 3 sao, tiền thưởng cao hơn và tiền tip.',
  'Khách vội trả thêm tiền nhưng nhanh hết kiên nhẫn. Hãy nấu món họ gọi trước.',
  'Ghé địa điểm trên bản đồ để học công thức mới và nhận nguyên liệu quý.',
  'Nói chuyện với nhân vật mỗi ngày để nhận quà, rồi nấu tặng họ để kết thân.',
  'Hãy nâng cấp Kho lạnh nếu bạn hay hụt nguyên liệu giữa ca.',
  'Giá bán trên thực đơn càng cao, khách càng khó tính. Đặt giá hợp lý để giữ tiền tip.',
  'Gom đủ 3 trang sổ rách của một miền để ghép thành công thức bí mật.',
  'Vào dịp lễ hội, các món hợp chủ đề được bán giá cao hơn.',
];

export function timeAgo(ts) {
  if (!ts) return 'chưa lưu';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'vừa xong';
  if (s < 60) return `${s} giây trước`;
  if (s < 3600) return `${Math.round(s / 60)} phút trước`;
  return new Date(ts).toLocaleString('vi-VN');
}
