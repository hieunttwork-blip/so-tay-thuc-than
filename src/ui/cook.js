// Màn hình nấu ăn không cần thao tác chính xác: (1) khay nguyên liệu, (2) sơ chế và (3) nấu chín bằng hoạt cảnh chờ, (4) nêm 1-2 vị.
// Dư hoặc thiếu nguyên liệu làm lệch vị, tốn thêm vốn và ảnh hưởng đánh giá của khách. Gợi ý: 3 lần miễn phí cho mỗi món, sau đó tốn tiền và bị trừ điểm.
import { icon } from '../art/icons.js';
import { infoBtn } from './extras.js';
import { DISH_BY_ID, GARNISHES } from '../data/dishes.js';
import { INGREDIENTS, INGREDIENT_GROUPS } from '../data/ingredients.js';
import {
  TOOLS, HEATS, STEP_NAMES, STAR_LABEL, SPICE_LABELS, HINT_PENALTY, FREE_HINTS, createSession, methodOf, scoreQuantities, scorePrep,
  asksOf, scoreTray, trayChosen, prepMs, heatMs, prepCycles, heatCycles, PREP_VERB, HEAT_ACT, seasonTarget, scoreSeason, tasteOrderText, dimsFor, TIER_LABEL, tasteHints, tasteIssues, TASTE_DIMS, combine, starsFromScore, hintPrice, hintsUsed, useHint, quantityCost, assistantPrepScore, tasteNote,
} from '../core/cooking.js';
import { stock, shortage, shortageCost, quickBuy, consume, ingredientPrice } from '../core/economy.js';
import { ingIcon } from '../art/ingicons.js';
import { applyCookToCustomer, recordCook } from '../core/service.js';
import { completeRequest } from '../core/explore.js';
import { getState, act, commit } from '../core/store.js';
import { openModal, updateModal, closeModal, confirmDialog, toast, pumpCelebrations } from './kit.js';
import { ACT, ui, refresh } from './app.js';
import { esc, dishArt, stars as starsHtml, money, bar } from './util.js';
import { emit } from '../core/bus.js';
import { startCookSound, stopCookSound, cookSfx } from '../core/audio.js';

let C = null;
export const isCooking = () => Boolean(C);
const practice = () => C.mode === 'practice';

/** mode: 'order' (đơn khách), 'gift' (nấu tặng nhân vật), 'practice' (nấu thử: miễn phí, không tính điểm). */
export function startCook({ dishId, order = {}, mode = 'order', custId = null, npcId = null }) {
  if (C) return;
  const s = getState();
  const dish = DISH_BY_ID[dishId];
  if (!dish) return;
  C = { dish, mode, custId, npcId, order, modalId: 0, finished: false };
  newSession(s);
  ui.cooking = true;
  C.modalId = openModal({ cls: 'cook-modal', closable: false, label: `Nấu ${dish.name}`, html: view() });
  emit('sfx', 'click');
}

function newSession(s) {
  const dish = C.dish;
  C.s = createSession(s, dish, C.order);
  C.pick = [];
  C.anim = null;
  C.lastDim = null;
  C.fresh = null;
  C.taste = {};
  C.committed = false;
  C.showShort = false;
  C.hinted = false;
  C.penalty = 0;
  C.prep = { score: C.s.preprepped ? C.s.scores.prep : null, by: C.s.preprepped ? 'assistant' : 'self' };
  C.heat = { score: null };
  C.result = null;
}

const cur = () => C.s.steps[C.s.index];
const redraw = () => { if (C) updateModal(C.modalId, view()); };

function head() {
  const d = C.dish;
  const steps = C.s.steps;
  return `<div class="cook-head">
    <div class="cook-dish">${dishArt(d, 64)}<div><h2>${esc(d.name)} ${infoBtn(d.id, 'sm')}</h2><small>${esc(methodOf(d).label)}${C.order.extra ? ` · ${esc(C.s.extra.label)}` : ''}</small><small class="tasteorder">${practice() ? 'Yêu cầu thử' : 'Khách gọi'}: <b>${esc(tasteOrderText(d, C.s.order.taste))}</b></small>${practice() ? '<span class="chip ok">Nấu thử: miễn phí</span>' : ''}</div></div>
    ${C.result ? '' : `<button type="button" class="btn ghost small" data-act="ck-cancel" aria-label="Hủy món">${icon('close', 18)}</button>`}
  </div>
  ${C.result ? '' : `<ol class="steps" aria-label="Các bước nấu">${steps.map((st, i) => `<li class="${i === C.s.index ? 'on' : i < C.s.index ? 'done' : ''}" ${i === C.s.index ? 'aria-current="step"' : ''}><b>${i + 1}</b><span>${STEP_NAMES[st]}</span></li>`).join('')}</ol>`}`;
}

