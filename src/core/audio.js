// Âm thanh tùy chọn: tự tổng hợp bằng Web Audio (không tệp ngoài). Chỉ phát sau tương tác của người chơi và khi bật âm thanh.
import { on } from './bus.js';

let ctx = null;
let enabled = true;
export const setSoundEnabled = (v) => { enabled = Boolean(v); };

function ensure() {
  if (ctx) return ctx;
  try { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (AC) ctx = new AC(); } catch { ctx = null; }
  return ctx;
}
/** Gọi trong sự kiện bấm/chạm đầu tiên để trình duyệt cho phép phát tiếng. */
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  if (musicOn && !music.timer) startMusic();
}

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  const c = ctx; if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(520, 0, 0.05, 'triangle', 0.06),
  coin: () => { tone(880, 0, 0.09, 'square', 0.06); tone(1320, 0.07, 0.16, 'square', 0.06); },
  error: () => { tone(220, 0, 0.14, 'sawtooth', 0.07); tone(165, 0.1, 0.2, 'sawtooth', 0.07); },
  bell: () => { tone(988, 0, 0.18, 'sine', 0.1); tone(1319, 0.12, 0.3, 'sine', 0.08); },
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle', 0.1)),
  unlock: () => [659, 880, 1175].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.1)),
  quest: () => { tone(740, 0, 0.1, 'triangle', 0.09); tone(988, 0.09, 0.18, 'triangle', 0.09); },
  pick: () => tone(660, 0, 0.07, 'sine', 0.08),
  travel: () => { tone(330, 0, 0.12, 'triangle', 0.08); tone(440, 0.1, 0.16, 'triangle', 0.08); },
  upgrade: () => [440, 554, 659].forEach((f, i) => tone(f, i * 0.07, 0.16, 'square', 0.05)),
  ting: () => { tone(1568, 0, 0.55, 'sine', 0.16); tone(2349, 0.03, 0.8, 'sine', 0.08); },
  sizzle: () => tone(180, 0, 0.12, 'sawtooth', 0.03),
};

// ---- Tiếng nấu ăn tự tổng hợp: xèo xèo, nước sôi, hơi nước, dao thớt ----
let noiseBuf = null;
function noiseBuffer() {
  if (noiseBuf || !ctx) return noiseBuf;
  const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}
function noiseBurst(start, dur, vol, type, freq, q = 1) {
  const c = ctx; if (!c) return;
  const src = c.createBufferSource(); src.buffer = noiseBuffer();
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(t0, Math.random()); src.stop(t0 + dur + 0.02);
}
const COOK = {
  sizzle: () => { for (let i = 0; i < 6; i++) noiseBurst(i * 0.05 + Math.random() * 0.04, 0.05, 0.06 + Math.random() * 0.05, 'highpass', 4500 + Math.random() * 2500); },
  boil: () => { tone(260 + Math.random() * 200, 0, 0.07, 'sine', 0.05); noiseBurst(0, 0.22, 0.025, 'lowpass', 700); if (Math.random() < 0.5) tone(380 + Math.random() * 220, 0.12, 0.06, 'sine', 0.04); },
  hiss: () => noiseBurst(0, 0.5, 0.035, 'bandpass', 6500, 0.6),
  chop: () => { noiseBurst(0, 0.05, 0.16, 'bandpass', 1800, 1.2); tone(150, 0, 0.07, 'sine', 0.1); },
  flip: () => { noiseBurst(0, 0.35, 0.1, 'bandpass', 2400, 0.7); for (let i = 0; i < 8; i++) noiseBurst(0.12 + i * 0.05, 0.05, 0.1, 'highpass', 5000); },
  stir: () => { noiseBurst(0, 0.5, 0.06, 'lowpass', 900); tone(300, 0.1, 0.1, 'triangle', 0.05); tone(260, 0.3, 0.1, 'triangle', 0.05); },
};
const loops = new Map();
/** Bật tiếng lặp khi đang nấu (xèo xèo, sôi, hơi nước). Gọi stopCookSound để tắt. */
export function startCookSound(kind) {
  if (!enabled || !ctx || loops.has(kind) || !COOK[kind]) return;
  const every = { sizzle: 260, boil: 230, hiss: 520, chop: 520 }[kind] || 400;
  const t = setInterval(() => { try { COOK[kind](); } catch { /* tùy chọn */ } }, every);
  loops.set(kind, t);
  try { COOK[kind](); } catch { /* tùy chọn */ }
}
export function stopCookSound(kind) {
  if (!kind) { for (const t of loops.values()) clearInterval(t); loops.clear(); return; }
  clearInterval(loops.get(kind)); loops.delete(kind);
}
export function cookSfx(kind) { if (enabled && ctx && COOK[kind]) { try { COOK[kind](); } catch { /* tùy chọn */ } } }

export function sfx(name) {
  if (!enabled || !ctx) return;
  try { (SOUNDS[name] || SOUNDS.click)(); } catch { /* âm thanh là tùy chọn */ }
}
on('sfx', sfx);

