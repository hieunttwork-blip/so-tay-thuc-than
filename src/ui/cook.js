// Màn hình nấu ăn gọn: (1) chọn số lượng cho đúng danh sách nguyên liệu, (2) sơ chế bằng vài lần chạm, (3) canh lửa bấm Dừng.
// Dư hoặc thiếu nguyên liệu làm lệch vị, tốn thêm vốn và ảnh hưởng đánh giá của khách. Gợi ý: 3 lần miễn phí cho mỗi món, sau đó tốn tiền và bị trừ điểm.
import { icon } from '../art/icons.js';
import { infoBtn } from './extras.js';
import { DISH_BY_ID, GARNISHES } from '../data/dishes.js';
import { INGREDIENTS, INGREDIENT_GROUPS } from '../data/ingredients.js';
import {
  TOOLS, HEATS, STEP_NAMES, STAR_LABEL, SPICE_LABELS, HINT_PENALTY, FREE_HINTS, createSession, methodOf, scoreQuantities, scorePrep,
  heatParams, markerPos, heatHit, scoreHeatRounds, HEAT_ROUNDS, seasonTarget, scoreSeason, tasteOrderText, dimsFor, TIER_LABEL, tasteHints, tasteIssues, TASTE_DIMS, combine, starsFromScore, hintPrice, hintsUsed, useHint, quantityCost, assistantPrepScore, tasteNote,
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
  document.addEventListener('keydown', onSpace, true);
  emit('sfx', 'click');
}

function newSession(s) {
  const dish = C.dish;
  C.s = createSession(s, dish, C.order);
  C.qty = Object.fromEntries(Object.keys(C.s.required).map((id) => [id, 0]));
  C.taste = {};
  C.committed = false;
  C.showShort = false;
  C.hinted = false;
  C.penalty = 0;
  C.prep = { phase: 'ready', i: 0, hits: 0, timer: null, score: C.s.preprepped ? C.s.scores.prep : null, by: C.s.preprepped ? 'assistant' : 'self' };
  C.heat = { params: null, running: false, t0: 0, raf: 0, score: null, round: 0, results: [], flash: null };
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
  return head() + `<div class="cook-body">${body}</div>`;
}