function view() {
  if (C.result) return head() + resultView();
  const body = { select: selectView, prep: prepView, heat: heatView, season: seasonView }[cur()]();
  syncSound();
  return head() + `<div class="cook-body">${body}</div>`;
}

// ---------- 1. Khay nguyên liệu: chạm ô để "múc" đủ số phần vào khay ----------
const chosenOf = () => trayChosen(C.s.required, C.pick);
const reqIds = () => Object.keys(C.s.required);
const rnd = (a, b) => Math.round(a + Math.random() * (b - a));
function selectView() {
  const s = getState();
  const req = C.s.required;
  const total = Object.values(req).reduce((a, b) => a + b, 0);
  const got = C.pick.reduce((a, id) => a + req[id], 0);
  const items = C.pick.flatMap((id) => Array.from({ length: req[id] }, (_, k) => {
    const fresh = C.fresh === id || C.fresh === 'all';
    return `<span class="bi ${fresh ? 'drop' : ''}" style="--d:${k * 120}ms;--x:${rnd(-30, 30)}px">${ingIcon(id, 30)}</span>`;
  })).join('');
  const tiles = reqIds().map((id) => {
    const ing = INGREDIENTS[id];
    const have = stock(s, id);
    const on = C.pick.includes(id);
    const out = !practice() && have < req[id];
    return `<button type="button" class="tile ${on ? 'on' : ''} ${out ? 'out' : ''}" data-act="ck-pick" data-id="${id}" aria-pressed="${on}" aria-label="${esc(ing.name)}, cần ${req[id]} phần">
      <i class="qb">×${req[id]}</i><span class="ti">${ingIcon(id, 44)}</span><b>${esc(ing.name)}</b><small>${practice() ? 'Tự do' : out ? `Kho thiếu (${have})` : `Kho ${have}`}</small>${on ? `<i class="tk">${icon('check', 14)}</i>` : ''}</button>`;
  }).join('');
  let short = '';
  if (C.showShort && !practice()) {
    const ch = chosenOf();
    const miss = shortage(s, ch);
    const sc = shortageCost(s, ch);
    short = `<div class="note warn" role="alert">${icon('shop', 18)}<div><b>Kho thiếu:</b> ${Object.entries(miss).map(([id, q]) => `${q} ${esc(INGREDIENTS[id].name)}`).join(', ')}.
      ${sc.buyable ? `<div class="row"><button type="button" class="btn primary small" data-act="ck-quickbuy" ${sc.cost > s.cash ? 'disabled' : ''}>Mua nhanh ${money(sc.cost)}</button></div>` : '<div>Có nguyên liệu hiếm chỉ kiếm được khi khám phá.</div>'}</div></div>`;
  }
  const full = C.pick.length === reqIds().length;
  return `<p class="lead">Chạm từng nguyên liệu để <b>múc vào khay</b>. Game tự lấy đúng số phần cho bạn.</p>
  <div class="bowl"><div class="bowl-in">${items || '<em>Khay đang trống</em>'}</div></div>
  <div class="tray-count" aria-live="polite">Đã lấy <b>${got}/${total}</b> phần</div>
  <div class="tray">${tiles}</div>${short}
  <div class="row end wrap"><button type="button" class="btn" data-act="ck-pickall" ${full ? 'disabled' : ''}>Lấy đủ</button><button type="button" class="btn primary" data-act="ck-select-ok" ${full ? '' : 'disabled'}>Xác nhận khay</button></div>`;
}
ACT['ck-pick'] = (el) => {
  const id = el.dataset.id;
  const i = C.pick.indexOf(id);
  if (i >= 0) { C.pick.splice(i, 1); C.fresh = null; } else { C.pick.push(id); C.fresh = id; }
  C.showShort = false;
  emit('sfx', 'pick');
  redraw();
};
ACT['ck-pickall'] = () => { C.pick = reqIds(); C.fresh = 'all'; C.showShort = false; emit('sfx', 'coin'); redraw(); };
ACT['ck-quickbuy'] = () => {
  const r = act((s) => quickBuy(s, chosenOf()));
  if (!r.ok) toast(r.reason, 'bad');
  C.showShort = false;
  redraw();
};
ACT['ck-select-ok'] = () => {
  const s = getState();
  const chosen = chosenOf();
  if (!practice() && Object.keys(shortage(s, chosen)).length) { C.showShort = true; redraw(); return; }
  const sel = scoreTray(C.s.required, C.pick);
  if (!practice()) act((st) => consume(st, chosen));
  C.committed = !practice();
  C.cost = quantityCost(chosen);
  C.issues = sel.issues;
  C.spiceOk = true;
  C.s.scores.select = sel.score;
  nextStep();
};