// ================= Nhạc nền vui nhộn (kiểu remix) =================
// Tự tổng hợp, nhịp nhanh 132 nhịp/phút, chia theo nốt móc kép: kick bốn nhịp, clap, hi-hat mở, bass nảy, hợp âm gảy lệch nhịp,
// arpeggio ở đoạn hai, giai điệu pluck vui tai (C - G - Am - F) và tiếng rải trống ở cuối mỗi 4 ô nhịp.
let musicOn = true;
let musicVol = 0.5;
const music = { timer: null, step: 0, next: 0, master: null, delay: null };
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const BPM = 132;
const SIXTEENTH = 60 / BPM / 4;
const EIGHTH = SIXTEENTH * 2;
const CHORDS = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]];
const ROOTS = [36, 43, 45, 41];
const MEL = [
  [[76, 0, 79, 76, 0, 81, 79, 76], [74, 0, 79, 74, 0, 83, 81, 79], [81, 0, 79, 81, 0, 84, 81, 79], [77, 0, 81, 77, 0, 79, 77, 76]],
  [[79, 79, 76, 0, 72, 76, 79, 0], [83, 81, 79, 0, 74, 79, 83, 0], [84, 81, 0, 81, 79, 76, 0, 76], [77, 79, 81, 84, 0, 81, 79, 0]],
];
const BASS = [0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 12, 0, 0, 7, 0, 12];
const BASS_ON = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1];
const MUSIC_GAIN = 1.0;

function musicChain() {
  const c = ctx;
  if (music.master) return music.master;
  const master = c.createGain();
  master.gain.value = musicVol * MUSIC_GAIN;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; lp.Q.value = 0.3;
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
  const delay = c.createDelay(1.5); delay.delayTime.value = SIXTEENTH * 3;
  const fb = c.createGain(); fb.gain.value = 0.25;
  const wet = c.createGain(); wet.gain.value = 0.22;
  delay.connect(fb); fb.connect(delay); delay.connect(wet);
  master.connect(lp); wet.connect(lp); lp.connect(comp); comp.connect(c.destination);
  music.master = master; music.delay = delay;
  return master;
}
function mnote(freq, when, dur, { type = 'sine', vol = 0.1, attack = 0.005, send = 0 } = {}) {
  const c = ctx, out = music.master;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vol, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g); g.connect(out);
  if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(music.delay); }
  o.start(when); o.stop(when + dur + 0.05);
}
function noiseHit(when, dur, vol, freq = 7000, type = 'highpass') {
  const c = ctx;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(music.master);
  src.start(when);
}
function kick(when) {
  const c = ctx, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(46, when + 0.1);
  g.gain.setValueAtTime(0.38, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
  o.connect(g); g.connect(music.master); o.start(when); o.stop(when + 0.25);
}
function scheduleStep(step, when) {
  const barAll = Math.floor(step / 16), bar = barAll % 4, pos = step % 16, section = Math.floor(barAll / 4) % 2;
  const chord = CHORDS[bar];
  const fill = bar === 3 && pos >= 12;
  // trống
  if (pos % 4 === 0 && !(fill && pos === 12)) kick(when);
  if ((pos === 4 || pos === 12) && !fill) noiseHit(when, 0.12, 0.16, 1800, 'bandpass');
  if (fill) noiseHit(when, 0.07, 0.07 + (pos - 12) * 0.05, 2200, 'bandpass'); // rải trống
  if (pos % 4 === 2) noiseHit(when, 0.1, 0.07, 8500); // hi-hat mở lệch nhịp
  else if (pos % 2 === 0) noiseHit(when, 0.03, 0.035, 9000);
  else if (section === 1 && Math.random() < 0.6) noiseHit(when, 0.02, 0.02, 9500);
  // bass nảy
  if (BASS_ON[pos]) mnote(mtof(ROOTS[bar] + BASS[pos]), when, SIXTEENTH * 1.8, { type: 'sawtooth', vol: 0.11, attack: 0.004 });
  // hợp âm gảy lệch nhịp
  if (pos % 4 === 2) chord.forEach((m, i) => mnote(mtof(m + 12), when + i * 0.008, SIXTEENTH * 1.6, { type: 'square', vol: 0.035, attack: 0.003, send: 0.25 }));
  // arpeggio ở đoạn hai
  if (section === 1 && pos % 2 === 1) mnote(mtof(chord[(pos >> 1) % 3] + 24), when, SIXTEENTH * 1.5, { type: 'triangle', vol: 0.05, attack: 0.003, send: 0.3 });
  // giai điệu pluck (chỉ ở nốt móc đơn)
  if (pos % 2 === 0) {
    const m = MEL[section][bar][pos / 2];
    if (m) {
      mnote(mtof(m), when, EIGHTH * 1.5, { type: 'triangle', vol: 0.17, attack: 0.004, send: 0.35 });
      mnote(mtof(m + 12), when, EIGHTH * 1.0, { type: 'square', vol: 0.025, attack: 0.003, send: 0.3 });
    }
  }
}
function pump() {
  if (!ctx || !musicOn) return;
  while (music.next < ctx.currentTime + 1.2) {
    if (music.next < ctx.currentTime) music.next = ctx.currentTime + 0.05;
    scheduleStep(music.step, music.next);
    music.step = (music.step + 1) % 128;
    music.next += SIXTEENTH;
  }
}
export function startMusic() {
  const c = ensure();
  if (!c || !musicOn || music.timer) return;
  musicChain();
  music.master.gain.value = musicVol * MUSIC_GAIN;
  music.next = c.currentTime + 0.1;
  pump();
  music.timer = setInterval(pump, 300);
}
export function stopMusic() {
  if (music.timer) { clearInterval(music.timer); music.timer = null; }
}
export function setMusicEnabled(v) {
  musicOn = Boolean(v);
  if (!musicOn) stopMusic(); else if (ctx && ctx.state !== 'suspended') startMusic();
}
export function setMusicVolume(v) {
  musicVol = Math.max(0, Math.min(1, Number(v) || 0));
  if (music.master && ctx) music.master.gain.setTargetAtTime(musicVol * MUSIC_GAIN, ctx.currentTime, 0.05);
}
export const musicPlaying = () => Boolean(music.timer);
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
  });
}
