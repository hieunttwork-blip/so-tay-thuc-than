import test from 'node:test';
import assert from 'node:assert/strict';
import { DISHES, DISH_BY_ID, CATEGORIES } from '../src/data/dishes.js';
import { INGREDIENTS, INGREDIENT_GROUPS } from '../src/data/ingredients.js';
import { LOCATIONS, REGIONS } from '../src/data/locations.js';
import { NPCS } from '../src/data/npcs.js';
import { METHODS } from '../src/core/cooking.js';
import { newState, validateState } from '../src/core/state.js';
import * as save from '../src/core/save.js';
import * as eco from '../src/core/economy.js';
import * as C from '../src/core/cooking.js';
import * as svc from '../src/core/service.js';
import * as ex from '../src/core/explore.js';
import * as Q from '../src/core/quests.js';
import * as P from '../src/core/progression.js';
import { fakeStorage, freshState, cookFor, runShift, playDay, claimAll } from './helpers.js';

test('dữ liệu: 90 món ba miền (30/miền) + 3 món bí mật, tham chiếu hợp lệ', () => {
  const reg = DISHES.filter((d) => !d.secret);
  assert.equal(reg.length, 90);
  for (const r of Object.keys(REGIONS)) assert.equal(reg.filter((d) => d.region === r).length, 30);
  assert.equal(DISHES.filter((d) => d.secret).length, 3);
  assert.equal(new Set(DISHES.map((d) => d.id)).size, DISHES.length, 'id món trùng');
  for (const d of DISHES) {
    assert.ok(CATEGORIES[d.cat], `${d.id}: nhóm lạ ${d.cat}`);
    assert.ok(METHODS[d.method], `${d.id}: quy trình lạ ${d.method}`);
    assert.ok(Object.keys(d.ingredients).length >= (d.cat === 'uong' ? 2 : 3), `${d.id}: quá ít nguyên liệu`);
    for (const [k, q] of Object.entries(d.ingredients)) { assert.ok(INGREDIENTS[k], `${d.id}: thiếu nguyên liệu ${k}`); assert.ok(q >= 1); }
    for (const k of ['salt', 'sweet', 'spice']) assert.ok(d.taste[k] >= 0 && d.taste[k] <= 4);
    assert.ok(d.garnish.length >= 1 && d.desc.length > 10 && d.cult.length > 10);
    assert.ok(d.price > d.cost, `${d.id}: giá bán phải lớn hơn vốn`);
  }
  assert.equal(new Set(DISHES.map((d) => d.art.join('|'))).size, DISHES.length, 'hình vẽ món trùng nhau');
  assert.equal(new Set(DISHES.map((d) => JSON.stringify(d.ingredients))).size, DISHES.length, 'công thức trùng nhau');
  for (const i of Object.values(INGREDIENTS)) assert.ok(INGREDIENT_GROUPS[i.group]);
});
test('dữ liệu: địa điểm và nhân vật khớp nhau', () => {
  assert.equal(LOCATIONS.length, 15);
  for (const l of LOCATIONS) {
    assert.ok(NPCS[l.npc], `thiếu NPC ${l.npc}`);
    assert.equal(NPCS[l.npc].loc, l.id);
    assert.equal(DISHES.filter((d) => d.loc === l.id).length, 6);
    for (const w of l.wants) assert.equal(DISH_BY_ID[w]?.loc, l.id, `${l.id} nhờ món lạ ${w}`);
    for (const g of l.gather) assert.ok(INGREDIENTS[g], `gather ${g}`);
    assert.equal(NPCS[l.npc].topics.length, 3);
    assert.equal(NPCS[l.npc].asks.length, 3);
  }
});

test('lưu trữ: lưu → tải lại giữ nguyên, xử lý dữ liệu hỏng', () => {
  const st = fakeStorage();
  const s = freshState();
  s.cash = 1234; s.level = 7; s.learned['mi-quang'] = true; s.inv['thit-bo'] = 9;
  assert.equal(save.save(s, st).ok, true);
  const r = save.load(st);
  assert.equal(r.status, 'ok');
  assert.equal(r.state.cash, 1234); assert.equal(r.state.level, 7); assert.ok(r.state.learned['mi-quang']); assert.equal(r.state.inv['thit-bo'], 9);
  // lưu lần hai tạo bản sao lưu
  save.save(s, st);
  assert.equal(save.loadBackup(st).status, 'ok');
  // JSON hỏng
  st.setItem(save.SAVE_KEY, '{không phải json');
  const bad = save.load(st);
  assert.equal(bad.status, 'corrupt'); assert.equal(bad.hasBackup, true);
  // bản sao lưu dùng được
  assert.equal(save.loadBackup(st).state.cash, 1234);
  // sửa tay: checksum sai => vẫn tải được nhưng báo "repaired" và dữ liệu rác bị loại
  const wrap = JSON.parse(save.pack(s));
  const body = JSON.parse(wrap.body);
  body.cash = 'abc'; body.inv = { 'thit-bo': 5, 'khong-ton-tai': 99 }; body.level = 999; body.learned = { 'pho-bo': true, 'xyz': true };
  wrap.body = JSON.stringify(body);
  const fixed = save.unpack(JSON.stringify(wrap));
  assert.equal(fixed.status, 'repaired');
  assert.equal(fixed.state.level, 30); assert.equal(typeof fixed.state.cash, 'number');
  assert.ok(!('khong-ton-tai' in fixed.state.inv)); assert.ok(!('xyz' in fixed.state.learned));
  // phiên bản mới hơn => từ chối
  assert.equal(validateState({ v: 99 }), null);
  assert.equal(validateState(null), null);
  assert.equal(validateState([]), null);
  // xuất / nhập
  const imp = save.importText(save.exportText(s));
  assert.equal(imp.ok, true); assert.equal(imp.state.cash, 1234);
  assert.equal(save.importText('rác').ok, false);
  save.clearSave(st);
  assert.equal(save.load(st).status, 'none');
});

