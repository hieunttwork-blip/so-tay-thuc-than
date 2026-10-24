// Nhiệm vụ chính, mẫu nhiệm vụ ngày/tuần, thành tựu và lễ hội. Thêm nội dung = thêm dòng dữ liệu.
import { vnd } from "../core/fmt.js";
// cond: { k: 'khóa-thống-kê', n } đếm từ lúc nhận nhiệm vụ; hoặc { v: 'giá-trị', n } so sánh giá trị hiện tại (xem core/quests.js valueOf).
// reward: { money, xp, rep, items: { nguyên-liệu: số-lượng } }

export const MAIN_QUESTS = [
  { id: 'm1', title: 'Mở cửa đón khách', desc: 'Phục vụ 3 thực khách đầu tiên trong quán nhỏ của bạn.', cond: { k: 'served', n: 3 }, reward: { money: 80, xp: 30 } },
  { id: 'm2', title: 'Nhập hàng ở chợ', desc: 'Mua tổng cộng 10 SL nguyên liệu ở tab Chợ trong màn hình Kho.', cond: { k: 'bought', n: 10 }, reward: { money: 60, xp: 25, items: { 'nuoc-dung': 3 } } },
  { id: 'm3', title: 'Học nghề đầu tiên', desc: 'Học một công thức mới ở một địa điểm trên bản đồ (bạn đang ở Phố cổ Hà Nội).', cond: { k: 'learned', n: 1 }, reward: { money: 100, xp: 40 } },
  { id: 'm4', title: 'Chuyến đi đầu tiên', desc: 'Đến Hồ Tây & làng Cốm trên bản đồ khám phá.', cond: { v: 'visitedCount', n: 2 }, reward: { money: 100, xp: 50 } },
  { id: 'm5', title: 'Nụ cười ba sao', desc: 'Nấu thành công một món đạt 3 sao.', cond: { k: 'stars3', n: 1 }, reward: { money: 120, xp: 60 } },
  { id: 'm6', title: 'Quán có tiếng', desc: 'Đạt 40 điểm uy tín (thang 100).', cond: { v: 'rep', n: 40 }, reward: { money: 200, xp: 70 } },
  { id: 'm7', title: 'Cuốn sổ đầu tiên', desc: 'Học tổng cộng 8 công thức trong Sổ tay.', cond: { v: 'learnedCount', n: 8 }, reward: { money: 250, xp: 120 } },
  { id: 'm8', title: 'Một người bạn', desc: 'Nấu tặng một món theo lời nhờ của một nhân vật trên bản đồ.', cond: { v: 'friendsDone', n: 1 }, reward: { money: 200, xp: 100, items: { 'hat-doi': 2 } } },
  { id: 'm9', title: 'Trọn vẹn miền Bắc', desc: 'Ghé thăm đủ 5 địa điểm ở miền Bắc.', cond: { v: 'visitedBac', n: 5 }, reward: { money: 400, xp: 200, rep: 4 } },
  { id: 'm10', title: 'Chuyến tàu vào Trung', desc: 'Đạt cấp độ 10. Nhận thưởng để mở khóa Miền Trung.', cond: { v: 'level', n: 10 }, reward: { money: 500, xp: 150, rep: 4 }, unlocks: 'trung' },
  { id: 'm11', title: 'Hương vị cố đô', desc: 'Đến Cố đô Huế và gặp người dân nơi đây.', cond: { v: 'visitedTrung', n: 1 }, reward: { money: 300, xp: 200 } },
  { id: 'm12', title: 'Bốn tay nghề Trung', desc: 'Học 6 công thức của Miền Trung.', cond: { v: 'learnedTrung', n: 6 }, reward: { money: 500, xp: 250 } },
  { id: 'm13', title: 'Đôi tay ba sao', desc: 'Nấu được tổng cộng 30 món 3 sao.', cond: { k: 'stars3', n: 30 }, reward: { money: 800, xp: 400, rep: 5 } },
  { id: 'm14', title: 'Trọn vẹn miền Trung', desc: 'Ghé thăm đủ 5 địa điểm ở Miền Trung.', cond: { v: 'visitedTrung', n: 5 }, reward: { money: 1000, xp: 500, rep: 6 } },
  { id: 'm15', title: 'Chuyến xe xuôi Nam', desc: 'Đạt cấp độ 19. Nhận thưởng để mở khóa Miền Nam.', cond: { v: 'level', n: 19 }, reward: { money: 1500, xp: 600, rep: 6 }, unlocks: 'nam' },
  { id: 'm16', title: 'Nếm vị phương Nam', desc: 'Học 6 công thức của Miền Nam.', cond: { v: 'learnedNam', n: 6 }, reward: { money: 2000, xp: 700 } },
  { id: 'm17', title: 'Trọn vẹn miền Nam', desc: 'Ghé thăm đủ 5 địa điểm ở Miền Nam.', cond: { v: 'visitedNam', n: 5 }, reward: { money: 2500, xp: 900, rep: 8 } },
  { id: 'm18', title: 'Thực Thần', desc: 'Học đủ 90 công thức của ba miền.', cond: { v: 'learnedRegular', n: 90 }, reward: { money: 6000, xp: 2000, rep: 10 } },
];

