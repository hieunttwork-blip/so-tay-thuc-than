// Màn hình tiêu đề, hướng dẫn, trang Nhà và ca phục vụ.
import { icon } from '../art/icons.js';
import { logoSVG, emblemSVG, sceneSVG, rankCrest } from '../art/scenes.js';
import { DISH_BY_ID, EXTRAS } from '../data/dishes.js';
import { INGREDIENTS } from '../data/ingredients.js';
import { MAIN_QUESTS } from '../data/quests.js';
import { UPGRADES, VENUES } from '../data/upgrades.js';
import { newState } from '../core/state.js';
import { getState, setState, flushSave, act, commit, store } from '../core/store.js';
import { load, loadBackup, clearSave, stashCorrupt, getCorruptText } from '../core/save.js';
import { refreshQuests, questProgress, questDef, describeReward, festivalOn, festivalNext, claimQuest } from '../core/quests.js';
import { bonus, venueOf, repRank, shopName, levelTitle } from '../core/progression.js';
import { CERTS } from '../data/certs.js';
import { hasAll, shortage, ingredientPrice } from '../core/economy.js';
import { customersFor, menuDishes, openShift, takeOrder, declineOrder, serve, tick, waitInfo, finishShift, endDay, nextDay, priceMult, assignPrep, pendingCert, clockText, shiftOver } from '../core/service.js';
import { masteryOf } from '../core/mastery.js';
import { SPICE_LABELS, extraOf, tasteOrderText, seasonTarget } from '../core/cooking.js';
import { on, emit } from '../core/bus.js';
import { ACT, SCREENS, ui, go, refresh, mutate } from './app.js';
import { openModal, closeModal, closeAllModals, confirmDialog, toast, floatAt, modalOpen } from './kit.js';
import { esc, money, dishArt, person, bar, stars, emptyState, TIPS, timeAgo, catChip, regionChip, repMeter, ratingStars } from './util.js';
import { startCook } from './cook.js';
import { openImportDialog, adopt, downloadText } from './saveui.js';
import { PLAYER_LOOK } from '../art/people.js';
import { FEEDBACK_URL, DONATE_IMG } from '../data/links.js';

// ================= Màn hình tiêu đề =================
SCREENS.title = {
  render(s) {
    const cur = s || (ui.title.save && ui.title.save.state) || null;
    const sv = ui.title.save;
    if (!s && sv && sv.status === 'corrupt') {
      return `<section class="title"><div class="title-card solo">${emblemSVG(88)}<h1>Tiến trình bị hỏng</h1>
      <p>${esc(sv.error || 'Không đọc được bản lưu.')} Dữ liệu cũ vẫn được giữ lại, chưa bị xóa.</p>
      <div class="stack">
        ${sv.hasBackup ? `<button type="button" class="btn primary" data-act="rec-backup">${icon('save', 18)}<span>Khôi phục bản sao lưu gần nhất</span></button>` : ''}
        <button type="button" class="btn" data-act="rec-export">${icon('download', 18)}<span>Xuất bản hỏng ra tệp</span></button>
        <button type="button" class="btn" data-act="open-import">${icon('upload', 18)}<span>Nhập tiến trình từ tệp</span></button>
        <button type="button" class="btn danger" data-act="rec-new">${icon('plus', 18)}<span>Bắt đầu game mới</span></button>
      </div></div></section>`;
    }
    return `<section class="title"><div class="title-stage"><div class="title-ui">
      <h1 class="sr-only">Sổ Tay Thực Thần</h1>
      <div class="tp">${cur
        ? `<button type="button" class="tbtn main" data-act="title-continue" data-autofocus><b>Tiếp tục</b><small>${esc(cur.name)} · Cấp ${cur.level} · Ngày ${cur.day}</small></button>`
        : `<button type="button" class="tbtn main" data-act="title-new" data-autofocus><b>Chơi mới</b><small>Thừa kế sổ tay của ông</small></button>`}</div>
      <div class="tslot">${cur
        ? `<button type="button" class="tbtn slot" data-act="title-new">Chơi mới</button>`
        : `<button type="button" class="tbtn slot" data-act="open-import">Nhập tiến trình</button>`}</div>
      ${cur ? `<button type="button" class="tlink" data-act="open-import">Nhập tiến trình từ tệp</button>` : ''}
      <div class="tside"><button type="button" class="tbtn side" data-act="open-feedback">${icon('help', 30)}<b>GÓP Ý</b></button><button type="button" class="tbtn side donate" data-act="open-donate">${icon('heart', 30)}<b>Ủng hộ</b></button></div>
      ${ui.title.noStorage ? `<div class="note warn tnote">Trình duyệt đang chặn lưu dữ liệu, tiến trình sẽ mất khi đóng trang. Hãy dùng "Xuất tiến trình" thường xuyên.</div>` : ''}
    </div><div class="tbottom"><b>Sổ Tay Thực Thần</b><p>Thừa kế cuốn sổ tay công thức của ông, mở quán nhỏ rồi đi khắp ba miền tìm lại những món ngon thất lạc.</p><small>Chơi được khi không có mạng · Lưu tự động trên thiết bị này</small></div></div></section>`;
  },
};