// ---------- 1. Chọn số lượng nguyên liệu ----------
function selectView() {
  const s = getState();
  const req = C.s.required;
  const rows = Object.keys(req).map((id) => {
    const ing = INGREDIENTS[id];
    const have = stock(s, id);
    const q = C.qty[id];
    const max = practice() ? 9 : Math.min(9, have);
    const low = !practice() && have < req[id];
    return `<li class="qrow ${q === req[id] ? 'match' : ''}">
      <span class="qi">${ingIcon(id, 34)}</span>
      <div class="qn"><b>${esc(ing.name)}</b><small class="need">Cần <b>${req[id]}</b> · ${practice() ? 'Nấu thử: không tốn' : low ? `<span class="warn">Kho chỉ có ${have}</span>` : `Kho: ${have}`}</small></div>
      <button type="button" class="btn ghost round" data-act="ck-q" data-id="${id}" data-d="-1" aria-label="Giảm ${esc(ing.name)}" ${q <= 0 ? 'disabled' : ''}>${icon('minus', 18)}</button>
      <output class="qv" aria-label="Số lượng ${esc(ing.name)}">${q}</output>
      <button type="button" class="btn ghost round" data-act="ck-q" data-id="${id}" data-d="1" aria-label="Tăng ${esc(ing.name)}" ${q >= max ? 'disabled' : ''}>${icon('plus', 18)}</button></li>`;
  }).join('');
  let short = '';
  if (C.showShort && !practice()) {
    const miss = shortage(s, C.s.required);
    const sc = shortageCost(s, C.s.required);
    short = `<div class="note warn" role="alert">${icon('shop', 18)}<div><b>Kho thiếu:</b> ${Object.entries(miss).map(([id, q]) => `${q} ${esc(INGREDIENTS[id].name)}`).join(', ')}.
      ${sc.buyable ? `<div class="row"><button type="button" class="btn primary small" data-act="ck-quickbuy" ${sc.cost > s.cash ? 'disabled' : ''}>Mua nhanh ${money(sc.cost)}</button></div>` : '<div>Có nguyên liệu hiếm chỉ kiếm được khi khám phá.</div>'}</div></div>`;
  }
  const total = Object.values(C.qty).reduce((a, b) => a + b, 0);
  return `<p class="lead">Bấm + / − để lấy <b>đúng số lượng</b> mỗi nguyên liệu như ghi ở chữ "Cần". Dư hoặc thiếu đều làm lệch vị, tốn vốn và khách chấm thấp.</p>
  <ul class="qlist">${rows}</ul>${short}
  <div class="row end wrap"><button type="button" class="btn primary" data-act="ck-select-ok" ${total ? '' : 'disabled'}>Xác nhận</button></div>`;
}
ACT['ck-q'] = (el) => {
  const id = el.dataset.id, s = getState();
  const max = practice() ? 9 : Math.min(9, stock(s, id));
  C.qty[id] = Math.max(0, Math.min(max, C.qty[id] + Number(el.dataset.d)));
  C.showShort = false;
  emit('sfx', 'pick');
  redraw();
};
ACT['ck-spice'] = (el) => { C.spice = Number(el.dataset.i); emit('sfx', 'pick'); redraw(); };
ACT['ck-quickbuy'] = () => {
  const r = act((s) => quickBuy(s, C.s.required));
  if (!r.ok) toast(r.reason, 'bad');
  else for (const id of Object.keys(C.s.required)) C.qty[id] = Math.max(C.qty[id], Math.min(C.s.required[id], stock(getState(), id)));
  C.showShort = false;
  redraw();
};
ACT['ck-select-ok'] = () => {
  const s = getState();
  const chosen = Object.fromEntries(Object.entries(C.qty).filter(([, q]) => q > 0));
  if (!practice() && Object.keys(shortage(s, chosen)).length) { C.showShort = true; redraw(); return; }
  if (!practice() && Object.entries(C.s.required).some(([id, q]) => stock(s, id) < q) && !C.showShortSeen) { C.showShort = true; C.showShortSeen = true; redraw(); return; }
  const spiceOk = true;
  const sel = scoreQuantities(C.s.required, C.qty, spiceOk);
  if (!practice()) act((st) => consume(st, chosen));
  C.committed = !practice();
  C.cost = quantityCost(chosen);
  C.issues = sel.issues;
  C.spiceOk = spiceOk;
  C.s.scores.select = sel.score;
  nextStep();
};

function nextStep() {
  C.s.index += 1;
  while (C.s.index < C.s.steps.length && cur() === 'prep' && C.prep.score != null) { C.s.scores.prep = C.prep.score; C.s.index += 1; } // phụ bếp đã sơ chế sẵn
  if (C.s.index >= C.s.steps.length) return finishCook();
  redraw();
}

