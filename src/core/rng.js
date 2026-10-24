// Bộ sinh số ngẫu nhiên có thể lưu (mulberry32). Trạng thái nằm trong state.rng nên tải lại trang không "đổi vận".
export function nextFloat(state) {
  if (!Number.isFinite(state.rng)) state.rng = 123456789;
  let t = (state.rng = (state.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const randInt = (state, min, max) => min + Math.floor(nextFloat(state) * (max - min + 1));
export const chance = (state, p) => nextFloat(state) < p;
export const pick = (state, arr) => arr[Math.floor(nextFloat(state) * arr.length)];
export function shuffle(state, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextFloat(state) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function weightedPick(state, entries) {
  const total = entries.reduce((s, e) => s + e[1], 0);
  let r = nextFloat(state) * total;
  for (const [v, w] of entries) { if ((r -= w) < 0) return v; }
  return entries[entries.length - 1][0];
}
// Băm chuỗi thành số nguyên dương (dùng cho hình vẽ cố định và hạt giống phụ).
export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function seededRng(seed) {
  const s = { rng: seed >>> 0 };
  return () => nextFloat(s);
}
