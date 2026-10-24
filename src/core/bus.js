// Kênh sự kiện nhỏ: lõi game phát tin (toast, lên cấp, mở khóa...), giao diện lắng nghe. Khi chạy kiểm thử, không ai nghe cũng không sao.
const handlers = new Map();
export function on(type, fn) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type).add(fn);
  return () => handlers.get(type).delete(fn);
}
export function emit(type, payload) {
  const set = handlers.get(type);
  if (!set) return;
  for (const fn of [...set]) {
    try { fn(payload); } catch (e) { console.error('[bus]', type, e); }
  }
}
export const toast = (text, kind = 'info') => emit('toast', { text, kind });