// ---------- 2. Sơ chế: chạm nhanh vài mục tiêu ----------
function prepView() {
  const m = methodOf(C.dish);
  const p = C.prep;
  const b = C.s.bonus;
  if (p.score != null) {
    return `<div class="note good">${icon('check', 18)}<div>${p.by === 'assistant' ? 'Phụ bếp đã sơ chế giúp bạn.' : 'Sơ chế xong.'} Điểm sơ chế: <b>${p.score}</b></div></div>
    <div class="row end"><button type="button" class="btn primary" data-act="ck-next" data-autofocus>Tiếp tục</button></div>`;
  }
  if (p.phase === 'run') {
    return `<p class="lead">Chạm thật nhanh vào mục tiêu vừa hiện ra!</p>
    <div class="prep-info"><span id="prep-count">${p.i + 1}/${C.s.needed}</span><span class="chip">${icon(TOOLS[m.tool].icon, 16)}${esc(TOOLS[m.tool].name)}</span></div>
    <div class="prep-board" id="prep-board" aria-live="polite"></div>`;
  }
  return `<p class="lead">Sơ chế: <b>${esc(m.verb)}</b>. Chạm đủ ${C.s.needed} mục tiêu khi chúng hiện ra.</p>
  <div class="row wrap"><button type="button" class="btn primary" data-act="ck-prep-go" data-autofocus>${icon(TOOLS[m.tool].icon, 18)}<span>Bắt đầu sơ chế</span></button>
  ${b.assistant ? `<button type="button" class="btn" data-act="ck-assist">${icon('u-assistant', 18)}<span>Nhờ phụ bếp (≈${assistantPrepScore(getState(), b)} điểm)</span></button>` : ''}</div>`;
}
ACT['ck-assist'] = () => {
  C.prep.score = assistantPrepScore(getState(), C.s.bonus);
  C.prep.by = 'assistant';
  C.s.scores.prep = C.prep.score;
  redraw();
};
ACT['ck-prep-go'] = () => {
  const p = C.prep;
  p.phase = 'run'; p.i = 0; p.hits = 0;
  redraw();
  showTarget();
};
function showTarget() {
  const p = C.prep;
  const board = document.getElementById('prep-board');
  if (!board) return;
  const win = C.s.prepWindow;
  const x = 12 + Math.random() * 68, y = 10 + Math.random() * 62;
  board.innerHTML = `<button type="button" class="ptarget" data-act="ck-hit" style="left:${x}%;top:${y}%;--win:${win}ms" aria-label="Chạm vào đây">${icon(TOOLS[methodOf(C.dish).tool].icon, 30)}</button>`;
  const cnt = document.getElementById('prep-count');
  if (cnt) cnt.textContent = `${p.i + 1}/${C.s.needed}`;
  clearTimeout(p.timer);
  p.timer = setTimeout(() => advanceTarget(false), win);
}
function advanceTarget(hit) {
  const p = C.prep;
  if (!C || p.phase !== 'run') return;
  clearTimeout(p.timer);
  if (hit) { p.hits += 1; emit('sfx', 'sizzle'); }
  p.i += 1;
  if (p.i >= C.s.needed) return endPrep();
  showTarget();
}
ACT['ck-hit'] = () => advanceTarget(true);
function endPrep() {
  const p = C.prep;
  p.phase = 'done';
  p.score = scorePrep({ toolOk: true, hits: p.hits, needed: C.s.needed });
  C.s.scores.prep = p.score;
  redraw();
}
ACT['ck-next'] = () => nextStep();

