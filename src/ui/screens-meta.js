// Nhiệm vụ, nâng cấp, kỹ năng, mở rộng, thành tựu, thống kê và cài đặt.
import { icon } from '../art/icons.js';
import { achievementBadge, emblemSVG } from '../art/scenes.js';
import { MAIN_QUESTS, ACHIEVEMENTS } from '../data/quests.js';
import { UPGRADES, UPGRADE_ORDER, SKILLS, SKILL_ORDER, VENUES } from '../data/upgrades.js';
import { LOCATION_BY_ID } from '../data/locations.js';
import { NPCS, NPC_LIST } from '../data/npcs.js';
import { getState, commit, flushSave, setState, store } from '../core/store.js';
import { clearSave } from '../core/save.js';
import { questDef, questProgress, claimQuest, describeReward, eventProgress, festivalOn, festivalNext, valueOf } from '../core/quests.js';
import { upgradeStatus, buyUpgrade, venueStatus, buyVenue, venueOf, upgradeSkill, bonus } from '../core/progression.js';
import { npcOf, requestOf } from '../core/explore.js';
import { claimEvent } from '../core/quests.js';
import { setSoundEnabled, setMusicEnabled, setMusicVolume, startMusic, sfx } from '../core/audio.js';
import { ACT, SCREENS, ui, go, refresh, mutate } from './app.js';
import { confirmDialog, toast, floatAt, closeAllModals } from './kit.js';
import { esc, money, num, bar, tabs, person, dishArt, emptyState, timeAgo } from './util.js';
import { exportSave, openImportDialog } from './saveui.js';
import { openTutorial, reviewItem } from './screens-home.js';
import { CERTS } from '../data/certs.js';
import { pendingCert, customersFor } from '../core/service.js';
import { shopName } from '../core/progression.js';

