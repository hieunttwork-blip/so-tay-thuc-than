// Chân dung nhân vật và thực khách (SVG, khung 100x100). Mỗi người ghép từ: da, tóc, kiểu tóc, mũ, trang phục, phụ kiện.
import { darken, lighten } from './dish.js';

const EYES = (y = 44) => `<circle cx="42" cy="${y}" r="2.1" fill="#2a1a10"/><circle cx="58" cy="${y}" r="2.1" fill="#2a1a10"/><circle cx="42.7" cy="${y - 0.8}" r=".7" fill="#fff"/><circle cx="58.7" cy="${y - 0.8}" r=".7" fill="#fff"/>`;

function hairBack(style, hair) {
  if (style === 'long') return `<path d="M26 44 Q24 20 50 18 Q76 20 74 44 L76 78 L24 78 Z" fill="${hair}"/>`;
  if (style === 'braid') return `<path d="M70 40 Q82 50 76 62 Q74 74 80 84" stroke="${hair}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="80" cy="85" r="3" fill="#c24a32"/>`;
  return '';
}
function hairFront(style, hair) {
  const cap = `<path d="M28 42 Q26 20 50 19 Q74 20 72 42 Q66 30 50 30 Q34 30 28 42Z" fill="${hair}"/>`;
  if (style === 'bun') return `<circle cx="50" cy="15" r="8" fill="${hair}"/>${cap}`;
  if (style === 'bald') return '';
  return cap;
}
function hat(kind, outfit) {
  switch (kind) {
    case 'nonla': return `<path d="M12 36 Q50 -6 88 36 Q50 30 12 36Z" fill="#f2dca0" stroke="#a8863a" stroke-width="1.4"/><path d="M26 31 Q50 8 74 31M36 24Q50 12 64 24" stroke="#c8a458" stroke-width="1" fill="none"/><path d="M32 36 Q30 52 38 56M68 36 Q70 52 62 56" stroke="${outfit}" stroke-width="1.8" fill="none"/>`;
    case 'cap': return `<path d="M27 32 Q28 14 50 14 Q72 14 73 32Z" fill="${outfit}" stroke="${darken(outfit, 0.3)}" stroke-width="1.2"/><path d="M60 30 Q82 28 84 34 Q70 36 58 33Z" fill="${darken(outfit, 0.15)}" stroke="${darken(outfit, 0.3)}" stroke-width="1"/>`;
    case 'bere': return `<ellipse cx="50" cy="22" rx="26" ry="10" fill="${outfit}" stroke="${darken(outfit, 0.3)}" stroke-width="1.2"/><circle cx="50" cy="12" r="2.4" fill="${darken(outfit, 0.3)}"/>`;
    case 'khan': return `<path d="M27 34 Q28 14 50 14 Q72 14 73 34 Q50 26 27 34Z" fill="${outfit}" stroke="${darken(outfit, 0.3)}" stroke-width="1.2"/><path d="M27 34 Q50 26 73 34" stroke="#f4d03a" stroke-width="2.4" fill="none"/><path d="M70 30 l10 8 -4 2 -2 -4z" fill="${outfit}"/>`;
    case 'chef': return `<path d="M30 30 L30 20 Q22 12 32 8 Q36 0 48 4 Q60 -2 66 6 Q78 8 70 20 L70 30Z" fill="#fff" stroke="#c8c0b0" stroke-width="1.2"/><path d="M30 28 H70" stroke="#d8d0c0" stroke-width="1.4"/>`;
    default: return '';
  }
}
function accessory(kind, outfit) {
  switch (kind) {
    case 'glasses': return `<circle cx="42" cy="44" r="5.6" fill="none" stroke="#2a1a10" stroke-width="1.4"/><circle cx="58" cy="44" r="5.6" fill="none" stroke="#2a1a10" stroke-width="1.4"/><path d="M47.6 44h4.8" stroke="#2a1a10" stroke-width="1.4"/>`;
    case 'mustache': return `<path d="M40 56 Q45 52 50 56 Q55 52 60 56 Q55 60 50 57 Q45 60 40 56Z" fill="#3a2a20"/>`;
    case 'flower': return `<g transform="translate(34 26)">${[0, 72, 144, 216, 288].map((d) => `<ellipse cx="0" cy="-3.2" rx="2" ry="3.2" fill="#f08aa0" transform="rotate(${d})"/>`).join('')}<circle r="1.8" fill="#f4d03a"/></g>`;
    case 'apron': return `<path d="M36 74 L40 90 L60 90 L64 74 Z" fill="#fffaf0" stroke="#d8c8a8" stroke-width="1"/>`;
    default: return '';
  }
}

export function personSVG(look = {}, size = 96, label = '') {
  const L = { skin: '#e2b48c', hair: '#2a1e18', style: 'short', hat: 'none', outfit: '#6f9a5a', acc: 'none', ...look };
  const mouth = '<path d="M44 56 Q50 61 56 56" stroke="#8a3a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  const showMustache = L.acc === 'mustache';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label.replace(/"/g, '')}" class="art-person">
<circle cx="50" cy="50" r="48" fill="${lighten(L.outfit, 0.72)}"/>
${hairBack(L.style, L.hair)}
<path d="M14 100 Q16 74 36 70 L64 70 Q84 74 86 100Z" fill="${L.outfit}" stroke="${darken(L.outfit, 0.3)}" stroke-width="1.2"/>
${L.acc === 'apron' ? accessory('apron') : ''}
<rect x="43" y="60" width="14" height="13" rx="4" fill="${darken(L.skin, 0.1)}"/>
<path d="M38 72 L50 80 L62 72" fill="none" stroke="${darken(L.outfit, 0.3)}" stroke-width="1.4"/>
<ellipse cx="28" cy="48" rx="3.4" ry="5" fill="${L.skin}"/><ellipse cx="72" cy="48" rx="3.4" ry="5" fill="${L.skin}"/>
<ellipse cx="50" cy="45" rx="22" ry="24" fill="${L.skin}" stroke="${darken(L.skin, 0.25)}" stroke-width="1"/>
${hairFront(L.style, L.hair)}
${EYES()}
<circle cx="36" cy="52" r="3.4" fill="#f08a7a" opacity=".35"/><circle cx="64" cy="52" r="3.4" fill="#f08a7a" opacity=".35"/>
<path d="M50 46 q-2 5 1 6" stroke="${darken(L.skin, 0.3)}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
${showMustache ? '' : mouth}
${L.acc === 'mustache' || L.acc === 'glasses' || L.acc === 'flower' ? accessory(L.acc) : ''}
${hat(L.hat, L.outfit)}
</svg>`;
}

export const PLAYER_LOOK = { skin: '#f0c9a0', hair: '#2a1a14', style: 'braid', hat: 'chef', outfit: '#b8442f', acc: 'none' };