function nextStep() {
  if (C.anim) clearTimeout(C.anim.timer);
  C.anim = null;
  C.s.index += 1;
  while (C.s.index < C.s.steps.length && cur() === 'prep' && C.prep.score != null) { C.s.scores.prep = C.prep.score; C.s.index += 1; } // phụ bếp đã sơ chế sẵn
  if (C.s.index >= C.s.steps.length) return finishCook();
  redraw();
}

// Âm thanh nền theo trạng thái: xèo xèo, nước sôi, hơi nước, dao thớt
function syncSound() {
  stopCookSound();
  const a = C.anim, st = cur();
  if (C.result || !a || a.phase === 'done') return;
  if (st === 'prep') {
    if (a.phase === 'act') [0, 220, 440, 660].forEach((t) => setTimeout(() => cookSfx('chop'), t));
    else startCookSound('chop');
    return;
  }
  const kind = HEAT_ACT[methodOf(C.dish).heat].kind;
  if (a.phase === 'act') { cookSfx(kind === 'flip' ? 'flip' : kind === 'stir' ? 'stir' : 'hiss'); startCookSound(kind === 'flip' ? 'sizzle' : 'boil'); return; }
  if (kind === 'flip') startCookSound('sizzle');
  else { startCookSound('boil'); startCookSound('hiss'); }
}

// ---------- Động tác có thanh thời gian tròn: chờ chạy hết, rồi chạm để lật / khuấy / thái ----------
function ensureAct(kind, cycles, dur) {
  if (C.anim && C.anim.step === kind) return C.anim;
  const a = { step: kind, cycle: 0, cycles, phase: 'run', dur: Math.max(1600, Math.round(dur / cycles)), t0: performance.now(), timer: 0 };
  a.timer = setTimeout(() => readyAct(a), a.dur);
  C.anim = a;
  return a;
}
function readyAct(a) {
  if (!C || C.anim !== a) return;
  a.phase = 'ready';
  emit('sfx', 'bell');
  redraw();
}
ACT['ck-act'] = () => {
  const a = C && C.anim;
  if (!a || a.phase !== 'ready') return;
  a.phase = 'act';
  emit('sfx', a.step === 'heat' ? 'sizzle' : 'pick');
  redraw();
  a.timer = setTimeout(() => {
    if (!C || C.anim !== a) return;
    a.cycle += 1;
    if (a.cycle >= a.cycles) {
      a.phase = 'done';
      C.s.scores[a.step] = 100;
      C[a.step].score = 100;
      emit('sfx', a.step === 'heat' ? 'ting' : 'pick');
    } else { a.phase = 'run'; a.t0 = performance.now(); a.timer = setTimeout(() => readyAct(a), a.dur); }
    redraw();
  }, 1000);
};
function ringHtml(a, verb, ico) {
  const run = a.phase === 'run', ready = a.phase === 'ready';
  const el = Math.round(performance.now() - a.t0);
  return `<div class="actwrap"><div class="pips" aria-label="Lần ${Math.min(a.cycle + 1, a.cycles)} trên ${a.cycles}">${Array.from({ length: a.cycles }, (_, i) => `<i class="${i < a.cycle ? 'ok' : i === a.cycle ? 'cur' : ''}"></i>`).join('')}</div>
  <div class="actring ${a.phase}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="rb" cx="60" cy="60" r="54"/><circle class="rf" cx="60" cy="60" r="54" style="${run ? `animation-duration:${a.dur}ms;animation-delay:-${el}ms` : ''}"/></svg>
  <button type="button" class="actbtn" data-act="ck-act" ${ready ? 'data-autofocus' : 'disabled'} aria-label="${ready ? `Chạm để ${verb}` : 'Đang chờ'}">${ready ? `<b>Chạm để ${verb}!</b>` : run ? `<span>${ico}</span><small>Chờ chút…</small>` : '<span>✨</span>'}</button></div></div>`;
}
const bitsHtml = (n, sz) => reqIds().slice(0, n).map((id, i) => `<span class="bit b${i}">${ingIcon(id, sz)}</span>`).join('');

