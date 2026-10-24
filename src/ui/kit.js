// Bộ công cụ giao diện: hộp thoại, thông báo, hiệu ứng nổi, hàng đợi chúc mừng (lên cấp, mở khóa, thành tựu).
import { icon } from '../art/icons.js';
import { levelBadge, achievementBadge } from '../art/scenes.js';
import { esc, dishArt, money } from './util.js';
import { getState } from '../core/store.js';
import { on } from '../core/bus.js';

let seq = 0;
const stack = [];

const layer = () => document.getElementById('layer-modal');
const toastLayer = () => document.getElementById('layer-toast');

/** Mở hộp thoại. Trả về id. closable=false: không đóng bằng Esc/nền. */
export function openModal({ html, cls = '', closable = true, onClose = null, label = '' }) {
  const id = ++seq;
  const el = document.createElement('div');
  el.className = 'modal-back';
  el.dataset.modal = String(id);
  el.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" ${label ? `aria-label="${esc(label)}"` : ''} tabindex="-1">${html}</div>`;
  layer().appendChild(el);
  const m = { id, el, closable, onClose, prevFocus: document.activeElement };
  stack.push(m);
  requestAnimationFrame(() => {
    el.classList.add('in');
    const first = el.querySelector('[data-autofocus]') || el.querySelector('button, input, select, [tabindex]');
    (first || el.firstElementChild).focus({ preventScroll: true });
  });
  return id;
}
export function updateModal(id, html) {
  const m = stack.find((x) => x.id === id);
  if (!m) return;
  const box = m.el.querySelector('.modal');
  const top = box.scrollTop;
  box.innerHTML = html;
  box.scrollTop = top;
}
export function closeModal(id) {
  const i = id == null ? stack.length - 1 : stack.findIndex((x) => x.id === id);
  if (i < 0) return;
  const [m] = stack.splice(i, 1);
  m.el.classList.remove('in');
  setTimeout(() => m.el.remove(), 150);
  try { m.prevFocus?.focus?.({ preventScroll: true }); } catch { /* bỏ qua */ }
  if (m.onClose) m.onClose();
  pumpCelebrations();
}
export const modalOpen = () => stack.length > 0;
export const topModalId = () => (stack.length ? stack[stack.length - 1].id : null);
export function closeAllModals() { while (stack.length) closeModal(); }

export function onKey(e) {
  if (e.key === 'Escape' && stack.length) {
    const m = stack[stack.length - 1];
    if (m.closable) { closeModal(m.id); e.preventDefault(); }
  }
  if (e.key === 'Tab' && stack.length) { // giữ tiêu điểm trong hộp thoại
    const box = stack[stack.length - 1].el.querySelector('.modal');
    const f = [...box.querySelectorAll('button:not([disabled]), input, select, [href], [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    else if (!box.contains(document.activeElement)) { first.focus(); e.preventDefault(); }
  }
}
export function onBackdrop(e) {
  const back = e.target.classList?.contains('modal-back') ? e.target : null;
  if (!back) return false;
  const m = stack.find((x) => x.el === back);
  if (m && m.closable) { closeModal(m.id); return true; }
  return false;
}

/** Hộp xác nhận. Trả về Promise<boolean>. */
export function confirmDialog({ title, text, ok = 'Đồng ý', cancel = 'Hủy', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const id = openModal({
      cls: 'confirm', closable: true, label: title, onClose: () => finish(false),
      html: `<h2>${esc(title)}</h2><p>${text}</p><div class="row end"><button type="button" class="btn ghost" data-act="modal-cancel">${esc(cancel)}</button><button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-act="modal-ok" data-autofocus>${esc(ok)}</button></div>`,
    });
    const el = layer().querySelector(`[data-modal="${id}"]`);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'modal-ok') { e.stopPropagation(); finish(true); closeModal(id); }
      else if (a === 'modal-cancel') { e.stopPropagation(); closeModal(id); }
    }, true);
  });
}

