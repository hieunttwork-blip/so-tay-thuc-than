// Logo, biểu tượng ứng dụng, bản đồ ba miền, cảnh nền địa điểm, huy hiệu và hoa văn giao diện. Tất cả là SVG tự vẽ.
import { iconG } from './icons.js';

const INK = '#4a2f1c', BRICK = '#b8442f', GOLD = '#e3a42b', CREAM = '#fbf3e3';

// ---------- Logo ----------
export function emblemSVG(size = 96) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="Biểu tượng Sổ Tay Thực Thần">
<circle cx="60" cy="60" r="57" fill="#f6ead0" stroke="${INK}" stroke-width="3"/>
<circle cx="60" cy="60" r="50" fill="none" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 5"/>
<path d="M16 86 L60 96 L104 86 L104 50 L60 60 L16 50Z" fill="${BRICK}" stroke="#7a2616" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M60 60 V96" stroke="#7a2616" stroke-width="2.4"/>
<path d="M22 54 L58 63 V92 L22 83Z" fill="#fffaf0" stroke="#7a2616" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M98 54 L62 63 V92 L98 83Z" fill="#f8ecd0" stroke="#7a2616" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M28 63l24 6M28 70l24 6M28 77l18 4M92 63l-24 6M92 70l-24 6" stroke="#d8c8a8" stroke-width="1.4" stroke-linecap="round"/>
<path d="M30 54 Q32 36 60 36 Q88 36 90 54 Q60 64 30 54Z" fill="#f6efe0" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
<ellipse cx="60" cy="42" rx="27" ry="6" fill="#d9a85c" stroke="${INK}" stroke-width="2"/>
<path d="M44 41q6 3 12 0M62 42q6 3 12 0" stroke="#8d3b2b" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M48 31c-4-5 4-7 0-13M60 29c-4-5 4-7 0-13M72 31c-4-5 4-7 0-13" stroke="#a89888" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
</svg>`;
}
export function logoSVG(width = 320) {
  const h = Math.round(width * 0.42);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 134" width="${width}" height="${h}" role="img" aria-label="Sổ Tay Thực Thần">
<g transform="translate(122 0) scale(.64)">${emblemSVG(120).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>
<text x="160" y="104" text-anchor="middle" font-family="'Be Vietnam Pro','Segoe UI',Georgia,serif" font-size="23" font-weight="800" fill="${INK}" letter-spacing="1.5">SỔ TAY THỰC THẦN</text>
<text x="160" y="124" text-anchor="middle" font-family="'Be Vietnam Pro','Segoe UI',Georgia,serif" font-size="10.5" fill="${BRICK}" letter-spacing="3">HÀNH TRÌNH ẨM THỰC BA MIỀN</text>
</svg>`;
}
export function appIconSVG(size = 192) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
<rect width="120" height="120" rx="26" fill="${BRICK}"/>
<rect x="6" y="6" width="108" height="108" rx="21" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-dasharray="4 5"/>
<g transform="translate(10 12) scale(.83)">${emblemSVG(120).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`;
}

// ---------- Bản đồ ba miền (360x440) ----------
const sea = (y, h, c = '#bfe0ea') => `<rect x="0" y="${y}" width="360" height="${h}" fill="${c}"/>`;
const wave = (x, y) => `<path d="M${x} ${y} q6 -5 12 0 t12 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>`;
const peak = (x, y, w, h, c = '#8aa87a', cap = true) => `<path d="M${x - w} ${y} L${x} ${y - h} L${x + w} ${y}Z" fill="${c}" stroke="#4a6a3a" stroke-width="1.4" stroke-linejoin="round"/>${cap ? `<path d="M${x - w * 0.28} ${y - h * 0.72} L${x} ${y - h} L${x + w * 0.28} ${y - h * 0.72} L${x} ${y - h * 0.62}Z" fill="#fff" opacity=".9"/>` : ''}`;
const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q3 -14 0 -26" stroke="#7a5a30" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M0 -26 q-12 -2 -16 6 M0 -26 q12 -2 16 6 M0 -26 q-8 -10 -14 -6 M0 -26 q8 -10 14 -6 M0 -26 q0 -10 0 -12" stroke="#3f8f48" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="-2" cy="-24" r="2.4" fill="#7a5a30"/></g>`;
const boat = (x, y, c = '#c24a32') => `<g transform="translate(${x} ${y})"><path d="M-12 0 Q0 8 12 0 L9 -4 H-9Z" fill="${c}" stroke="#7a2616" stroke-width="1.2"/><path d="M0 -4 V-14 L8 -6Z" fill="#fff8e8" stroke="#a89878" stroke-width=".8"/></g>`;
const house = (x, y, c = '#c4572f') => `<g transform="translate(${x} ${y})"><rect x="-7" y="-6" width="14" height="8" fill="#f6e6c0" stroke="${INK}" stroke-width="1"/><path d="M-9 -6 L0 -14 L9 -6Z" fill="${c}" stroke="${INK}" stroke-width="1"/></g>`;
const field = (x, y, w, h, c1 = '#b8d672', c2 = '#a5c85e') => Array.from({ length: Math.floor(h / 8) }, (_, i) => `<rect x="${x}" y="${y + i * 8}" width="${w}" height="7" rx="2" fill="${i % 2 ? c1 : c2}"/>`).join('');
const river = (d, w = 7, c = '#9fd0e4') => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5" stroke-dasharray="3 7" stroke-linecap="round"/>`;
const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="16" ry="6"/><ellipse cx="-8" cy="-4" rx="9" ry="6"/><ellipse cx="7" cy="-5" rx="10" ry="7"/></g>`;

export function mapSVG(region) {
  const wrap = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Bản đồ ${region}" class="art-map"><rect width="360" height="440" fill="${bg}"/>${inner}</svg>`;
  if (region === 'bac') {
    return wrap(`
${sea(300, 140, '#bfe0ea')}${wave(240, 330)}${wave(280, 360)}${wave(210, 395)}${wave(300, 410)}
<path d="M0 300 Q120 270 230 300 Q300 285 360 296 V0 H0Z" fill="#dce8c0"/>
${peak(40, 140, 50, 80)}${peak(95, 120, 46, 70, '#7e9c6e')}${peak(20, 90, 36, 56, '#96b286')}${peak(70, 75, 40, 60, '#86a476')}${peak(140, 110, 36, 50, '#96b286')}
${field(150, 200, 120, 56, '#cfe28a', '#b9d46e')}
${river('M120 90 Q150 150 175 190 Q215 235 260 270 Q290 295 320 310', 8)}${river('M175 190 Q150 230 150 280', 5)}
<path d="M250 296 q12 -26 20 -2 q8 -26 22 0 q8 -20 18 4 q-30 8 -60 -2Z" fill="#8aa87a" stroke="#4a6a3a" stroke-width="1.3"/><path d="M280 270 q8 -20 14 0 q8 -16 16 2 q-16 6 -30 -2Z" fill="#7e9c6e" stroke="#4a6a3a" stroke-width="1.2"/>
${boat(300, 330)}${boat(250, 345, '#e3a42b')}
<g transform="translate(160 262)"><rect x="-10" y="-14" width="20" height="14" fill="#f4e3b0" stroke="${INK}" stroke-width="1.2"/><path d="M-14 -14 L0 -26 L14 -14Z" fill="${BRICK}" stroke="${INK}" stroke-width="1.2"/><path d="M-10 -22 L0 -34 L10 -22Z" fill="#c4572f" stroke="${INK}" stroke-width="1.2"/></g>
${house(200, 232)}${house(230, 250)}${house(120, 280)}
${cloud(280, 60)}${cloud(120, 40, .8)}`, '#e6f0d6');
  }
  if (region === 'trung') {
    return wrap(`
${sea(0, 440, '#bfe0ea')}
<path d="M0 0 H215 Q250 60 232 120 Q205 170 240 230 Q268 290 240 350 Q225 400 250 440 H0Z" fill="#e8c898"/>
<path d="M215 0 Q250 60 232 120 Q205 170 240 230 Q268 290 240 350 Q225 400 250 440" fill="none" stroke="#f6e6b8" stroke-width="9"/>
<path d="M0 0 H150 Q170 90 140 170 Q120 250 150 330 Q160 400 150 440 H0Z" fill="#c9a068" opacity=".55"/>
${peak(40, 120, 42, 76, '#a07848', false)}${peak(95, 200, 46, 80, '#8e6a3a', false)}${peak(50, 290, 44, 78, '#a07848', false)}${peak(100, 370, 44, 70, '#8e6a3a', false)}${peak(30, 410, 36, 50, '#a07848', false)}
${river('M150 60 Q180 70 215 80', 5)}${river('M150 170 Q190 180 232 190', 5)}${river('M160 300 Q200 310 246 320', 5)}
${wave(280, 60)}${wave(300, 150)}${wave(290, 250)}${wave(300, 330)}${wave(280, 410)}${wave(320, 110)}${wave(316, 380)}
${boat(310, 200)}${boat(300, 290, '#e3a42b')}
<g transform="translate(150 140)"><path d="M0 0 L8 -14 L16 0Z" fill="#c4572f" stroke="${INK}" stroke-width="1.2"/><rect x="-4" y="0" width="24" height="8" fill="#e8b878" stroke="${INK}" stroke-width="1.2"/></g>
${house(180, 250, '#7a3a6a')}${house(170, 380)}${house(196, 110)}
${iconG('lantern', 20, 190, 175)}
${cloud(80, 50)}${cloud(300, 40, .8)}`, '#f6e6c8');
  }
  return wrap(`
${sea(0, 440, '#bfe0ea')}
<path d="M110 0 H360 V330 Q300 380 230 360 Q160 340 120 300 Q80 240 110 180 Q140 100 110 0Z" fill="#cfe6b0"/>
${river('M360 60 Q290 90 270 150 Q250 210 200 260 Q170 300 150 330', 11)}${river('M340 150 Q300 170 280 200 Q260 240 270 300', 8)}${river('M270 150 Q220 140 170 170 Q140 200 150 240', 7)}${river('M200 260 Q230 300 260 340', 6)}
${field(180, 70, 90, 40, '#bddc82', '#a8cc6a')}${field(150, 280, 70, 40, '#bddc82', '#a8cc6a')}
${palm(150, 120)}${palm(180, 330, .9)}${palm(250, 80, .85)}${palm(300, 300, 1)}${palm(130, 220, .8)}
${boat(260, 190)}${boat(215, 310, '#e3a42b')}${boat(330, 120, '#3a7a9a')}
${house(300, 220, '#3f8f78')}${house(190, 200, '#3f8f78')}${house(240, 130, '#3f8f78')}
<path d="M60 360 q10 -22 26 -8 q14 -16 28 4 q10 14 -8 22 q-26 8 -46 -18Z" fill="#8cc070" stroke="#4a8a3a" stroke-width="1.3"/>${palm(86, 360, .7)}
${wave(20, 80)}${wave(40, 200)}${wave(30, 280)}${wave(120, 400)}${wave(220, 410)}${wave(310, 390)}
${cloud(60, 50)}${cloud(300, 40, .8)}`, '#e1f1e6');
}