// ================= Nhiệm vụ =================
function qCard(s, id) {
  const def = questDef(s, id), q = s.quests[id], p = questProgress(s, id);
  if (!def || !q) return '';
  const st = q.status;
  return `<article class="card qcard st-${st}"><div class="q-top"><b>${esc(def.title)}</b>${st === 'claimed' ? `<span class="chip ok">${icon('check', 14)}Đã nhận</span>` : st === 'done' ? '<span class="chip gold">Hoàn thành</span>' : ''}</div>
  <p>${esc(def.desc)}</p>${st === 'claimed' ? '' : bar(p.pct, '', def.title)}
  <div class="q-bot"><small>${st === 'claimed' ? '' : `${p.cur}/${p.n} · `}Thưởng: ${esc(describeReward(def.reward))}</small>${st === 'done' ? `<button type="button" class="btn primary small" data-act="q-claim" data-id="${id}">Nhận thưởng</button>` : ''}</div></article>`;
}
function questsMain(s) {
  const active = MAIN_QUESTS.filter((m) => s.quests[m.id] && s.quests[m.id].status !== 'claimed');
  const claimed = MAIN_QUESTS.filter((m) => s.quests[m.id]?.status === 'claimed');
  const next = MAIN_QUESTS.find((m) => !s.quests[m.id]);
  return `${active.map((m) => qCard(s, m.id)).join('') || '<p class="muted">Không có nhiệm vụ chính đang làm.</p>'}
  ${next ? `<div class="card locked-q">${icon('lock', 20)}<div><b>Nhiệm vụ kế tiếp</b><p class="muted">Hoàn thành và nhận thưởng nhiệm vụ hiện tại để mở. (Còn ${MAIN_QUESTS.length - claimed.length - active.length} nhiệm vụ chính nữa.)</p></div></div>` : ''}
  ${claimed.length ? `<details class="card"><summary>Đã hoàn thành (${claimed.length})</summary>${claimed.map((m) => `<p class="done-line">${icon('check', 16)} ${esc(m.title)}</p>`).join('')}</details>` : ''}`;
}
function questsChar(s) {
  const list = NPC_LIST.filter((n) => s.visited[n.loc]);
  if (!list.length) return emptyState('heart', 'Chưa gặp ai', 'Hãy đến các địa điểm trên bản đồ để gặp gỡ nhân vật.');
  return list.map((npc) => {
    const n = npcOf(s, npc.id), rq = requestOf(s, npc.id);
    return `<article class="card npc-q">${person(npc.look, 56, npc.name)}<div><b>${esc(npc.name)}</b><small>${esc(LOCATION_BY_ID[npc.loc].name)}</small>
    <div class="friend">${[0, 1, 2].map((i) => icon(i < n.friend ? 'heart' : 'star-off', 16)).join('')}</div>
    <p>${rq.full ? 'Đã kết thân trọn vẹn.' : `${esc(rq.text)} <b>(${esc(rq.dish.name)})</b>`}</p></div></article>`;
  }).join('');
}
function questsEvent(s) {
  const p = eventProgress(s);
  if (!p) {
    const nx = festivalNext(s.day);
    return `<div class="card center-card">${icon('lantern', 48)}<h2>Chưa có lễ hội</h2><p>Lễ hội kế tiếp: <b>${esc(nx.f.name)}</b> sau ${nx.wait} ngày nữa.</p><p class="muted">${esc(nx.f.desc)}</p></div>`;
  }
  return `<div class="card fest-card big">${icon('lantern', 36)}<div><h2>${esc(p.f.name)}</h2><p>${esc(p.f.desc)}</p><p>Còn ${p.daysLeft} ngày. Mục tiêu: bán ${p.goal} phần món hợp chủ đề.</p>${bar((p.n / p.goal) * 100, '', 'Tiến độ lễ hội')}<small>${p.n}/${p.goal} · Thưởng: ${esc(describeReward(p.f.reward))}</small>
  <div class="row end">${p.claimed ? '<span class="chip ok">Đã nhận thưởng</span>' : `<button type="button" class="btn primary" data-act="ev-claim" ${p.done ? '' : 'disabled'}>Nhận thưởng lễ hội</button>`}</div></div></div>`;
}
SCREENS.quests = {
  render(s) {
    const t = ui.tab.quests;
    const cnt = (ids) => ids.filter((id) => s.quests[id]?.status === 'done').length;
    const mainDone = MAIN_QUESTS.filter((m) => s.quests[m.id]?.status === 'done').length;
    const ep = eventProgress(s);
    const body = t === 'main' ? questsMain(s)
      : t === 'daily' ? (s.daily.ids.map((id) => qCard(s, id)).join('') || '<p class="muted">Chưa có nhiệm vụ ngày.</p>')
      : t === 'weekly' ? (s.weekly.ids.map((id) => qCard(s, id)).join('') || '<p class="muted">Chưa có nhiệm vụ tuần.</p>')
      : t === 'char' ? questsChar(s) : questsEvent(s);
    return `<h1>Nhiệm vụ</h1>${tabs([['main', 'Chính', mainDone], ['daily', 'Ngày', cnt(s.daily.ids)], ['weekly', 'Tuần', cnt(s.weekly.ids)], ['char', 'Nhân vật'], ['event', 'Sự kiện', ep && ep.done && !ep.claimed ? 1 : 0]], t, 'tab-quests')}<div class="tabpane">${body}</div>`;
  },
};
ACT['tab-quests'] = (el) => { ui.tab.quests = el.dataset.tab; refresh(); };
ACT['ev-claim'] = (el) => { const r = mutate((s) => claimEvent(s)); if (r.ok) floatAt(el, 'Đã nhận', 'coin'); };

