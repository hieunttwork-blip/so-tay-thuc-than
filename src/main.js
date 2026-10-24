// Điểm vào: tải bản lưu, nối sự kiện, khởi động giao diện.
import { load } from './core/save.js';
import { setState, getState, flushSave } from './core/store.js';
import { refreshQuests } from './core/quests.js';
import { REGIONS } from './data/locations.js';
import { unlockAudio, setSoundEnabled, setMusicEnabled, setMusicVolume } from './core/audio.js';
import { wireBus, setCelebrationBlocker } from './ui/kit.js';
import { ui, startApp, go } from './ui/app.js';
import './ui/cook.js';
import './ui/saveui.js';
import './ui/screens-home.js';
import './ui/screens-world.js';
import './ui/screens-meta.js';
import { isCooking } from './ui/cook.js';

setCelebrationBlocker(isCooking);
wireBus(Object.fromEntries(Object.entries(REGIONS).map(([k, v]) => [k, v.name])));

const r = load();
ui.title.save = r.status === 'none' ? null : r;
ui.title.noStorage = Boolean(r.noStorage);
if (r.state) { refreshQuests(r.state); setSoundEnabled(r.state.settings.sound); setMusicEnabled(r.state.settings.music); setMusicVolume(r.state.settings.musicVol); }

const first = () => { unlockAudio(); document.removeEventListener('pointerdown', first, true); document.removeEventListener('keydown', first, true); };
document.addEventListener('pointerdown', first, true);
document.addEventListener('keydown', first, true);
window.addEventListener('pagehide', () => { if (getState()) flushSave(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && getState()) flushSave(); });

startApp();

// Cho phép chơi offline và cài như ứng dụng (chỉ hoạt động khi chạy qua http/https, không phải mở thẳng tệp).
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  const registerSW = () => navigator.serviceWorker.register('./sw.js').then((reg) => {
    // Kiểm tra bản mới khi mở lại tab và mỗi 20 phút.
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 20 * 60 * 1000);
  }).catch(() => {});
  // Đăng ký sau khi game đã hiện ra để không tranh băng thông lúc mở.
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(registerSW, { timeout: 4000 }) : setTimeout(registerSW, 2000));
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  // Khi bản mới đã tải xong và thay bản cũ: hiện thanh báo để người chơi tải lại (tiến trình đã được lưu).
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBar(); });
}
function showUpdateBar() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>Sổ Tay Thực Thần có bản mới!</span><button type="button" class="btn small primary" id="update-go">Cập nhật</button><button type="button" class="btn small ghost" id="update-later" aria-label="Để sau">Để sau</button>';
  document.body.appendChild(bar);
  document.getElementById('update-go').addEventListener('click', () => { try { if (getState()) flushSave(); } catch { /* bỏ qua */ } location.reload(); });
  document.getElementById('update-later').addEventListener('click', () => bar.remove());
}
import { musicPlaying } from './core/audio.js';
window.__game = { getState, go, musicPlaying };