// Mẫu nhiệm vụ ngày: reward/n được tính theo cấp độ khi tạo.
export const DAILY_TEMPLATES = [
  { id: 'serve', title: (n) => `Phục vụ ${n} thực khách`, cond: (lv) => ({ k: 'served', n: 3 + Math.floor(lv / 6) }), weight: 3 },
  { id: 'earn', title: (n) => `Kiếm ${vnd(n)} doanh thu`, cond: (lv) => ({ k: 'earn', n: 150 + lv * 30 }), weight: 2 },
  { id: 'good', title: (n) => `Nấu ${n} món đạt từ 2 sao`, cond: (lv) => ({ k: 'good', n: 2 + Math.floor(lv / 8) }), weight: 3 },
  { id: 'star3', title: () => 'Nấu 1 món đạt 3 sao', cond: () => ({ k: 'stars3', n: 1 }), weight: 2 },
  { id: 'buy', title: (n) => `Mua ${n} SL nguyên liệu`, cond: () => ({ k: 'bought', n: 8 }), weight: 2 },
  { id: 'gather', title: (n) => `Thu thập nguyên liệu ${n} lần`, cond: () => ({ k: 'gather', n: 2 }), weight: 2 },
];
export const WEEKLY_TEMPLATES = [
  { id: 'wserve', title: (n) => `Phục vụ ${n} thực khách trong tuần`, cond: (lv) => ({ k: 'served', n: 24 + lv }) },
  { id: 'wstar3', title: (n) => `Đạt ${n} món 3 sao trong tuần`, cond: (lv) => ({ k: 'stars3', n: 5 + Math.floor(lv / 5) }) },
  { id: 'wearn', title: (n) => `Kiếm ${vnd(n)} trong tuần`, cond: (lv) => ({ k: 'earn', n: 1400 + lv * 220 }) },
  { id: 'wgather', title: (n) => `Đi thu thập nguyên liệu ${n} lần trong tuần`, cond: () => ({ k: 'gather', n: 8 }) },
];

