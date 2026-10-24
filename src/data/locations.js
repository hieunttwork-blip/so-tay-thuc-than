// Ba miền, mười lăm địa điểm. Thêm địa điểm = thêm một object vào LOCATIONS (và một khối món trong dishes.js).
// pos: vị trí (%) trên bản đồ minh họa của miền. level: cấp độ tối thiểu để đến. fare: tiền tàu xe (nghìn đồng).
// wants: nhân vật nhờ nấu món này để tăng thân thiết (đơn "nấu tặng"), reward: phần thưởng mỗi mức.

export const REGIONS = {
  bac: { id: 'bac', name: 'Miền Bắc', short: 'Bắc', tone: 'Tinh tế, thanh đạm, nước dùng trong và gia vị dịu.', color: '#6f8f5a', sky: '#dfe9d2' },
  trung: { id: 'trung', name: 'Miền Trung', short: 'Trung', tone: 'Đậm đà, cay nồng, mắm ruốc và sả ớt, nhiều món bánh nhỏ.', color: '#c4572f', sky: '#f4dcc0' },
  nam: { id: 'nam', name: 'Miền Nam', short: 'Nam', tone: 'Ngọt thơm, phóng khoáng, nhiều rau, nước cốt dừa và đồ sông nước.', color: '#3f8f78', sky: '#d6ecdf' },
};

export const REGION_ORDER = ['bac', 'trung', 'nam'];