export function toast(text, kind = 'info') {
  const host = toastLayer();
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon(kind === 'good' ? 'check' : kind === 'bad' ? 'close' : 'sparkle', 18)}<span>${esc(text)}</span>`;
  host.appendChild(el);
  while (host.children.length > 4) host.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 250); }, kind === 'bad' ? 4200 : 3000);
}

export function floatAt(target, text, cls = '') {
  const s = getState();
  if (!target || (s && s.settings.fx === false)) return;
  const r = target.getBoundingClientRect();
  const el = document.createElement('span');
  el.className = `floater ${cls}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

export function confetti() {
  const s = getState();
  if (s && (s.settings.fx === false || s.settings.motion === false)) return;
  const host = document.createElement('div');
  host.className = 'confetti';
  host.setAttribute('aria-hidden', 'true');
  const cols = ['#b8442f', '#e3a42b', '#4f7a3a', '#3a7a9a', '#e07a8a'];
  host.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${Math.random() * 0.4}s;--dx:${(Math.random() - 0.5) * 120}px"></i>`).join('');
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 2400);
}

// ---------- Hàng đợi chúc mừng ----------
const queue = [];
let showing = null;
let cookingBlock = () => false;
export const setCelebrationBlocker = (fn) => { cookingBlock = fn; };

export function celebrate(item) { queue.push(item); pumpCelebrations(); }
export function pumpCelebrations() {
  if (showing || !queue.length || cookingBlock()) return;
  if (stack.some((m) => !m.celebration)) return; // chờ hộp thoại khác đóng
  const it = queue.shift();
  let html = '';
  if (it.type === 'levelup') html = `<div class="celebrate">${levelBadge(it.level, 96)}<h2>Lên cấp ${it.level}!</h2><p>Danh hiệu mới: <b>${esc(it.title)}</b></p><p class="muted">Bạn nhận 1 điểm kỹ năng và thêm thể lực.</p></div>`;
  else if (it.type === 'unlock') html = `<div class="celebrate">${dishArt(it.dish, 120)}<h2>${it.secret ? 'Công thức bí mật!' : 'Món mới đã mở khóa!'}</h2><p><b>${esc(it.dish.name)}</b></p><p class="muted">${esc(it.dish.desc)}</p></div>`;
  else if (it.type === 'achievement') html = `<div class="celebrate">${achievementBadge(it.icon, true, 88)}<h2>Thành tựu mới</h2><p><b>${esc(it.name)}</b></p><p class="muted">${esc(it.desc)}</p></div>`;
  else if (it.type === 'region') html = `<div class="celebrate">${icon('r-' + it.region, 72)}<h2>Mở khóa ${esc(it.name)}!</h2><p class="muted">Bản đồ khám phá mới, nguyên liệu và món ăn mới đang chờ bạn.</p></div>`;
  else if (it.type === 'cert') html = `<div class="celebrate cert">${icon(it.icon, 80)}<h2>${it.id === 'c6' ? 'THỰC THẦN!' : 'Nhận chứng nhận!'}</h2><p><b>${esc(it.name)}</b></p><p class="muted">Cấp bởi ${esc(it.judge)}. Thưởng ${it.reward.money}k, +${it.reward.rep} uy tín.</p></div>`;
  else if (it.type === 'rank') html = `<div class="celebrate">${icon('rep', 64)}<h2>Uy tín tăng hạng</h2><p><b>${esc(it.name)}</b></p></div>`;
  else return pumpCelebrations();
  showing = openModal({ cls: 'celebrate-modal', label: 'Chúc mừng', closable: true, html: `${html}<div class="row end"><button type="button" class="btn primary" data-act="modal-close" data-autofocus>Tuyệt vời!</button></div>`, onClose: () => { showing = null; pumpCelebrations(); } });
  const m = stack.find((x) => x.id === showing); if (m) m.celebration = true;
  confetti();
}

export function wireBus(names) {
  on('levelup', (p) => celebrate({ type: 'levelup', ...p }));
  on('unlock', (p) => celebrate({ type: 'unlock', ...p }));
  on('achievement', (a) => celebrate({ type: 'achievement', ...a }));
  on('region', (p) => celebrate({ type: 'region', region: p.region, name: names[p.region] }));
  on('rank', (p) => celebrate({ type: 'rank', ...p }));
  on('cert', (p) => celebrate({ type: 'cert', ...p }));
  on('toast', ({ text, kind }) => toast(text, kind));
}
export { money };