// ================= Thêm =================
function upgradesTab(s) {
  return `<div class="grid2">${UPGRADE_ORDER.map((k) => {
    const d = UPGRADES[k], st = upgradeStatus(s, k);
    return `<article class="card upg"><div class="upg-top">${icon(d.icon, 36)}<div><b>${esc(d.name)}</b><small>Cấp ${st.level}/${d.max}</small></div></div><p>${esc(d.desc)}</p>
    <div class="pips lv">${Array.from({ length: d.max }, (_, i) => `<i class="${i < st.level ? 'on' : ''}"></i>`).join('')}</div>
    ${st.maxed ? '<span class="chip ok">Đã tối đa</span>' : `<button type="button" class="btn ${st.locked ? '' : 'primary'}" data-act="upg" data-k="${k}" ${st.locked || !st.affordable ? 'disabled' : ''}>${st.locked ? `${icon('lock', 16)}<span>Cần cấp ${st.req}</span>` : `<span>Nâng cấp ${money(st.cost)}</span>`}</button>`}</article>`;
  }).join('')}</div>`;
}
function skillsTab(s) {
  return `<div class="card"><b>Điểm kỹ năng: ${s.skillPoints}</b><p class="muted">Mỗi lần lên cấp bạn nhận 1 điểm kỹ năng.</p></div>
  <div class="grid2">${SKILL_ORDER.map((k) => {
    const d = SKILLS[k], lv = s.skills[k];
    return `<article class="card upg"><div class="upg-top">${icon(d.icon, 36)}<div><b>${esc(d.name)}</b><small>Cấp ${lv}/${d.max}</small></div></div><p>${esc(d.desc)}</p>
    <div class="pips lv">${Array.from({ length: d.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
    ${lv >= d.max ? '<span class="chip ok">Đã tối đa</span>' : `<button type="button" class="btn primary" data-act="skill" data-k="${k}" ${s.skillPoints < 1 ? 'disabled' : ''}>Học (1 điểm)</button>`}</article>`;
  }).join('')}</div>`;
}
function venueTab(s) {
  const v = venueOf(s), st = venueStatus(s), b = bonus(s);
  return `<div class="card"><h3>${icon('home', 22)} ${esc(v.name)}</h3><p>Khách đến mỗi ngày: khoảng <b>${customersFor(s)}</b> (tăng theo uy tín và cấp độ, không giới hạn chỗ ngồi) · Hệ số danh tiếng: <b>×${b.repMult.toFixed(2)}</b></p></div>
  <ol class="venues">${VENUES.map((x, i) => `<li class="${i === s.venue ? 'cur' : i < s.venue ? 'past' : ''}"><b>${esc(x.name)}</b><small>${i === 0 ? 'Khởi đầu' : `Cấp ${x.level} · ${money(x.cost)} · khách đông hơn, +${x.customers} khách/ngày`}</small></li>`).join('')}</ol>
  ${st.maxed ? '<div class="note good">Quán của bạn đã là thương hiệu ba miền!</div>' : `<button type="button" class="btn primary big" data-act="venue" ${st.locked || !st.affordable ? 'disabled' : ''}>${st.locked ? `Cần cấp ${st.next.level}` : `Mở rộng thành "${esc(st.next.name)}" (${money(st.next.cost)})`}</button>`}`;
}
function achTab(s) {
  const got = ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length;
  return `<p class="muted">Đã mở ${got}/${ACHIEVEMENTS.length} thành tựu.</p><div class="ach-grid">${ACHIEVEMENTS.map((a) => {
    const un = Boolean(s.achievements[a.id]);
    const cur = a.cond.v ? valueOf(s, a.cond.v) : (s.stats[a.cond.k] || 0);
    return `<article class="card ach ${un ? 'on' : ''}">${achievementBadge(a.icon, un, 52)}<div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${un ? '' : `<small>${Math.min(cur, a.cond.n)}/${a.cond.n}</small>`}</div></article>`;
  }).join('')}</div>`;
}
function chart(h) {
  if (!h.length) return '<p class="muted">Chưa có dữ liệu. Hãy bán hàng vài ngày.</p>';
  const W = 320, H = 110, n = h.length, bw = Math.max(4, Math.floor((W - 10) / n) - 2);
  const max = Math.max(1, ...h.map((x) => Math.max(x.revenue, x.cost)));
  const bars = h.map((x, i) => {
    const hx = 5 + i * (bw + 2), hr = (x.revenue / max) * (H - 24), hc = (x.cost / max) * (H - 24);
    return `<rect x="${hx}" y="${H - 14 - hr}" width="${bw / 2}" height="${hr}" fill="#4f7a3a"><title>Ngày ${x.day}: doanh thu ${money(x.revenue)}</title></rect><rect x="${hx + bw / 2}" y="${H - 14 - hc}" width="${bw / 2}" height="${hc}" fill="#b8442f"><title>Ngày ${x.day}: chi phí ${x.cost}k</title></rect>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ doanh thu và chi phí ${n} ngày gần nhất">${bars}<line x1="0" x2="${W}" y1="${H - 14}" y2="${H - 14}" stroke="#4a2f1c" stroke-width="1"/><text x="5" y="${H - 2}" font-size="9" fill="#4a2f1c">Ngày ${h[0].day}</text><text x="${W - 5}" y="${H - 2}" font-size="9" text-anchor="end" fill="#4a2f1c">Ngày ${h[n - 1].day}</text></svg>
  <p class="legend"><i class="lg g"></i>Doanh thu <i class="lg r"></i>Chi phí</p>`;
}
function statsTab(s) {
  const st = s.stats;
  const rows = [['Số ngày đã qua', (s.day - 1)], ['Ca bán hàng', st.shifts || 0], ['Khách đã phục vụ', st.served || 0], ['Khách bỏ đi', st.lost || 0], ['Món đã nấu', st.cooked || 0], ['Món 3 sao', st.stars3 || 0], ['Món bị hỏng', st.ruined || 0], ['Tổng doanh thu bán hàng', money(st.earn || 0)], ['Tổng tiền đã chi', money(st.spent || 0)], ['Phần nguyên liệu đã mua', st.bought || 0], ['Lần thu thập', st.gather || 0], ['Địa điểm đã đến', Object.keys(s.visited).length + '/15'], ['Công thức đã học', Object.keys(s.learned).length], ['Quà đã tặng', st.gifts || 0], ['Nhiệm vụ đã nhận thưởng', st.questsClaimed || 0]];
  const reg = Object.entries(s.regulars);
  return `<ul class="facts big">${rows.map(([l, v]) => `<li><span>${l}</span><b>${typeof v === 'number' ? num(v) : v}</b></li>`).join('')}</ul>
  <div class="card"><h3>Doanh thu 30 ngày gần nhất</h3>${chart(s.history)}</div>
  ${reg.length ? `<div class="card"><h3>Khách quen</h3><ul class="list plain">${reg.sort((a, b) => b[1] - a[1]).map(([n, c]) => `<li class="row-item"><span class="ri-main"><b>${esc(n)}</b><small>${c} lần ghé quán</small></span></li>`).join('')}</ul></div>` : ''}`;
}
function certTab(s) {
  const pc = pendingCert(s);
  return `<p class="muted">Khi đạt mốc cấp độ, một giám khảo sẽ ghé quán và gọi một món. Nấu đủ số sao yêu cầu để nhận chứng nhận và phần thưởng. Cấp cao nhất là <b>THỰC THẦN</b>.</p>
  <div class="cert-list">${CERTS.map((c, i) => {
    const on = Boolean(s.certs[c.id]);
    const state = on ? 'on' : (pc && pc.cert.id === c.id) ? 'wait' : s.level >= c.level ? 'next' : 'locked';
    return `<article class="card certc ${state} ${c.id === 'c6' ? 'top' : ''}"><div class="cert-ic">${icon(on ? c.icon : 'lock', 40)}</div><div><b>${i + 1}. ${esc(c.name)}</b><small>${esc(c.judge)} · cần cấp ${c.level} · món từ ${c.need} sao</small><p>${esc(c.desc)}</p>
    <small>Thưởng: ${money(c.reward.money)}${c.reward.xp ? `, ${c.reward.xp} XP` : ''}, +${c.reward.rep} uy tín</small>
    ${on ? '<span class="chip ok">Đã nhận</span>' : state === 'wait' ? '<span class="chip gold">Giám khảo sắp ghé quán</span>' : state === 'next' ? '<span class="chip">Cần chứng nhận trước đó</span>' : `<span class="chip warn">Cấp ${c.level}</span>`}</div></article>`;
  }).join('')}</div>`;
}
function reviewsTab(s) {
  const list = s.reviews.slice().reverse();
  const avg = list.length ? Math.round((list.reduce((a, r) => a + r.rating, 0) / list.length) * 10) / 10 : 0;
  return `<div class="card"><h3>${icon('heart', 20)} Đánh giá gần đây</h3><p>${list.length ? `Điểm trung bình ${avg}/5 trong ${list.length} đánh giá gần nhất.` : 'Chưa có đánh giá. Phục vụ khách để nhận lời nhận xét.'}</p></div>
  ${list.length ? `<ul class="rv-list">${list.map(reviewItem).join('')}</ul>` : ''}`;
}
const THEMES = [['cream', 'Kem ấm', '#fbf3e3', '#b8442f'], ['night', 'Đêm', '#231b16', '#d2603f'], ['fresh', 'Xanh lá', '#eef6e6', '#3f7a55'], ['rose', 'Hồng đào', '#fdeff0', '#c2557a']];
const ACCENTS = ['#b8442f', '#d9822b', '#3f7a55', '#2f7fa0', '#7a4a9a', '#c2557a'];
function appearanceCard(s) {
  return `<div class="card"><h3>${icon('settings', 20)} Quán & giao diện</h3>
  <div class="set-row"><div><b>Tên quán</b><small>Hiển thị trên đầu trang và bảng hiệu.</small></div><input class="text-in" maxlength="24" value="${esc(shopName(s))}" data-change="shop-name" aria-label="Tên quán"></div>
  <div class="set-row"><div><b>Chủ đề màu</b></div><div class="swatches" role="group" aria-label="Chủ đề màu">${THEMES.map(([id, l, bg, ac]) => `<button type="button" class="swatch ${s.settings.theme === id ? 'on' : ''}" data-act="set-theme" data-id="${id}" aria-pressed="${s.settings.theme === id}" title="${l}"><i style="background:${bg}"></i><i style="background:${ac}"></i><span>${l}</span></button>`).join('')}</div></div>
  <div class="set-row"><div><b>Màu nhấn</b><small>Màu của thanh trên cùng và nút chính.</small></div><div class="swatches">${ACCENTS.map((c) => `<button type="button" class="dot-sw ${s.settings.accent === c ? 'on' : ''}" style="background:${c}" data-act="set-accent" data-c="${c}" aria-label="Màu ${c}"></button>`).join('')}<input type="color" value="${s.settings.accent || '#b8442f'}" data-change="accent-pick" aria-label="Chọn màu tùy ý" class="colorpick"><button type="button" class="btn ghost small" data-act="set-accent" data-c="">Mặc định</button></div></div></div>`;
}
ACT['change:shop-name'] = (el) => { const v = el.value.trim().slice(0, 24); const s = getState(); s.shopName = v; commit(); toast('Đã lưu tên quán.', 'good'); };
ACT['set-theme'] = (el) => { const s = getState(); s.settings.theme = el.dataset.id; commit(); };
ACT['set-accent'] = (el) => { const s = getState(); s.settings.accent = el.dataset.c; commit(); };
ACT['change:accent-pick'] = (el) => { const s = getState(); s.settings.accent = el.value; commit(); };
function toggle(id, label, on, hint = '') {
  return `<div class="set-row"><div><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</div><button type="button" class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="set-toggle" data-k="${id}"><i></i></button></div>`;
}
function settingsTab(s) {
  const sv = store.lastSave;
  return `${appearanceCard(s)}<div class="card">${toggle('music', 'Nhạc nền vui nhộn', s.settings.music, 'Nhạc nhịp nhanh, tươi vui, tự tạo trong game.')}
  <div class="set-row"><div><b>Âm lượng nhạc</b></div><input type="range" min="0" max="100" step="5" value="${Math.round(s.settings.musicVol * 100)}" data-change="music-vol" aria-label="Âm lượng nhạc nền" class="range"></div>
  ${toggle('sound', 'Hiệu ứng âm thanh', s.settings.sound, 'Tiếng bấm, tiền, chuông khách...')}${toggle('motion', 'Chuyển động', s.settings.motion, 'Tắt để giảm hiệu ứng chuyển động.')}${toggle('fx', 'Hiệu ứng nổi và pháo giấy', s.settings.fx)}</div>
  <div class="card"><h3>${icon('save', 20)} Lưu trữ</h3><p>Game tự lưu sau mỗi hành động quan trọng. Lần lưu gần nhất: <b>${esc(timeAgo(s.savedAt))}</b>${sv && sv.ok === false ? `<br><span class="warn">${esc(sv.error)}</span>` : ''}</p>
  <div class="row wrap"><button type="button" class="btn" data-act="set-save">${icon('save', 18)}<span>Lưu ngay</span></button><button type="button" class="btn" data-act="set-export">${icon('download', 18)}<span>Xuất tiến trình</span></button><button type="button" class="btn" data-act="open-import">${icon('upload', 18)}<span>Nhập tiến trình</span></button></div></div>
  <div class="card"><h3>${icon('help', 20)} Trợ giúp</h3><div class="row wrap"><button type="button" class="btn" data-act="tut-open">Xem lại hướng dẫn</button><button type="button" class="btn" data-act="set-title">Về màn hình chính</button></div></div>
  <div class="card danger-zone"><h3>${icon('trash', 20)} Xóa tiến trình</h3><p>Xóa toàn bộ dữ liệu lưu trên thiết bị này. Hãy xuất tệp sao lưu trước nếu muốn giữ.</p><button type="button" class="btn danger" data-act="set-delete">Xóa tiến trình</button></div>
  <p class="fine center">Sổ Tay Thực Thần · mọi hình vẽ đều là SVG tự tạo · chạy offline</p>`;
}
const MORE_TABS = [['upgrades', 'Nâng cấp'], ['skills', 'Kỹ năng'], ['venue', 'Mở rộng'], ['cert', 'Chứng nhận'], ['reviews', 'Đánh giá'], ['ach', 'Thành tựu'], ['stats', 'Thống kê'], ['settings', 'Cài đặt']];
SCREENS.more = {
  render(s) {
    const t = ui.tab.more;
    const body = { upgrades: upgradesTab, skills: skillsTab, venue: venueTab, cert: certTab, reviews: reviewsTab, ach: achTab, stats: statsTab, settings: settingsTab }[t](s);
    return `<h1>Thêm</h1>${tabs(MORE_TABS.map(([id, l]) => [id, l, id === 'skills' && s.skillPoints ? s.skillPoints : 0]), t, 'tab-more')}<div class="tabpane">${body}</div>`;
  },
};
ACT['tab-more'] = (el) => { ui.tab.more = el.dataset.tab; refresh(); };
ACT.upg = (el) => mutate((s) => buyUpgrade(s, el.dataset.k));
ACT.skill = (el) => mutate((s) => upgradeSkill(s, el.dataset.k));
ACT.venue = () => mutate((s) => buyVenue(s));
ACT['set-toggle'] = (el) => {
  const k = el.dataset.k, s = getState();
  s.settings[k] = !s.settings[k];
  if (k === 'sound') setSoundEnabled(s.settings.sound);
  if (k === 'music') { setMusicEnabled(s.settings.music); if (s.settings.music) startMusic(); }
  commit();
  if (k === 'sound' && s.settings.sound) sfx('coin');
};
ACT['change:music-vol'] = (el) => { const s = getState(); s.settings.musicVol = Number(el.value) / 100; setMusicVolume(s.settings.musicVol); commit(false); };
ACT['set-save'] = () => { const r = flushSave(); toast(r.ok ? 'Đã lưu tiến trình.' : r.error, r.ok ? 'good' : 'bad'); refresh(); };
ACT['set-export'] = () => exportSave();
ACT['set-title'] = () => { flushSave(); go('title'); };
ACT['set-delete'] = async () => {
  const ok = await confirmDialog({ title: 'Xóa toàn bộ tiến trình?', text: 'Hành động này không thể hoàn tác. Tất cả món đã học, tiền và nhiệm vụ sẽ mất.', ok: 'Xóa tiến trình', cancel: 'Giữ lại', danger: true });
  if (!ok) return;
  const ok2 = await confirmDialog({ title: 'Bạn chắc chắn chứ?', text: 'Đây là lần xác nhận cuối cùng.', ok: 'Xóa vĩnh viễn', cancel: 'Quay lại', danger: true });
  if (!ok2) return;
  clearSave();
  setState(null);
  ui.title.save = null;
  closeAllModals();
  go('title');
  toast('Đã xóa tiến trình.', 'info');
};
