// Kiểm tra tài sản: mọi SVG phải đúng cấu trúc XML, có viewBox, và mọi tệp CSS/HTML tham chiếu tới assets/ đều tồn tại.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0, files = 0;
const fail = (m) => { bad++; console.error('  ✗ ' + m); };

export function wellFormed(svg) {
  const stack = [];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let last = 0, m;
  while ((m = re.exec(svg))) {
    const between = svg.slice(last, m.index);
    if (/[<>]/.test(between)) return `ký tự < hoặc > lạ gần vị trí ${last}`;
    last = re.lastIndex;
    if (m[0].startsWith('<!--') || m[0].startsWith('<?')) continue;
    const [, close, name, , self] = m;
    if (close) { if (stack.pop() !== name) return `thẻ đóng </${name}> không khớp`; }
    else if (!self) stack.push(name);
  }
  if (/[<>]/.test(svg.slice(last))) return 'còn ký tự < hoặc > ở cuối';
  return stack.length ? `thẻ <${stack.pop()}> chưa đóng` : null;
}

function walk(d, fn) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, fn) : fn(p); } }

const assets = path.join(root, 'assets');
if (!fs.existsSync(assets)) { console.error('Chưa có thư mục assets/. Chạy: npm run assets'); process.exit(1); }
walk(assets, (p) => {
  if (!p.endsWith('.svg')) return;
  files++;
  const t = fs.readFileSync(p, 'utf8');
  const rel = path.relative(root, p);
  if (!/^\s*<svg[\s>]/.test(t)) fail(`${rel}: không bắt đầu bằng <svg>`);
  if (!/viewBox="[^"]+"/.test(t)) fail(`${rel}: thiếu viewBox`);
  if (/https?:\/\/(?!www\.w3\.org)/.test(t)) fail(`${rel}: phụ thuộc đường dẫn ngoài`);
  const e = wellFormed(t.trim());
  if (e) fail(`${rel}: ${e}`);
  if (t.length < 80) fail(`${rel}: quá ngắn`);
});

// Tham chiếu assets/ trong CSS/HTML/JS
for (const dir of ['', 'src']) {
  const base = path.join(root, dir);
  const list = [];
  if (dir === '') { for (const f of fs.readdirSync(base)) if (/\.(html|css|webmanifest)$/.test(f)) list.push(path.join(base, f)); }
  else walk(base, (p) => { if (/\.(css|js)$/.test(p)) list.push(p); });
  for (const f of list) {
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/(?:url\(\s*['"]?|src=["']|href=["'])(\.{0,2}\/?assets\/[^'")\s]+)/g)) {
      const ref = m[1].replace(/^\.\//, '');
      const target = path.resolve(path.dirname(f), ref);
      if (!fs.existsSync(target) && !fs.existsSync(path.join(root, ref))) fail(`${path.relative(root, f)}: thiếu ${ref}`);
    }
  }
}
console.log(bad ? `\n${bad} lỗi trong ${files} tệp SVG.` : `✓ ${files} tệp SVG hợp lệ, không có tham chiếu gãy.`);
if (bad) process.exit(1);