// ---------- Cảnh nền địa điểm (360x120) ----------
const SKY = (c1, c2) => `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="360" height="120" fill="url(#sg)"/>`;
const tileHouse = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${INK}" stroke-width="1.2"/><path d="M${x - 3} ${y} L${x + w / 2} ${y - 11} L${x + w + 3} ${y}Z" fill="#b8442f" stroke="${INK}" stroke-width="1.2"/><rect x="${x + w / 2 - 4}" y="${y + h - 14}" width="8" height="14" fill="#6a4a2a"/>`;
const SCENES = {
  pho: () => SKY('#f8d9a0', '#fbf0d8') + `<rect y="96" width="360" height="24" fill="#c8a878"/>${[10, 60, 110, 160, 215, 265, 310].map((x, i) => tileHouse(x, 54 + (i % 2) * 6, 40, 42 - (i % 2) * 6, ['#f4d9a0', '#e8c890', '#f0d0a8'][i % 3])).join('')}${[40, 130, 240, 330].map((x) => iconG('lantern', 16, x, 34)).join('')}`,
  ho: () => SKY('#cfe8f4', '#eaf4f0') + `<rect y="70" width="360" height="50" fill="#a8d4e0"/>${wave(30, 90)}${wave(150, 100)}${wave(250, 88)}<g transform="translate(250 40)"><rect x="-10" y="0" width="20" height="26" fill="#f4e3b0" stroke="${INK}" stroke-width="1.2"/><path d="M-16 0 L0 -14 L16 0Z" fill="#b8442f" stroke="${INK}" stroke-width="1.2"/><path d="M-10 12 L0 4 L10 12Z" fill="#c4572f" stroke="${INK}" stroke-width="1"/></g>${[60, 120, 190, 300].map((x, i) => `<ellipse cx="${x}" cy="${100 + (i % 2) * 6}" rx="14" ry="5" fill="#6aa04a" stroke="#3f7030" stroke-width="1"/><circle cx="${x}" cy="${97 + (i % 2) * 6}" r="4.5" fill="#f08aa0"/>`).join('')}`,
  cang: () => SKY('#bcd8ea', '#eef4f6') + `<rect y="82" width="360" height="38" fill="#7fb4cc"/>${wave(20, 98)}${wave(200, 104)}<path d="M40 82 L50 64 H150 L168 82Z" fill="#3a5a7a" stroke="${INK}" stroke-width="1.3"/><rect x="70" y="50" width="48" height="14" fill="#b8442f" stroke="${INK}" stroke-width="1.2"/><rect x="100" y="38" width="14" height="12" fill="#e3a42b" stroke="${INK}" stroke-width="1.2"/><path d="M250 82 V30 H290 M290 30 V50" stroke="#6a5a50" stroke-width="3" fill="none"/><rect x="262" y="62" width="40" height="20" fill="#3f8f78" stroke="${INK}" stroke-width="1.2"/><rect x="302" y="66" width="30" height="16" fill="#c24a32" stroke="${INK}" stroke-width="1.2"/>`,
  nui: () => SKY('#e6eef8', '#f8f0e0') + `${[[40, 100, 60, 70], [120, 100, 70, 84], [210, 100, 60, 64], [300, 100, 66, 76]].map(([x, y, w, h], i) => `<path d="M${x - w} ${y} L${x} ${y - h} L${x + w} ${y}Z" fill="${['#8aa87a', '#7e9c6e', '#96b286', '#86a476'][i]}" stroke="#4a6a3a" stroke-width="1.3"/>`).join('')}${[0, 1, 2, 3, 4].map((i) => `<path d="M${20 + i * 70} ${108 - i % 2 * 6} q20 -6 40 0" stroke="#d8d068" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${30 + i * 70} ${98 - i % 2 * 4} q16 -5 32 0" stroke="#e8e078" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}<ellipse cx="90" cy="48" rx="46" ry="8" fill="#fff" opacity=".7"/><ellipse cx="270" cy="38" rx="40" ry="7" fill="#fff" opacity=".7"/>`,
  vinh: () => SKY('#d6ecf4', '#f0f4ec') + `<rect y="76" width="360" height="44" fill="#8ccade"/>${wave(10, 92)}${wave(120, 100)}${wave(260, 94)}${[[60, 90, 30, 56], [140, 90, 26, 42], [250, 90, 34, 62], [320, 90, 22, 36]].map(([x, y, w, h]) => `<path d="M${x - w} ${y} Q${x - w * 0.8} ${y - h} ${x - 4} ${y - h} Q${x + w * 0.6} ${y - h} ${x + w} ${y}Z" fill="#9ab88a" stroke="#4a6a3a" stroke-width="1.3"/>`).join('')}${boat(200, 100)}`,
  hue: () => SKY('#f8dcc0', '#fbf0d8') + `<rect y="84" width="360" height="36" fill="#a8d0dc"/>${wave(20, 100)}${wave(230, 106)}<rect x="110" y="48" width="140" height="36" fill="#c4572f" stroke="${INK}" stroke-width="1.4"/><path d="M104 48 L180 24 L256 48Z" fill="#e3a42b" stroke="${INK}" stroke-width="1.4"/><rect x="164" y="58" width="32" height="26" rx="14" fill="#6a2a1a"/><path d="M12 100 Q40 82 68 100Z" fill="#f2dca0" stroke="#a8863a" stroke-width="1.2"/>`,
  bien: () => SKY('#cfe8f6', '#f6f0e0') + `<rect y="62" width="360" height="58" fill="#7fc0d8"/>${wave(10, 80)}${wave(130, 90)}${wave(260, 82)}${wave(60, 104)}${wave(220, 108)}<circle cx="290" cy="34" r="14" fill="#f6d26a"/><path d="M0 108 Q90 90 180 108 T360 106 V120 H0Z" fill="#f2dca0"/><path d="M60 70 Q120 40 180 70" stroke="#c24a32" stroke-width="5" fill="none"/><path d="M80 70 V86 M100 60 V86 M120 54 V86 M140 54 V86 M160 60 V86" stroke="#c24a32" stroke-width="2.4"/>`,
  hoian: () => SKY('#f4d8a8', '#fbeed0') + `<rect y="92" width="360" height="28" fill="#8ec6d8"/>${wave(30, 106)}${[0, 1, 2, 3, 4].map((i) => tileHouse(16 + i * 68, 50 + (i % 2) * 4, 50, 42 - (i % 2) * 4, ['#f4d878', '#f0c868', '#f8e090', '#f0d070', '#f4dc84'][i])).join('')}${[36, 100, 170, 240, 310].map((x, i) => iconG('lantern', 18, x, 28 + (i % 2) * 8)).join('')}`,
  dong: () => SKY('#e6f0d0', '#f6f4dc') + `<rect y="62" width="360" height="58" fill="#b8d672"/>${field(0, 68, 360, 52, '#cfe28a', '#b0cf68')}<path d="M0 62 Q80 52 160 62 T360 60" stroke="#8ab048" stroke-width="2" fill="none"/>${peak(300, 62, 40, 32, '#a8c090', false)}<g transform="translate(70 50)"><rect x="-12" y="0" width="24" height="14" fill="#f4e3b0" stroke="${INK}" stroke-width="1.2"/><path d="M-16 0 L0 -12 L16 0Z" fill="#c89458" stroke="${INK}" stroke-width="1.2"/></g>${palm(250, 70, .8)}`,
  saigon: () => SKY('#fbd6b0', '#fcefd8') + `<rect y="98" width="360" height="22" fill="#a8a098"/>${[[14, 40, 26, 58], [48, 26, 22, 72], [76, 50, 30, 48], [114, 18, 24, 80], [146, 44, 30, 54], [182, 30, 24, 68], [214, 12, 26, 86], [248, 46, 28, 52], [282, 28, 24, 70], [312, 42, 30, 56]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${['#6a8aa8', '#7a9ab4', '#5a7a98'][i % 3]}" stroke="${INK}" stroke-width="1.1"/>${[0, 1, 2, 3].map((r) => `<path d="M${x + 4} ${y + 8 + r * 12} h${w - 8}" stroke="#fff6c8" stroke-width="2.4" opacity=".75"/>`).join('')}`).join('')}<circle cx="42" cy="104" r="5" fill="${INK}"/><circle cx="62" cy="104" r="5" fill="${INK}"/><path d="M42 104 L52 88 H66 L62 104" stroke="#c24a32" stroke-width="2.4" fill="none"/>`,
  'cho-noi': () => SKY('#f8e0b0', '#fdf2d8') + `<rect y="58" width="360" height="62" fill="#8cc6b0"/>${wave(10, 82)}${wave(150, 100)}${wave(280, 90)}${[[60, 84, '#c24a32'], [170, 92, '#e3a42b'], [280, 86, '#3a7a9a']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><path d="M-30 0 Q0 14 30 0 L24 -8 H-24Z" fill="${c}" stroke="${INK}" stroke-width="1.2"/><path d="M-12 -8 V-34" stroke="${INK}" stroke-width="2"/><circle cx="-12" cy="-38" r="5" fill="#f2b21a"/><circle cx="6" cy="-14" r="6" fill="#6aa04a"/><circle cx="16" cy="-12" r="5" fill="#e8805a"/></g>`).join('')}`,
  vuon: () => SKY('#d8f0d0', '#f4f6e0') + `<rect y="88" width="360" height="32" fill="#8cc6a8"/>${wave(20, 104)}${wave(200, 108)}${[40, 110, 190, 270, 330].map((x, i) => palm(x, 90 - (i % 2) * 6, 1.1)).join('')}${[80, 230].map((x) => house(x, 84, '#3f8f78')).join('')}`,
  dao: () => SKY('#cfecf6', '#f6f4e4') + `<rect y="62" width="360" height="58" fill="#6cc0d4"/>${wave(20, 80)}${wave(160, 92)}${wave(280, 82)}${wave(60, 106)}${wave(230, 108)}<path d="M110 84 Q140 52 190 84Z" fill="#f2dca0" stroke="#c8a458" stroke-width="1.3"/>${palm(150, 70, .9)}${palm(172, 74, .7)}<circle cx="300" cy="30" r="13" fill="#f6d26a"/>${boat(240, 98)}`,
};
export function sceneSVG(kind) {
  const fn = SCENES[kind] || SCENES.pho;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" class="art-scene" role="img" aria-label="Cảnh ${kind}">${fn()}</svg>`;
}
export const SCENE_KINDS = Object.keys(SCENES);

// ---------- Huy hiệu ----------
export function levelBadge(level, size = 56) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="${size}" height="${size}" role="img" aria-label="Cấp ${level}" class="art-badge"><path d="M30 3l24 13v28L30 57 6 44V16z" fill="#79ad4c" stroke="#3f7030" stroke-width="2.4" stroke-linejoin="round"/><path d="M30 9l18 10v22L30 51 12 41V19z" fill="none" stroke="#cfe8a8" stroke-width="1.4"/><text x="30" y="37" text-anchor="middle" font-family="'Be Vietnam Pro','Segoe UI',sans-serif" font-size="${level > 9 ? 20 : 24}" font-weight="800" fill="#fff" stroke="#3f7030" stroke-width=".6">${level}</text></svg>`;
}
export function achievementBadge(iconName, unlocked = true, size = 56) {
  const body = unlocked ? '#f4d27a' : '#d8d0c0', rim = unlocked ? '#a8761a' : '#a89c88';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 66" width="${size}" height="${Math.round(size * 1.1)}" class="art-badge ${unlocked ? '' : 'is-locked'}"><path d="M14 40l-6 22 12-6 4 8 6-18M46 40l6 22-12-6-4 8-6-18" fill="${unlocked ? '#b8442f' : '#a89c88'}" stroke="${unlocked ? '#7a2616' : '#7a7062'}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="30" cy="28" r="22" fill="${body}" stroke="${rim}" stroke-width="2.6"/><circle cx="30" cy="28" r="17" fill="none" stroke="${rim}" stroke-width="1" stroke-dasharray="2 3"/><g opacity="${unlocked ? 1 : 0.35}"${unlocked ? '' : ' style="filter:grayscale(1)"'}>${iconG(iconName, 24, 18, 16)}</g></svg>`;
}
export function rankCrest(index, size = 48) {
  const c = ['#a8a098', '#79ad4c', '#4aa0c8', '#e3a42b', '#c24a32', '#7a4a9a'][Math.min(5, Math.floor(index / 2))];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52" width="${size}" height="${Math.round(size * 1.08)}" class="art-badge"><path d="M24 3l19 7v16c0 12-8 20-19 24C13 46 5 38 5 26V10z" fill="${c}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 9l13 5v12c0 9-5 14-13 18-8-4-13-9-13-18V14z" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"/>${Array.from({ length: Math.min(5, index % 5 + 1) }, (_, i) => `<path d="M${24 + (i - Math.min(5, index % 5 + 1) / 2 + 0.5) * 7} 28 l1.6 3.4 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff6c8" transform="translate(0 -8) scale(.9)"/>`).join('')}</svg>`;
}

// ---------- Hoa văn giao diện (xuất ra assets/ui/*.svg) ----------
export const uiPaperPattern = () => `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#f8eed6"/><g fill="none" stroke="#e8d6ac" stroke-width="1" opacity=".8"><path d="M0 30 Q30 18 60 30 T120 30M0 90 Q30 78 60 90 T120 90"/><circle cx="30" cy="60" r="10"/><circle cx="90" cy="60" r="10"/></g><g fill="#efdfb8" opacity=".7"><circle cx="60" cy="10" r="2"/><circle cx="60" cy="110" r="2"/><circle cx="8" cy="60" r="2"/><circle cx="112" cy="60" r="2"/></g></svg>\n`;
export const uiWoodPattern = () => `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80"><rect width="160" height="80" fill="#8a5a30"/><g fill="none" stroke="#734a26" stroke-width="1.4" opacity=".7"><path d="M0 12 Q40 6 80 12 T160 12M0 36 Q40 30 80 36 T160 36M0 60 Q40 54 80 60 T160 60"/></g><path d="M0 0H160M0 40H160" stroke="#5e3c1c" stroke-width="2"/></svg>\n`;
export const uiRibbon = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 56" width="320" height="56"><path d="M0 14h30l12 14-12 14H0l14-14z" fill="#8a2a1a"/><path d="M320 14h-30l-12 14 12 14h30l-14-14z" fill="#8a2a1a"/><rect x="24" y="6" width="272" height="44" rx="6" fill="#b8442f" stroke="#7a2616" stroke-width="2"/><path d="M32 12h256M32 44h256" stroke="#f0c870" stroke-width="1.4" stroke-dasharray="4 4" opacity=".8"/></svg>\n`;
export const uiCardFrame = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260"><rect x="3" y="3" width="194" height="254" rx="16" fill="#fbf3e3" stroke="#4a2f1c" stroke-width="3"/><rect x="11" y="11" width="178" height="238" rx="11" fill="none" stroke="#e3a42b" stroke-width="1.6" stroke-dasharray="5 4"/><g fill="#b8442f"><circle cx="20" cy="20" r="4"/><circle cx="180" cy="20" r="4"/><circle cx="20" cy="240" r="4"/><circle cx="180" cy="240" r="4"/></g></svg>\n`;
export const uiPanelCorner = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><path d="M4 44V12Q4 4 12 4h32" fill="none" stroke="#b8442f" stroke-width="3" stroke-linecap="round"/><path d="M12 36V18Q12 12 18 12h18" fill="none" stroke="#e3a42b" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="8" r="3" fill="#b8442f"/></svg>\n`;
