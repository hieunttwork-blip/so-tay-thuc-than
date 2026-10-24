// Nguyên liệu. Thêm nguyên liệu mới = thêm một dòng vào INGREDIENT_ROWS.
// [id, tên, nhóm, giá nhập (nghìn đồng), vùng bán ('base' | 'bac' | 'trung' | 'nam' | 'hiem')]
// 'base' = luôn có ở chợ quê; 'bac/trung/nam' = chỉ bán khi đã mở miền đó; 'hiem' = chỉ nhận qua khám phá.

export const INGREDIENT_GROUPS = {
  bot: { name: 'Gạo, bột & sợi', icon: 'g-bot' },
  thit: { name: 'Thịt & trứng', icon: 'g-thit' },
  haisan: { name: 'Hải sản & cá', icon: 'g-haisan' },
  rau: { name: 'Rau củ & thảo mộc', icon: 'g-rau' },
  giavi: { name: 'Gia vị & nước chấm', icon: 'g-giavi' },
  ngot: { name: 'Ngọt & trái cây', icon: 'g-ngot' },
  uong: { name: 'Đồ uống', icon: 'g-uong' },
  dacsan: { name: 'Đặc sản & đồ khô', icon: 'g-dacsan' },
};

export const INGREDIENT_ROWS = [
  // Gạo, bột & sợi
  ['gao', 'Gạo tẻ', 'bot', 2, 'base'],
  ['gao-nep', 'Gạo nếp', 'bot', 3, 'base'],
  ['banh-pho', 'Bánh phở', 'bot', 3, 'base'],
  ['bun', 'Bún tươi', 'bot', 2, 'base'],
  ['mien', 'Miến dong', 'bot', 3, 'base'],
  ['banh-trang', 'Bánh tráng', 'bot', 2, 'base'],
  ['bot-gao', 'Bột gạo', 'bot', 2, 'base'],
  ['bot-mi', 'Bột mì', 'bot', 2, 'base'],
  ['bot-nang', 'Bột năng', 'bot', 2, 'base'],
  ['banh-mi', 'Bánh mì ổ', 'bot', 2, 'base'],
  ['hu-tieu', 'Hủ tiếu khô', 'bot', 3, 'nam'],
  ['mi-quang', 'Sợi mì Quảng', 'bot', 3, 'trung'],
  ['soi-cao-lau', 'Sợi cao lầu', 'bot', 5, 'trung'],
  ['banh-da', 'Bánh đa đỏ', 'bot', 3, 'bac'],
  // Thịt & trứng
  ['thit-bo', 'Thịt bò', 'thit', 12, 'base'],
  ['thit-heo', 'Thịt heo', 'thit', 8, 'base'],
  ['suon', 'Sườn heo', 'thit', 9, 'base'],
  ['thit-ga', 'Thịt gà', 'thit', 7, 'base'],
  ['thit-trau', 'Thịt trâu', 'thit', 14, 'bac'],
  ['gio-heo', 'Giò heo', 'thit', 10, 'base'],
  ['cha-lua', 'Chả lụa', 'thit', 6, 'base'],
  ['long-heo', 'Lòng heo', 'thit', 6, 'base'],
  ['trung', 'Trứng', 'thit', 2, 'base'],
  ['pate', 'Pa-tê', 'thit', 4, 'base'],
  ['thit-nguoi', 'Thịt nguội', 'thit', 6, 'base'],
  // Hải sản & cá
  ['tom', 'Tôm', 'haisan', 10, 'base'],
  ['cua', 'Cua', 'haisan', 14, 'base'],
  ['muc', 'Mực', 'haisan', 11, 'bac'],
  ['ca', 'Cá tươi', 'haisan', 8, 'base'],
  ['ca-loc', 'Cá lóc', 'haisan', 8, 'nam'],
  ['ca-hoi', 'Cá hồi', 'haisan', 16, 'bac'],
  ['ca-ro', 'Cá rô đồng', 'haisan', 7, 'bac'],
  ['ca-thu', 'Cá thu', 'haisan', 8, 'base'],
  ['ca-linh', 'Cá linh', 'haisan', 6, 'nam'],
  ['ca-trich', 'Cá trích', 'haisan', 9, 'nam'],
  ['ngan', 'Ngán', 'haisan', 8, 'bac'],
  ['oc', 'Ốc', 'haisan', 6, 'base'],
  ['hen', 'Hến', 'haisan', 5, 'trung'],
  ['luon', 'Lươn', 'haisan', 10, 'trung'],
  ['sua', 'Sứa', 'haisan', 7, 'trung'],
  ['so-diep', 'Sò điệp', 'haisan', 12, 'nam'],
  // Rau củ & thảo mộc
  ['hanh-la', 'Hành lá', 'rau', 1, 'base'],
  ['hanh-tim', 'Hành tím', 'rau', 1, 'base'],
  ['rau-song', 'Rau sống', 'rau', 2, 'base'],
  ['rau-thom', 'Rau thơm', 'rau', 1, 'base'],
  ['xa', 'Sả', 'rau', 1, 'base'],
  ['gung', 'Gừng', 'rau', 1, 'base'],
  ['toi', 'Tỏi', 'rau', 1, 'base'],
  ['ot', 'Ớt', 'rau', 1, 'base'],
  ['rau-muong', 'Rau muống', 'rau', 2, 'base'],
  ['dua-chuot', 'Dưa chuột', 'rau', 2, 'base'],
  ['gia', 'Giá đỗ', 'rau', 1, 'base'],
  ['ca-chua', 'Cà chua', 'rau', 2, 'base'],
  ['thi-la', 'Thì là', 'rau', 1, 'base'],
  ['nghe', 'Nghệ tươi', 'rau', 1, 'base'],
  ['chuoi-xanh', 'Chuối xanh', 'rau', 2, 'base'],
  ['dau-phu', 'Đậu phụ', 'rau', 2, 'base'],
  ['nam', 'Nấm rơm', 'rau', 4, 'base'],
  ['ca-rot', 'Cà rốt', 'rau', 2, 'base'],
  ['khoai-lang', 'Khoai lang', 'rau', 2, 'base'],
  ['nam-huong', 'Nấm hương', 'rau', 5, 'base'],
  ['moc-nhi', 'Mộc nhĩ', 'rau', 3, 'base'],
  ['la-chuoi', 'Lá chuối', 'rau', 1, 'base'],
  ['la-nhuom', 'Lá nhuộm màu', 'rau', 3, 'bac'],
  ['ong-nua', 'Ống nứa', 'rau', 3, 'bac'],
  ['rau-dang', 'Rau đắng', 'rau', 2, 'nam'],
  ['dien-dien', 'Hoa điên điển', 'rau', 5, 'nam'],
  ['ca-tim', 'Cà tím', 'rau', 2, 'nam'],
  ['mit-non', 'Mít non', 'rau', 3, 'trung'],
  ['la-mot', 'Lá mót', 'rau', 2, 'trung'],
  ['bap-ngo', 'Bắp ngô', 'rau', 2, 'trung'],
  ['dua-thom', 'Dứa', 'rau', 3, 'trung'],
  // Gia vị & nước chấm
  ['nuoc-mam', 'Nước mắm', 'giavi', 3, 'base'],
  ['muoi', 'Muối', 'giavi', 1, 'base'],
  ['duong', 'Đường', 'giavi', 1, 'base'],
  ['tieu', 'Tiêu', 'giavi', 2, 'base'],
  ['mam-tom', 'Mắm tôm', 'giavi', 3, 'bac'],
  ['mam-nem', 'Mắm nêm', 'giavi', 3, 'trung'],
  ['mam-ruoc', 'Mắm ruốc', 'giavi', 3, 'trung'],
  ['mam-ca', 'Mắm cá', 'giavi', 5, 'nam'],
  ['tuong', 'Tương', 'giavi', 2, 'base'],
  ['hanh-phi', 'Hành phi', 'giavi', 2, 'base'],
  ['dau-an', 'Dầu ăn', 'giavi', 2, 'base'],
  ['nuoc-dung', 'Nước dùng xương', 'giavi', 4, 'base'],
  ['sa-te', 'Sa tế', 'giavi', 3, 'base'],
  ['que-hoi', 'Quế hồi', 'giavi', 4, 'base'],
  ['hat-doi', 'Hạt dổi', 'giavi', 6, 'hiem'],
  ['mac-khen', 'Mắc khén', 'giavi', 5, 'hiem'],
  ['vung', 'Mè (vừng)', 'giavi', 2, 'base'],
  ['lac', 'Lạc rang', 'giavi', 2, 'base'],
  ['mat-mia', 'Mật mía', 'giavi', 2, 'trung'],
  // Ngọt & trái cây
  ['mat-ong', 'Mật ong', 'ngot', 5, 'base'],
  ['nuoc-cot-dua', 'Nước cốt dừa', 'ngot', 3, 'base'],
  ['dua', 'Dừa', 'ngot', 4, 'base'],
  ['dau-xanh', 'Đậu xanh', 'ngot', 2, 'base'],
  ['dau-do', 'Đậu đỏ', 'ngot', 2, 'base'],
  ['com', 'Cốm', 'ngot', 6, 'bac'],
  ['chuoi', 'Chuối', 'ngot', 2, 'base'],
  ['duong-thot-not', 'Đường thốt nốt', 'ngot', 6, 'nam'],
  ['mia', 'Mía', 'ngot', 2, 'base'],
  ['thach', 'Thạch', 'ngot', 2, 'base'],
  ['sua-dac', 'Sữa đặc', 'ngot', 3, 'base'],
  ['quat', 'Quất', 'ngot', 1, 'base'],
  ['chanh', 'Chanh', 'ngot', 1, 'base'],
  // Đồ uống
  ['ca-phe', 'Cà phê', 'uong', 4, 'base'],
  ['tra', 'Trà xanh', 'uong', 2, 'base'],
  ['tra-shan', 'Trà Shan tuyết', 'uong', 8, 'hiem'],
  ['da', 'Đá viên', 'uong', 1, 'base'],
  // Đặc sản & đồ khô
  ['tom-kho', 'Tôm khô', 'dacsan', 6, 'base'],
];

