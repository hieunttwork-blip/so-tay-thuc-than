// Bộ vẽ món ăn SVG: mỗi món là một danh sách "token" (xem data/dishes.js). Token đầu là đồ đựng, các token sau là thành phần.
// Mọi hình đều tạo bằng mã (không ảnh ngoài), vẽ trong khung 100x100, rõ nét ở mọi kích thước.
import { hashString, seededRng } from '../core/rng.js';

const f = (x) => Math.round(x * 10) / 10;

export function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  const n = parseInt(m ? m[1] : '999999', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
export const lighten = (c, t = 0.3) => mix(c, '#ffffff', t);
export const darken = (c, t = 0.25) => mix(c, '#2a1a10', t);

const ring = (c, n, k = 0.62, r, off = 0) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const kk = k * (0.7 + r() * 0.5);
    pts.push([c.cx + c.rx * kk * Math.cos(a), c.cy + c.ry * kk * Math.sin(a)]);
  }
  return pts;
};

// ---------- Đồ đựng ----------
const VESSELS = {
  bowl(a) {
    const body = a[0] || '#f4ead8', rim = a[1] || lighten(body, 0.4);
    return {
      ctx: { cx: 50, cy: 46, rx: 32, ry: 10, top: 34 },
      svg: `<ellipse cx="50" cy="88" rx="30" ry="5" fill="#000" opacity=".12"/>
<path d="M13 46 Q15 82 50 85 Q85 82 87 46 Z" fill="${body}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<path d="M19 62 Q50 70 81 62" fill="none" stroke="${rim}" stroke-width="3" opacity=".8"/>
<ellipse cx="50" cy="46" rx="37" ry="12" fill="${rim}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<ellipse cx="50" cy="46.5" rx="33" ry="10" fill="${darken(body, 0.18)}"/>`,
    };
  },
  plate(a) {
    const body = a[0] || '#f6eedd';
    return {
      ctx: { cx: 50, cy: 56, rx: 30, ry: 12, top: 40 },
      svg: `<ellipse cx="50" cy="66" rx="42" ry="9" fill="#000" opacity=".1"/>
<ellipse cx="50" cy="60" rx="44" ry="20" fill="${body}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<ellipse cx="50" cy="58" rx="34" ry="14" fill="${lighten(body, 0.25)}" stroke="${darken(body, 0.12)}" stroke-width=".8"/>`,
    };
  },
  glass() {
    return {
      ctx: { cx: 50, cy: 28, rx: 17, ry: 4.5, top: 22, kind: 'glass', x1: 33, x2: 67, y1: 24, y2: 84 },
      svg: `<ellipse cx="50" cy="88" rx="22" ry="4" fill="#000" opacity=".12"/>
<clipPath id="gclip"><path d="M33 22 L67 22 L63 84 L37 84 Z"/></clipPath>
<path d="M30 16 L70 16 L65 86 L35 86 Z" fill="#dfeff2" opacity=".55" stroke="#9fb8bf" stroke-width="1.4"/>`,
      after: '<path d="M30 16 L70 16 L65 86 L35 86 Z" fill="none" stroke="#9fb8bf" stroke-width="1.4"/><path d="M36 22 L39 80" stroke="#fff" stroke-width="2" opacity=".6"/>',
    };
  },
  cup(a) {
    const body = a[0] || '#f1e3c8';
    return {
      ctx: { cx: 50, cy: 44, rx: 22, ry: 6, top: 38, kind: 'cup' },
      svg: `<ellipse cx="50" cy="84" rx="34" ry="6" fill="#000" opacity=".1"/>
<ellipse cx="50" cy="80" rx="32" ry="7" fill="${lighten(body, 0.2)}" stroke="${darken(body, 0.25)}" stroke-width="1"/>
<path d="M72 48 Q92 48 88 64 Q84 74 70 68" fill="none" stroke="${darken(body, 0.25)}" stroke-width="5"/>
<path d="M26 40 Q28 78 50 80 Q72 78 74 40 Z" fill="${body}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<ellipse cx="50" cy="40" rx="24" ry="7" fill="${lighten(body, 0.35)}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<ellipse cx="50" cy="40.5" rx="21" ry="5.5" fill="${darken(body, 0.2)}"/>`,
    };
  },
  leaf() {
    return {
      ctx: { cx: 50, cy: 58, rx: 32, ry: 17, top: 44 },
      svg: `<ellipse cx="50" cy="64" rx="46" ry="22" fill="#000" opacity=".08"/>
<path d="M6 60 Q30 28 50 36 Q72 28 94 60 Q74 90 50 86 Q26 90 6 60 Z" fill="#6aa04a" stroke="#3f7030" stroke-width="1.2"/>
<path d="M10 60 Q50 54 92 60" stroke="#3f7030" stroke-width="1.6" fill="none"/>
<path d="M26 44 L34 60 M44 38 L48 58 M62 38 L58 58 M78 46 L68 60 M26 76 L34 60 M44 82 L48 60 M62 82 L58 60 M78 74 L68 60" stroke="#8cbf62" stroke-width="1" fill="none" opacity=".8"/>`,
    };
  },
  tray() {
    return {
      ctx: { cx: 50, cy: 58, rx: 34, ry: 12, top: 44 },
      svg: `<rect x="8" y="42" width="84" height="40" rx="7" fill="#b8844e" stroke="#7a4f2a" stroke-width="1.4"/>
<rect x="13" y="46" width="74" height="32" rx="5" fill="#d0a066"/>
<path d="M16 54 H84 M16 62 H84 M16 70 H84" stroke="#b8844e" stroke-width="1" opacity=".6"/>`,
    };
  },
  pot(a) {
    const body = a[0] || '#a8452e';
    return {
      ctx: { cx: 50, cy: 46, rx: 29, ry: 8, top: 36 },
      svg: `<ellipse cx="50" cy="88" rx="30" ry="5" fill="#000" opacity=".12"/>
<path d="M8 50 Q4 50 6 58 M92 50 Q96 50 94 58" stroke="${darken(body, 0.3)}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M12 46 Q10 84 50 86 Q90 84 88 46 Z" fill="${body}" stroke="${darken(body, 0.3)}" stroke-width="1.2"/>
<path d="M18 62 Q50 70 82 62" stroke="${lighten(body, 0.3)}" stroke-width="2.5" fill="none" opacity=".7"/>
<ellipse cx="50" cy="46" rx="38" ry="10.5" fill="${darken(body, 0.15)}" stroke="${darken(body, 0.35)}" stroke-width="1.2"/>
<ellipse cx="50" cy="47" rx="33" ry="8" fill="${darken(body, 0.45)}"/>`,
    };
  },
  board() {
    return {
      ctx: { cx: 50, cy: 62, rx: 34, ry: 10, top: 48 },
      svg: `<g transform="rotate(-4 50 62)"><rect x="9" y="50" width="82" height="28" rx="8" fill="#a8723e" stroke="#6e4524" stroke-width="1.4"/>
<rect x="12" y="53" width="76" height="22" rx="6" fill="#c89458"/><path d="M16 60 H84 M16 68 H84" stroke="#a8723e" stroke-width="1" opacity=".6"/><circle cx="86" cy="64" r="3" fill="#6e4524"/></g>`,
    };
  },
  bamboo() {
    const tube = (x) => `<rect x="${x - 9}" y="34" width="18" height="52" rx="3" fill="#b8c46a" stroke="#6f7a30" stroke-width="1.2"/><path d="M${x - 9} 52 H${x + 9} M${x - 9} 70 H${x + 9}" stroke="#6f7a30" stroke-width="1.5"/><ellipse cx="${x}" cy="34" rx="9" ry="3.2" fill="#e8dcb0" stroke="#6f7a30" stroke-width="1"/>`;
    return {
      ctx: { cx: 50, cy: 34, rx: 26, ry: 4, top: 26 },
      svg: `<ellipse cx="50" cy="88" rx="38" ry="5" fill="#000" opacity=".1"/>${tube(28)}${tube(50)}${tube(72)}`,
    };
  },
  coco() {
    return {
      ctx: { cx: 50, cy: 38, rx: 20, ry: 6, top: 30 },
      svg: `<ellipse cx="50" cy="90" rx="30" ry="4" fill="#000" opacity=".12"/>
<circle cx="50" cy="60" r="31" fill="#7c9a4a" stroke="#4f6a2a" stroke-width="1.4"/>
<path d="M30 78 Q50 90 70 78" stroke="#a8c46a" stroke-width="3" fill="none" opacity=".7"/>
<ellipse cx="50" cy="38" rx="22" ry="7" fill="#f4eed8" stroke="#4f6a2a" stroke-width="1.4"/>
<ellipse cx="50" cy="38.5" rx="19" ry="5" fill="#fbf8ec"/>`,
    };
  },
};

