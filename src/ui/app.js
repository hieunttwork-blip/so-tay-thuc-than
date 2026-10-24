// Khung ứng dụng: bộ định tuyến màn hình, đăng ký hành động (data-act), vẽ lại gộp theo khung hình, khung HUD và thanh điều hướng.
import { icon } from '../art/icons.js';
import { levelBadge } from '../art/scenes.js';
import { getState, subscribe, act, commit } from '../core/store.js';
import { levelTitle, xpForLevel, maxStamina, staminaInfo, regenStamina, shopName } from '../core/progression.js';
import { festivalOn } from '../core/quests.js';
import { esc, money, bar, xpBar, repMeter } from './util.js';
import { toast, modalOpen, onKey, onBackdrop, closeModal, confirmDialog } from './kit.js';
import { emit } from '../core/bus.js';
import { setSoundEnabled, setMusicEnabled, setMusicVolume } from '../core/audio.js';

export const ui = {
  screen: 'title',
  tab: { pantry: 'market', quests: 'main', more: 'upgrades' },
  market: { group: '', q: '', cart: {} },
  menuView: { q: '', sort: 'profit', only: 'all' },
  nb: { q: '', cat: '', region: '', status: '', sort: 'level', limit: 24, tab: 'dishes' },
  mapRegion: 'bac',
  selLoc: null,
  dialog: null,
  cooking: false,
  title: { view: 'main' },
};
export const ACT = {};
export const SCREENS = {};

export const NAV = [
  ['home', 'Nhà', 'home'], ['service', 'Phục vụ', 'cook'], ['pantry', 'Kho & chợ', 'shop'], ['notebook', 'Sổ tay', 'book'],
  ['map', 'Bản đồ', 'map'], ['quests', 'Nhiệm vụ', 'quest'], ['more', 'Thêm', 'more'],
];

let queued = false;
let mounted = null;
const root = () => document.getElementById('app');

function staminaText(s) {
  const i = staminaInfo(s);
  if (i.full) return 'đầy';
  return `${Math.floor(i.secs / 60)}:${String(i.secs % 60).padStart(2, '0')}`;
}
const THEME_VARS = ['--brick', '--brick2'];
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}
export function applyTheme(s) {
  const el = document.documentElement;
  el.dataset.theme = s?.settings.theme || 'cream';
  const acc = s?.settings.accent;
  if (acc) { el.style.setProperty('--brick', acc); el.style.setProperty('--brick2', shade(acc, 0.72)); }
  else for (const v of THEME_VARS) el.style.removeProperty(v);
}
let stamTimer = null;
function startStamina() {
  clearInterval(stamTimer);
  stamTimer = setInterval(() => {
    const s = getState();
    if (!s || document.hidden) return;
    const gained = regenStamina(s);
    if (gained) { commit(); toast(`Thể lực hồi thêm ${gained}.`, 'info'); return; }
    const cd = document.getElementById('st-cd');
    if (cd) cd.textContent = staminaText(s);
  }, 1000);
}

export function refresh() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; render(); });
}

export function go(id, opts = {}) {
  if (!SCREENS[id]) return;
  if (ui.cooking && id !== ui.screen) { toast('Hãy hoàn tất hoặc hủy món đang nấu trước.', 'bad'); return; }
  Object.assign(ui, opts.ui || {});
  ui.screen = id;
  emit('sfx', 'click');
  render();
  window.scrollTo({ top: 0 });
}

/** Chạy thao tác lõi, hiện lý do nếu thất bại. */
export function mutate(fn, immediate = true) {
  const r = act(fn, immediate);
  if (r && r.ok === false && r.reason) { toast(r.reason, 'bad'); emit('sfx', 'error'); }
  return r;
}

function hud(s) {
  const fest = festivalOn(s.day);
  const need = xpForLevel(s.level);
  return `<header class="hud" role="banner">
  <div class="hud-id">${levelBadge(s.level, 44)}<div class="hud-name"><b>${esc(shopName(s))}</b><small>${esc(levelTitle(s.level))}</small>${xpBar(s)}<small class="xp-txt">${s.level >= 30 ? 'Cấp tối đa' : `${s.xp}/${need} XP`}</small></div></div>
  <div class="hud-chips">
    <span class="chip stat" title="Ngày" aria-label="Ngày ${s.day}">${icon('day', 18)}<b>${s.day}</b></span>
    <span class="chip stat gold" title="Tiền" aria-label="Tiền ${money(s.cash)}">${icon('money', 18)}<b>${money(s.cash)}</b></span>
    <span class="chip stat stam" title="Thể lực hồi dần theo thời gian" aria-label="Thể lực ${s.stamina} trên ${maxStamina(s)}">${icon('stamina', 18)}<b id="st-val">${s.stamina}/${maxStamina(s)}</b><small id="st-cd" class="st-cd">${staminaText(s)}</small></span>
    <span class="chip stat repchip" title="Uy tín của quán (0 đến 100)">${icon('rep', 18)}${repMeter(s)}<b>${Math.round(s.rep)}</b></span>
    <button type="button" class="chip mini" data-act="open-feedback" title="Góp ý cho tác giả" aria-label="Góp ý">${icon('help', 16)}<b>Góp ý</b></button><button type="button" class="chip mini" data-act="open-donate" title="Ủng hộ tác giả" aria-label="Ủng hộ tác giả">${icon('heart', 16)}<b>Ủng hộ</b></button>
    ${fest ? `<span class="chip fest" title="${esc(fest.f.name)}">${icon('lantern', 18)}<b>${esc(fest.f.name)}</b></span>` : ''}
  </div></header>`;
}