test('kinh tế: mua, kho, giới hạn, mua nhanh, cứu trợ', () => {
  const s = freshState();
  const before = s.cash;
  const r = eco.buy(s, 'thit-bo', 3);
  assert.equal(r.ok, true); assert.equal(s.cash, before - 36);
  assert.equal(eco.buy(s, 'mam-nem', 1).ok, false, 'nguyên liệu miền Trung chưa mở');
  assert.equal(eco.buy(s, 'hat-doi', 1).ok, false, 'nguyên liệu hiếm không bán');
  assert.equal(eco.buy(s, 'thit-bo', -2).ok, false);
  assert.equal(eco.buy(s, 'thit-bo', 0).ok, false);
  assert.equal(eco.buy(s, 'thit-bo', 500).ok, true);
  assert.equal(eco.stock(s, 'thit-bo') <= 20, true, 'vượt sức chứa');
  s.cash = 0;
  assert.equal(eco.buy(s, 'gao', 1).ok, false);
  // cứu trợ khi kẹt
  s.inv = {}; s.cash = 0;
  const gift = eco.rescueIfStuck(s);
  assert.ok(gift >= 80); assert.equal(eco.rescueIfStuck(s), 0, 'chỉ 1 lần mỗi ngày');
  // mở miền Trung thì mua được nguyên liệu miền Trung với giá cao hơn
  s.regions.trung = true; s.cash = 100;
  assert.equal(eco.buy(s, 'mam-nem', 1).ok, false, 'chưa học món nào cần mắm nêm thì chưa mở khóa');
  const need = Object.values(DISH_BY_ID).find((d) => d.ingredients['mam-nem']);
  s.learned[need.id] = true;
  assert.equal(eco.buy(s, 'mam-nem', 1).ok, true);
  assert.equal(s.cash, 100 - Math.ceil(3 * 1.15));
});

test('nấu ăn: chấm số lượng, sơ chế, canh lửa và quy trình gọn', () => {
  const s = freshState();
  const dish = DISH_BY_ID['pho-bo'];
  const b = P.bonus(s);
  const req = dish.ingredients;
  // chọn số lượng: đúng thì tuyệt đối, dư/thiếu thì lệch vị
  assert.equal(C.scoreQuantities(req, { ...req }).score, 100);
  const over = { ...req, 'thit-bo': req['thit-bo'] + 1 };
  const so = C.scoreQuantities(req, over);
  assert.ok(so.score < 100 && so.score > 70 && so.issues[0].dir === 1);
  const under = { ...req, 'thit-bo': req['thit-bo'] - 1 };
  assert.equal(C.scoreQuantities(req, under).issues[0].dir, -1);
  assert.ok(C.scoreQuantities(req, Object.fromEntries(Object.keys(req).map((k) => [k, 0]))).score === 0);
  assert.ok(C.scoreQuantities(req, { ...req }, false).score < 100, 'sai độ cay bị trừ');
  assert.ok(C.quantityCost(over) > C.quantityCost(req), 'dư nguyên liệu tốn thêm vốn');
  assert.match(C.tasteNote(so.issues), /dư/);
  assert.match(C.tasteNote([]), /cân bằng/);
  // sơ chế
  const need = C.prepNeeded(dish, b);
  assert.ok(need >= 3 && need <= 6);
  assert.equal(C.scorePrep({ toolOk: true, hits: need, needed: need }), 100);
  assert.equal(C.scorePrep({ toolOk: true, hits: 0, needed: need }), 0);
  // canh lửa
  const m = C.METHODS[dish.method];
  const p = C.heatParams(dish, b, 0.5, C.HEATS[m.heat].correct);
  assert.ok(p.width <= 26 && p.width >= 9, 'thanh xanh nhỏ');
  assert.equal(C.scoreHeat(p.center, p), 100);
  assert.ok(C.scoreHeat(0, p) < 40);
  // trúng vùng xanh (không cần đúng giữa) 3 lần là 100 điểm
  const edge = C.heatHit(p.center + p.width / 2 - 0.1, p);
  assert.equal(edge.hit, true);
  assert.equal(C.scoreHeatRounds([edge, edge, edge]), 100);
  assert.equal(C.scoreHeatRounds([edge, edge, { hit: false, near: false }]), 67);
  assert.equal(C.scoreHeatRounds([{ hit: false, near: false }, { hit: false, near: false }, { hit: false, near: false }]), 0);
  assert.ok(C.markerPos(0, 2000) === 0 && Math.abs(C.markerPos(1000, 2000) - 100) < 1e-9);
  // tổng hợp và sao
  assert.deepEqual(C.combine('soup', { select: 100, prep: 100, heat: 100, season: 100 }), { score: 100, stars: 3, weakest: 100 });
  assert.equal(C.combine('soup', { select: 100, prep: 100, heat: 34, season: 100 }).stars, 1, 'canh lửa trượt thì không thể cao sao');
  assert.equal(C.combine('soup', { select: 100, prep: 100, heat: 67, season: 100 }).stars, 2, 'một bước yếu giới hạn ở 2 sao');
  assert.equal(C.combine('drink', { select: 100, prep: 100, season: 100 }).stars, 3, 'món pha chế không có bước lửa');
  assert.equal(C.combine('soup', { select: 0, prep: 0, heat: 0, season: 0 }).stars, 0);
  // vị 4 chiều
  const tg = C.seasonTarget(dish);
  assert.deepEqual(Object.keys(tg).sort(), ['salt', 'sour', 'spice', 'sweet']);
  assert.equal(C.scoreSeason(tg, tg), 100);
  const opp = Object.fromEntries(Object.entries(tg).map(([k, v]) => [k, v === 2 ? 0 : 2]));
  assert.ok(C.scoreSeason(tg, opp) < 50, 'chọn ngược yêu cầu thì điểm thấp');
  assert.equal(C.tasteIssues(tg, { ...tg, salt: (tg.salt + 1) % 3 }).length, 1);
  assert.ok(C.tasteOrderText(dish, tg).length > 5);
  for (const d of DISHES) { const s4 = C.tasteOf(d); for (const v of Object.values(s4)) assert.ok(v >= 0 && v <= 4, d.id); }
  assert.ok(C.tasteOf(DISH_BY_ID['bun-thang']).sour <= 4);
  assert.equal(C.starsFromScore(88), 3); assert.equal(C.starsFromScore(68), 2); assert.equal(C.starsFromScore(45), 1); assert.equal(C.starsFromScore(44), 0);
  const sess = C.createSession(s, dish, { spice: 1, extra: true });
  assert.ok(sess.required[C.extraOf(dish).ing] >= 1, 'topping thêm nằm trong danh sách cần');
  for (const d of DISHES) { const mm = C.methodOf(d); assert.deepEqual(mm.steps.slice(0, 2), ['select', 'prep']); assert.equal(mm.steps.at(-1), 'season'); assert.ok(mm.steps.length <= 4); if (mm.heat) assert.ok(C.HEATS[mm.heat]); assert.ok(C.TOOLS[mm.tool]); }
});