export const ACHIEVEMENTS = [
  { id: 'a-serve1', name: 'Vị khách đầu tiên', desc: 'Phục vụ thực khách đầu tiên.', icon: 'b-spoon', cond: { k: 'served', n: 1 }, reward: { xp: 10 } },
  { id: 'a-serve50', name: 'Quán đông khách', desc: 'Phục vụ 50 thực khách.', icon: 'b-spoon', cond: { k: 'served', n: 50 }, reward: { xp: 80, money: 100 } },
  { id: 'a-serve250', name: 'Ngàn bữa cơm', desc: 'Phục vụ 250 thực khách.', icon: 'b-spoon', cond: { k: 'served', n: 250 }, reward: { xp: 300, money: 500 } },
  { id: 'a-star3-1', name: 'Tay nghề thấy rõ', desc: 'Nấu được món 3 sao đầu tiên.', icon: 'b-star', cond: { k: 'stars3', n: 1 }, reward: { xp: 20 } },
  { id: 'a-star3-25', name: 'Đầu bếp ba sao', desc: 'Nấu 25 món 3 sao.', icon: 'b-star', cond: { k: 'stars3', n: 25 }, reward: { xp: 150, money: 200 } },
  { id: 'a-star3-100', name: 'Bàn tay vàng', desc: 'Nấu 100 món 3 sao.', icon: 'b-star', cond: { k: 'stars3', n: 100 }, reward: { xp: 500, money: 1000 } },
  { id: 'a-learn10', name: 'Sổ tay dày dần', desc: 'Học 10 công thức.', icon: 'b-book', cond: { v: 'learnedCount', n: 10 }, reward: { xp: 60 } },
  { id: 'a-learn30', name: 'Người sưu tầm', desc: 'Học 30 công thức.', icon: 'b-book', cond: { v: 'learnedCount', n: 30 }, reward: { xp: 200, money: 300 } },
  { id: 'a-learn60', name: 'Từ điển ẩm thực', desc: 'Học 60 công thức.', icon: 'b-book', cond: { v: 'learnedCount', n: 60 }, reward: { xp: 500, money: 800 } },
  { id: 'a-learn90', name: 'Trọn bộ ba miền', desc: 'Học 90 công thức của ba miền.', icon: 'b-book', cond: { v: 'learnedRegular', n: 90 }, reward: { xp: 1500, money: 3000 } },
  { id: 'a-trung', name: 'Vào Trung', desc: 'Mở khóa Miền Trung.', icon: 'b-map', cond: { v: 'regionTrung', n: 1 }, reward: { xp: 100 } },
  { id: 'a-nam', name: 'Xuôi Nam', desc: 'Mở khóa Miền Nam.', icon: 'b-map', cond: { v: 'regionNam', n: 1 }, reward: { xp: 200 } },
  { id: 'a-visit15', name: 'Ba miền in dấu giày', desc: 'Ghé thăm cả 15 địa điểm.', icon: 'b-map', cond: { v: 'visitedCount', n: 15 }, reward: { xp: 800, money: 1500 } },
  { id: 'a-rich', name: 'Két sắt đầy', desc: 'Có 5.000.000 VNĐ trong tay.', icon: 'b-coin', cond: { v: 'cash', n: 5000 }, reward: { xp: 150 } },
  { id: 'a-rich2', name: 'Ông chủ lớn', desc: 'Có 50.000.000 VNĐ trong tay.', icon: 'b-coin', cond: { v: 'cash', n: 50000 }, reward: { xp: 600 } },
  { id: 'a-upg5', name: 'Quán lên đời', desc: 'Thực hiện 5 lần nâng cấp.', icon: 'b-hammer', cond: { k: 'upgrades', n: 5 }, reward: { xp: 120, money: 200 } },
  { id: 'a-venue', name: 'Mở rộng cơ sở', desc: 'Nâng quán lên cơ sở lớn hơn.', icon: 'b-hammer', cond: { k: 'venueUp', n: 1 }, reward: { xp: 200 } },
  { id: 'a-friend1', name: 'Có bạn bốn phương', desc: 'Hoàn thành lời nhờ đầu tiên của một nhân vật.', icon: 'b-heart', cond: { v: 'friendsDone', n: 1 }, reward: { xp: 40 } },
  { id: 'a-friend5', name: 'Bạn bè khắp chốn', desc: 'Kết thân trọn vẹn với 5 nhân vật.', icon: 'b-heart', cond: { v: 'friendsFull', n: 5 }, reward: { xp: 400, money: 600 } },
  { id: 'a-secret', name: 'Trang sổ rách', desc: 'Tìm được công thức bí mật đầu tiên.', icon: 'b-scroll', cond: { v: 'secretsFound', n: 1 }, reward: { xp: 150 } },
  { id: 'a-secret3', name: 'Ba mảnh ghép', desc: 'Tìm đủ ba công thức bí mật.', icon: 'b-scroll', cond: { v: 'secretsFound', n: 3 }, reward: { xp: 600, money: 1000 } },
  { id: 'a-days30', name: 'Một tháng mở quán', desc: 'Kinh doanh qua 30 ngày.', icon: 'b-sun', cond: { v: 'day', n: 31 }, reward: { xp: 200, money: 300 } },
  { id: 'a-level10', name: 'Đầu bếp có nghề', desc: 'Đạt cấp độ 10.', icon: 'b-level', cond: { v: 'level', n: 10 }, reward: { xp: 0, money: 200 } },
  { id: 'a-level30', name: 'Thực Thần', desc: 'Đạt cấp độ tối đa.', icon: 'b-level', cond: { v: 'level', n: 30 }, reward: { money: 5000 } },
  { id: 'a-rare1', name: 'Người đi săn', desc: 'Tìm được nguyên liệu thăng hoa đầu tiên.', icon: 'b-scroll', cond: { k: 'rareFound', n: 1 }, reward: { xp: 60 } },
  { id: 'a-rare15', name: 'Thợ săn tinh túy', desc: 'Tìm được 15 nguyên liệu thăng hoa.', icon: 'b-scroll', cond: { k: 'rareFound', n: 15 }, reward: { xp: 300, money: 500 } },
  { id: 'a-asc1', name: 'Món Thực Thần đầu tiên', desc: 'Nâng một món lên cấp 5 THỰC THẦN.', icon: 'b-star', cond: { k: 'ascended', n: 1 }, reward: { xp: 250, money: 500 } },
  { id: 'a-asc10', name: 'Mười món Thực Thần', desc: 'Nâng 10 món lên cấp 5 THỰC THẦN.', icon: 'b-star', cond: { k: 'ascended', n: 10 }, reward: { xp: 1200, money: 3000 } },
  { id: 'a-collect', name: 'Hoàn thành bộ sưu tập', desc: 'Hoàn thành một bộ sưu tập món ăn.', icon: 'b-collect', cond: { v: 'collectionsFull', n: 1 }, reward: { xp: 200 } },
];