ACT['open-import'] = () => openImportDialog();
ACT['title-continue'] = () => {
  const s = getState() || (ui.title.save && ui.title.save.state);
  if (!s) return;
  if (!getState()) { refreshQuests(s); setState(s); }
  go('home');
  maybeTutorial();
};
ACT['title-new'] = async () => {
  if (getState() || (ui.title.save && ui.title.save.state)) {
    const ok = await confirmDialog({ title: 'Chơi mới sẽ ghi đè?', text: 'Tiến trình hiện có sẽ bị thay bằng game mới. Bạn nên xuất tệp sao lưu trước.', ok: 'Tiếp tục', cancel: 'Quay lại', danger: true });
    if (!ok) return;
  }
  openModal({
    cls: 'confirm', label: 'Tên đầu bếp',
    html: `<h2>Tên của bạn là gì?</h2><p>Mọi người sẽ gọi bạn bằng tên này trong quán.</p>
    <input id="name-in" class="text-in" maxlength="18" value="" placeholder="Ví dụ: Minh Anh" aria-label="Tên đầu bếp" data-autofocus>
    <div class="row end"><button type="button" class="btn ghost" data-act="modal-close">Hủy</button><button type="button" class="btn primary" data-act="start-new">Bắt đầu</button></div>`,
  });
};
ACT['start-new'] = () => {
  const name = document.getElementById('name-in')?.value || 'Minh Anh';
  const s = newState(name);
  refreshQuests(s);
  ui.title.save = null;
  setState(s);
  flushSave();
  closeAllModals();
  go('home');
  maybeTutorial();
};
ACT['rec-backup'] = () => {
  const r = loadBackup();
  if (r.status === 'none' || r.status === 'corrupt') { toast('Không có bản sao lưu dùng được.', 'bad'); return; }
  adopt(r.state, r.status === 'repaired');
};
ACT['rec-export'] = () => {
  const t = getCorruptText();
  if (!t) { toast('Không có dữ liệu để xuất.', 'bad'); return; }
  downloadText(t, 'so-tay-thuc-than-ban-hong.json');
};
ACT['rec-new'] = async () => {
  const ok = await confirmDialog({ title: 'Bắt đầu game mới?', text: 'Bản lưu hỏng sẽ được cất riêng, bạn vẫn có thể xuất nó sau.', ok: 'Bắt đầu mới', danger: true });
  if (!ok) return;
  stashCorrupt();
  clearSave();
  ui.title.save = null;
  ACT['title-new']();
};