function nav(s, active) {
  const claim = Object.values(s.quests).filter((q) => q.status === 'done').length;
  const sh = s.shift ? s.shift.customers.length : 0;
  return `<nav class="nav" aria-label="Điều hướng chính">${NAV.map(([id, label, ic]) => {
    const badge = id === 'quests' && claim ? claim : id === 'service' && sh ? sh : 0;
    return `<button type="button" class="nav-btn ${id === active ? 'on' : ''}" data-act="nav" data-to="${id}" aria-label="${label}" ${id === active ? 'aria-current="page"' : ''}>${icon(ic, 26)}<span>${label}</span>${badge ? `<b class="dotbadge">${badge}</b>` : ''}</button>`;
  }).join('')}</nav>`;
}

function snapshotFocus() {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  const key = a.dataset?.input || a.id;
  if (!key) return null;
  return { sel: a.dataset?.input ? `[data-input="${a.dataset.input}"]` : `#${a.id}`, s: a.selectionStart, e: a.selectionEnd };
}

export function render() {
  const s = getState();
  const host = root();
  if (!host) return;
  const scr = SCREENS[ui.screen];
  if (mounted && mounted !== ui.screen && SCREENS[mounted]?.unmount) SCREENS[mounted].unmount();
  applyTheme(s);
  if (s) { setSoundEnabled(s.settings.sound); setMusicEnabled(s.settings.music); setMusicVolume(s.settings.musicVol); }
  document.documentElement.classList.toggle('no-motion', Boolean(s) && s.settings.motion === false);
  document.documentElement.classList.toggle('no-fx', Boolean(s) && s.settings.fx === false);
  const focus = snapshotFocus();
  const scroll = window.scrollY;
  if (ui.screen === 'title' || !s) {
    host.className = 'app title-mode';
    host.innerHTML = SCREENS.title.render(s);
  } else {
    host.className = 'app game-mode';
    host.innerHTML = `${hud(s)}<div class="body">${nav(s, ui.screen)}<main id="screen" class="screen scr-${ui.screen}" tabindex="-1">${scr.render(s)}</main></div>`;
  }
  if (mounted !== ui.screen) { mounted = ui.screen; if (scr.mount) scr.mount(); }
  else if (scr.after) scr.after();
  if (focus) {
    const el = host.querySelector(focus.sel);
    if (el) { el.focus({ preventScroll: true }); try { if (focus.s != null) el.setSelectionRange(focus.s, focus.e); } catch { /* không phải ô văn bản */ } }
  }
  window.scrollTo({ top: scroll });
}

// ---------- Sự kiện ----------
function onClick(e) {
  if (onBackdrop(e)) return;
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (!fn) { console.warn('Thiếu hành động', el.dataset.act); return; }
  Promise.resolve(fn(el, e)).catch((err) => { console.error(err); toast('Có lỗi xảy ra. Hãy thử lại.', 'bad'); });
}
function onInput(e) {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const fn = ACT[`input:${el.dataset.input}`];
  if (fn) fn(el, e);
}
function onChange(e) {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const fn = ACT[`change:${el.dataset.change}`];
  if (fn) fn(el, e);
}

export function startApp() {
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', onKey);
  subscribe(() => refresh());
  const s0 = getState();
  if (s0) regenStamina(s0);
  startStamina();
  render();
}

// ---------- Hành động chung ----------
ACT.nav = (el) => go(el.dataset.to);
ACT['modal-close'] = () => closeModal();
ACT['modal-ok'] = () => closeModal();
ACT['modal-cancel'] = () => closeModal();
ACT.tab = (el) => { const [scr, tab] = [el.dataset.scr, el.dataset.tab]; ui.tab[scr] = tab; refresh(); };
export { confirmDialog, commit };