// ---------- 3. Canh lửa: thanh xanh nhỏ, bấm Dừng trúng vùng xanh 3 lần ----------
function heatView() {
  const m = methodOf(C.dish);
  const H = HEATS[m.heat];
  const h = C.heat;
  if (!h.params) h.params = heatParams(C.dish, C.s.bonus, Math.random(), H.correct);
  const dots = Array.from({ length: HEAT_ROUNDS }, (_, i) => { const r = h.results[i]; return `<i class="hd ${r ? (r.hit ? 'hit' : 'miss') : i === h.round ? 'cur' : ''}">${r ? (r.hit ? '✓' : '✗') : i + 1}</i>`; }).join('');
  if (h.score != null) {
    return `<div class="heat-dots">${dots}</div><div class="note ${h.score >= 70 ? 'good' : ''}">${icon(H.icon, 18)}<div>Trúng ${h.results.filter((r) => r.hit).length}/${HEAT_ROUNDS} lần. Điểm canh lửa: <b>${h.score}</b></div></div>
    <div class="row end"><button type="button" class="btn primary" data-act="ck-next" data-autofocus>Tiếp tục</button></div>`;
  }
  return `<p class="lead">${esc(H.label)} (đã chỉnh lửa ${H.temps[H.correct].toLowerCase()}). Bấm <b>Dừng</b> (hoặc phím Cách) khi chấm tròn nằm trong vùng xanh. Trúng ${HEAT_ROUNDS} lần là đạt 100 điểm, không cần đúng chính giữa.</p>
  <div class="heat-dots">${dots}</div>${trackHtml(h.params, h.flash ? h.stopPos : 0, h.flash)}
  <div class="row center">${h.running ? `<button type="button" class="btn primary big" data-act="ck-stop" data-autofocus>Dừng!</button>` : `<button type="button" class="btn primary big" data-act="ck-heat-go" data-autofocus ${h.flash ? 'disabled' : ''}>${h.round === 0 ? 'Bắt đầu' : 'Lần tiếp'}</button>`}</div>`;
}
function trackHtml(p, pos = 0, flash = null) {
  return `<div class="heat-track ${flash ? (flash === 'hit' ? 'f-hit' : 'f-miss') : ''}" aria-hidden="true"><div class="zone" style="left:${p.center - p.width / 2}%;width:${p.width}%"></div><div id="hk-marker" class="marker" style="left:${pos}%"></div></div>`;
}
ACT['ck-heat-go'] = () => {
  const h = C.heat;
  if (h.running || h.round >= HEAT_ROUNDS) return;
  h.running = true; h.flash = null;
  h.t0 = performance.now();
  redraw();
  const loop = () => {
    if (!C || !h.running) return;
    const t = performance.now() - h.t0;
    h.pos = markerPos(t, h.params.period);
    const m = document.getElementById('hk-marker');
    if (m) m.style.left = `${h.pos}%`;
    if (t > h.params.period * 2) { stopHeat(); return; }
    h.raf = requestAnimationFrame(loop);
  };
  h.raf = requestAnimationFrame(loop);
};
function stopHeat() {
  const h = C.heat;
  if (!h.running) return;
  h.running = false;
  cancelAnimationFrame(h.raf);
  h.stopPos = h.pos ?? 0;
  const r = heatHit(h.stopPos, h.params);
  h.results.push(r);
  h.round += 1;
  h.flash = r.hit ? 'hit' : 'miss';
  emit('sfx', r.hit ? 'sizzle' : 'error');
  if (h.round >= HEAT_ROUNDS) {
    h.score = scoreHeatRounds(h.results);
    C.s.scores.heat = h.score;
    redraw();
    return;
  }
  redraw();
  // vòng kế tiếp: vùng xanh dời chỗ khác
  h.timer = setTimeout(() => { if (!C || C.heat !== h) return; h.params = heatParams(C.dish, C.s.bonus, Math.random(), HEATS[methodOf(C.dish).heat].correct); h.flash = null; redraw(); }, 800);
}
ACT['ck-stop'] = () => stopHeat();
function onSpace(e) {
  if (!C || C.result || e.code !== 'Space') return;
  if (cur() === 'heat' && C.heat.running) { e.preventDefault(); stopHeat(); }
}

// ---------- 4. Nêm vị theo yêu cầu của khách: mặn, ngọt, chua, cay ----------
function seasonView() {
  const rows = dimsFor(C.dish).map(([k, label, sub]) => `<div class="tasterow"><div class="st-name"><b>${label}</b><small>${sub}</small></div>
    <div class="tiers" role="group" aria-label="${label}">${TIER_LABEL[k].map((l, i) => `<button type="button" class="chip pick ${C.taste[k] === i ? 'on' : ''}" data-act="ck-taste" data-k="${k}" data-v="${i}" aria-pressed="${C.taste[k] === i}">${l}</button>`).join('')}</div></div>`).join('');
  const done = dimsFor(C.dish).every(([k]) => C.taste[k] != null);
  return `<div class="note order-note">${icon('customer', 20)}<div>${practice() ? 'Yêu cầu thử' : 'Khách gọi'}: <b>${esc(tasteOrderText(C.dish, C.s.order.taste))}</b></div></div>
  <p class="lead">Nêm đúng như yêu cầu: chọn mức cho từng vị. Chọn sai một mức bị trừ một nửa điểm của vị đó.</p>
  ${rows}
  <div class="row end wrap"><button type="button" class="btn primary" data-act="ck-season-ok" ${done ? '' : 'disabled'}>Nêm xong</button></div>`;
}
ACT['ck-taste'] = (el) => {
  C.taste[el.dataset.k] = Number(el.dataset.v);
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
  <ul class="score-list">${rows}</ul>${tn}${extra}
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
  clearTimeout(C.prep.timer);
  cancelAnimationFrame(C.heat.raf);
  clearTimeout(C.heat.timer);
  document.removeEventListener('keydown', onSpace, true);
  const id = C.modalId;
  C = null;
  ui.cooking = false;
  closeModal(id);
  commit();
  refresh();
  pumpCelebrations();
}