function prepView() {
  const m = methodOf(C.dish);
  const p = C.prep;
  const b = C.s.bonus;
  if (p.score != null && p.by === 'assistant') {
    return `<div class="note good">${icon('check', 18)}<div>Phụ bếp đã sơ chế giúp bạn. Điểm sơ chế: <b>${p.score}</b></div></div>
    <div class="row end"><button type="button" class="btn primary" data-act="ck-next" data-autofocus>Tiếp tục</button></div>`;
  }
  const verb = PREP_VERB[m.tool] || 'sơ chế';
  const a = ensureAct('prep', prepCycles(), prepMs(C.dish, b));
  const scene = `<div class="scene sc-prep ${a.phase}" aria-hidden="true"><div class="cutboard">${bitsHtml(3, 36)}<span class="half h1"></span><span class="half h2"></span></div><div class="chop">${icon(TOOLS[m.tool].icon, 60)}</div><div class="chips-fx"><u></u><u></u><u></u><u></u></div></div>`;
  if (a.phase === 'done') {
    return `${scene}<div class="note good">${icon('check', 18)}<div>Sơ chế xong, nguyên liệu đã sẵn sàng.</div></div>
    <div class="row end"><button type="button" class="btn primary" data-act="ck-next" data-autofocus>Tiếp tục</button></div>`;
  }
  return `<p class="lead">Sơ chế: <b>${esc(m.verb)}</b>. Chờ vòng tròn chạy đầy, rồi chạm để ${verb}.</p>${scene}${ringHtml(a, verb, icon(TOOLS[m.tool].icon, 26))}
  ${b.assistant ? `<div class="row end"><button type="button" class="btn small" data-act="ck-assist">${icon('u-assistant', 16)}<span>Nhờ phụ bếp làm nhanh (≈${assistantPrepScore(getState(), b)} điểm)</span></button></div>` : ''}`;
}
ACT['ck-assist'] = () => {
  if (C.anim) clearTimeout(C.anim.timer);
  C.anim = null;
  C.prep.score = assistantPrepScore(getState(), C.s.bonus);
  C.prep.by = 'assistant';
  C.s.scores.prep = C.prep.score;
  redraw();
};
ACT['ck-next'] = () => nextStep();

function heatView() {
  const m = methodOf(C.dish);
  const H = HEATS[m.heat];
  const A = HEAT_ACT[m.heat];
  const a = ensureAct('heat', heatCycles(C.dish), heatMs(C.dish, C.s.bonus));
  const sparks = '<div class="sparks"><u></u><u></u><u></u><u></u><u></u></div>';
  const fire = '<div class="fire"><i></i><i></i><i></i></div>';
  const steam = '<div class="steam"><i></i><i></i><i></i></div>';
  const inner = A.kind === 'flip'
    ? `${steam}<div class="panwrap"><div class="food">${bitsHtml(3, 30)}</div><div class="pan"></div><div class="handle"></div>${sparks}</div>${fire}`
    : `${steam}${A.kind === 'lid' ? '<div class="lid"></div>' : '<div class="ladle"><i></i></div>'}<div class="pot"><div class="liquid">${bitsHtml(3, 26)}<u class="bub k1"></u><u class="bub k2"></u><u class="bub k3"></u></div></div>${fire}`;
  const scene = `<div class="scene sc-heat k-${A.kind} ${a.phase}" aria-hidden="true">${inner}${a.phase === 'done' ? '<div class="ting">Ting!</div>' : ''}</div>`;
  if (a.phase === 'done') {
    return `${scene}<div class="note good">${icon(H.icon, 18)}<div><b>Ting!</b> Món đã chín.</div></div>
    <div class="row end"><button type="button" class="btn primary" data-act="ck-next" data-autofocus>Tiếp tục</button></div>`;
  }
  return `<p class="lead">${esc(A.doing)} (lửa ${H.temps[H.correct].toLowerCase()}). Chờ vòng tròn đầy, rồi chạm để ${A.verb}.</p>${scene}${ringHtml(a, A.verb, icon(H.icon, 26))}`;
}