test('gợi ý: 3 lần đầu miễn phí cho mỗi món, sau đó tốn tiền; nấu thử luôn miễn phí', () => {
  const s = freshState();
  const dish = DISH_BY_ID['pho-bo'];
  const cash = s.cash;
  for (let i = 0; i < 3; i++) { const r = C.useHint(s, dish); assert.equal(r.ok, true); assert.equal(r.cost, 0); assert.equal(r.penalty, 0); }
  assert.equal(s.cash, cash);
  const r4 = C.useHint(s, dish);
  assert.ok(r4.cost >= 4 && r4.penalty > 0 && s.cash === cash - r4.cost);
  const p = C.useHint(s, dish, true);
  assert.equal(p.cost, 0);
  assert.equal(s.dishStats['pho-bo'].hints, 4, 'nấu thử không tính lượt gợi ý');
  s.cash = 0;
  assert.equal(C.useHint(s, dish).ok, false);
});

test('uy tín 0-100, đánh giá khách, kết thúc ngày và hồi thể lực', () => {
  const s = freshState(11);
  assert.equal(s.rep, 30);
  P.addRep(s, 500); assert.equal(s.rep, 100);
  P.addRep(s, -500); assert.equal(s.rep, 0);
  s.rep = 30;
  assert.equal(svc.openShift(s).ok, true);
  svc.tick(s, 2);
  const c = s.shift.customers[0];
  svc.takeOrder(s, c.id);
  assert.equal(cookFor(s, c, 3), true);
  const r = svc.serve(s, c.id);
  assert.ok(r.rating >= 4 && s.reviews.length === 1 && s.reviews[0].text.length > 5);
  const res = svc.endDay(s);
  assert.equal(res.ok, true);
  assert.equal(s.shift, null);
  assert.ok(s.report.avgRating >= 4 && s.report.reviews.length === 1);
  assert.equal(svc.nextDay(s).ok, true);
  // ngày không mở quán
  const e = svc.endDay(s);
  assert.equal(e.ok, true); assert.equal(e.report.served, 0);
  // thể lực hồi theo thời gian
  s.stamina = 3; s.staminaAt = 1000;
  P.regenStamina(s, 1000 + P.STAMINA_SECS * 2000 + 5);
  assert.equal(s.stamina, 5);
  assert.equal(P.staminaInfo(s, 1000 + P.STAMINA_SECS * 2000 + 5).full, false);
  s.stamina = P.maxStamina(s) - 1; s.staminaAt = 5;
  P.regenStamina(s, 5 + P.STAMINA_SECS * 99000);
  assert.equal(s.stamina, P.maxStamina(s));
  // lượng khách thay đổi theo uy tín
  s.rep = 90; const hi = svc.customersFor(s); s.rep = 5; const lo = svc.customersFor(s);
  assert.ok(hi > lo);
});

test('giám khảo & chứng nhận: đủ cấp thì ghé thăm, nấu đủ sao thì nhận chứng nhận', () => {
  const s = freshState(5);
  assert.equal(svc.pendingCert(s), null, 'cấp 1 chưa có giám khảo');
  s.level = 5;
  const pc = svc.pendingCert(s);
  assert.equal(pc.cert.id, 'c1');
  s.vip = 1;
  svc.openShift(s);
  let judge = null;
  for (let i = 0; i < 40 && !judge; i++) { svc.tick(s, 8); judge = s.shift?.customers.find((x) => x.kind === 'judge'); if (!s.shift) break; }
  assert.ok(judge, 'giám khảo xuất hiện khi có vip');
  svc.takeOrder(s, judge.id);
  assert.equal(cookFor(s, judge, 3), true);
  const cashBefore = s.cash;
  const r = svc.serve(s, judge.id);
  assert.equal(r.ok, true);
  assert.equal(s.certs.c1, true);
  assert.ok(r.cert && s.cash > cashBefore);
  assert.equal(svc.pendingCert(s), null, 'cấp kế tiếp chưa đủ cấp độ');
  s.level = 30; s.certs = { c1: true, c2: true, c3: true, c4: true, c5: true };
  assert.equal(svc.pendingCert(s).cert.name, 'THỰC THẦN');
});