export const INGREDIENTS = Object.fromEntries(
  INGREDIENT_ROWS.map(([id, name, group, price, avail]) => [id, { id, name, group, price, avail }]),
);

// Vật phẩm đặc biệt (không phải nguyên liệu nấu): trang sổ rách để tìm công thức bí mật.
export const SPECIAL_ITEMS = {
  'trang-so-bac': { id: 'trang-so-bac', name: 'Trang sổ rách (Bắc)', region: 'bac' },
  'trang-so-trung': { id: 'trang-so-trung', name: 'Trang sổ rách (Trung)', region: 'trung' },
  'trang-so-nam': { id: 'trang-so-nam', name: 'Trang sổ rách (Nam)', region: 'nam' },
};

// Nguyên liệu thăng hoa (không bán ở chợ, chỉ kiếm được khi đi thu thập). Dùng để nâng món lên cấp 5 (Thực Thần).
// hiem: Hiếm, mỗi địa điểm một loại. quy: Quý, mỗi miền một loại (rơi ở mọi địa điểm của miền đó, tỉ lệ thấp hơn).
export const RARITY = {
  hiem: { name: 'Hiếm', cls: 'r-hiem' },
  quy: { name: 'Quý', cls: 'r-quy' },
};
const RARE_ROWS = [
  ['hoi-co-truyen', 'Hồi quế cổ truyền', 'hiem', 'b1'], ['com-sen-ho-tay', 'Cốm sen Hồ Tây', 'hiem', 'b2'],
  ['cua-gach-do-son', 'Cua gạch Đồ Sơn', 'hiem', 'b3'], ['thao-qua-sa-pa', 'Thảo quả Sa Pa', 'hiem', 'b4'],
  ['hao-van-don', 'Hào Vân Đồn', 'hiem', 'b5'],
  ['ruoc-hue-thuong-hang', 'Ruốc Huế thượng hạng', 'hiem', 'c1'], ['mam-nhi-nam-o', 'Mắm nhỉ Nam Ô', 'hiem', 'c2'],
  ['nuoc-gieng-ba-le', 'Nước giếng Bá Lễ', 'hiem', 'c3'], ['luon-vang-nghe-an', 'Lươn vàng Nghệ An', 'hiem', 'c4'],
  ['tom-hum-bong', 'Tôm hùm bông', 'hiem', 'c5'],
  ['ca-phe-rang-cui', 'Cà phê rang củi', 'hiem', 'n1'], ['ca-loc-dong-cai-rang', 'Cá lóc đồng Cái Răng', 'hiem', 'n2'],
  ['dua-sap-cau-ke', 'Dừa sáp Cầu Kè', 'hiem', 'n3'], ['ca-linh-nuoc-noi', 'Cá linh mùa nước nổi', 'hiem', 'n4'],
  ['tieu-phu-quoc', 'Hồ tiêu Phú Quốc', 'hiem', 'n5'],
];
const QUY_ROWS = [
  ['tra-sen-tien-vua', 'Trà sen tiến vua', 'quy', 'bac'], ['ot-hiem-do-quang', 'Ớt hiểm đỏ xứ Quảng', 'quy', 'trung'],
  ['mat-hoa-dua-nuoc', 'Mật hoa dừa nước', 'quy', 'nam'],
];
export const RARE_ITEMS = {};
export const RARE_BY_LOC = {};
export const RARE_BY_REGION = {};
for (const [id, name, rarity, where] of RARE_ROWS) { RARE_ITEMS[id] = { id, name, rarity, loc: where }; RARE_BY_LOC[where] = id; }
for (const [id, name, rarity, where] of QUY_ROWS) { RARE_ITEMS[id] = { id, name, rarity, region: where }; RARE_BY_REGION[where] = id; }
/** Tên bất kỳ vật phẩm đặc biệt (trang sổ hoặc nguyên liệu thăng hoa). */
export const itemName = (id) => (SPECIAL_ITEMS[id] || RARE_ITEMS[id] || { name: id }).name;
export const isItem = (id) => Boolean(SPECIAL_ITEMS[id] || RARE_ITEMS[id]);