export const LOCATIONS = [
  // ===== MIỀN BẮC =====
  { id: 'b1', region: 'bac', name: 'Phố cổ Hà Nội', level: 1, fare: 0, pos: [46, 62], scene: 'pho', npc: 'bac-ba',
    blurb: 'Những con ngõ nhỏ thơm mùi nước dùng sớm mai, nơi quán của bạn bắt đầu.',
    gather: ['hanh-la', 'rau-thom', 'gung', 'ca-rot', 'trung'], wants: ['pho-bo', 'bun-cha', 'cha-ca-la-vong'] },
  { id: 'b2', region: 'bac', name: 'Hồ Tây & làng Cốm', level: 3, fare: 4, pos: [66, 44], scene: 'ho', npc: 'co-sen',
    blurb: 'Gió hồ, hương cốm mới và những gánh bánh chiều cuối tuần.',
    gather: ['com', 'khoai-lang', 'dau-xanh', 'moc-nhi', 'rau-song'], wants: ['banh-tom-ho-tay', 'nem-ran', 'che-com'] },
  { id: 'b3', region: 'bac', name: 'Hải Phòng', level: 5, fare: 8, pos: [78, 66], scene: 'cang', npc: 'chu-tam',
    blurb: 'Thành phố cảng với bánh đa cua, nem cua bể và những ổ bánh mì cay lừng danh.',
    gather: ['cua', 'ca-ro', 'banh-da', 'ca-chua', 'rau-muong'], wants: ['banh-da-cua', 'bun-ca-cay', 'banh-mi-cay'] },
  { id: 'b4', region: 'bac', name: 'Tây Bắc – Sa Pa', level: 7, fare: 14, pos: [24, 30], scene: 'nui', npc: 'a-lenh',
    blurb: 'Mây phủ ruộng bậc thang, bếp lửa nhà sàn và những loại gia vị rừng thơm lạ.',
    gather: ['thit-trau', 'ca-hoi', 'la-nhuom', 'ong-nua', 'nam'], wants: ['thang-co', 'xoi-ngu-sac', 'lau-ca-hoi'] },
  { id: 'b5', region: 'bac', name: 'Hạ Long & Ninh Bình', level: 9, fare: 16, pos: [84, 34], scene: 'vinh', npc: 'ba-nhan',
    blurb: 'Vịnh đá vôi và đồng lúa, hải sản tươi cùng cơm cháy giòn rụm.',
    gather: ['muc', 'ngan', 'oc', 'ca-thu', 'gung'], wants: ['cha-muc-ha-long', 'com-chay', 'oc-luoc-xa'] },

  // ===== MIỀN TRUNG =====
  { id: 'c1', region: 'trung', name: 'Cố đô Huế', level: 10, fare: 24, pos: [58, 22], scene: 'hue', npc: 'o-bay',
    blurb: 'Sông Hương, nón lá, những chiếc bánh nhỏ xinh và bát bún đậm vị sả ruốc.',
    gather: ['mam-ruoc', 'xa', 'hen', 'gio-heo', 'dua-thom'], wants: ['bun-bo-hue', 'banh-beo', 'com-hen'] },
  { id: 'c2', region: 'trung', name: 'Đà Nẵng', level: 12, fare: 26, pos: [66, 40], scene: 'bien', npc: 'chu-sau',
    blurb: 'Biển xanh, cầu Rồng và tô mì Quảng vàng nghệ ăn mãi không chán.',
    gather: ['mi-quang', 'mam-nem', 'bap-ngo', 'dua-thom', 'rau-song'], wants: ['mi-quang', 'bun-mam-nem', 'banh-xeo-mien-trung'] },
  { id: 'c3', region: 'trung', name: 'Phố cổ Hội An', level: 14, fare: 28, pos: [74, 56], scene: 'hoian', npc: 'chi-hai',
    blurb: 'Đèn lồng ven sông, giếng cổ và những món ăn gói trong sự tỉ mẩn.',
    gather: ['soi-cao-lau', 'la-mot', 'tom', 'thit-nguoi', 'hanh-phi'], wants: ['cao-lau', 'com-ga-hoi-an', 'banh-mi-hoi-an'] },
  { id: 'c4', region: 'trung', name: 'Nghệ An – Hà Tĩnh', level: 16, fare: 32, pos: [40, 68], scene: 'dong', npc: 'ba-sau',
    blurb: 'Miền đất nắng gió với lươn đồng, nhút mặn và kẹo lạc ngọt bùi.',
    gather: ['luon', 'mit-non', 'mat-mia', 'lac', 'gung'], wants: ['chao-luon', 'banh-muot', 'keo-cu-do'] },
  { id: 'c5', region: 'trung', name: 'Duyên hải Nam Trung Bộ', level: 18, fare: 34, pos: [60, 82], scene: 'bien', npc: 'bac-tu',
    blurb: 'Bãi biển dài, tháp Chăm đỏ, bún sứa mát và bánh xèo tôm nhảy giòn tan.',
    gather: ['sua', 'ca', 'tom', 'mam-nem', 'trung'], wants: ['bun-sua', 'banh-xeo-tom-nhay', 'nem-nuong-ninh-hoa'] },

  // ===== MIỀN NAM =====
  { id: 'n1', region: 'nam', name: 'Sài Gòn – TP.HCM', level: 19, fare: 40, pos: [56, 36], scene: 'saigon', npc: 'chu-bay',
    blurb: 'Thành phố không ngủ, quán vỉa hè sáng đèn đến khuya, món gì cũng có.',
    gather: ['suon', 'hu-tieu', 'ca-phe', 'sua-dac', 'dua-chuot'], wants: ['com-tam-suon', 'hu-tieu-nam-vang', 'ca-phe-sua-da'] },
  { id: 'n2', region: 'nam', name: 'Cần Thơ – Cái Răng', level: 21, fare: 42, pos: [44, 54], scene: 'cho-noi', npc: 'co-nam',
    blurb: 'Chợ nổi tấp nập ghe xuồng, sáng sớm bán hàng bằng cây bẹo.',
    gather: ['mam-ca', 'ca-loc', 'ca-tim', 'rau-muong', 'thach'], wants: ['lau-mam', 'banh-cong', 'che-ba-mau'] },
  { id: 'n3', region: 'nam', name: 'Bến Tre – Tiền Giang', level: 23, fare: 44, pos: [68, 52], scene: 'vuon', npc: 'ba-muoi',
    blurb: 'Xứ dừa xanh mướt, lò kẹo thơm lừng và con rạch rợp bóng vườn cây.',
    gather: ['dua', 'chuoi', 'nuoc-cot-dua', 'ca-loc', 'chuoi-xanh'], wants: ['hu-tieu-my-tho', 'ca-loc-nuong-trui', 'chuoi-nep-nuong'] },
  { id: 'n4', region: 'nam', name: 'Đồng Tháp – An Giang', level: 25, fare: 46, pos: [30, 38], scene: 'dong', npc: 'chu-tu',
    blurb: 'Mùa nước nổi, hoa điên điển vàng rực và những phum sóc yên bình.',
    gather: ['ca-linh', 'dien-dien', 'rau-dang', 'duong-thot-not', 'mam-ca'], wants: ['bun-ca-chau-doc', 'lau-ca-linh-dien-dien', 'ca-kho-to'] },
  { id: 'n5', region: 'nam', name: 'Phú Quốc – Cà Mau', level: 27, fare: 50, pos: [28, 80], scene: 'dao', npc: 'anh-hai',
    blurb: 'Đảo ngọc, rừng đước và những món hải sản đánh bắt trong ngày.',
    gather: ['cua', 'so-diep', 'ca-trich', 'ca-thu', 'tom'], wants: ['bun-quay', 'cua-rang-muoi', 'so-diep-nuong-mo-hanh'] },
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
export const LOCATION_INDEX = Object.fromEntries(LOCATIONS.map((l, i) => [l.id, i]));

// Điều kiện mở miền: cần cấp độ và hoàn thành nhiệm vụ chính tương ứng.
export const REGION_UNLOCK = {
  bac: { level: 1, quest: null },
  trung: { level: 10, quest: 'm10' },
  nam: { level: 19, quest: 'm15' },
};