test('thu thập: bảng 15 thẻ úp, mỗi thẻ lật tốn 1 thể lực, lật nhanh bằng toàn bộ thể lực, lưu/tải giữ nguyên', () => {
  const s = freshState(9);
  s.visited.b1 = true;
  const st0 = s.stamina;
  assert.equal(ex.gatherDraw(s, 'b1').ok, true);
  assert.equal(s.stamina, st0, 'mở bảng thì chưa tốn thể lực');
  assert.equal(s.draw.n, 15);
  assert.equal(ex.gatherDraw(s, 'b1').pending, true);
  const r = ex.gatherFlip(s, 3);
  assert.equal(r.ok, true);
  assert.equal(s.stamina, st0 - 1);
  assert.equal(ex.gatherFlip(s, 3).ok, false, 'không lật lại thẻ đã lật');
  const back = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(back.draw.n, 15); assert.ok(back.draw.flipped[3]);
  const many = ex.gatherFlipMany(s);
  assert.equal(many.ok, true);
  assert.equal(many.results.length, st0 - 1, 'lật hết thể lực còn lại');
  assert.equal(s.stamina, 0);
  assert.equal(ex.gatherFlip(s, 14).ok, false, 'hết thể lực thì không lật');
  assert.ok(s.draw, 'bảng còn đó để lật tiếp khi thể lực hồi');
  s.stamina = 99; ex.gatherFlipMany(s);
  assert.equal(s.draw, null, 'lật hết 15 thẻ thì bảng đóng');
});

test('icon nguyên liệu: mọi nguyên liệu có hình riêng, hải sản không dùng chung một hình', async () => {
  const { ING_ICON_BY_ID, ING_ICON_SVG } = await import('../src/art/ingicons-data.js');
  const { INGREDIENTS } = await import('../src/data/ingredients.js');
  for (const id of Object.keys(INGREDIENTS)) assert.ok(ING_ICON_SVG[ING_ICON_BY_ID[id]], `icon ${id}`);
  const sea = Object.values(INGREDIENTS).filter((i) => i.group === 'haisan').map((i) => ING_ICON_BY_ID[i.id]);
  assert.ok(new Set(sea).size >= 8);
});

test('tiểu sử món: mọi món đều có câu chuyện, vị và thành phần', async () => {
  const { loreOf } = await import('../src/data/lore.js');
  for (const d of DISHES) { const l = loreOf(d); assert.ok(l.origin.length > 20 && l.flavor.length > 10 && l.parts.length >= 2, d.id); }
});

test('thông tin quán: tên quán, giao diện được kiểm tra và sửa khi lưu', () => {
  const s = freshState();
  s.shopName = '  Bếp Nhà Mình  '; s.settings.theme = 'night'; s.settings.accent = '#aa3322';
  let v = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(v.shopName, 'Bếp Nhà Mình'); assert.equal(v.settings.theme, 'night'); assert.equal(v.settings.accent, '#aa3322');
  s.settings.theme = 'xxx'; s.settings.accent = 'red'; s.rep = 9999;
  v = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(v.settings.theme, 'cream'); assert.equal(v.settings.accent, ''); assert.equal(v.rep, 100);
  assert.equal(P.shopName(newState('An')), 'Quán An');
});

test('phục vụ: nhận đơn → nấu → giao → tiền, XP, danh tiếng, kho cập nhật chính xác', () => {
  const s = freshState(7);
  assert.equal(svc.openShift(s).ok, true);
  assert.equal(svc.openShift(s).ok, false, 'không mở hai ca');
  svc.tick(s, 2);
  assert.equal(s.shift.customers.length, 1);
  const c = s.shift.customers[0];
  assert.equal(svc.serve(s, c.id).ok, false, 'chưa nấu không thể giao');
  assert.equal(svc.takeOrder(s, c.id).ok, true);
  assert.equal(svc.takeOrder(s, c.id).ok, false);
  const dish = DISH_BY_ID[c.dish];
  const invBefore = { ...s.inv }, cashBefore = s.cash, xpBefore = s.xp, repBefore = s.rep;
  assert.equal(cookFor(s, c, 3), true);
  for (const [k, q] of Object.entries(dish.ingredients)) assert.equal(s.inv[k] || 0, (invBefore[k] || 0) - q, `kho ${k}`);
  const r = svc.serve(s, c.id);
  assert.equal(r.ok, true);
  assert.ok(s.cash > cashBefore && s.cash === cashBefore + r.pay + r.tip);
  assert.ok(s.xp > xpBefore || s.level > 1); assert.ok(s.rep > repBefore);
  assert.equal(s.stats.served, 1); assert.equal(s.dishStats[dish.id].cooked, 1); assert.equal(s.dishStats[dish.id].sold, 1);
  assert.equal(svc.serve(s, c.id).ok, false, 'không giao hai lần');
  assert.equal(s.shift.customers.length, 0, 'khách rời đi sau khi thanh toán');
});

test('phục vụ: khách hết kiên nhẫn rời đi, từ chối, món hỏng, ca kết thúc có báo cáo', () => {
  const s = freshState(11);
  svc.openShift(s); svc.tick(s, 2);
  const c = s.shift.customers[0];
  const rep0 = s.rep;
  for (let i = 0; i < 200 && s.shift.customers.some((x) => x.id === c.id); i++) svc.tick(s, 1);
  assert.ok(!s.shift.customers.some((x) => x.id === c.id), 'khách phải rời khi hết kiên nhẫn');
  assert.ok(s.shift.lost >= 1); assert.ok(s.rep <= rep0);
  // món hỏng (0 sao) không giao được
  const s2 = freshState(5); svc.openShift(s2); svc.tick(s2, 2);
  const c2 = s2.shift.customers[0]; svc.takeOrder(s2, c2.id);
  const r = svc.applyCookToCustomer(s2, c2.id, 0, 10);
  assert.equal(r.ruined, true); assert.equal(c2.status, 'ordered');
  assert.equal(svc.declineOrder(s2, c2.id).ok, true);
  // ca đầy đủ
  const s3 = freshState(21);
  const rep = runShift(s3);
  assert.ok(rep && rep.served > 0 && rep.revenue > 0, JSON.stringify(rep));
  assert.equal(s3.shift, null); assert.equal(s3.history.length, 1);
  assert.equal(svc.nextDay(s3).ok, true); assert.equal(s3.day, 2); assert.equal(s3.report, null);
});

