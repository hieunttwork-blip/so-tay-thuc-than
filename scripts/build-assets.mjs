// Xuất toàn bộ tài sản SVG ra thư mục assets/ để xem, thay thế từng cái riêng lẻ hoặc dùng ngoài game.
// Game dùng trực tiếp các hàm vẽ trong src/art/, nên chạy script này là tùy chọn (npm run assets).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS, ICON_NAMES, iconFile } from '../src/art/icons.js';
import { DISHES } from '../src/data/dishes.js';
import { dishSVG } from '../src/art/dish.js';
import { NPC_LIST } from '../src/data/npcs.js';
import { personSVG, PLAYER_LOOK } from '../src/art/people.js';
import { logoSVG, emblemSVG, appIconSVG, mapSVG, sceneSVG, SCENE_KINDS, levelBadge, achievementBadge, rankCrest, uiPaperPattern, uiWoodPattern, uiRibbon, uiCardFrame, uiPanelCorner } from '../src/art/scenes.js';
import { ACHIEVEMENTS } from '../src/data/quests.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.rmSync(root, { recursive: true, force: true });
const write = (rel, text) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text.endsWith('\n') ? text : text + '\n'); };

write('logo.svg', logoSVG(640));
write('emblem.svg', emblemSVG(256));
write('icon.svg', appIconSVG(512));
for (const n of ICON_NAMES) write(`icons/${n}.svg`, iconFile(n));
for (const d of DISHES) write(`dishes/${d.id}.svg`, dishSVG(d.art, 256, d.name));
for (const n of NPC_LIST) write(`people/${n.name.toLowerCase().replace(/\s+/g, '-')}.svg`, personSVG(n.look, 256, n.name));
write('people/nguoi-choi.svg', personSVG(PLAYER_LOOK, 256, 'Người chơi'));
for (const r of ['bac', 'trung', 'nam']) write(`maps/${r}.svg`, mapSVG(r));
for (const k of SCENE_KINDS) write(`scenes/${k}.svg`, sceneSVG(k));
write('badges/level-10.svg', levelBadge(10, 128));
for (const a of ACHIEVEMENTS.slice(0, 3)) write(`badges/${a.id}.svg`, achievementBadge(a.icon, true, 128));
write('badges/locked.svg', achievementBadge('b-star', false, 128));
for (let i = 0; i < 6; i++) write(`badges/rank-${i}.svg`, rankCrest(i * 2, 128));
write('ui/paper.svg', uiPaperPattern());
write('ui/wood.svg', uiWoodPattern());
write('ui/ribbon.svg', uiRibbon());
write('ui/card-frame.svg', uiCardFrame());
write('ui/panel-corner.svg', uiPanelCorner());
let count = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : count++; })(root);
console.log(`Đã xuất ${count} tệp SVG vào assets/`);