// ================= Hướng dẫn =================
const TUT = [
  ['logo', 'Chào mừng đến Sổ Tay Thực Thần', 'Bạn vừa thừa kế một quán nhỏ và cuốn sổ tay công thức đã thiếu nhiều trang. Hãy nấu, bán hàng và đi khắp ba miền để tìm lại những món ngon.'],
  ['cook', 'Mở quán và phục vụ', 'Vào tab Phục vụ, bấm Mở quán. Khách đến sẽ gọi món: nhận đơn, nấu, rồi giao. Khách chờ lâu sẽ bỏ đi, nên hãy nấu nhanh và đúng.'],
  ['star', 'Nấu ăn chỉ 3 bước', 'Nguyên liệu được điền sẵn (bạn chỉnh được), chạm nhanh để sơ chế, bấm Dừng trúng vùng xanh nhỏ 3 lần để canh lửa, rồi nêm vị mặn, ngọt, chua, cay bằng trí nhớ. Gợi ý vị miễn phí 3 lần cho mỗi món, sau đó tốn tiền và bị trừ điểm.'],
  ['shop', 'Kho, chợ và thực đơn', 'Mua nguyên liệu ở tab Kho & chợ, chọn món bán trong thực đơn và chỉnh giá. Hết nguyên liệu thì không nấu được món đó.'],
  ['map', 'Khám phá và học món', 'Trên Bản đồ, bạn đi đến địa điểm mới, thu thập nguyên liệu, trò chuyện, nấu tặng nhân vật và học công thức mới. Đủ 3 trang sổ rách sẽ ghép thành công thức bí mật.'],
  ['trophy', 'Uy tín, đánh giá và chứng nhận', 'Khách để lại đánh giá sau mỗi món. Uy tín (0 đến 100) tăng khi khách hài lòng, giảm khi phục vụ chậm, và quyết định lượng khách mỗi ngày. Lên cấp sẽ có giám khảo ghé thăm: nấu đủ sao để nhận chứng nhận, cao nhất là THỰC THẦN. Bấm Kết thúc ngày để xem báo cáo.'],
];
let tutIdx = 0;
export function openTutorial() {
  tutIdx = 0;
  openModal({ cls: 'tutorial', label: 'Hướng dẫn', html: tutHtml(), onClose: () => { const s = getState(); if (s && !s.settings.tutorial) { s.settings.tutorial = true; commit(); } } });
}
function tutHtml() {
  const [ic, title, text] = TUT[tutIdx];
  return `<div class="tut"><div class="tut-ic">${ic === 'logo' ? emblemSVG(84) : icon(ic, 64)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>
  <div class="dots" aria-hidden="true">${TUT.map((_, i) => `<i class="${i === tutIdx ? 'on' : ''}"></i>`).join('')}</div>
  <div class="row between"><button type="button" class="btn ghost" data-act="tut-skip">Bỏ qua</button><div class="row">${tutIdx > 0 ? '<button type="button" class="btn" data-act="tut-prev">Trước</button>' : ''}<button type="button" class="btn primary" data-act="tut-next" data-autofocus>${tutIdx === TUT.length - 1 ? 'Bắt đầu chơi' : 'Tiếp'}</button></div></div></div>`;
}
const tutRedraw = () => { const b = document.querySelector('.modal.tutorial'); if (b) b.innerHTML = tutHtml(); };
ACT['tut-next'] = () => { if (tutIdx >= TUT.length - 1) closeModal(); else { tutIdx += 1; tutRedraw(); } };
ACT['tut-prev'] = () => { tutIdx = Math.max(0, tutIdx - 1); tutRedraw(); };
ACT['tut-skip'] = () => closeModal();
function maybeTutorial() { const s = getState(); if (s && !s.settings.tutorial) openTutorial(); }
ACT['tut-open'] = () => openTutorial();