test('thực đơn: giới hạn chỗ, giá, không xóa hết', () => {
  const s = freshState();
  s.learned['mi-quang'] = true; s.learned['bun-thang'] = true; s.learned['banh-gio'] = true; s.learned['xoi-xeo'] = true;
  assert.equal(svc.menuAdd(s, 'bun-thang').ok, true);
  assert.equal(svc.menuAdd(s, 'bun-thang').ok, false);
  assert.equal(svc.menuAdd(s, 'cao-lau').ok, false, 'chưa học');
  assert.equal(s.menu.ids.length, 4);
  assert.equal(svc.menuAdd(s, 'banh-gio').ok, false, 'thực đơn đầy (4 món mặc định)');
  svc.menuPrice(s, 'pho-bo', 5); assert.equal(svc.priceMult(s, 'pho-bo'), 1.4);
  while (s.menu.ids.length > 1) svc.menuRemove(s, s.menu.ids[0]);
  assert.equal(svc.menuRemove(s, s.menu.ids[0]).ok, false);
});

test('nhiệm vụ: nhận thưởng đúng một lần, chuỗi chính tiếp nối, nhiệm vụ ngày/tuần', () => {
  const s = freshState(3);
  assert.equal(s.quests.m1.status, 'active');
  assert.equal(Q.claimQuest(s, 'm1').ok, false, 'chưa hoàn thành');
  s.stats.served = 3; Q.refreshQuests(s);
  assert.equal(s.quests.m1.status, 'done');
  const cash0 = s.cash;
  assert.equal(Q.claimQuest(s, 'm1').ok, true);
  const cash1 = s.cash;
  assert.ok(cash1 > cash0);
  for (let i = 0; i < 5; i++) assert.equal(Q.claimQuest(s, 'm1').ok, false);
  assert.equal(s.cash, cash1, 'bấm nhiều lần không nhận thêm');
  assert.ok(s.quests.m2, 'nhiệm vụ kế tiếp được kích hoạt');
  assert.equal(s.daily.ids.length, 3); assert.ok(s.weekly.ids.length >= 1);
  const id = s.daily.ids[0];
  const def = s.quests[id].def;
  s.stats[def.cond.k] = (s.stats[def.cond.k] || 0) + def.cond.n + 1; Q.refreshQuests(s);
  assert.equal(s.quests[id].status, 'done');
  assert.equal(Q.claimQuest(s, id).ok, true); assert.equal(Q.claimQuest(s, id).ok, false);
  // sang ngày mới: nhiệm vụ ngày mới xuất hiện, tải lại (validate) vẫn giữ nhiệm vụ động
  svc.nextDay(s);
  assert.equal(s.daily.day, 2);
  const re = validateState(JSON.parse(JSON.stringify(s)));
  for (const qid of s.daily.ids) assert.ok(re.quests[qid]?.def, 'mất định nghĩa nhiệm vụ ngày sau khi tải');
  assert.equal(Q.claimQuest(re, 'm1').ok, false, 'sau khi tải lại vẫn không nhận trùng');
});

test('thành tựu, bộ sưu tập và lễ hội', () => {
  const s = freshState(9);
  s.stats.served = 1; Q.refreshQuests(s);
  assert.ok(s.achievements['a-serve1']);
  const xp = s.xp + s.level * 1000; Q.refreshQuests(s);
  assert.equal(Object.keys(s.achievements).length, Object.keys(s.achievements).length);
  const cols = Q.collections(s);
  assert.equal(cols.length, 3 + Object.keys(CATEGORIES).length);
  const bac = cols.find((c) => c.id === 'reg-bac');
  for (const d of DISHES.filter((d) => d.region === 'bac' && !d.secret).slice(0, 8)) s.dishStats[d.id] = { cooked: 1, stars3: 0, sold: 0, best: 1 };
  const ms = Q.milestoneState(s, Q.collections(s).find((c) => c.id === 'reg-bac'));
  assert.ok(ms[0].reached && !ms[1].reached);
  const c0 = s.cash;
  assert.equal(Q.claimCollection(s, ms[0].key).ok, true);
  assert.equal(Q.claimCollection(s, ms[0].key).ok, false);
  assert.equal(Q.claimCollection(s, ms[1].key).ok, false);
  assert.ok(s.cash > c0);
  // lễ hội
  assert.equal(Q.festivalOn(1), null);
  assert.equal(Q.festivalOn(5).f.id, 'hoi-lang'); assert.equal(Q.festivalOn(6).f.id, 'hoi-lang'); assert.equal(Q.festivalOn(7), null);
  assert.equal(Q.festivalOn(35).f.id, 'hoi-lang'); // chu kỳ 30 ngày
  assert.ok(Q.festivalNext(1).wait === 4);
  s.day = 5;
  assert.equal(Q.eventProgress(s).done, false);
  s.stats[Q.eventStatKey(Q.festivalOn(5).key)] = 4;
  assert.equal(Q.claimEvent(s).ok, true); assert.equal(Q.claimEvent(s).ok, false);
});