// ---------- Thành phần ----------
const C = {
  soup(a, c) { return `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${f(c.rx * 0.97)}" ry="${f(c.ry * 0.93)}" fill="${a[0]}"/><ellipse cx="${c.cx - c.rx * 0.3}" cy="${c.cy - c.ry * 0.3}" rx="${f(c.rx * 0.3)}" ry="${f(c.ry * 0.2)}" fill="#fff" opacity=".25"/>`; },
  noodle(a, c, r) {
    const [type, col] = [a[0], a[1] || '#f4ead2'];
    if (type === 'bun') {
      return [0, 1, 2].map((i) => `<rect x="${f(c.cx - c.rx * 0.7 + i * c.rx * 0.45)}" y="${f(c.cy - c.ry * 0.9 + (i % 2) * 3)}" width="${f(c.rx * 0.5)}" height="${f(c.ry * 1.5)}" rx="4" fill="${col}" stroke="${darken(col, 0.15)}" stroke-width=".8"/><path d="M${f(c.cx - c.rx * 0.6 + i * c.rx * 0.45)} ${f(c.cy - c.ry * 0.4)} h${f(c.rx * 0.3)} M${f(c.cx - c.rx * 0.6 + i * c.rx * 0.45)} ${f(c.cy)} h${f(c.rx * 0.3)}" stroke="${darken(col, 0.12)}" stroke-width=".7"/>`).join('');
    }
    const n = type === 'thin' ? 9 : 5, w = type === 'thin' ? 1.3 : type === 'thick' ? 3.4 : 2.8;
    let s = '';
    for (let i = 0; i < n; i++) {
      const y = c.cy - c.ry * 0.7 + (i / (n - 1)) * c.ry * 1.4, k = (r() - 0.5) * 4;
      s += `<path d="M${f(c.cx - c.rx * 0.82)} ${f(y)} C${f(c.cx - c.rx * 0.3)} ${f(y - 4 + k)} ${f(c.cx + c.rx * 0.3)} ${f(y + 4 - k)} ${f(c.cx + c.rx * 0.82)} ${f(y)}" fill="none" stroke="${i % 2 ? col : darken(col, 0.1)}" stroke-width="${w}" stroke-linecap="round"/>`;
    }
    return s;
  },
  rice(a, c, r) {
    const col = a[0] || '#f8f2e2';
    let s = `<path d="M${f(c.cx - c.rx * 0.85)} ${f(c.cy + c.ry * 0.3)} Q${c.cx} ${f(c.cy - c.ry * 3)} ${f(c.cx + c.rx * 0.85)} ${f(c.cy + c.ry * 0.3)} Q${c.cx} ${f(c.cy + c.ry * 1.1)} ${f(c.cx - c.rx * 0.85)} ${f(c.cy + c.ry * 0.3)}Z" fill="${col}" stroke="${darken(col, 0.18)}" stroke-width=".9"/>`;
    for (let i = 0; i < 12; i++) s += `<ellipse cx="${f(c.cx + (r() - 0.5) * c.rx * 1.3)}" cy="${f(c.cy - r() * c.ry * 1.7)}" rx="1.4" ry=".7" fill="${darken(col, 0.12)}" transform="rotate(${f(r() * 180)} ${c.cx} ${c.cy})"/>`;
    return s;
  },
  meat(a, c, r) {
    const [kind, col] = [a[0], a[1] || '#8d3b2b'], hi = lighten(col, 0.35);
    const P = ring(c, kind === 'shred' ? 14 : 5, 0.55, r);
    if (kind === 'slice') return P.slice(0, 4).map(([x, y], i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="8" ry="3.6" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8" transform="rotate(${-20 + i * 14} ${f(x)} ${f(y)})"/><ellipse cx="${f(x - 2)}" cy="${f(y - 1)}" rx="3.5" ry="1" fill="${hi}" opacity=".6" transform="rotate(${-20 + i * 14} ${f(x)} ${f(y)})"/>`).join('');
    if (kind === 'ball') return P.slice(0, 4).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="4.4" fill="${col}" stroke="${darken(col, 0.25)}" stroke-width=".8"/><circle cx="${f(x - 1.4)}" cy="${f(y - 1.4)}" r="1.2" fill="${hi}"/>`).join('');
    if (kind === 'cube') return P.map(([x, y]) => `<rect x="${f(x - 3.4)}" y="${f(y - 3)}" width="6.8" height="6" rx="1.4" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/>`).join('');
    if (kind === 'rib') return P.slice(0, 3).map(([x, y], i) => `<rect x="${f(x - 10)}" y="${f(y - 3)}" width="20" height="6.5" rx="3" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8" transform="rotate(${-15 + i * 12} ${f(x)} ${f(y)})"/><circle cx="${f(x + 10)}" cy="${f(y)}" r="2.2" fill="#f4ead8" transform="rotate(${-15 + i * 12} ${f(x)} ${f(y)})"/>`).join('');
    if (kind === 'chop') return `<g transform="translate(${c.cx - 14} ${c.cy - 12}) rotate(-12)"><path d="M0 8 Q4 -2 18 0 Q30 2 28 14 Q20 22 6 20 Q-2 16 0 8Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M6 6 L20 16 M12 3 L24 12 M3 12 L14 19" stroke="${darken(col, 0.4)}" stroke-width="1.2" opacity=".6"/></g>`;
    if (kind === 'patty') return P.slice(0, 4).map(([x, y], i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7.5" ry="4" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8" transform="rotate(${i * 25} ${f(x)} ${f(y)})"/><path d="M${f(x - 4)} ${f(y - 1)} l7 3 M${f(x - 3)} ${f(y + 1.5)} l6 2" stroke="${darken(col, 0.45)}" stroke-width="1" opacity=".7"/>`).join('');
    return P.map(([x, y], i) => `<path d="M${f(x - 3)} ${f(y)} q3 -3 6 ${i % 3 - 1}" stroke="${i % 2 ? col : hi}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('');
  },
  shrimp(a, c, r) {
    const col = a[0] || '#e0763a';
    return ring(c, 3, 0.55, r).map(([x, y], i) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${i * 50 - 30})"><path d="M-7 0 Q-6 -7 2 -6 Q8 -4 6 3 Q4 -1 0 0 Q-3 1 -7 0Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/><path d="M-4 -2 l1 3 M-1 -4 l1 4 M2 -4 l1 3" stroke="${darken(col, 0.3)}" stroke-width=".7"/><path d="M6 3 l3 3 l-4 0" fill="${lighten(col, 0.2)}"/></g>`).join('');
  },
  crab(a, c) {
    const col = a[0] || '#d95b3a', big = a[1] === 'big', k = big ? 1.5 : 1;
    return `<g transform="translate(${c.cx} ${c.cy - 2}) scale(${k})"><path d="M-10 -2 l-8 -4 M-10 2 l-9 0 M-9 5 l-7 5 M10 -2 l8 -4 M10 2 l9 0 M9 5 l7 5" stroke="${darken(col, 0.3)}" stroke-width="2.2" stroke-linecap="round"/><ellipse rx="12" ry="9" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><circle cx="-14" cy="-8" r="3.6" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/><circle cx="14" cy="-8" r="3.6" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/><circle cx="-3" cy="-3" r="1.3" fill="#fff"/><circle cx="3" cy="-3" r="1.3" fill="#fff"/><path d="M-6 3 Q0 7 6 3" stroke="${darken(col, 0.4)}" fill="none" stroke-width="1"/></g>`;
  },
  squid(a, c, r) {
    const col = a[0] || '#f4ead0';
    return ring(c, 5, 0.6, r).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.6" fill="none" stroke="${col}" stroke-width="2.4"/><circle cx="${f(x)}" cy="${f(y)}" r="4.8" fill="none" stroke="${darken(col, 0.2)}" stroke-width=".6"/>`).join('');
  },
  fish(a, c) {
    const [kind, col] = [a[0], a[1] || '#e8b84a'];
    if (kind === 'whole') return `<g transform="translate(${c.cx} ${c.cy - 3}) rotate(-6)"><path d="M-20 0 Q-8 -11 8 -6 L20 -12 L18 0 L20 12 L8 6 Q-8 11 -20 0Z" fill="${col}" stroke="${darken(col, 0.35)}" stroke-width="1"/><circle cx="-12" cy="-2" r="1.7" fill="#2a1a10"/><path d="M-6 -6 Q-3 0 -6 6 M0 -6 Q3 0 0 6 M6 -5 Q9 0 6 5" stroke="${darken(col, 0.3)}" fill="none" stroke-width=".9"/></g>`;
    return `<g transform="translate(${c.cx - 4} ${c.cy - 8})"><path d="M-14 4 Q-6 -8 10 -4 Q18 0 14 8 Q2 14 -10 10 Q-15 8 -14 4Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M-8 2 Q0 -2 10 2 M-8 7 Q0 3 10 7" stroke="${darken(col, 0.3)}" fill="none" stroke-width=".9"/></g><g transform="translate(${c.cx + 12} ${c.cy - 4}) rotate(14)"><path d="M-9 3 Q-3 -6 8 -3 Q13 1 9 6 Q0 10 -7 8Z" fill="${lighten(col, 0.12)}" stroke="${darken(col, 0.3)}" stroke-width="1"/></g>`;
  },
  shell(a, c, r) {
    const col = a[0] || '#e8dcc0', scallop = a[1] === 'scallop';
    return ring(c, scallop ? 3 : 5, 0.58, r).map(([x, y]) => scallop
      ? `<g transform="translate(${f(x)} ${f(y)})"><path d="M-7 4 Q-9 -6 0 -7 Q9 -6 7 4 Q0 8 -7 4Z" fill="${col}" stroke="${darken(col, 0.35)}" stroke-width=".9"/><path d="M0 4 V-6 M-3 4 L-5 -4 M3 4 L5 -4" stroke="${darken(col, 0.3)}" stroke-width=".7"/><ellipse cy="0" rx="3.5" ry="2.2" fill="#fbe9cf"/></g>`
      : `<g transform="translate(${f(x)} ${f(y)})"><ellipse rx="5" ry="3.6" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/><path d="M-2 0 a2 1.5 0 1 1 3 1" stroke="${darken(col, 0.4)}" fill="none" stroke-width=".8"/></g>`).join('');
  },
  eel(a, c) {
    const col = a[0] || '#7a5a3a';
    return `<path d="M${c.cx - 18} ${c.cy - 2} q6 -9 12 0 t12 0 t12 0" fill="none" stroke="${darken(col, 0.2)}" stroke-width="6" stroke-linecap="round"/><path d="M${c.cx - 18} ${c.cy - 2} q6 -9 12 0 t12 0 t12 0" fill="none" stroke="${col}" stroke-width="3.6" stroke-linecap="round"/>`;
  },
  herb(a, c, r) {
    const col = a[0] || '#5d9440';
    if (a[1] === 'dill') return ring(c, 4, 0.7, r).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)})" stroke="${col}" stroke-width="1" stroke-linecap="round"><path d="M0 0 l-4 -5 M0 0 l0 -6 M0 0 l4 -5 M0 0 l-6 -1 M0 0 l6 -1"/></g>`).join('');
    return ring(c, 6, 0.72, r).map(([x, y], i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="1.8" fill="${i % 2 ? col : lighten(col, 0.2)}" stroke="${darken(col, 0.3)}" stroke-width=".5" transform="rotate(${i * 55} ${f(x)} ${f(y)})"/>`).join('');
  },
  onion(a, c, r) {
    const col = a[0] || '#7fae55';
    return ring(c, 8, 0.6, r).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="none" stroke="${col}" stroke-width="1.1"/>`).join('');
  },
  sprout(a, c, r) { return ring(c, 7, 0.65, r).map(([x, y], i) => `<path d="M${f(x)} ${f(y)} q3 -4 ${i % 2 ? 5 : -5} -1" stroke="#f4f0d8" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join(''); },
  greens(a, c, r) {
    const col = a[0] || '#79ad4c';
    return ring(c, 6, 0.7, r).map(([x, y], i) => `<path d="M${f(x)} ${f(y)} q-5 -6 0 -8 q6 2 0 8z" fill="${i % 2 ? col : lighten(col, 0.18)}" stroke="${darken(col, 0.3)}" stroke-width=".6" transform="rotate(${i * 60} ${f(x)} ${f(y)})"/>`).join('');
  },
  cuke(a, c, r) { return ring(c, 4, 0.7, r).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="#cfe4a0" stroke="#6f9a3c" stroke-width="1"/><circle cx="${f(x)}" cy="${f(y)}" r="1.4" fill="#e8f2c8"/>`).join(''); },
  tomato(a, c, r) { return ring(c, 3, 0.7, r).map(([x, y], i) => `<path d="M${f(x - 4)} ${f(y)} a4 4 0 0 1 8 0z" fill="#d9402a" stroke="#8a2616" stroke-width=".8" transform="rotate(${i * 70} ${f(x)} ${f(y)})"/>`).join(''); },
  chili(a, c, r) { return ring(c, 2, 0.75, r).map(([x, y], i) => `<path d="M${f(x - 5)} ${f(y)} q6 -5 11 2" stroke="#d92a1a" stroke-width="2.2" fill="none" stroke-linecap="round" transform="rotate(${i * 90 + 20} ${f(x)} ${f(y)})"/><circle cx="${f(x - 5)}" cy="${f(y)}" r="1" fill="#4f7a2a"/>`).join(''); },
  lime(a, c) { return `<g transform="translate(${c.cx + c.rx * 0.65} ${c.cy - c.ry * 0.1}) rotate(-14)"><path d="M-6 0 a6 6 0 0 1 12 0z" fill="#b8d94a" stroke="#6f9a1a" stroke-width="1"/><path d="M0 0 V-5 M-3 0 L-4 -4 M3 0 L4 -4" stroke="#e8f2a0" stroke-width=".8"/></g>`; },
  shallot(a, c, r) { return ring(c, 9, 0.55, r).map(([x, y]) => `<rect x="${f(x)}" y="${f(y)}" width="2.6" height="1.5" rx=".7" fill="#d9a23c" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`).join(''); },
  peanut(a, c, r) { return ring(c, 7, 0.6, r).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.7" ry="1.2" fill="#c98a4a" stroke="#8a5a2a" stroke-width=".4"/>`).join(''); },
  vung(a, c, r) { return ring(c, 10, 0.55, r).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx=".9" ry=".5" fill="#f4ead0"/>`).join(''); },
  egg(a, c) {
    const kind = a[0];
    if (kind === 'thin') return [-1, 0, 1].map((i) => `<path d="M${c.cx - 8} ${c.cy - 4 + i * 3} q8 -3 16 0" stroke="#f2d66a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`).join('');
    if (kind === 'fried') return `<path d="M${c.cx - 6} ${c.cy - 8} q8 -8 16 -1 q6 8 -2 12 q-8 4 -14 -1 q-6 -4 0 -10z" fill="#fffaf0" stroke="#d8c8a8" stroke-width=".8"/><circle cx="${c.cx + 2}" cy="${c.cy - 4}" r="3.6" fill="#f2b21a"/><circle cx="${c.cx + 1}" cy="${c.cy - 5}" r="1" fill="#fde28a"/>`;
    return `<g transform="translate(${c.cx + 10} ${c.cy - 4})"><ellipse rx="6" ry="4.4" fill="#fffaf0" stroke="#d8c8a8" stroke-width=".8"/><ellipse rx="2.8" ry="2.2" fill="#f2b21a"/></g>`;
  },
  tofu(a, c, r) { const col = a[0] || '#e5b95a'; return ring(c, 4, 0.6, r).map(([x, y]) => `<rect x="${f(x - 3.5)}" y="${f(y - 3)}" width="7" height="6" rx="1.4" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8"/>`).join(''); },
  mushroom(a, c, r) { const col = a[0] || '#6b4a33'; return ring(c, 3, 0.62, r).map(([x, y]) => `<path d="M${f(x - 4)} ${f(y)} a4 3.4 0 0 1 8 0z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".7"/><rect x="${f(x - 1)}" y="${f(y)}" width="2" height="3" fill="#e8d8b8"/>`).join(''); },
  pepper(a, c, r) { return ring(c, 10, 0.6, r).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r=".7" fill="#2a1a10"/>`).join(''); },
  ginger(a, c, r) { return ring(c, 4, 0.62, r).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.2" ry="1.8" fill="#e8d09a" stroke="#b8985a" stroke-width=".6"/>`).join(''); },
  eggplant(a, c, r) { return ring(c, 3, 0.6, r).map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3.6" fill="#7a4a8a" stroke="#4a2a5a" stroke-width=".8"/><circle cx="${f(x)}" cy="${f(y)}" r="1.4" fill="#e8dcc8"/>`).join(''); },
  flower(a, c, r) { const col = a[0] || '#f4d03a'; return ring(c, 3, 0.62, r).map(([x, y]) => [0, 72, 144, 216, 288].map((d) => `<ellipse cx="${f(x)}" cy="${f(y - 2.2)}" rx="1.3" ry="2.2" fill="${col}" transform="rotate(${d} ${f(x)} ${f(y)})"/>`).join('') + `<circle cx="${f(x)}" cy="${f(y)}" r="1" fill="#c98a1a"/>`).join(''); },
  banana(a, c) { return [0, 1, 2].map((i) => `<path d="M${c.cx - 16 + i * 4} ${c.cy - 6 + i * 4} q16 -9 32 0 q-16 5 -32 0z" fill="${i % 2 ? '#f2d24a' : '#e8c43a'}" stroke="#a8841a" stroke-width=".9"/>`).join(''); },
  loaf(a, c) {
    const thin = a[0] === 'thin', small = a[0] === 'small';
    const w = thin ? 74 : small ? 36 : 62, h = thin ? 12 : small ? 12 : 18, x0 = 50 - w / 2, y0 = 52 - h / 2;
    return `<g transform="rotate(-8 50 52)"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${h / 2}" fill="#e0a85a" stroke="#9a6a2a" stroke-width="1.1"/><path d="${[0.25, 0.45, 0.65].map((k) => `M${f(x0 + w * k)} ${y0 + 2} l3 ${h - 4}`).join(' ')}" stroke="#b8803a" stroke-width="1.6" fill="none"/><path d="M${x0 + 6} ${y0 + 3} h${w - 12}" stroke="#f4d08a" stroke-width="1.5" opacity=".7"/></g>`;
  },
  cake(a, c) {
    const [kind, col] = [a[0], a[1] || '#f5f0e0'], x = c.cx, y = c.cy - 4;
    if (kind === 'pyramid') return `<path d="M${x - 14} ${y + 8} L${x} ${y - 14} L${x + 14} ${y + 8} Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M${x} ${y - 14} V${y + 8}" stroke="${darken(col, 0.2)}" stroke-width=".8"/>`;
    if (kind === 'square') return `<rect x="${x - 15}" y="${y - 8}" width="30" height="16" rx="3" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M${x - 15} ${y} H${x + 15} M${x} ${y - 8} V${y + 8}" stroke="${darken(col, 0.2)}" stroke-width=".6" opacity=".6"/>`;
    if (kind === 'log') return `<rect x="${x - 26}" y="${y - 8}" width="52" height="16" rx="8" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M${x - 10} ${y - 8} V${y + 8} M${x + 6} ${y - 8} V${y + 8}" stroke="#7a9a4a" stroke-width="1.4"/><ellipse cx="${x + 26}" cy="${y}" rx="3" ry="8" fill="${lighten(col, 0.3)}" stroke="${darken(col, 0.3)}" stroke-width=".8"/>`;
    if (kind === 'flower') return [0, 60, 120, 180, 240, 300].map((d) => `<ellipse cx="${x}" cy="${y - 8}" rx="6" ry="9" fill="${col}" stroke="${darken(col, 0.25)}" stroke-width=".8" transform="rotate(${d} ${x} ${y})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="4" fill="${darken(col, 0.12)}"/>`;
    return `<ellipse cx="${x}" cy="${y}" rx="17" ry="11" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><ellipse cx="${x - 5}" cy="${y - 3}" rx="6" ry="2.6" fill="${lighten(col, 0.4)}" opacity=".6"/>`;
  },
  roll(a, c) {
    const [kind, col] = [a[0], a[1] || '#d98a2b'];
    const n = kind === 'rice' ? 3 : 3;
    return [0, 1, 2].map((i) => {
      const x = c.cx - 22 + i * 4, y = c.cy - 12 + i * 9;
      if (kind === 'fried') return `<g transform="rotate(-8 ${x} ${y})"><rect x="${x}" y="${y}" width="34" height="8" rx="4" fill="${col}" stroke="${darken(col, 0.35)}" stroke-width=".9"/><path d="M${x + 5} ${y + 2} h18" stroke="${lighten(col, 0.4)}" stroke-width="1.2" opacity=".8"/><circle cx="${x + 34}" cy="${y + 4}" r="3.6" fill="#f2c47a" stroke="${darken(col, 0.35)}" stroke-width=".7"/><circle cx="${x + 34}" cy="${y + 4}" r="1.4" fill="#a8683a"/></g>`;
      if (kind === 'fresh') return `<g transform="rotate(-6 ${x} ${y})"><rect x="${x}" y="${y}" width="32" height="8" rx="4" fill="${col}" opacity=".9" stroke="#c8c0a8" stroke-width=".8"/><circle cx="${x + 9}" cy="${y + 4}" r="2.2" fill="#e8805a"/><circle cx="${x + 18}" cy="${y + 4}" r="2.2" fill="#6aa04a"/><circle cx="${x + 26}" cy="${y + 4}" r="1.8" fill="#f2c47a"/></g>`;
      return `<g transform="rotate(-5 ${x} ${y})"><rect x="${x}" y="${y}" width="32" height="8" rx="4" fill="${col}" stroke="${darken(col, 0.18)}" stroke-width=".9"/><path d="M${x + 8} ${y + 1} v6 M${x + 16} ${y + 1} v6 M${x + 24} ${y + 1} v6" stroke="${darken(col, 0.1)}" stroke-width=".7"/></g>`;
    }).slice(0, n).join('');
  },
  pancake(a, c) {
    const [size, col] = [a[0], a[1] || '#e8b53a'], k = size === 'big' ? 1.2 : size === 'small' ? 0.8 : 1, x = c.cx, y = c.cy;
    if (size === 'round') return `<ellipse cx="${x}" cy="${y}" rx="28" ry="12" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1"/><path d="M${x - 14} ${y - 3} q6 -4 12 0 q6 4 12 0 M${x - 12} ${y + 3} q6 -3 12 0" stroke="${darken(col, 0.3)}" fill="none" stroke-width="1"/>`;
    return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-30 4 A30 16 0 0 1 30 4 Q0 14 -30 4Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width="1.1"/><path d="M-22 4 q6 -8 12 -2 M-4 2 q6 -9 12 -2 M12 4 q5 -6 10 -1" stroke="${darken(col, 0.3)}" fill="none" stroke-width="1"/><path d="M-26 5 Q0 12 26 5" stroke="${lighten(col, 0.4)}" fill="none" stroke-width="1" opacity=".7"/></g>`;
  },
  sticky(a, c) {
    const cols = (a[0] || '#f4e7b0').split(','), x = c.cx, y = c.cy;
    const base = `<path d="M${x - 24} ${y + 4} Q${x} ${y - 26} ${x + 24} ${y + 4} Q${x} ${y + 12} ${x - 24} ${y + 4}Z" fill="${cols[0]}" stroke="${darken(cols[0], 0.25)}" stroke-width="1"/>`;
    const stripes = cols.map((col, i) => `<path d="M${x - 20 + i * (40 / cols.length)} ${y + 4 - i} q${(20 / cols.length)} ${-16 + i} ${(40 / cols.length)} ${i} q${-(20 / cols.length)} 4 ${-(40 / cols.length)} -${i}z" fill="${col}" opacity=".9"/>`).join('');
    return base + stripes;
  },
  beans(a, c, r) { const col = a[0] || '#f0d66a'; return ring(c, 9, 0.6, r).map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.7" ry="1.2" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".4"/>`).join(''); },
  bowlets(a, c) { const col = a[0] || '#fbf7ec'; return [0, 1, 2, 3, 4].map((i) => `<ellipse cx="${c.cx - 24 + (i % 3) * 24 + (i > 2 ? 12 : 0)}" cy="${c.cy - 8 + (i > 2 ? 16 : 0)}" rx="9" ry="4" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".9"/><ellipse cx="${c.cx - 24 + (i % 3) * 24 + (i > 2 ? 12 : 0)}" cy="${c.cy - 8 + (i > 2 ? 16 : 0) - 1}" rx="5" ry="2" fill="${darken(col, 0.06)}"/>`).join(''); },
  dumpling(a, c, r) { const col = a[0] || '#f7d9b0'; return ring(c, 4, 0.55, r).map(([x, y]) => `<g transform="translate(${f(x)} ${f(y)})"><path d="M-6 3 Q-7 -6 0 -6 Q7 -6 6 3 Q0 6 -6 3Z" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".9"/><path d="M-4 -1 q4 -3 8 0" stroke="${darken(col, 0.25)}" fill="none" stroke-width=".8"/></g>`).join(''); },
  candy(a, c, r) { const col = a[0] || '#e8c070'; return ring(c, 5, 0.58, r).map(([x, y], i) => `<rect x="${f(x - 5)}" y="${f(y - 2.5)}" width="10" height="5" rx="1.6" fill="${col}" stroke="${darken(col, 0.3)}" stroke-width=".8" transform="rotate(${i * 36} ${f(x)} ${f(y)})"/>`).join(''); },
  coconut(a, c) { return `<path d="M${c.cx - 14} ${c.cy - 3} q7 -7 14 0 t14 0" stroke="#fffdf4" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${c.cx - 8} ${c.cy + 2} q5 -4 10 0 t10 0" stroke="#f4ecd0" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; },
  jelly(a, c, r) { const col = a[0] || '#e8dcc4'; return ring(c, 5, 0.6, r).map(([x, y]) => `<rect x="${f(x - 2.6)}" y="${f(y - 2.6)}" width="5.2" height="5.2" rx="1.2" fill="${col}" opacity=".85" stroke="${darken(col, 0.25)}" stroke-width=".6"/>`).join(''); },
  cracker(a, c) { return `<g transform="translate(${c.cx + c.rx * 0.5} ${c.cy - 8}) rotate(20)"><circle r="9" fill="#e8c27a" stroke="#a8782a" stroke-width="1"/><circle cx="-3" cy="-2" r="1.2" fill="#c8984a"/><circle cx="3" cy="2" r="1.2" fill="#c8984a"/><circle cx="2" cy="-4" r="1" fill="#c8984a"/><circle cx="-2" cy="4" r="1" fill="#c8984a"/></g>`; },
  dip(a, c) { const col = a[0] || '#b9743a'; return `<ellipse cx="${c.cx + c.rx * 0.62}" cy="${c.cy + c.ry * 0.55}" rx="8" ry="3.4" fill="#f6eedd" stroke="#a89878" stroke-width=".8"/><ellipse cx="${c.cx + c.rx * 0.62}" cy="${c.cy + c.ry * 0.5}" rx="6" ry="2.3" fill="${col}"/>`; },
  steam(a, c) { return [-9, 0, 9].map((dx, i) => `<path d="M${c.cx + dx} ${c.top - 1} q-4 -5 0 -9 t0 -9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7" transform="translate(0 ${i % 2 ? -2 : 1})"/>`).join(''); },
  leaf(a, c) { return `<g transform="translate(${c.cx + c.rx * 0.7} ${c.cy - c.ry * 1.2}) rotate(24)"><path d="M0 0 q-6 -7 0 -13 q6 6 0 13z" fill="#6aa04a" stroke="#3f7030" stroke-width=".8"/><path d="M0 0 V-12" stroke="#3f7030" stroke-width=".6"/></g>`; },
  // Đồ uống
  liq(a, c) {
    const cols = (a[0] || '#c98a4b').split(',');
    if (c.kind === 'cup') {
      return `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${c.rx}" ry="${c.ry - 0.5}" fill="${cols[0]}"/><ellipse cx="${c.cx - 6}" cy="${c.cy - 1.4}" rx="6" ry="1.3" fill="#fff" opacity=".25"/>`;
    }
    const h = (c.y2 - c.y1) / cols.length;
    return `<g clip-path="url(#gclip)">${cols.map((col, i) => `<rect x="30" y="${f(c.y1 + 6 + i * h)}" width="40" height="${f(h + 1)}" fill="${col}"/>`).join('')}<ellipse cx="50" cy="${c.y1 + 6}" rx="17" ry="3.4" fill="${lighten(cols[0], 0.2)}"/></g>`;
  },
  foam(a, c) { return `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${f((c.rx || 20) * 0.9)}" ry="${f((c.ry || 5) * 0.8)}" fill="${a[0] || '#f6efe0'}" stroke="${darken(a[0] || '#f6efe0', 0.15)}" stroke-width=".6"/><ellipse cx="${c.cx - 5}" cy="${c.cy - 1}" rx="5" ry="1.2" fill="#fff" opacity=".5"/>`; },
  ice(a, c) { return [[-8, 2], [3, 0], [10, 3]].map(([dx, dy], i) => `<rect x="${c.cx + dx - 4}" y="${c.cy + dy - 3 + (c.kind === 'glass' ? 2 : -2)}" width="8" height="8" rx="1.8" fill="#eaf6fa" opacity=".8" stroke="#a8c8d4" stroke-width=".8" transform="rotate(${i * 18 - 12} ${c.cx + dx} ${c.cy + dy})"/>`).join(''); },
  straw(a, c) { const col = a[0] || '#d9503a'; return `<path d="M${c.cx + 4} ${c.kind === 'glass' ? 74 : c.cy + 10} L${c.cx + 18} ${c.kind === 'glass' ? 6 : c.cy - 30}" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/><path d="M${c.cx + 4} ${c.kind === 'glass' ? 74 : c.cy + 10} L${c.cx + 18} ${c.kind === 'glass' ? 6 : c.cy - 30}" stroke="#fff" stroke-width="1" stroke-dasharray="4 5" opacity=".7"/>`; },
};

export function parseSpec(spec) {
  return spec.map((t) => { const [name, ...args] = t.split(':'); const hex = args.length && args[0].startsWith('#') ? args : args; return { name, args: hex }; });
}

/** Trả về nội dung SVG (không gồm thẻ svg ngoài) của một món. */
export function dishInner(spec) {
  const toks = parseSpec(spec);
  const r = seededRng(hashString(spec.join('|')));
  const [v, ...rest] = toks;
  const vessel = (VESSELS[v.name] || VESSELS.plate)(v.args);
  let out = vessel.svg;
  const ctx = vessel.ctx;
  for (const t of rest) {
    const fn = C[t.name];
    if (!fn) continue;
    out += fn(t.args, ctx, r);
  }
  return out + (vessel.after || '');
}

export function dishSVG(spec, size = 96, label = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label.replace(/"/g, '')}" class="art-dish">${dishInner(spec)}</svg>`;
}
export const COMPONENTS = Object.keys(C);
export const VESSEL_NAMES = Object.keys(VESSELS);