// Lễ hội theo "tháng" 30 ngày trong game, không phụ thuộc giờ thật.
export const FESTIVALS = [
  { id: 'hoi-lang', name: 'Hội làng đầu xuân', start: 5, len: 2, cats: ['banh'], regions: [], priceMult: 1.3, xpMult: 1.15,
    desc: 'Bánh trái ê hề khắp hội làng. Các món bánh bán được giá cao hơn.', goal: 4, reward: { money: 220, xp: 100, rep: 3, items: { 'bot-gao': 4 } } },
  { id: 'han-thuc', name: 'Tết Hàn thực', start: 12, len: 2, cats: ['banh', 'ngot'], regions: [], priceMult: 1.25, xpMult: 1.1,
    desc: 'Người ta ưa chuộng những món ngọt và bánh nhỏ. Bánh và chè bán chạy.', goal: 4, reward: { money: 260, xp: 110, rep: 3, items: { 'nuoc-cot-dua': 4 } } },
  { id: 'trung-thu', name: 'Rằm Trung Thu', start: 19, len: 2, cats: ['ngot', 'uong'], regions: [], priceMult: 1.3, xpMult: 1.15,
    desc: 'Đêm trăng rằm sáng, ai cũng muốn một món ngọt và ly nước mát.', goal: 4, reward: { money: 300, xp: 120, rep: 4, items: { 'mat-ong': 3 } } },
  { id: 'cho-noi', name: 'Phiên chợ nổi', start: 26, len: 3, cats: ['nuong'], regions: ['nam'], priceMult: 1.25, xpMult: 1.2,
    desc: 'Ghe xuồng nườm nượp, món Nam bộ và đồ nướng được săn đón.', goal: 5, reward: { money: 400, xp: 150, rep: 5, items: { 'tom': 3 } } },
];
export const FESTIVAL_CYCLE = 30;