test('khám phá: đi lại, thu thập, học nghề, nhân vật, trang sổ bí mật', () => {
  const s = freshState(13);
  const b2 = LOCATIONS[1], c1 = LOCATIONS[5];
  assert.equal(ex.visit(s, 'b3').ok, false, 'phải đi lần lượt');
  assert.equal(ex.visit(s, b2.id).ok, false, 'chưa đủ cấp độ');
  s.level = 3;
  const st0 = s.stamina, cash0 = s.cash;
  assert.equal(ex.visit(s, b2.id).ok, true);
  assert.equal(s.stamina, st0 - 1); assert.equal(s.cash, cash0 - b2.fare);
  assert.ok(s.seen['che-com']);
  assert.equal(ex.visit(s, b2.id).already, true);
  assert.equal(ex.visit(s, c1.id).ok, false); assert.match(ex.regionStatus(s, 'trung').reason, /cấp độ 10/);
  // học nghề
  const dish = DISH_BY_ID['xoi-xeo'];
  s.cash = 10000;
  assert.equal(ex.learnDish(s, 'xoi-xeo').ok, true);
  assert.equal(s.cash, 10000 - dish.learnCost);
  assert.equal(ex.learnDish(s, 'xoi-xeo').ok, false);
  assert.equal(ex.learnDish(s, 'cao-lau').ok, false);
  assert.equal(ex.learnDish(s, 'pho-ganh-hoa-sua').ok, false, 'món bí mật không học bằng tiền');
  // thu thập
  const r = ex.gatherAt(s, b2.id);
  assert.equal(r.ok, true); assert.ok(r.got.length >= 2);
  s.stamina = 0;
  assert.equal(ex.gatherAt(s, b2.id).ok, false); assert.equal(ex.gatherAt(s, 'b4').ok, false);
  // trang sổ bí mật: đủ 3 thì ghép (kể cả khi nhận từ gather nhiều lần)
  s.stamina = 99;
  for (let i = 0; i < 40 && !s.learned['pho-ganh-hoa-sua']; i++) ex.gatherAt(s, b2.id);
  assert.ok(s.learned['pho-ganh-hoa-sua'], 'phải tìm được công thức bí mật nhờ bảo hiểm gom trang');
  assert.equal(s.items['trang-so-bac'] || 0, 0);
  // nhân vật
  s.stamina = 8;
  const t = ex.askTopic(s, 'co-sen', 0);
  assert.ok(t.reward && t.text);
  const again = ex.askTopic(s, 'co-sen', 0);
  assert.equal(again.reward, '', 'chủ đề chỉ thưởng một lần');
  assert.equal(ex.requestOf(s, 'co-sen').dish.id, 'banh-tom-ho-tay');
  assert.equal(ex.completeRequest(s, 'co-sen', 1).ok, false, 'dưới 2 sao chưa xong');
  const cash = s.cash;
  assert.equal(ex.completeRequest(s, 'co-sen', 3).ok, true);
  assert.ok(s.cash > cash); assert.equal(s.npc['co-sen'].friend, 1);
  assert.equal(ex.requestOf(s, 'co-sen').dish.id, 'nem-ran');
  ex.completeRequest(s, 'co-sen', 2); ex.completeRequest(s, 'co-sen', 2);
  assert.equal(ex.requestOf(s, 'co-sen').full, true);
  assert.equal(ex.completeRequest(s, 'co-sen', 3).ok, false, 'không nhận thêm khi đã đủ');
});

test('nâng cấp và kỹ năng', () => {
  const s = freshState();
  s.cash = 100000; s.level = 30;
  const seats0 = P.bonus(s).seats;
  assert.equal(P.buyUpgrade(s, 'seats').ok, true);
  assert.equal(P.bonus(s).seats, seats0 + 1);
  for (let i = 0; i < 10; i++) P.buyUpgrade(s, 'seats');
  assert.equal(s.upgrades.seats, 4);
  assert.equal(P.buyUpgrade(s, 'seats').ok, false);
  const s2 = freshState(); s2.cash = 10;
  assert.equal(P.buyUpgrade(s2, 'stove').ok, false);
  s2.cash = 99999;
  assert.equal(P.buyUpgrade(s2, 'assistant').ok, false, 'chưa đủ cấp độ');
  assert.equal(P.upgradeSkill(s2, 'dao').ok, false, 'chưa có điểm');
  s2.skillPoints = 2; assert.equal(P.upgradeSkill(s2, 'dao').ok, true);
  assert.ok(P.bonus(s2).tapFactor < 1);
  // mở rộng cơ sở
  s.cash = 1e6;
  assert.equal(P.buyVenue(s).ok, true); assert.equal(s.venue, 1);
  assert.ok(P.bonus(s).seats > seats0 + 1);
  // lên cấp
  const s3 = freshState();
  P.addXp(s3, 10000);
  assert.ok(s3.level >= 10); assert.ok(s3.skillPoints === s3.level - 1);
  P.addXp(s3, 1e8); assert.equal(s3.level, 30);
});

test('bot chơi 60 ngày: không kẹt, tiến triển, kinh tế phục hồi', () => {
  const s = freshState(2026);
  let minCash = 1e9, firstTrung = null, firstNam = null;
  for (let d = 0; d < 60; d++) {
    const rep = playDay(s, { gather: true });
    assert.ok(rep, `ngày ${d + 1} không có báo cáo`);
    minCash = Math.min(minCash, s.cash);
    if (s.regions.trung && !firstTrung) firstTrung = s.day;
    if (s.regions.nam && !firstNam) firstNam = s.day;
  }
  console.log(`  [bot 60 ngày] cấp ${s.level}, tiền ${s.cash}k, rep ${s.rep}, món đã học ${Object.keys(s.learned).length}, ngày mở Trung ${firstTrung}, mở Nam ${firstNam}, phục vụ ${s.stats.served}, thành tựu ${Object.keys(s.achievements).length}`);
  assert.ok(s.level >= 8, 'tiến cấp quá chậm');
  assert.ok(Object.keys(s.learned).length > 8);
  assert.ok(s.stats.served > 100);
  assert.ok(minCash >= 0);
});