// ================= Trang Nhà =================
function festivalCard(s) {
  const cur = festivalOn(s.day);
  if (cur) return `<div class="card fest-card">${icon('lantern', 28)}<div><b>${esc(cur.f.name)}</b> <small>(còn ${cur.daysLeft} ngày)</small><p>${esc(cur.f.desc)}</p></div></div>`;
  const nx = festivalNext(s.day);
  return `<div class="card muted-card">${icon('lantern', 24)}<div><b>Lễ hội kế tiếp: ${esc(nx.f.name)}</b><p>Còn ${nx.wait} ngày nữa. ${esc(nx.f.desc)}</p></div></div>`;
}
function questCard(s) {
  const q = MAIN_QUESTS.find((m) => s.quests[m.id] && s.quests[m.id].status !== 'claimed');
  if (!q) return `<div class="card"><h3>${icon('quest', 20)} Nhiệm vụ chính</h3><p>Bạn đã hoàn thành mọi nhiệm vụ chính. Thật tuyệt vời!</p></div>`;
  const p = questProgress(s, q.id), st = s.quests[q.id].status;
  return `<div class="card"><h3>${icon('quest', 20)} Nhiệm vụ chính</h3><b>${esc(q.title)}</b><p>${esc(q.desc)}</p>${bar(p.pct, '', q.title)}<small>${p.cur}/${p.n} · Thưởng: ${esc(describeReward(q.reward))}</small>
  <div class="row end">${st === 'done' ? `<button type="button" class="btn primary" data-act="q-claim" data-id="${q.id}">Nhận thưởng</button>` : `<button type="button" class="btn ghost" data-act="nav" data-to="quests">Chi tiết</button>`}</div></div>`;
}
function menuCard(s) {
  const list = menuDishes(s);
  return `<div class="card"><h3>${icon('book', 20)} Thực đơn hôm nay</h3>
  <ul class="mini-menu">${list.map((d) => { const ok = hasAll(s, d.ingredients); return `<li>${dishArt(d, 40)}<span><b>${esc(d.name)}</b><small>Lv ${masteryOf(s, d.id).level} · ${money(d.price * priceMult(s, d.id))}</small></span><span class="chip ${ok ? 'ok' : 'warn'}">${ok ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'}</span></li>`; }).join('')}</ul>
  <div class="row end"><button type="button" class="btn ghost" data-act="nav" data-to="pantry">${icon('shop', 16)}<span>Đi chợ</span></button></div></div>`;
}
function certCard(s) {
  const pc = pendingCert(s);
  const done = CERTS.filter((c) => s.certs[c.id]).length;
  const next = CERTS.find((c) => !s.certs[c.id]);
  return `<div class="card cert-card"><h3>${icon('trophy', 20)} Chứng nhận ẩm thực (${done}/${CERTS.length})</h3>
  <div class="cert-row">${CERTS.map((c) => `<span class="cert-dot ${s.certs[c.id] ? 'on' : ''} ${c.id === 'c6' ? 'top' : ''}" title="${esc(c.name)}">${icon(s.certs[c.id] ? c.icon : 'lock', 22)}</span>`).join('')}</div>
  ${next ? `<p><b>${esc(next.name)}</b>${pc ? ': giám khảo sẽ ghé quán trong những ngày tới. Hãy giữ thực đơn đầy đủ nguyên liệu và nấu thật ngon!' : `: cần đạt cấp độ ${next.level}, giám khảo sẽ ghé quán.`}</p>` : '<p><b>Bạn đã là THỰC THẦN!</b></p>'}
  <div class="row end"><button type="button" class="btn ghost small" data-act="more-cert">Xem chi tiết</button></div></div>`;
}
function reviewCard(s) {
  const last = s.reviews.slice(-3).reverse();
  return `<div class="card"><h3>${icon('heart', 20)} Khách nói gì về quán</h3>${last.length ? `<ul class="rv-list">${last.map(reviewItem).join('')}</ul><div class="row end"><button type="button" class="btn ghost small" data-act="more-reviews">Xem tất cả</button></div>` : '<p class="muted">Chưa có đánh giá nào. Hãy mở quán và phục vụ khách!</p>'}</div>`;
}
export function reviewItem(r) {
  const K = { critic: 'Nhà phê bình', judge: 'Giám khảo', regular: 'Khách quen' };
  return `<li class="rv"><div class="rv-h"><b>${esc(r.name)}</b>${K[r.kind] ? `<span class="chip kind">${K[r.kind]}</span>` : ''}<span class="stars" aria-label="${r.rating} sao">${ratingStars(r.rating, 13)}</span></div><p>${esc(r.text)}</p><small>${esc(r.dish)} · Ngày ${r.day}</small></li>`;
}
SCREENS.home = {
  render(s) {
    const v = venueOf(s), rk = repRank(s.rep);
    const dailies = s.daily.ids.map((id) => ({ id, def: questDef(s, id), p: questProgress(s, id), st: s.quests[id]?.status })).filter((x) => x.def);
    const trend = s.report ? Math.round(s.report.rep) : null;
    return `<div class="grid2">
    <div class="card shop-card"><div class="scene">${sceneSVG('pho')}</div><div class="shop-info">
      <h2>${esc(shopName(s))} <button type="button" class="btn ghost small" data-act="shop-rename" aria-label="Đổi tên quán">${icon('settings', 16)}<span>Đổi tên</span></button></h2>
      <p>${esc(v.name)} · Chủ quán: <b>${esc(s.name)}</b> · ${esc(levelTitle(s.level))} · Ngày ${s.day}</p>
      <div class="rank">${rankCrest(rk.index, 40)}<div class="rank-m">${repMeter(s, { big: true, trend })}<small>Uy tín quyết định lượng khách mỗi ngày (hôm nay dự kiến khoảng ${customersFor(s)} khách).</small></div></div>
      <div class="row"><button type="button" class="btn primary" data-act="nav" data-to="service">${icon('cook', 18)}<span>${s.shift ? 'Tiếp tục ca bán' : s.report ? 'Xem kết quả ngày' : 'Mở quán'}</span></button>
      <button type="button" class="btn" data-act="nav" data-to="map">${icon('map', 18)}<span>Khám phá</span></button>
      <button type="button" class="btn" data-act="go-forage">${icon('g-rau', 18)}<span>Thu thập</span></button></div>
    </div></div>
    ${festivalCard(s)}
    ${questCard(s)}
    ${certCard(s)}
    ${reviewCard(s)}
    <div class="card"><h3>${icon('day', 20)} Nhiệm vụ trong ngày</h3>${dailies.length ? `<ul class="mini-q">${dailies.map((d) => `<li class="${d.st === 'claimed' ? 'is-done' : ''}"><span>${esc(d.def.title)}</span>${d.st === 'done' ? `<button type="button" class="btn small primary" data-act="q-claim" data-id="${d.id}">Nhận</button>` : `<small>${d.st === 'claimed' ? 'Xong' : `${d.p.cur}/${d.p.n}`}</small>`}</li>`).join('')}</ul>` : '<p class="muted">Chưa có nhiệm vụ hôm nay.</p>'}</div>
    ${menuCard(s)}
    <div class="card tip">${icon('sparkle', 22)}<p><b>Mẹo:</b> ${esc(TIPS[(s.day + s.level) % TIPS.length])}</p><button type="button" class="btn ghost small" data-act="tut-open">Xem lại hướng dẫn</button></div>
    </div>`;
  },
};
ACT['shop-rename'] = () => {
  const s = getState();
  openModal({ cls: 'confirm', label: 'Đổi tên quán', html: `<h2>Tên quán của bạn</h2><p>Tên hiển thị trên bảng hiệu và ở đầu trang.</p>
    <input id="shop-in" class="text-in" maxlength="24" value="${esc(shopName(s))}" aria-label="Tên quán" data-autofocus>
    <div class="row end"><button type="button" class="btn ghost" data-act="modal-close">Hủy</button><button type="button" class="btn primary" data-act="shop-save">Lưu</button></div>` });
};
ACT['shop-save'] = () => {
  const v = (document.getElementById('shop-in')?.value || '').trim().slice(0, 24);
  act((s) => { s.shopName = v; });
  closeModal();
  toast(v ? `Quán đã đổi tên thành "${v}".` : 'Đã dùng lại tên quán mặc định.', 'good');
};
ACT['more-cert'] = () => { ui.tab.more = 'cert'; go('more'); };
ACT['more-reviews'] = () => { ui.tab.more = 'reviews'; go('more'); };
ACT['go-forage'] = () => { ui.tab.pantry = 'forage'; go('pantry'); };
ACT['q-claim'] = (el) => {
  const r = mutate((s) => claimQuest(s, el.dataset.id));
  if (r && r.ok) floatAt(el, (r.text || '').split(',')[0], 'coin');
};

// ================= Phục vụ =================
let timer = null, last = 0;
function sig(sh) { return sh.customers.map((c) => `${c.id}:${c.status}:${c.prep ? c.prep.state : ''}`).join('|') + `#${sh.arrived}${sh.closed ? 'x' : ''}`; }

function custCard(s, c) {
  const d = DISH_BY_ID[c.dish];
  const ex = c.extra ? extraOf(d) : null;
  const need = { ...d.ingredients };
  if (ex) need[ex.ing] = (need[ex.ing] || 0) + 1;
  const ok = hasAll(s, need);
  const miss = shortage(s, need);
  const pct = waitInfo(c).pct;
  const canAssist = bonus(s).assistant > 0;
  const prepDone = c.prep && c.prep.state === 'done';
  const KIND = { normal: '', hurry: 'Khách vội', regular: 'Khách quen', tourist: 'Khách du lịch', critic: 'Nhà phê bình', judge: 'Giám khảo' };
  const acts = c.status === 'waiting'
    ? `<button type="button" class="btn primary" data-act="svc-take" data-id="${c.id}">Nhận đơn</button><button type="button" class="btn ghost" data-act="svc-decline" data-id="${c.id}">Từ chối</button>`
    : c.status === 'ordered'
      ? `<button type="button" class="btn primary" data-act="svc-cook" data-id="${c.id}" ${c.prep && c.prep.state === 'doing' ? 'disabled' : ''}>${icon('cook', 18)}<span>${c.prep && c.prep.state === 'doing' ? 'Phụ bếp đang sơ chế...' : 'Nấu món'}</span></button>${canAssist && c.prep && c.prep.state === 'none' ? `<button type="button" class="btn" data-act="svc-assist" data-id="${c.id}" title="Phụ bếp sơ chế sẵn trong lúc bạn làm việc khác">${icon('u-assistant', 18)}<span>Phụ bếp</span></button>` : ''}<button type="button" class="btn ghost" data-act="svc-decline" data-id="${c.id}">Bỏ đơn</button>`
      : `<button type="button" class="btn good" data-act="svc-serve" data-id="${c.id}">${icon('check', 18)}<span>Giao món</span></button>`;
  return `<article class="cust k-${c.kind} st-${c.status}" data-cust="${c.id}" aria-label="Khách ${esc(c.name)}">
    <div class="cust-who">${person(c.look, 56, c.name)}<div><b>${esc(c.name)}</b>${KIND[c.kind] ? `<span class="chip kind">${KIND[c.kind]}</span>` : ''}</div></div>
    <div class="cust-order">${dishArt(d, 52)}<div><b>${esc(d.name)}</b>${c.kind === 'judge' ? `<small class="warn">Cần từ ${c.need} sao để nhận chứng nhận</small>` : ''}<small class="tasteorder">${esc(tasteOrderText(d, c.taste || seasonTarget(d, {})))}${ex ? ' · ' + esc(ex.label) : ''}</small>
      ${c.status === 'ready' ? `<span class="stars">${stars(c.stars, 3, 16)}</span>` : `<small class="${ok ? 'ok' : 'warn'}">${ok ? 'Đủ nguyên liệu' : 'Thiếu: ' + Object.entries(miss).map(([id, q]) => `${q} ${esc(INGREDIENTS[id].name)}`).join(', ')}</small>${prepDone ? `<small class="ok">${icon('u-assistant', 14)} Đã sơ chế sẵn</small>` : ''}`}</div></div>
    <div class="patience" title="Khách chờ càng lâu thì đánh giá càng thấp">${icon('clock', 16)}${bar(pct, pct < 30 ? 'low' : pct < 60 ? 'mid' : '', 'Thời gian chờ')}</div>
    <div class="row">${acts}</div></article>`;
}

function preShift(s) {
  const fest = festivalOn(s.day);
  const menu = menuDishes(s);
  const n = customersFor(s) + (fest ? 1 : 0);
  if (s.report) return reportCard(s.report, s);
  const cookable = menu.filter((d) => hasAll(s, d.ingredients)).length;
  return `<div class="card center-card">${icon('cook', 48)}<h2>Ngày ${s.day}: sẵn sàng mở quán?</h2>
  <p>Dự kiến khoảng <b>${n}</b> thực khách (uy tín ${Math.round(s.rep)}/100 càng cao khách càng đông, không giới hạn chỗ ngồi). Khách chờ càng lâu thì đánh giá càng thấp. Hết giờ quán không nhận khách nữa. ${cookable}/${menu.length} món trong thực đơn đủ nguyên liệu.</p>
  ${fest ? `<div class="note good">${icon('lantern', 18)}<div>Hôm nay có <b>${esc(fest.f.name)}</b>: món hợp chủ đề bán giá cao hơn.</div></div>` : ''}
  ${cookable < menu.length ? `<div class="note warn">${icon('shop', 18)}<div>Một số món thiếu nguyên liệu. Bạn vẫn có thể mua nhanh khi nấu, hoặc ghé chợ trước.</div></div>` : ''}
  <div class="row center"><button type="button" class="btn primary big" data-act="svc-open" data-autofocus>${icon('cook', 20)}<span>Mở quán</span></button>
  <button type="button" class="btn" data-act="svc-endday">${icon('day', 18)}<span>Kết thúc ngày</span></button></div></div>`;
}
const INC_L = { sale: 'Bán món ăn', tips: 'Tiền tip', reward: 'Thưởng, chứng nhận' };
const EXP_L = { ingredients: 'Mua nguyên liệu', hint: 'Mua gợi ý nấu', fare: 'Tiền đi lại khám phá', learn: 'Học món mới', upgrade: 'Nâng cấp quán', wage: 'Lương phụ bếp', other: 'Chi khác' };
function ledgerHtml(r, row) {
  const inc = r.inc || { sale: Math.max(0, r.revenue - r.tips), tips: r.tips };
  const exp = r.exp || { ingredients: r.cogs, wage: r.wage };
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const ti = sum(inc), te = sum(exp), net = ti - te;
  const lines = (o, L, sign) => Object.entries(o).filter(([, v]) => v > 0).map(([k, v]) => row(L[k] || k, sign + money(v))).join('') || '<li class="muted"><span>Không có</span><b>0</b></li>';
  return `<h3>${icon('money', 18)} Thu</h3><ul class="rep-list">${lines(inc, INC_L, '+')}${row('Tổng thu', money(ti), 'good')}</ul>
  <h3>${icon('shop', 18)} Chi</h3><ul class="rep-list">${lines(exp, EXP_L, '-')}${row('Tổng chi', '-' + money(te), te ? 'bad' : '')}</ul>
  <ul class="rep-list sum"><li class="${net >= 0 ? 'good' : 'bad'}"><span><b>${net >= 0 ? 'LÃI' : 'LỖ'} trong ngày</b></span><b>${net >= 0 ? '+' : '-'}${money(Math.abs(net))}</b></li>${row('Tiền đầu ngày', money(r.startCash ?? (r.cash - net)))}${row('Tiền hiện có', money(r.cash))}</ul>`;
}
function reportCard(r, s) {
  const row = (l, v, cls = '') => `<li class="${cls}"><span>${l}</span><b>${v}</b></li>`;
  const certs = (r.certs || []).map((id) => CERTS.find((c) => c.id === id)).filter(Boolean);
  const dRep = Math.round((r.rep || 0) * 10) / 10;
  return `<div class="card report"><h2>${icon('trophy', 28)} Báo cáo cuối ngày ${r.day}</h2>
  ${certs.map((c) => `<div class="note good">${icon(c.icon, 22)}<div><b>Nhận chứng nhận: ${esc(c.name)}!</b></div></div>`).join('')}
  ${ledgerHtml(r, row)}
  <ul class="rep-list">${row('Đã phục vụ', r.served)}${row('Khách bỏ đi', r.lost, r.lost ? 'bad' : '')}${row('Đánh giá trung bình', r.avgRating ? `${r.avgRating}/5` : 'Chưa có')}${row('Thay đổi uy tín', `${dRep >= 0 ? '+' : ''}${dRep}`, dRep >= 0 ? 'good' : 'bad')}${row('Kinh nghiệm', '+' + r.xp)}</ul>
  <div class="rep-after">${repMeter(s, { big: true, trend: dRep })}</div>
  ${r.reviews && r.reviews.length ? `<h3>${icon('heart', 18)} Lời khách để lại</h3><ul class="rv-list">${r.reviews.slice().reverse().slice(0, 4).map(reviewItem).join('')}</ul>` : ''}
  <div class="row center"><button type="button" class="btn primary big" data-act="svc-nextday" data-autofocus>${icon('day', 20)}<span>Qua ngày mới (ngày ${s.day + 1})</span></button></div></div>`;
}

SCREENS.service = {
  render(s) {
    const sh = s.shift;
    if (!sh) return preShift(s);
    const over = shiftOver(sh);
    const pct = Math.min(100, (sh.t / sh.dayLen) * 100);
    const banner = over
      ? `<div class="card endbanner" role="alert">${icon('day', 32)}<div><b>${sh.closed ? 'Hết giờ nhận khách!' : 'Hôm nay đã phục vụ hết khách!'}</b><p>${sh.customers.length ? 'Hãy phục vụ nốt những khách đang ở trong quán, rồi bấm nút Kết thúc ngày để xem báo cáo.' : 'Bấm nút Kết thúc ngày để xem báo cáo doanh thu.'}</p></div>
        <button type="button" class="btn primary big" data-act="svc-endday" data-autofocus>${icon('day', 20)}<span>Kết thúc ngày</span></button></div>` : '';
    return `<div class="shift-head card"><div class="clockbox">${icon('clock', 22)}<div><b id="clock-t">${clockText(sh)}</b><small>Ngày ${sh.day}${sh.festival ? ' · lễ hội' : ''} · đã đón ${sh.arrived} khách</small></div>
      <div class="dayline" aria-hidden="true"><i id="clock-bar" style="width:${pct}%"></i></div></div>
    <div class="shift-stats"><span class="chip">${icon('check', 16)}${sh.served}</span><span class="chip warn">${icon('close', 16)}${sh.lost}</span><span class="chip gold">${icon('money', 16)}${money(sh.revenue + sh.tips)}</span><span class="chip" title="Khách đang chờ trong quán">${icon('customer', 16)}Đang chờ ${sh.customers.length}</span></div>
    ${over ? '' : `<button type="button" class="btn small" data-act="svc-endday">${icon('day', 16)}<span>Kết thúc sớm</span></button>`}</div>
    ${banner}
    <div class="cust-grid">${sh.customers.length ? sh.customers.map((c) => custCard(s, c)).join('') : over ? '' : emptyState('customer', 'Đang chờ khách', 'Khách sẽ lần lượt tới quán. Uy tín càng cao khách càng đông. Bạn có thể ghé chợ hoặc chuẩn bị nguyên liệu trong lúc chờ.')}</div>`;
  },
  mount() {
    clearInterval(timer);
    last = performance.now();
    timer = setInterval(onTick, 250);
  },
  unmount() { clearInterval(timer); timer = null; },
};

let overFor = 0;
function onTick() {
  const now = performance.now();
  const dt = Math.min(1, (now - last) / 1000);
  last = now;
  const s = getState();
  if (!s || !s.shift || ui.screen !== 'service' || (modalOpen() && !ui.cooking) || document.hidden) return;
  const before = sig(s.shift);
  const r = tick(s, dt);
  if (r === 'done' && overFor !== s.shift.day) { overFor = s.shift.day; emit('sfx', 'bell'); toast(s.shift.closed ? 'Hết giờ nhận khách! Phục vụ nốt rồi bấm Kết thúc ngày.' : 'Hôm nay hết khách rồi. Hãy bấm Kết thúc ngày.', 'info'); commit(false); return; }
  if (sig(s.shift) !== before) { commit(false); return; }
  const sh = s.shift;
  const ct = document.getElementById('clock-t'), cb = document.getElementById('clock-bar');
  if (ct) ct.textContent = clockText(sh);
  if (cb) cb.style.width = `${Math.min(100, (sh.t / sh.dayLen) * 100)}%`;
  for (const c of sh.customers) {
    const el = document.querySelector(`[data-cust="${c.id}"] .bar`);
    if (!el) continue;
    const p = waitInfo(c).pct;
    el.firstElementChild.style.width = `${p}%`;
    el.className = `bar ${p < 30 ? 'low' : p < 60 ? 'mid' : ''}`;
    el.setAttribute('aria-valuenow', String(Math.round(p)));
  }
}
function openReport(r) {
  openModal({ cls: 'report-modal', label: 'Kết quả ngày', html: `${reportCard(r, getState()).replace('data-act="svc-nextday"', 'data-act="svc-nextday"')}` });
}

ACT['svc-open'] = () => mutate((s) => openShift(s));
ACT['svc-endday'] = async () => {
  const s = getState();
  const left = s.shift ? s.shift.customers.length : 0;
  const ok = await confirmDialog({ title: 'Kết thúc ngày?', text: s.shift ? `Quán đóng cửa ngay${left ? `, ${left} khách chưa phục vụ sẽ ra về (không bị phạt uy tín)` : ''}. Bạn sẽ xem báo cáo doanh thu rồi qua ngày mới.` : 'Quán không mở cửa hôm nay. Bạn sẽ xem báo cáo rồi qua ngày mới.', ok: 'Kết thúc ngày', cancel: 'Quay lại' });
  if (!ok) return;
  const r = mutate((st) => endDay(st));
  if (r && r.ok) openReport(r.report);
};
ACT['svc-nextday'] = () => { closeAllModals(); mutate((s) => nextDay(s)); go('home'); };
ACT['svc-take'] = (el) => mutate((s) => takeOrder(s, el.dataset.id), false);
ACT['svc-decline'] = async (el) => {
  const ok = await confirmDialog({ title: 'Từ chối khách này?', text: 'Khách sẽ bỏ đi và danh tiếng giảm nhẹ.', ok: 'Từ chối', cancel: 'Giữ lại', danger: true });
  if (ok) mutate((s) => declineOrder(s, el.dataset.id));
};
ACT['svc-cook'] = (el) => {
  const c = getState().shift?.customers.find((x) => x.id === el.dataset.id);
  if (!c) return;
  startCook({ dishId: c.dish, order: { spice: c.spice, taste: c.taste, extra: c.extra, prepScore: c.prep && c.prep.state === 'done' ? c.prep.score : null }, mode: 'order', custId: c.id });
};
// Sau khi nấu xong: nhận và nấu ngay khách kế tiếp (khách chờ lâu nhất trước).
ACT['svc-cook-next'] = () => {
  const sh = getState().shift;
  const c = sh && sh.customers.find((x) => x.status === 'waiting' || x.status === 'ordered');
  if (!c) return;
  if (c.status === 'waiting') mutate((s) => takeOrder(s, c.id));
  ACT['svc-cook']({ dataset: { id: c.id } });
};
ACT['svc-assist'] = (el) => mutate((s) => assignPrep(s, el.dataset.id), false);
ACT['svc-serve'] = (el) => {
  const r = mutate((s) => serve(s, el.dataset.id));
  if (r && r.ok) { floatAt(el && el.getBoundingClientRect ? el : null, `+${money(r.pay)}`, 'coin'); if (r.tip) toast(`Khách boa thêm ${money(r.tip)}!`, 'good'); if (r.rating) toast(`Đánh giá ${r.rating}/5${r.rep ? ` · uy tín ${r.rep > 0 ? '+' : ''}${Math.round(r.rep * 10) / 10}` : ''}`, r.rating >= 4 ? 'good' : r.rating === 3 ? 'info' : 'bad'); if (r.mp) toast(`+${r.mp} điểm thông thạo`, 'info'); }
};

on('lost', ({ c, why }) => { if (why !== 'close') toast(why === 'timeout' ? `${c.name} chờ lâu quá nên đã bỏ đi. Uy tín giảm.` : `Bạn đã từ chối ${c.name}.`, 'bad'); });
on('review', (r) => { if (r.rating <= 2 || r.kind === 'critic' || r.kind === 'judge') toast(`${r.name}: "${r.text}"`, r.rating >= 4 ? 'good' : 'bad'); });

// ================= Góp ý & Ủng hộ =================
ACT['open-feedback'] = () => {
  if (FEEDBACK_URL) { window.open(FEEDBACK_URL, '_blank', 'noopener'); return; }
  toast('Trang góp ý sẽ sớm mở. Cảm ơn bạn đã quan tâm!', 'info');
};
ACT['open-donate'] = () => {
  openModal({
    cls: 'confirm donate', label: 'Ủng hộ tác giả',
    html: `<h2>Mời tác giả ly cà phê ☕</h2>
    <p>Game này miễn phí và sẽ luôn chơi được bình thường. Nếu bạn thấy vui và muốn ủng hộ, bạn có thể quét mã QR dưới đây. Không bắt buộc, cảm ơn bạn rất nhiều!</p>
    <img class="donate-img" src="${DONATE_IMG}" alt="Mã QR ủng hộ tác giả (VPBank)" width="260">
    <div class="row"><button type="button" class="btn primary" data-act="modal-close" data-autofocus>Đóng</button></div>`,
  });
};
