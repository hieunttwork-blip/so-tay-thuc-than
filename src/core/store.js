// Kho trạng thái: giữ state hiện tại, thông báo thay đổi cho giao diện và tự lưu (có trễ nhẹ để không ghi liên tục).
import { save } from './save.js';

export const store = { state: null, listeners: new Set(), saveTimer: null, lastSave: { ok: true }, enabled: true };

export function setState(s) { store.state = s; notify(); }
export const getState = () => store.state;
export function subscribe(fn) { store.listeners.add(fn); return () => store.listeners.delete(fn); }
function notify() { for (const fn of [...store.listeners]) { try { fn(store.state); } catch (e) { console.error('[store]', e); } } }

export function flushSave() {
  if (store.saveTimer) { clearTimeout(store.saveTimer); store.saveTimer = null; }
  if (store.state && store.enabled) store.lastSave = save(store.state);
  return store.lastSave;
}
/** Thông báo thay đổi và lên lịch lưu. immediate=true: lưu ngay (mua bán, mở khóa, nhận thưởng). */
export function commit(immediate = true) {
  notify();
  if (!store.enabled) return;
  if (immediate) flushSave();
  else if (!store.saveTimer) store.saveTimer = setTimeout(flushSave, 1500);
}
/** Chạy một thao tác lõi trên state rồi commit. */
export function act(fn, immediate = true) {
  const r = fn(store.state);
  commit(immediate);
  return r;
}