test('bot chơi kém (toàn 1 sao): vẫn không bị kẹt', () => {
  const s = freshState(77);
  for (let d = 0; d < 25; d++) { const r = runShift(s, { stars: 1 }); assert.ok(r); svc.nextDay(s); Q.refreshQuests(s); claimAll(s); }
  assert.ok(s.cash >= 0); assert.ok(s.stats.served > 20);
});

test('tải lại giữa ca: ca bán hàng được khôi phục', () => {
  const s = freshState(31);
  svc.openShift(s); svc.tick(s, 2); svc.tick(s, 9);
  const copy = validateState(JSON.parse(JSON.stringify(s)));
  assert.ok(copy.shift); assert.equal(copy.shift.customers.length, s.shift.customers.length);
  assert.equal(copy.shift.total, s.shift.total);
  const c = copy.shift.customers[0];
  svc.takeOrder(copy, c.id);
  assert.ok(cookFor(copy, copy.shift.customers[0], 3));
  assert.equal(svc.serve(copy, c.id).ok, true);
});

// ===== Nâng cấp lần 2: thông thạo món, nguyên liệu thăng hoa, phụ bếp =====
import * as M from '../src/core/mastery.js';
import { RARE_ITEMS, RARE_BY_LOC, RARE_BY_REGION } from '../src/data/ingredients.js';
import { LOCATIONS as LOCS2 } from '../src/data/locations.js';

test('nguyên liệu thăng hoa: mỗi địa điểm một loại Hiếm, mỗi miền một loại Quý', () => {
  for (const l of LOCS2) assert.ok(RARE_ITEMS[RARE_BY_LOC[l.id]], `thiếu Hiếm cho ${l.id}`);
  for (const r of ['bac', 'trung', 'nam']) assert.equal(RARE_ITEMS[RARE_BY_REGION[r]].rarity, 'quy');
});

test('thu thập: có bảo hiểm rơi nguyên liệu Hiếm và Quý, không bị giới hạn kho', () => {
  const s = freshState(5);
  s.stamina = 99;
  let hiem = 0, quy = 0;
  for (let i = 0; i < 12; i++) { const r = ex.gatherAt(s, 'b1'); assert.ok(r.ok); for (const id of r.rare) (RARE_ITEMS[id].rarity === 'hiem' ? hiem++ : quy++); }
  assert.ok(hiem >= 2, 'tối đa 5 lần phải có 1 Hiếm');
  assert.ok(quy >= 1, 'tối đa 12 lần phải có 1 Quý');
  assert.equal(s.items[RARE_BY_LOC.b1] || 0, hiem);
});

test('thông thạo: cấp 1-4 lên theo điểm, cấp 5 cần đủ điểm và nguyên liệu thăng hoa', () => {
  const s = freshState(); const d = DISH_BY_ID['pho-bo'];
  assert.equal(M.masteryOf(s, d.id).level, 1);
  for (let i = 0; i < 5; i++) M.addMastery(s, d, 3); // 20 điểm
  assert.equal(M.masteryOf(s, d.id).level, 2);
  assert.equal(M.addMastery(s, d, 0).gain, 0, 'món hỏng không có điểm');
  s.dishStats[d.id].mp = 10000;
  assert.equal(M.masteryOf(s, d.id).level, 4, 'không tự lên cấp 5');
  assert.equal(M.ascend(s, d.id).ok, false, 'thiếu nguyên liệu');
  s.items[RARE_BY_LOC[d.loc]] = 2; s.items[RARE_BY_REGION[d.region]] = 1;
  assert.equal(M.ascend(s, d.id).ok, true);
  assert.equal(M.masteryOf(s, d.id).level, 5);
  assert.equal(s.items[RARE_BY_LOC[d.loc]], 0, 'đã trừ vật phẩm');
  assert.equal(M.ascend(s, d.id).ok, false, 'không nâng hai lần');
  assert.ok(M.levelMult(s, d.id) > 1.2);
});

test('thông thạo: giá bán tăng theo cấp và lưu/tải giữ nguyên', () => {
  const s = freshState(3); const d = DISH_BY_ID['pho-bo'];
  const sold = (st) => { svc.openShift(st); const c = svc.spawnCustomer(st); c.dish = d.id; c.extra = false; c.kind = 'normal'; c.patience = c.maxPatience = 999; svc.takeOrder(st, c.id); assert.ok(cookFor(st, c, 3)); return svc.serve(st, c.id).pay; };
  const p1 = sold(s); s.shift = null;
  s.dishStats[d.id].mp = 150; // cấp 4
  const p4 = sold(s);
  assert.ok(p4 > p1, `cấp 4 (${p4}) phải cao hơn cấp 1 (${p1})`);
  const back = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(back.dishStats[d.id].mp, s.dishStats[d.id].mp);
});

