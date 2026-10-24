// Đóng gói game thành thư mục dist/ để đăng lên mạng. Chạy: npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
// Chỉ đưa vào bản phát hành những tệp game thật sự dùng (các tệp SVG xuất ra trong assets/ chỉ để tham khảo).
const DIRS = ['src', 'icons'];
const ASSET_FILES = ['assets/icon.svg', 'assets/ui/title-map.webp', 'assets/ui/donate-qr.jpg'];
const list = [];
function copy(rel) {
  const from = path.join(root, rel), to = path.join(dist, rel);
  const st = fs.statSync(from);
  if (st.isDirectory()) { for (const n of fs.readdirSync(from)) copy(path.join(rel, n)); return; }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  list.push('./' + rel.split(path.sep).join('/'));
}
for (const f of FILES) copy(f);
for (const d of DIRS) copy(d);
for (const f of ASSET_FILES) copy(f);
// Tải sẵn song song mọi mô-đun JS và ảnh nền để game mở nhanh hơn.
{
  const mods = list.filter((f) => f.endsWith('.js') && f.startsWith('./src/'));
  const tags = ['<link rel="preload" as="image" href="assets/ui/title-map.webp">', ...mods.map((f) => `<link rel="modulepreload" href="${f.slice(2)}">`)].join('\n  ');
  const ip = path.join(dist, 'index.html');
  fs.writeFileSync(ip, fs.readFileSync(ip, 'utf8').replace('</head>', `  ${tags}\n</head>`));
}
list.unshift('./');
// Tự đổi phiên bản bộ nhớ đệm mỗi lần build để người chơi luôn nhận bản mới.
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const swPath = path.join(dist, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace(/const VERSION = '[^']*';/, `const VERSION = 'b${stamp}';`));
fs.writeFileSync(path.join(dist, 'cache-list.json'), JSON.stringify(list));
fs.writeFileSync(path.join(dist, '_headers'), '/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n');
const size = list.reduce((s, f) => { try { return s + fs.statSync(path.join(dist, f)).size; } catch { return s; } }, 0);
console.log(`Đã tạo dist/ gồm ${list.length - 1} tệp, ${(size / 1024 / 1024).toFixed(2)} MB. Đăng nguyên thư mục dist lên mạng là chơi được.`);