// ---------- 4. Nêm vị: khách chỉ dặn 1 đến 2 vị, rắc / rót / nhỏ giọt ----------
const DIMFX = {
  salt: { e: '🧂', c: '#f4f0e4', kind: 'sprinkle' }, sweet: { e: '🍯', c: '#e9a82c', kind: 'pour' },
  sour: { e: '🍋', c: '#d6e04a', kind: 'drip' }, spice: { e: '🌶️', c: '#d9402b', kind: 'sprinkle' },
};
function fxParticles(n) { return Array.from({ length: n }, () => `<i style="--x:${rnd(-26, 26)}px;--dl:${rnd(0, 380)}ms"></i>`).join(''); }
function seasonView() {
  const asks = asksOf(C.dish, C.s.order.taste);
  const rows = TASTE_DIMS.filter(([k]) => asks.includes(k)).map(([k, label, sub]) => {
    const v = C.taste[k];
    return `<div class="tasterow"><div class="st-name"><span class="dimico">${DIMFX[k].e}</span><div><b>${label}</b><small>${sub}</small></div>
      <span class="meter" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${v != null && i <= v ? 'on' : ''}" style="--c:${DIMFX[k].c}"></i>`).join('')}</span></div>
    <div class="tiers" role="group" aria-label="${label}">${TIER_LABEL[k].map((l, i) => `<button type="button" class="chip pick big ${v === i ? 'on pop' : ''}" data-act="ck-taste" data-k="${k}" data-v="${i}" aria-pressed="${v === i}">${l}</button>`).join('')}</div></div>`;
  }).join('');
  const done = asks.every((k) => C.taste[k] != null);
  const fx = C.lastDim ? DIMFX[C.lastDim] : null;
  const scene = `<div class="sscene ${fx ? `go k-${fx.kind}` : ''}" style="--c:${fx ? fx.c : '#fff'}" aria-hidden="true">
    <span class="sbottle">${fx ? fx.e : '🥄'}</span><div class="sfall">${fx ? fxParticles(5 + 4 * (C.lastLv + 1)) : ''}</div>
    <div class="sdish">${dishArt(C.dish, 84)}<div class="sfx-steam"><i></i><i></i><i></i></div></div></div>`;
  return `<div class="note order-note">${icon('customer', 20)}<div>${practice() ? 'Yêu cầu thử' : 'Khách gọi'}: <b>${esc(tasteOrderText(C.dish, C.s.order.taste))}</b></div></div>
  ${scene}<p class="lead">Khách chỉ dặn ${asks.length} vị. Chọn mức khách gọi để nêm vào món.</p>
  ${rows}
  <div class="row end wrap"><button type="button" class="btn primary" data-act="ck-season-ok" ${done ? '' : 'disabled'}>Nêm xong</button></div>`;
}
ACT['ck-taste'] = (el) => {
  C.taste[el.dataset.k] = Number(el.dataset.v);
  C.lastDim = el.dataset.k; C.lastLv = Number(el.dataset.v);
  emit('sfx', 'pick');
  redraw();
};
ACT['ck-season-ok'] = () => {
  const target = seasonTarget(C.dish, C.s.order);
  C.s.scores.season = scoreSeason(target, C.taste, C.s.bonus.seasonBonus, C.dish);
  C.tasteIss = tasteIssues(target, C.taste, C.dish);
  nextStep();
};

// ---------- Kết quả ----------
function finishCook() {
  const raw = combine(C.dish.method, C.s.scores).score;
  const score = Math.max(0, raw - C.penalty);
  const stars = starsFromScore(score);
  C.result = { score, stars, scores: { ...C.s.scores } };
  const dish = C.dish;
  if (C.mode === 'order') {
    act((s) => { const r = applyCookToCustomer(s, C.custId, stars, score, { cost: C.cost, issues: [...(C.issues || []), ...(C.tasteIss || [])] }); if (!r.ok) C.result.note = r.reason; });
  } else if (C.mode === 'gift') {
    act((s) => { recordCook(s, dish.id, stars); C.result.gift = completeRequest(s, C.npcId, stars); });
  } // nấu thử: không ghi nhận gì
  emit('sfx', stars >= 2 ? 'levelup' : stars === 1 ? 'coin' : 'error');
  redraw();
}

function resultView() {
  const r = C.result;
  const rows = C.s.steps.map((st) => `<li><span>${STEP_NAMES[st]}${C.hinted[st] ? ' <small>(gợi ý)</small>' : ''}</span>${bar(r.scores[st] ?? 0, 'sc', STEP_NAMES[st])}<b>${r.scores[st] ?? 0}</b></li>`).join('');
  let extra = '';
  const weak = C.s.steps.map((st) => [st, r.scores[st] ?? 100]).sort((a, b) => a[1] - b[1])[0];
  const weakNote = r.stars > 0 && r.stars < 3 && weak && weak[1] < 90 ? `<div class="note warn">${icon('help', 18)}<div>Bước <b>${STEP_NAMES[weak[0]]}</b> mới đạt ${weak[1]} điểm nên món chưa thể đạt 3 sao. Làm đủ tốt các bước mới được 3 sao.</div></div>` : '';
  const note = tasteNote([...(C.issues || []), ...(C.tasteIss || [])], C.spiceOk === false);
  const tn = `<div class="note ${C.issues?.length || C.tasteIss?.length || C.spiceOk === false ? 'warn' : 'good'}">${icon('help', 18)}<div>${esc(note)}${C.penalty ? ` Đã dùng gợi ý trả phí: -${C.penalty} điểm.` : ''}</div></div>`;
  if (C.mode === 'order') {
    extra = r.note ? `<div class="note warn">${esc(r.note)}</div>`
      : r.stars === 0 ? `<div class="note warn">Món bị hỏng, nguyên liệu đã mất. Khách vẫn đang chờ, bạn có thể nấu lại.</div>`
      : `<div class="note good">Món đã sẵn sàng. Hãy giao cho khách ngay!</div>`;
  } else if (C.mode === 'gift') {
    const g = r.gift;
    extra = g.ok ? `<div class="note good">${icon('heart', 18)}<div><b>${esc(g.done)}</b><br>Phần thưởng: ${esc(g.text)}</div></div>` : `<div class="note warn">${esc(g.reason)}</div>`;
  } else {
    extra = `<div class="note">${icon('book', 18)}<div>Nấu thử không tốn nguyên liệu và không tính điểm. Hãy nấu lại cho đến khi nhớ rõ công thức rồi nấu thật!</div></div>`;
  }
  const sh = getState().shift;
  const me = C.mode === 'order' && sh && sh.customers.find((x) => x.id === C.custId && x.status === 'ready');
  const hasNext = Boolean(me && sh.customers.some((x) => x.id !== C.custId && (x.status === 'waiting' || x.status === 'ordered')));
  const canRetry = (C.mode === 'order' && r.stars === 0 && !r.note) || (C.mode === 'gift' && !r.gift.ok && !r.gift.full) || C.mode === 'practice';
  return `<div class="cook-result"><div class="big-stars" role="img" aria-label="${r.stars} sao">${starsHtml(r.stars, 3, 40)}</div>
  <h3>${STAR_LABEL[r.stars]} · ${r.score} điểm</h3>
  <ul class="score-list">${rows}</ul>${tn}${weakNote}${extra}
  <div class="row end">${canRetry ? '<button type="button" class="btn ghost" data-act="ck-retry">Nấu lại</button>' : ''}${me ? `<button type="button" class="btn good big" data-act="ck-serve" data-autofocus>${icon('check', 20)}<span>Giao món ngay</span></button>${hasNext ? `<button type="button" class="btn primary" data-act="ck-serve-next">Giao & nấu khách kế</button>` : ''}` : ''}<button type="button" class="btn ${me ? 'ghost' : 'primary'}" data-act="ck-close" ${me ? '' : 'data-autofocus'}>${C.mode === 'order' && r.stars > 0 ? 'Để sau' : 'Đóng'}</button></div></div>`;
}
ACT['ck-retry'] = () => { C.order = { ...C.order, prepScore: null }; newSession(getState()); redraw(); };
ACT['ck-close'] = () => endCook();
function serveFromResult(next) {
  const id = C.custId;
  endCook();
  ACT['svc-serve']({ dataset: { id } });
  if (next) ACT['svc-cook-next']();
}
ACT['ck-serve'] = () => serveFromResult(false);
ACT['ck-serve-next'] = () => serveFromResult(true);

ACT['ck-cancel'] = async () => {
  if (C.committed && !C.result) {
    const ok = await confirmDialog({ title: 'Bỏ dở món đang nấu?', text: 'Nguyên liệu đã dùng sẽ bị mất và món này tính là hỏng.', ok: 'Bỏ món', cancel: 'Nấu tiếp', danger: true });
    if (!ok) return;
    act((s) => recordCook(s, C.dish.id, 0));
  }
  endCook();
};

function endCook() {
  if (!C) return;
  stopCookSound();
  if (C.anim) clearTimeout(C.anim.timer);
  const id = C.modalId;
  C = null;
  ui.cooking = false;
  closeModal(id);
  commit();
  refresh();
  pumpCelebrations();
}