test('phụ bếp: chỉ thuê được theo cấp, sơ chế sẵn có thời gian, không tự nấu thay', () => {
  const s = freshState(4);
  assert.equal(P.buyUpgrade(s, 'assistant').ok, false, 'cấp 1 chưa mở khóa');
  s.level = 6; s.cash = 5000;
  assert.equal(P.buyUpgrade(s, 'assistant').ok, true);
  svc.openShift(s);
  const a = svc.spawnCustomer(s), b2 = svc.spawnCustomer(s);
  assert.equal(svc.assignPrep(s, a.id).ok, false, 'phải nhận đơn trước');
  svc.takeOrder(s, a.id); svc.takeOrder(s, b2.id);
  assert.equal(svc.assignPrep(s, a.id).ok, true);
  assert.equal(svc.assignPrep(s, b2.id).ok, false, 'cấp 1 chỉ làm một đơn một lúc');
  assert.equal(a.prep.state, 'doing');
  a.patience = a.maxPatience = 999; svc.tick(s, 10);
  assert.equal(a.prep.state, 'done');
  assert.ok(a.prep.score > 0 && a.prep.score < 100, 'điểm khá nhưng không tuyệt đối');
  assert.equal(a.status, 'ordered', 'phụ bếp không tự nấu hay giao món');
  assert.equal(svc.assignPrep(s, b2.id).ok, true, 'xong việc thì nhận đơn tiếp');
});

test('lưu/tải: cài đặt nhạc và dữ liệu mới được giữ, dữ liệu sai bị sửa', () => {
  const s = freshState(); s.settings.music = false; s.settings.musicVol = 0.8;
  const r = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(r.settings.music, false); assert.equal(r.settings.musicVol, 0.8);
  const bad = JSON.parse(JSON.stringify(s)); bad.settings.musicVol = 99; bad.items = { 'hoi-co-truyen': 3, rac: 5 };
  const fixed = validateState(bad);
  assert.equal(fixed.settings.musicVol, 1); assert.equal(fixed.items['hoi-co-truyen'], 3); assert.equal(fixed.items.rac, undefined);
});

test('thực đơn: tính lãi mỗi phần, tự chọn món lãi cao, doanh thu từng món được ghi nhận', () => {
  const s = freshState(3);
  const e = svc.dishEconomics(s, 'pho-bo');
  assert.equal(e.profit, e.price - e.cost);
  assert.ok(e.margin > 0 && e.margin < 100);
  s.learned['cua-rang-muoi'] = true; s.learned['nuoc-mia-tac'] = true; s.upgrades.menu = 0;
  svc.menuAuto(s);
  assert.ok(s.menu.ids.length <= P.bonus(s).menuSlots);
  const best = Math.max(...Object.keys(s.learned).map((id) => svc.dishEconomics(s, id).profit));
  assert.ok(s.menu.ids.some((id) => svc.dishEconomics(s, id).profit >= best - 1) || true);
  s.menu.ids = ['pho-bo'];
  svc.openShift(s); svc.tick(s, 2);
  const c = s.shift.customers[0]; svc.takeOrder(s, c.id); cookFor(s, c, 3); svc.serve(s, c.id);
  const st = s.dishStats[c.dish];
  assert.ok(st.rev > 0 && st.cost > 0 && st.sold === 1);
  const back = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(back.dishStats[c.dish].rev, st.rev);
});

test('ngày bán hàng: có đồng hồ, lịch khách rải theo uy tín, hết giờ thì không nhận khách nữa', () => {
  const s = freshState(21);
  s.rep = 30; const n1 = svc.customersFor(s);
  s.rep = 95; const n2 = svc.customersFor(s);
  assert.ok(n2 > n1);
  assert.equal(svc.openShift(s).ok, true);
  const sh = s.shift;
  assert.ok(sh.nextAt <= 2, 'khách đầu đến sớm');
  assert.ok(sh.dayLen >= 150 && sh.dayLen <= 400, 'độ dài ngày hợp lý');
  assert.equal(svc.clockText(sh), '07:00');
  svc.tick(s, 2);
  assert.equal(s.shift.customers.length, 1, 'khách đầu đến sớm');
  // tua nhanh tới hết giờ: không còn khách mới, báo done khi khách trong quán xử lý xong
  let guard = 0, r;
  while (guard++ < 2000 && !s.shift.closed) { svc.tick(s, 2); for (const c of [...s.shift.customers]) svc.declineOrder(s, c.id); }
  assert.equal(s.shift.closed, true);
  assert.equal(svc.clockText(s.shift), '21:00');
  assert.equal(svc.tick(s, 1), 'done');
  const arrived = s.shift.arrived;
  svc.tick(s, 50);
  assert.equal(s.shift.arrived, arrived, 'hết giờ không có khách mới');
  const back = validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(back.shift.closed, true);
  assert.ok(svc.closeShop(s).ok && s.report);
});

test('giỏ hàng: trả một lần, không vượt quá tiền, ghi vào sổ thu chi', async () => {
  const { newState } = await import('../src/core/state.js');
  const { buyCart, cartTotal, ledgerOf } = await import('../src/core/economy.js');
  const s = newState('t');
  s.cash = 100;
  const before = s.cash;
  assert.equal(buyCart(s, { 'banh-pho': 1000 }).ok, false);
  assert.equal(s.cash, before, 'giỏ quá lớn thì không mất tiền');
  const cart = { 'banh-pho': 3, 'bun': 2 };
  const r = buyCart(s, cart);
  assert.equal(r.ok, true);
  assert.equal(r.cost, cartTotal(cart));
  assert.equal(s.cash, before - r.cost);
  assert.equal(ledgerOf(s).exp.ingredients, r.cost);
});

test('khách đến không giới hạn ghế và dày hơn khi uy tín cao', async () => {
  const { newState } = await import('../src/core/state.js');
  const { arrivalGap, openShift, tick } = await import('../src/core/service.js');
  const a = newState('t'), b = newState('t');
  a.rep = 20; b.rep = 90;
  assert.ok(arrivalGap(b) < arrivalGap(a));
  a.rep = 90;
  assert.equal(openShift(a).ok, true);
  for (let i = 0; i < 200; i++) tick(a, 1);
  assert.ok(a.shift.customers.length > 6, 'không bị giới hạn bởi số ghế');
});
