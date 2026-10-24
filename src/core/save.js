// Lưu/tải tiến trình bằng localStorage: có phiên bản, kiểm tra dữ liệu, bản sao lưu, xuất/nhập, xóa.
import { validateState, SAVE_VERSION } from './state.js';
import { hashString } from './rng.js';

export const SAVE_KEY = 'sttt.save.v1';
export const BACKUP_KEY = 'sttt.save.backup.v1';

function getStorage() {
  try { const s = globalThis.localStorage; const k = '__t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch { return null; }
}

const sum = (text) => hashString(text).toString(36);

export function pack(state) {
  const body = JSON.stringify(state);
  return JSON.stringify({ app: 'so-tay-thuc-than', v: SAVE_VERSION, savedAt: state.savedAt, sum: sum(body), body });
}

/** Giải gói chuỗi lưu. Trả về { status: 'ok'|'repaired'|'corrupt', state, error }. */
export function unpack(text) {
  let wrap;
  try { wrap = JSON.parse(text); } catch { return { status: 'corrupt', error: 'Tệp lưu không đọc được (không phải JSON hợp lệ).' }; }
  if (!wrap || typeof wrap !== 'object' || typeof wrap.body !== 'string') return { status: 'corrupt', error: 'Tệp lưu thiếu dữ liệu.' };
  let raw;
  try { raw = JSON.parse(wrap.body); } catch { return { status: 'corrupt', error: 'Nội dung bản lưu bị hỏng.' }; }
  const state = validateState(raw);
  if (!state) return { status: 'corrupt', error: 'Dữ liệu bản lưu không hợp lệ hoặc từ phiên bản mới hơn.' };
  return { status: sum(wrap.body) === wrap.sum ? 'ok' : 'repaired', state };
}

export function save(state, storage = getStorage()) {
  if (!storage) return { ok: false, error: 'Trình duyệt không cho phép lưu dữ liệu.' };
  try {
    state.savedAt = Date.now();
    const text = pack(state);
    const prev = storage.getItem(SAVE_KEY);
    if (prev && unpack(prev).status !== 'corrupt') storage.setItem(BACKUP_KEY, prev);
    storage.setItem(SAVE_KEY, text);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Không lưu được: ' + (e && e.message ? e.message : e) };
  }
}

export function load(storage = getStorage()) {
  if (!storage) return { status: 'none', noStorage: true };
  let text;
  try { text = storage.getItem(SAVE_KEY); } catch { return { status: 'none', noStorage: true }; }
  if (!text) return { status: 'none' };
  const r = unpack(text);
  if (r.status === 'corrupt') r.hasBackup = Boolean(safeGet(storage, BACKUP_KEY));
  return r;
}
const safeGet = (s, k) => { try { return s.getItem(k); } catch { return null; } };

export function loadBackup(storage = getStorage()) {
  const text = storage && safeGet(storage, BACKUP_KEY);
  if (!text) return { status: 'none' };
  return unpack(text);
}

export function clearSave(storage = getStorage()) {
  if (!storage) return;
  try { storage.removeItem(SAVE_KEY); storage.removeItem(BACKUP_KEY); } catch { /* bỏ qua */ }
}

/** Lưu bản hỏng sang khóa riêng để người chơi có thể xuất ra nếu muốn. */
export function stashCorrupt(storage = getStorage()) {
  try { const t = storage.getItem(SAVE_KEY); if (t) storage.setItem(SAVE_KEY + '.corrupt', t); } catch { /* bỏ qua */ }
}
export const getCorruptText = (storage = getStorage()) => safeGet(storage, SAVE_KEY + '.corrupt') || safeGet(storage, SAVE_KEY);

export const exportText = (state) => pack(state);
export function importText(text) {
  const r = unpack(String(text || '').trim());
  return r.status === 'corrupt' ? { ok: false, error: r.error } : { ok: true, state: r.state, repaired: r.status === 'repaired' };
}
