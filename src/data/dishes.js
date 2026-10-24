// Dữ liệu món ăn. Mỗi khối là một địa điểm; mỗi dòng là một món có công thức, vị chuẩn, độ khó, quy trình và hình vẽ SVG riêng.
// Thêm món = thêm một dòng vào khối của địa điểm (hoặc tạo khối mới cho địa điểm mới). Không cần sửa logic.
//
// Dòng: [id, tên, nhóm, quy trình, 'nguyên-liệu:số-lượng ...', vị 'mặn|ngọt|cay' (0-4), độ khó 1-5,
//        hình [token SVG...], mô tả hương vị, ghi chú văn hóa, trang trí đúng]
// nhóm: nuoc (món nước), kho (món khô/trộn), com (cơm & xôi), banh (bánh & món cuốn/rán), nuong (nướng, hải sản), ngot (chè & món ngọt), uong (đồ uống)
// quy trình: soup | dry | grill | fry | steam | rice | simmer | sweet | drink | roll   (xem core/cooking.js)
// trang trí: herb lime chili shallot peanut sauce pickle egg ice pepper
// Lưu ý văn hóa: chỉ nêu điều phổ biến, an toàn; không khẳng định nguồn gốc lịch sử cụ thể.

import { LOCATION_INDEX, LOCATION_BY_ID } from './locations.js';
import { INGREDIENTS } from './ingredients.js';

export const CATEGORIES = {
  nuoc: { name: 'Món nước', icon: 'c-nuoc' },
  kho: { name: 'Món khô & trộn', icon: 'c-kho' },
  com: { name: 'Cơm & xôi', icon: 'c-com' },
  banh: { name: 'Bánh & món cuốn', icon: 'c-banh' },
  nuong: { name: 'Nướng & hải sản', icon: 'c-nuong' },
  ngot: { name: 'Chè & món ngọt', icon: 'c-ngot' },
  uong: { name: 'Đồ uống', icon: 'c-uong' },
};

export const GARNISHES = {
  herb: 'Rau thơm', lime: 'Chanh', chili: 'Ớt tươi', shallot: 'Hành phi', peanut: 'Lạc rang',
  sauce: 'Nước chấm', pickle: 'Dưa góp', egg: 'Trứng', ice: 'Đá bào', pepper: 'Tiêu xay',
};

// Topping thêm theo yêu cầu khách (tính theo nhóm món).
export const EXTRAS = {
  nuoc: { ing: 'trung', label: 'thêm trứng', price: 5 },
  kho: { ing: 'cha-lua', label: 'thêm chả', price: 8 },
  com: { ing: 'trung', label: 'thêm trứng ốp', price: 5 },
  banh: { ing: 'thit-heo', label: 'thêm nhân', price: 9 },
  nuong: { ing: 'ot', label: 'thêm muối ớt', price: 3 },
  ngot: { ing: 'nuoc-cot-dua', label: 'thêm nước cốt dừa', price: 4 },
  uong: { ing: 'thach', label: 'thêm thạch', price: 4 },
};

const BLOCKS = {
  // ---------------- MIỀN BẮC ----------------
  b1: [
    ['pho-bo', 'Phở bò', 'nuoc', 'soup', 'banh-pho:2 thit-bo:2 nuoc-dung:2 hanh-la:1 que-hoi:1', '310', 2,
      ['bowl:#f6efe0:#a8452e', 'soup:#d9a85c', 'noodle:flat:#f4ead2', 'meat:slice:#8d3b2b', 'onion:#7fae55', 'herb:#5d9440', 'steam'],
      'Nước dùng trong, ngọt xương, thơm quế hồi, bánh phở mềm dai.', 'Thường là bữa sáng quen thuộc của nhiều gia đình và quán phố.', 'herb lime chili'],
    ['bun-cha', 'Bún chả', 'kho', 'grill', 'bun:2 thit-heo:2 nuoc-mam:1 duong:1 rau-song:1 toi:1', '231', 3,
      ['plate:#f7f0e0', 'noodle:bun:#fbf6ea', 'meat:patty:#6a3a22', 'herb:#6aa04a', 'dip:#b9743a', 'chili'],
      'Chả nướng than thơm lừng, chấm nước mắm chua ngọt cùng bún và rau sống.', 'Món bữa trưa dễ gặp ở các con phố ẩm thực.', 'herb pickle sauce'],
    ['bun-thang', 'Bún thang', 'nuoc', 'soup', 'bun:2 thit-ga:1 trung:1 nam-huong:1 tom-kho:1 nuoc-dung:1', '311', 4,
      ['bowl:#f4eee2:#4f7a3a', 'soup:#efd9a0', 'noodle:thin:#faf4e4', 'meat:shred:#f0d9a8', 'egg:thin', 'mushroom:#6b4a33', 'herb:#7bb04f'],
      'Nước dùng ngọt thanh, nhiều thành phần cắt sợi nhỏ xếp gọn gàng.', 'Một món công phu, thường gắn với bữa ăn ngày lễ của gia đình.', 'herb pepper lime'],
    ['cha-ca-la-vong', 'Chả cá Lã Vọng', 'nuong', 'fry', 'ca:2 nghe:1 thi-la:2 bun:1 mam-tom:1 hanh-la:1 lac:1', '320', 4,
      ['plate:#e8d6b0', 'noodle:bun:#fbf6ea', 'fish:fillet:#e8b84a', 'herb:#4f9a3c:dill', 'peanut', 'onion:#8cc063', 'dip:#9b5a3a'],
      'Cá nướng vàng nghệ, áp chảo với thì là và hành, chấm mắm tôm.', 'Điểm nhấn của món là mùi thì là và nghệ nóng thơm trên chảo.', 'herb peanut sauce'],
    ['banh-cuon', 'Bánh cuốn nóng', 'banh', 'steam', 'bot-gao:2 thit-heo:1 moc-nhi:1 hanh-phi:1 cha-lua:1 nuoc-mam:1', '220', 3,
      ['plate:#f4f1e8', 'roll:rice:#f7f3ea', 'meat:shred:#7a4a2a', 'shallot', 'dip:#c98a4b', 'herb:#6aa04a'],
      'Lớp bánh mỏng mịn như lụa, nhân thịt nấm đậm đà, chấm nước mắm ấm.', 'Bánh tráng hấp từng lớp mỏng, ăn nóng là ngon nhất.', 'shallot herb sauce'],
    ['ca-phe-trung', 'Cà phê trứng', 'uong', 'drink', 'ca-phe:1 trung:2 sua-dac:1 duong:1', '024', 2,
      ['cup:#f1e3c8', 'liq:#4a2a14,#f2cf7a', 'foam:#f8e9a6', 'steam'],
      'Lớp kem trứng béo mịn phủ trên cà phê đậm, ngọt ấm.', 'Thức uống thường được nhâm nhi vào những ngày se lạnh.', 'pepper'],
  ],
  b2: [
    ['banh-tom-ho-tay', 'Bánh tôm Hồ Tây', 'banh', 'fry', 'bot-mi:1 tom:2 khoai-lang:1 dau-an:1 rau-song:1 nuoc-mam:1', '221', 3,
      ['plate:#efe3c8', 'cake:round:#e6a63e', 'shrimp:#e0763a', 'greens:#79ad4c', 'dip:#c98a4b'],
      'Bánh giòn rụm, tôm nguyên con ở trên, ăn kèm rau sống và nước chấm.', 'Món ăn vặt mang không khí chiều ven hồ.', 'herb sauce pickle'],
    ['xoi-xeo', 'Xôi xéo', 'com', 'steam', 'gao-nep:2 dau-xanh:1 hanh-phi:1 nghe:1 muoi:1', '210', 2,
      ['plate:#f4eadb', 'sticky:#f2c230,#f4e7b0', 'beans:#f0d66a', 'shallot'],
      'Xôi vàng nghệ, đậu xanh bở, hành phi giòn thơm.', 'Bữa sáng gọn nhẹ, thường bán bằng gánh hoặc xe đẩy.', 'shallot pepper'],
    ['bun-dau-mam-tom', 'Bún đậu mắm tôm', 'kho', 'fry', 'bun:2 dau-phu:2 mam-tom:1 thit-heo:1 rau-song:2', '320', 3,
      ['tray', 'noodle:bun:#fbf6ea', 'tofu:#e5b95a', 'meat:cube:#b97a4a', 'herb:#6aa04a', 'dip:#7a5a8a'],
      'Đậu rán nóng giòn, bún lá, rau thơm chấm mắm tôm đánh sủi.', 'Một mâm đồ ăn bày chung, hợp ăn cùng bạn bè.', 'herb chili lime'],
    ['banh-gio', 'Bánh giò', 'banh', 'steam', 'bot-gao:2 thit-heo:1 moc-nhi:1 hanh-tim:1 la-chuoi:1', '300', 2,
      ['leaf', 'cake:pyramid:#f5f0e0', 'meat:shred:#8a5a3a', 'pepper'],
      'Bánh mềm nóng hổi, nhân thịt mộc nhĩ tiêu thơm.', 'Thường gói bằng lá chuối, ăn nóng vào bữa sáng.', 'pepper'],
    ['che-com', 'Chè cốm', 'ngot', 'sweet', 'com:2 duong:1 nuoc-cot-dua:1 dua:1', '040', 2,
      ['cup:#e9f1d8', 'liq:#8fb85a,#d8e8a2', 'coconut', 'candy:#f3e3a0'],
      'Hạt cốm xanh dẻo thơm, ngọt dịu, béo vị dừa.', 'Gắn với mùa cốm mới của vùng đồng bằng.', 'peanut ice'],
    ['nem-ran', 'Nem rán Hà Nội', 'banh', 'fry', 'banh-trang:2 thit-heo:1 mien:1 moc-nhi:1 ca-rot:1 trung:1', '311', 3,
      ['plate:#f0e4cc', 'roll:fried:#d98a2b', 'greens:#7bb04f', 'dip:#c98a4b', 'chili'],
      'Vỏ vàng giòn rụm, nhân thịt miến mộc nhĩ thơm lừng.', 'Thường góp mặt trong mâm cỗ ngày Tết.', 'herb pickle sauce'],
  ],
  b3: [
    ['banh-da-cua', 'Bánh đa cua', 'nuoc', 'soup', 'banh-da:2 cua:2 rau-muong:1 nuoc-dung:2 dau-phu:1', '310', 3,
      ['bowl:#efe1c4:#a8452e', 'soup:#d9803c', 'noodle:flat:#c24a32', 'crab:#d95b3a', 'greens:#7bb04f', 'tofu:#e5b95a'],
      'Sợi bánh đa đỏ, riêu cua bùi béo, rau muống giòn.', 'Món bình dân của thành phố cảng.', 'herb chili lime'],
    ['nem-cua-be', 'Nem cua bể', 'banh', 'fry', 'banh-trang:2 cua:2 thit-heo:1 hanh-la:1 tieu:1', '310', 4,
      ['plate:#f2e8d2', 'roll:fried:#c9741f', 'crab:#d95b3a', 'greens:#6aa04a', 'dip:#9b5a3a'],
      'Nem giòn tan, nhân cua đậm vị biển.', 'Một món nem thường được coi là đặc sản vùng biển.', 'herb sauce pickle'],
    ['banh-mi-cay', 'Bánh mì cay', 'banh', 'grill', 'banh-mi:1 pate:1 cha-lua:1 ot:1 tuong:1 rau-thom:1', '213', 2,
      ['board', 'loaf', 'meat:shred:#a23a2a', 'herb:#5d9440', 'chili'],
      'Bánh mì nóng giòn, pa-tê béo, tương ớt cay nồng.', 'Một thức ăn nhanh rất được ưa thích của người đi đường.', 'chili herb'],
    ['bun-ca-cay', 'Bún cá cay', 'nuoc', 'soup', 'bun:2 ca-ro:2 ca-chua:1 thi-la:1 nuoc-dung:2 ot:1', '312', 3,
      ['bowl:#f0e6d4:#c24a32', 'soup:#e0a04a', 'noodle:thin:#faf4e4', 'fish:fillet:#d9b46a', 'tomato', 'herb:#4f9a3c:dill'],
      'Nước dùng chua nhẹ, cay thơm, cá chiên giòn ăn cùng bún.', 'Món ăn dân dã của bờ sông.', 'herb chili lime'],
    ['banh-mi-que', 'Bánh mì que', 'banh', 'grill', 'banh-mi:1 pate:1 tuong:1 ot:1 hanh-phi:1', '312', 2,
      ['board', 'loaf:thin', 'meat:patty:#8a3f2a', 'onion:#d9a23c', 'chili'],
      'Ổ bánh mì nhỏ dài, nhân pa-tê ớt, thơm giòn.', 'Món cầm tay tiện lợi.', 'chili shallot'],
    ['nuoc-mia-tac', 'Nước mía tắc', 'uong', 'drink', 'mia:2 quat:1 da:1', '032', 1,
      ['glass', 'liq:#e8d48a,#f1e7b0', 'ice', 'lime', 'straw:#d9503a'],
      'Mía ngọt mát, thêm vị tắc chua thơm.', 'Thức uống giải khát quen thuộc nơi vỉa hè.', 'ice lime'],
  ],
  b4: [
    ['thang-co', 'Thắng cố', 'nuoc', 'soup', 'thit-trau:2 hat-doi:1 mac-khen:1 gung:1 nuoc-dung:1', '311', 5,
      ['pot:#6a4a3a', 'soup:#b87a3a', 'meat:cube:#8a4a2a', 'herb:#5d9440', 'chili', 'steam'],
      'Món hầm nghi ngút, đậm gia vị núi rừng, ăn lúc trời lạnh.', 'Thường gắn với những phiên chợ vùng cao.', 'herb pepper chili'],
    ['com-lam', 'Cơm lam', 'com', 'grill', 'gao-nep:2 ong-nua:1 dau-do:1 vung:1', '221', 3,
      ['bamboo', 'rice:#f7f0dc', 'sticky:#e8d7ad,#f4ecd5', 'vung', 'peanut'],
      'Cơm nếp nướng trong ống nứa, dẻo thơm mùi khói tre.', 'Hay được dùng làm quà mang đi trên đường dài.', 'peanut pepper'],
    ['thit-trau-gac-bep', 'Thịt trâu gác bếp', 'nuong', 'grill', 'thit-trau:2 mac-khen:1 gung:1 toi:1 ot:1', '321', 4,
      ['board', 'meat:rib:#6a3a28', 'meat:shred:#8a3a2a', 'chili', 'herb:#5d9440'],
      'Thịt dai thơm khói bếp, cay nồng mắc khén.', 'Món ăn dành để nhâm nhi và đãi khách quý.', 'chili pepper'],
    ['xoi-ngu-sac', 'Xôi ngũ sắc', 'com', 'steam', 'gao-nep:2 la-nhuom:2 vung:1 dau-an:1', '120', 3,
      ['plate:#f4eadb', 'sticky:#e24a5a,#f2c230,#4a9a5a,#7a4a9a,#f8f2e4', 'vung'],
      'Năm màu sắc từ lá cây, xôi dẻo bùi.', 'Thường xuất hiện trong ngày hội và lễ cưới.', 'peanut pepper'],
    ['lau-ca-hoi', 'Lẩu cá hồi Sa Pa', 'nuoc', 'soup', 'ca-hoi:2 ca-chua:1 nam:1 rau-muong:1 nuoc-dung:2 gung:1', '310', 4,
      ['pot:#a8452e', 'soup:#e8a05a', 'fish:fillet:#f08a5a', 'tomato', 'mushroom:#d9b88a', 'greens:#79ad4c', 'steam'],
      'Nước lẩu chua thanh, cá hồi béo ngọt.', 'Hợp bữa tối quây quần khi trời se.', 'herb lime chili'],
    ['tra-shan-tuyet', 'Trà Shan tuyết', 'uong', 'drink', 'tra-shan:1 mat-ong:1 da:1', '020', 2,
      ['cup:#e8e0cc', 'liq:#d9b250,#efd88a', 'leaf:small', 'steam'],
      'Trà thơm dịu, hậu ngọt nhẹ vị mật ong.', 'Trà cổ thụ vùng núi cao được nhiều người yêu thích.', 'ice'],
  ],
  b5: [
    ['cha-muc-ha-long', 'Chả mực Hạ Long', 'nuong', 'fry', 'muc:3 hanh-la:1 tieu:1 nuoc-mam:1 dau-an:1', '320', 4,
      ['plate:#eee2c8', 'meat:patty:#e5b45a', 'squid:#f4ead0', 'onion:#8cc063', 'pepper'],
      'Mực giã tay dai giòn, chiên vàng thơm.', 'Một đặc sản làm quà phổ biến vùng biển.', 'herb pepper sauce'],
    ['banh-cuon-cha-muc', 'Bánh cuốn chả mực', 'banh', 'steam', 'bot-gao:2 muc:2 hanh-phi:1 nuoc-mam:1 rau-thom:1', '310', 4,
      ['plate:#f4f1e8', 'roll:rice:#f6f1e2', 'meat:patty:#e5b45a', 'shallot', 'herb:#6aa04a', 'dip:#c98a4b'],
      'Bánh mỏng mềm cuốn chả mực giòn, ăn kèm nước chấm.', 'Kết hợp bánh quê với hải sản.', 'shallot herb sauce'],
    ['com-chay', 'Cơm cháy', 'com', 'fry', 'gao:3 thit-heo:1 hanh-phi:1 dau-an:1', '310', 3,
      ['plate:#eadcbc', 'cake:square:#d9a24a', 'meat:shred:#a8683a', 'shallot', 'dip:#c98a4b'],
      'Miếng cơm giòn vàng rụm, rắc chà bông đậm đà.', 'Ăn chơi hay ăn kèm món nước đều hợp.', 'shallot sauce'],
    ['ngan-hap-gung', 'Ngán hấp gừng', 'nuong', 'steam', 'ngan:3 gung:2 hanh-la:1 nuoc-mam:1', '310', 3,
      ['plate:#eee2c8', 'shell:#e8dcc0', 'ginger', 'onion:#8cc063', 'dip:#9b5a3a'],
      'Ngán ngọt mềm, hơi cay ấm của gừng, nhấm nháp chấm muối.', 'Món hải sản bình dị ven biển.', 'chili lime pepper'],
    ['banh-gai', 'Bánh gai', 'banh', 'steam', 'gao-nep:2 la-nhuom:1 dau-xanh:1 duong:1 la-chuoi:1', '130', 3,
      ['leaf', 'cake:round:#2a3a28', 'beans:#f0d66a', 'vung'],
      'Vỏ bánh dẻo thơm lá, nhân đậu xanh ngọt bùi.', 'Gắn với mùa lễ truyền thống.', 'peanut'],
    ['oc-luoc-xa', 'Ốc luộc sả gừng', 'nuong', 'steam', 'oc:3 xa:2 gung:1 ot:1 chanh:1', '310', 2,
      ['plate:#eee2c8', 'shell:#6a5a4a', 'ginger', 'chili', 'lime'],
      'Ốc luộc thơm sả, chấm muối ớt chanh cay chua.', 'Món ăn vặt quen thuộc của buổi chiều.', 'chili lime herb'],
  ],

  // ---------------- MIỀN TRUNG ----------------
  c1: [
    ['bun-bo-hue', 'Bún bò Huế', 'nuoc', 'soup', 'bun:2 thit-bo:2 gio-heo:1 xa:2 mam-ruoc:1 sa-te:1', '323', 4,
      ['bowl:#f2e6cf:#b8442f', 'soup:#d9552c', 'noodle:thick:#f6ecd2', 'meat:slice:#8d3b2b', 'meat:cube:#e7c9a0', 'onion:#8cc063', 'steam'],
      'Nước dùng đậm sả và mắm ruốc, cay nồng, sợi bún to.', 'Hương vị mạnh mẽ đặc trưng của vùng đất cố đô.', 'herb lime chili'],
    ['banh-beo', 'Bánh bèo', 'banh', 'steam', 'bot-gao:2 tom-kho:1 hanh-phi:1 nuoc-mam:1 dau-an:1', '210', 3,
      ['plate:#f1e9d8', 'bowlets:#fbf7ec', 'shallot', 'shrimp:#e08a5a', 'dip:#b9743a'],
      'Những chiếc bánh nhỏ mềm, rắc tôm cháy và hành phi.', 'Thường ăn bằng thìa nhỏ, nhiều chén xếp trên đĩa.', 'shallot sauce chili'],
    ['banh-nam', 'Bánh nậm', 'banh', 'steam', 'bot-gao:2 tom:1 thit-heo:1 la-chuoi:1 hanh-tim:1', '210', 3,
      ['leaf', 'cake:square:#f8f3e4', 'shrimp:#e08a5a', 'meat:shred:#a8683a', 'dip:#b9743a'],
      'Bánh mềm gói lá, nhân tôm thịt thơm.', 'Mở lá ra là mùi lá chuối thơm lan tỏa.', 'chili sauce'],
    ['banh-bot-loc', 'Bánh bột lọc', 'banh', 'steam', 'bot-nang:2 tom:2 thit-heo:1 la-chuoi:1 nuoc-mam:1 ot:1', '312', 3,
      ['leaf', 'dumpling:#f7d9b0', 'shrimp:#e0763a', 'chili', 'dip:#b9743a'],
      'Vỏ bánh trong dai, nhân tôm thịt đậm đà, chấm mắm cay.', 'Món nhỏ gọn ăn vặt cả ngày.', 'chili sauce'],
    ['com-hen', 'Cơm hến', 'com', 'rice', 'gao:2 hen:3 hanh-phi:1 chuoi-xanh:1 ot:1 mam-ruoc:1', '313', 3,
      ['bowl:#efe4cc:#8a4a2a', 'rice:#f6efdc', 'shell:#6a5a4a', 'shallot', 'chili', 'greens:#79ad4c'],
      'Cơm nguội trộn hến xào, rau sống, mắm ruốc cay.', 'Nét bình dân đặc sắc của vùng sông Hương.', 'chili shallot herb'],
    ['ca-phe-muoi', 'Cà phê muối', 'uong', 'drink', 'ca-phe:1 sua-dac:1 muoi:1 da:1', '224', 2,
      ['cup:#e9dcc2', 'liq:#3a2210,#d9c8a0', 'foam:#f6efe0'],
      'Cà phê đậm, lớp kem mặn nhẹ béo mịn.', 'Một cách pha lạ miệng được nhiều người yêu thích.', 'ice'],
  ],
  c2: [
    ['mi-quang', 'Mì Quảng', 'kho', 'dry', 'mi-quang:2 thit-ga:1 tom:1 lac:1 banh-trang:1 nghe:1', '321', 3,
      ['bowl:#f1e5c8:#c28a2a', 'noodle:flat:#f2d36b', 'shrimp:#e0763a', 'meat:cube:#e0b87a', 'peanut', 'herb:#5d9440', 'cracker'],
      'Sợi mì vàng nghệ, ít nước đậm đà, ăn kèm bánh tráng nướng.', 'Mỗi nhà một cách nấu, từ gà đến tôm thịt.', 'peanut herb chili'],
    ['banh-trang-cuon-thit-heo', 'Bánh tráng cuốn thịt heo', 'banh', 'roll', 'banh-trang:2 thit-heo:2 rau-song:2 mam-nem:1 bun:1', '231', 2,
      ['plate:#f4ecd8', 'roll:fresh:#f4efe0', 'meat:slice:#f0b8a0', 'herb:#6aa04a', 'dip:#9b6a3a'],
      'Thịt heo luộc cuốn rau sống với bánh tráng, chấm mắm nêm.', 'Một bữa ăn tự cuốn vui nhộn quanh mâm.', 'herb pickle sauce'],
    ['bun-mam-nem', 'Bún mắm nêm', 'kho', 'dry', 'bun:2 thit-heo:2 mam-nem:1 dua-thom:1 ot:1', '323', 3,
      ['bowl:#efe3ca', 'noodle:bun:#fbf6ea', 'meat:slice:#f0b8a0', 'dip:#c9a24a', 'chili', 'herb:#5d9440'],
      'Bún lạnh, thịt luộc, mắm nêm chua cay dậy hương dứa.', 'Hợp ăn những trưa nắng nóng.', 'herb chili lime'],
    ['banh-xeo-mien-trung', 'Bánh xèo miền Trung', 'banh', 'fry', 'bot-gao:2 tom:2 thit-heo:1 gia:1 nghe:1 nuoc-mam:1', '312', 3,
      ['plate:#f0e4cb', 'pancake:small:#e8b53a', 'shrimp:#e0763a', 'sprout', 'dip:#9b5a3a'],
      'Chiếc bánh nhỏ vàng giòn, nhân tôm, cuốn rau chấm nước lèo.', 'Thường chiên trên những chảo nhỏ, ăn nóng.', 'herb sauce chili'],
    ['bun-cha-ca', 'Bún chả cá', 'nuoc', 'soup', 'bun:2 ca:2 ca-chua:1 hanh-la:1 nuoc-dung:2 thi-la:1', '310', 2,
      ['bowl:#efe6d2:#4f7a3a', 'soup:#e8b66a', 'noodle:bun:#faf4e4', 'fish:fillet:#f0d6a0', 'tomato', 'onion:#8cc063'],
      'Chả cá dai ngọt, nước dùng thanh, thêm ớt cay tùy thích.', 'Một tô bún dễ ăn, ăn sớm hay trưa đều hợp.', 'herb chili lime'],
    ['che-bap', 'Chè bắp', 'ngot', 'sweet', 'bap-ngo:2 duong:1 nuoc-cot-dua:1 bot-nang:1', '040', 2,
      ['cup:#f6efdc', 'liq:#f2c84a,#fbe9a0', 'beans:#f4d03a', 'coconut', 'peanut'],
      'Bắp ngọt dẻo hòa nước cốt dừa béo thơm.', 'Món ngọt giản dị cho cả nhà.', 'peanut'],
  ],
  c3: [
    ['cao-lau', 'Cao lầu', 'kho', 'dry', 'soi-cao-lau:2 thit-heo:2 gia:1 rau-song:1 tuong:1', '321', 4,
      ['bowl:#eee0c4:#6a4a2a', 'noodle:thick:#d9b16a', 'meat:slice:#8a4a3a', 'greens:#79ad4c', 'sprout', 'cracker'],
      'Sợi dai nâu vàng, thịt xíu, ít nước ăn cùng rau sống.', 'Món mang dấu ấn của phố cổ ven sông.', 'herb chili lime'],
    ['com-ga-hoi-an', 'Cơm gà Hội An', 'com', 'rice', 'gao:2 thit-ga:2 hanh-tim:1 rau-song:1 nghe:1', '311', 3,
      ['plate:#f3ead6', 'rice:#f2d36b', 'meat:shred:#f0d9b0', 'greens:#79ad4c', 'onion:#d9a23c', 'chili'],
      'Cơm vàng nghệ, gà xé phay trộn hành tím và rau răm.', 'Một đĩa cơm đơn giản, no lòng và thơm.', 'herb chili pickle'],
    ['banh-mi-hoi-an', 'Bánh mì Hội An', 'banh', 'grill', 'banh-mi:1 pate:1 thit-nguoi:1 rau-song:1 tuong:1', '312', 2,
      ['board', 'loaf', 'meat:slice:#c46a4a', 'greens:#79ad4c', 'tomato', 'chili'],
      'Ổ bánh mì giòn nhân đầy đặn, nước sốt đậm.', 'Hương vị bình dân ở những quán nhỏ bên đường.', 'herb chili pickle'],
    ['banh-bao-banh-vac', 'Bánh bao bánh vạc', 'banh', 'steam', 'bot-gao:2 tom:2 hanh-phi:1 nuoc-mam:1', '210', 4,
      ['plate:#f1e9d8', 'cake:flower:#f9f4e8', 'shrimp:#e08a5a', 'shallot', 'dip:#b9743a'],
      'Bánh trong mỏng như cánh hoa, nhân tôm thịt thơm.', 'Hình hoa hồng trắng xinh xắn, tỉ mẩn từng chiếc.', 'shallot chili sauce'],
    ['hoanh-thanh-chien', 'Hoành thánh chiên', 'banh', 'fry', 'bot-mi:2 thit-heo:1 tom:1 dau-an:2 ca-chua:1', '311', 3,
      ['plate:#efe3c8', 'dumpling:#e8b440', 'tomato', 'shrimp:#e0763a', 'dip:#c9402b'],
      'Vỏ giòn vàng, nhân đầy, rưới sốt chua ngọt.', 'Món chiên giòn bắt mắt cho bữa tối.', 'sauce herb chili'],
    ['nuoc-mot', 'Nước mót', 'uong', 'drink', 'la-mot:2 duong:1 da:1', '030', 1,
      ['glass', 'liq:#6a8a3a,#a8c870', 'ice', 'leaf:small', 'straw:#e0a23c'],
      'Nước rau mát, vị thanh ngọt dịu.', 'Thức uống giải khát giản dị.', 'ice lime'],
  ],
  c4: [
    ['chao-luon', 'Cháo lươn', 'nuoc', 'soup', 'gao:2 luon:2 hanh-la:1 tieu:1 gung:1 thi-la:1', '310', 3,
      ['bowl:#efe3ca:#6a4a2a', 'soup:#e8d6a0', 'eel:#7a5a3a', 'onion:#8cc063', 'pepper', 'herb:#4f9a3c:dill'],
      'Cháo sánh thơm, lươn dai ngọt, nhiều hạt tiêu.', 'Một bát nóng bổ dưỡng.', 'pepper herb chili'],
    ['sup-luon', 'Súp lươn', 'nuoc', 'soup', 'luon:2 mien:1 nuoc-dung:2 hanh-la:1 tieu:1', '311', 3,
      ['bowl:#f1e6d0:#8a4a2a', 'soup:#d9a64a', 'noodle:thin:#e8dcb8', 'eel:#7a5a3a', 'onion:#8cc063', 'steam'],
      'Nước sền sệt, lươn thơm, miến dai.', 'Thích hợp bữa sáng vùng đồng bằng.', 'pepper herb lime'],
    ['banh-muot', 'Bánh mướt', 'banh', 'steam', 'bot-gao:2 thit-heo:1 hanh-phi:1 nuoc-mam:1 hanh-la:1', '211', 2,
      ['plate:#f4f1e8', 'roll:rice:#fbf7ec', 'meat:shred:#a8683a', 'shallot', 'dip:#c98a4b'],
      'Bánh tráng mỏng mịn, chan nước mắm thơm hành phi.', 'Ăn đơn giản mà đậm vị quê.', 'shallot chili sauce'],
    ['nhut-thanh-chuong', 'Nhút Thanh Chương', 'kho', 'roll', 'mit-non:2 muoi:1 ot:1 duong:1', '311', 3,
      ['bowl:#e6d8b8', 'greens:#c4c870', 'chili', 'dip:#b98a4a'],
      'Mít non muối chua, giòn, ăn kèm bữa cơm.', 'Món ăn kèm quen thuộc, vị chua mặn mộc mạc.', 'chili herb'],
    ['keo-cu-do', 'Kẹo cu đơ', 'ngot', 'sweet', 'lac:2 mat-mia:1 duong:1 gung:1', '040', 3,
      ['plate:#eadcbc', 'candy:#c98a3a', 'peanut', 'ginger'],
      'Kẹo lạc giòn, mật ngọt, thơm gừng cay nhẹ.', 'Quà quê thường mang biếu.', 'peanut'],
    ['che-xanh', 'Chè xanh Nghệ An', 'uong', 'drink', 'tra:2 duong:1 da:1', '020', 1,
      ['cup:#eae4cc', 'liq:#a8b04a,#d6dc86', 'leaf:small'],
      'Nước chè xanh đậm, ngọt chát đặc trưng.', 'Thức uống tiếp khách ở nhiều gia đình.', 'ice'],
  ],
  c5: [
    ['bun-sua', 'Bún sứa', 'nuoc', 'soup', 'bun:2 sua:2 thit-heo:1 nuoc-mam:1 nuoc-dung:1', '310', 3,
      ['bowl:#eef2ea:#4a8aa0', 'soup:#e8e0b8', 'noodle:bun:#fbf8ee', 'meat:slice:#f0b8a0', 'jelly:#e8dcc4', 'herb:#6aa04a'],
      'Sứa giòn sần sật, nước dùng thanh mát.', 'Món giải nhiệt nơi biển nắng.', 'herb chili lime'],
    ['banh-canh-cha-ca', 'Bánh canh chả cá', 'nuoc', 'soup', 'bot-gao:2 ca:2 hanh-la:1 nuoc-dung:2 ot:1', '311', 3,
      ['bowl:#f1e6d0:#6a4a2a', 'soup:#e8c27a', 'noodle:thick:#f6ecd6', 'fish:fillet:#f0d6a0', 'onion:#8cc063', 'chili'],
      'Sợi bánh canh dai, chả cá ngọt, nước dùng sánh.', 'Ăn nóng buổi sáng hoặc chiều tối.', 'herb chili pepper'],
    ['banh-xeo-tom-nhay', 'Bánh xèo tôm nhảy', 'banh', 'fry', 'bot-gao:2 tom:3 gia:1 nghe:1 dau-an:1', '312', 4,
      ['plate:#f0e4cb', 'pancake:big:#eab030', 'shrimp:#e0563a', 'sprout', 'greens:#79ad4c', 'dip:#b9743a'],
      'Bánh giòn rụm, tôm tươi còn nhảy lúc đổ, rau xanh mát.', 'Tiếng xèo xèo trên chảo là điểm nhấn.', 'herb sauce chili'],
    ['nem-nuong-ninh-hoa', 'Nem nướng Ninh Hòa', 'nuong', 'grill', 'thit-heo:3 banh-trang:2 rau-song:2 toi:1 mam-nem:1', '321', 4,
      ['plate:#efe3cb', 'meat:patty:#b8583a', 'roll:fresh:#f4efe0', 'herb:#6aa04a', 'dip:#c98a4b'],
      'Nem nướng thơm tỏi, cuốn bánh tráng chấm nước sốt đặc.', 'Một mâm cuốn vui nhộn ăn nhiều người.', 'herb pickle sauce'],
    ['bun-ca-quy-nhon', 'Bún cá Quy Nhơn', 'nuoc', 'soup', 'bun:2 ca:2 ca-chua:1 hanh-la:1 thi-la:1 nuoc-dung:2', '310', 3,
      ['bowl:#eef0e4:#2a6a8a', 'soup:#e0b86a', 'noodle:bun:#fbf6ea', 'fish:whole:#e8c890', 'tomato', 'herb:#4f9a3c:dill'],
      'Nước dùng ngọt cá, cà chua chua nhẹ, thơm thì là.', 'Một tô bún ven biển bình dị.', 'herb chili lime'],
    ['banh-trang-nuong', 'Bánh tráng nướng', 'banh', 'grill', 'banh-trang:2 trung:2 hanh-la:1 lac:1 sa-te:1', '312', 2,
      ['board', 'pancake:round:#d9a24a', 'egg:fried', 'onion:#8cc063', 'peanut', 'dip:#c9402b'],
      'Bánh giòn nướng than, trứng, hành lá, sa tế cay thơm.', 'Món ăn vặt nướng ven đường.', 'chili peanut shallot'],
  ],

  // ---------------- MIỀN NAM ----------------
  n1: [
    ['com-tam-suon', 'Cơm tấm sườn bì chả', 'com', 'grill', 'gao:2 suon:2 trung:1 cha-lua:1 nuoc-mam:1 duong:1', '321', 3,
      ['plate:#f5efe0', 'rice:#f9f4e6', 'meat:chop:#8a4a2a', 'egg:fried', 'cuke', 'dip:#c98a4b'],
      'Cơm tấm dẻo, sườn nướng thơm ngọt, trứng ốp, mỡ hành.', 'Bữa sáng hay trưa quen thuộc ở thành phố.', 'pickle herb sauce'],
    ['hu-tieu-nam-vang', 'Hủ tiếu Nam Vang', 'nuoc', 'soup', 'hu-tieu:2 thit-heo:1 tom:1 long-heo:1 nuoc-dung:2 gia:1', '321', 3,
      ['bowl:#f3e8d0:#2a6a8a', 'soup:#e8c27a', 'noodle:thin:#faf2dc', 'shrimp:#e0763a', 'meat:slice:#f0b8a0', 'sprout'],
      'Nước dùng ngọt xương, hủ tiếu dai, tôm thịt đầy đặn.', 'Món ăn sáng ưa thích của người đô thị.', 'herb lime chili'],
    ['banh-mi-thit', 'Bánh mì thịt', 'banh', 'grill', 'banh-mi:1 pate:1 thit-nguoi:1 dua-chuot:1 rau-thom:1', '311', 2,
      ['board', 'loaf', 'meat:slice:#c46a4a', 'cuke', 'herb:#5d9440', 'chili'],
      'Bánh mì giòn rụm, thịt nguội, pa-tê, đồ chua thanh.', 'Một món nhanh gọn, nhiều người thích.', 'herb chili pickle'],
    ['banh-xeo-mien-nam', 'Bánh xèo miền Nam', 'banh', 'fry', 'bot-gao:2 tom:2 thit-heo:1 gia:2 nuoc-cot-dua:1 nghe:1', '321', 4,
      ['plate:#f0e4cb', 'pancake:big:#f0be38', 'shrimp:#e0763a', 'sprout', 'greens:#79ad4c', 'dip:#c98a4b'],
      'Bánh vàng to, giòn thơm nước cốt dừa, cuốn rau chấm mắm.', 'Thường ăn nhiều người cuốn cùng nhau.', 'herb sauce pickle'],
    ['bo-ne', 'Bò né', 'nuong', 'fry', 'thit-bo:2 trung:1 pate:1 banh-mi:1 hanh-tim:1 ca-chua:1', '311', 3,
      ['plate:#6a5a50', 'meat:slice:#9a3a2a', 'egg:fried', 'tomato', 'onion:#d9a23c', 'loaf:small'],
      'Bò áp chảo nóng xèo xèo, trứng, pa-tê, ăn với bánh mì.', 'Dọn trên chảo nóng nên cần "né" khi ăn.', 'pepper herb'],
    ['ca-phe-sua-da', 'Cà phê sữa đá', 'uong', 'drink', 'ca-phe:2 sua-dac:2 da:1', '024', 1,
      ['glass', 'liq:#f1dcb0,#3a2210', 'ice', 'straw:#6a3a22'],
      'Cà phê đậm pha sữa đặc ngọt, đá lạnh.', 'Không thể thiếu trong nhịp sống buổi sáng.', 'ice'],
  ],
  n2: [
    ['lau-mam', 'Lẩu mắm', 'nuoc', 'soup', 'mam-ca:2 ca-loc:2 ca-tim:1 rau-muong:2 thit-heo:1', '413', 5,
      ['pot:#a8452e', 'soup:#c98a3a', 'fish:fillet:#e8d0a0', 'eggplant', 'greens:#79ad4c', 'steam'],
      'Nước lẩu mắm đậm đà, nhiều rau đồng, ăn cùng bún.', 'Một nồi lẩu cho cả nhà vào mùa nước nổi.', 'herb chili lime'],
    ['banh-cong', 'Bánh cống', 'banh', 'fry', 'dau-xanh:2 tom:2 thit-heo:1 rau-song:2', '321', 3,
      ['plate:#efe3c8', 'cake:round:#d9942a', 'shrimp:#e0563a', 'greens:#79ad4c', 'dip:#c98a4b'],
      'Bánh chiên giòn vàng, tôm trên đỉnh, cuốn rau chấm nước mắm.', 'Món chiên giòn thân thuộc của miền sông nước.', 'herb sauce chili'],
    ['bun-nuoc-leo', 'Bún nước lèo', 'nuoc', 'soup', 'bun:2 mam-ca:1 ca-loc:2 xa:1 nuoc-dung:2', '413', 4,
      ['bowl:#f2e8cf:#6a8a3a', 'soup:#d8b45a', 'noodle:bun:#fbf6ea', 'fish:fillet:#e8d0a0', 'greens:#79ad4c'],
      'Nước dùng thơm mắm sả, cá lóc ngọt thịt.', 'Một tô bún đặc trưng của vùng sông nước.', 'herb chili lime'],
    ['nem-nuong-can-tho', 'Nem nướng Cần Thơ', 'nuong', 'grill', 'thit-heo:3 banh-trang:1 rau-song:2 tuong:1 dua-chuot:1', '321', 3,
      ['plate:#eee3cd', 'meat:patty:#b4563a', 'roll:fresh:#f6f0e2', 'cuke', 'dip:#b9743a'],
      'Nem nướng thơm lừng, cuốn rau chấm sốt đậu.', 'Ăn cuốn bánh tráng cùng gia đình.', 'herb pickle sauce'],
    ['bun-mam', 'Bún mắm', 'nuoc', 'soup', 'bun:2 mam-ca:2 tom:1 muc:1 ca-tim:1', '413', 4,
      ['bowl:#efe0c4:#6a4a2a', 'soup:#c98a3a', 'noodle:bun:#faf2dc', 'shrimp:#e0763a', 'squid:#f4ead0', 'eggplant'],
      'Nước mắm đậm đà, nhiều hải sản và rau.', 'Một tô đậm vị của đồng bằng.', 'herb chili lime'],
    ['che-ba-mau', 'Chè ba màu', 'ngot', 'sweet', 'dau-do:1 dau-xanh:1 thach:1 nuoc-cot-dua:1 da:1', '040', 2,
      ['glass', 'liq:#b8452e,#f4d03a,#4f9a5a,#f6efe0', 'ice', 'straw:#e0a23c'],
      'Ba lớp đậu đỏ, đậu xanh, thạch, béo nước cốt dừa.', 'Món ngọt giải nhiệt ngày nóng.', 'ice peanut'],
  ],
  n3: [
    ['hu-tieu-my-tho', 'Hủ tiếu Mỹ Tho', 'nuoc', 'soup', 'hu-tieu:2 thit-heo:1 tom:1 nuoc-dung:2 hanh-phi:1 gia:1', '311', 3,
      ['bowl:#f3e8d0:#4f7a3a', 'soup:#e6c37a', 'noodle:thick:#f9f1dc', 'meat:ball:#c4825a', 'shrimp:#e0763a', 'sprout'],
      'Sợi hủ tiếu dai, nước dùng ngọt thanh, tôm thịt đầy.', 'Ăn sáng ở miền sông nước.', 'herb lime chili'],
    ['ca-loc-nuong-trui', 'Cá lóc nướng trui', 'nuong', 'grill', 'ca-loc:3 banh-trang:2 rau-song:2 mam-nem:1 chuoi-xanh:1', '221', 4,
      ['tray', 'fish:whole:#6a5a4a', 'roll:fresh:#f4efe0', 'herb:#6aa04a', 'dip:#c9a24a'],
      'Cá nướng nguyên con thơm khói, cuốn bánh tráng rau sống.', 'Một cách ăn dân dã giữa đồng.', 'herb sauce chili'],
    ['banh-tet', 'Bánh tét', 'banh', 'steam', 'gao-nep:3 dau-xanh:1 thit-heo:1 la-chuoi:2', '310', 3,
      ['leaf', 'cake:log:#f3eed4', 'beans:#f0d66a', 'meat:cube:#b97a4a'],
      'Nếp dẻo thơm lá chuối, nhân đậu xanh thịt béo.', 'Biểu tượng của ngày Tết miền Nam.', 'pickle'],
    ['keo-dua', 'Kẹo dừa Bến Tre', 'ngot', 'sweet', 'dua:2 duong:2 mat-mia:1 nuoc-cot-dua:1', '040', 3,
      ['plate:#eadcbc', 'candy:#e8c070', 'coconut', 'leaf:small'],
      'Kẹo dẻo thơm dừa, ngọt béo.', 'Quà quê nổi tiếng của xứ dừa.', 'peanut'],
    ['chuoi-nep-nuong', 'Chuối nếp nướng', 'ngot', 'grill', 'chuoi:3 gao-nep:1 nuoc-cot-dua:1 la-chuoi:1', '030', 3,
      ['leaf', 'banana', 'coconut', 'vung'],
      'Chuối bọc nếp nướng, rưới nước cốt dừa béo thơm.', 'Món ăn chiều thơm lừng mùi than.', 'peanut'],
    ['nuoc-dua-tuoi', 'Nước dừa tươi', 'uong', 'drink', 'dua:2 da:1', '020', 1,
      ['coco', 'straw:#e0a23c', 'ice'],
      'Nước dừa trong mát, ngọt thanh.', 'Giải khát tự nhiên giữa trưa nắng.', 'ice'],
  ],
  n4: [
    ['bun-ca-chau-doc', 'Bún cá Châu Đốc', 'nuoc', 'soup', 'bun:2 ca-loc:2 nghe:1 xa:1 mam-ca:1 nuoc-dung:2', '413', 4,
      ['bowl:#f4e9ce:#c28a2a', 'soup:#e8b83a', 'noodle:thin:#faf4e4', 'fish:fillet:#e8c070', 'herb:#79ad4c', 'steam'],
      'Nước dùng vàng nghệ, thơm sả mắm, cá lóc dai ngọt.', 'Một tô bún quen thuộc ở vùng biên giới.', 'herb chili lime'],
    ['lau-ca-linh-dien-dien', 'Lẩu cá linh bông điên điển', 'nuoc', 'soup', 'ca-linh:3 dien-dien:2 nuoc-dung:2 ca-chua:1 rau-muong:1', '312', 5,
      ['pot:#9a5a3a', 'soup:#e8b24a', 'fish:whole:#d9c8a0', 'flower:#f4d03a', 'tomato', 'steam'],
      'Nước lẩu chua dịu, cá linh béo, hoa vàng ngọt dịu.', 'Gắn liền với mùa nước nổi.', 'herb chili lime'],
    ['ca-kho-to', 'Cá kho tộ', 'com', 'simmer', 'ca-loc:3 duong:1 nuoc-mam:2 tieu:1 ot:1 gao:1', '431', 4,
      ['pot:#4a3a30', 'soup:#6a3a1a', 'fish:fillet:#a8683a', 'chili', 'onion:#8cc063', 'pepper'],
      'Cá kho đậm đà, sánh nước ngọt mặn, ăn với cơm trắng nóng.', 'Món cơm nhà đưa cơm bậc nhất.', 'pepper chili herb'],
    ['chao-ca-loc-rau-dang', 'Cháo cá lóc rau đắng', 'nuoc', 'soup', 'gao:2 ca-loc:2 rau-dang:2 hanh-la:1 tieu:1', '310', 3,
      ['bowl:#eee3c8:#4f7a3a', 'soup:#ece1b8', 'fish:fillet:#f0d6a0', 'greens:#5d8f3a', 'onion:#8cc063', 'pepper'],
      'Cháo sánh, cá ngọt, rau đắng chát nhẹ lạ miệng.', 'Một bát cháo bổ ấm bụng.', 'pepper herb chili'],
    ['banh-bo-thot-not', 'Bánh bò thốt nốt', 'banh', 'steam', 'bot-gao:2 duong-thot-not:2 nuoc-cot-dua:1 dua:1', '040', 3,
      ['plate:#f1e6c8', 'cake:round:#e8b45a', 'coconut', 'vung'],
      'Bánh xốp mềm, ngọt thơm đường thốt nốt.', 'Món ngọt đặc trưng vùng núi Bảy Núi.', 'peanut'],
    ['nuoc-thot-not', 'Nước thốt nốt', 'uong', 'drink', 'duong-thot-not:2 da:1 dua:1', '030', 2,
      ['glass', 'liq:#d9b060,#f4e3b0', 'ice', 'straw:#6a8a3a'],
      'Nước ngọt thơm đường thốt nốt, mát lạnh.', 'Giải khát quen thuộc của vùng đồng bằng.', 'ice'],
  ],
  n5: [
    ['bun-quay', 'Bún quậy Phú Quốc', 'nuoc', 'soup', 'bun:2 ca:1 tom:2 nuoc-dung:2 chanh:1 ot:1', '322', 3,
      ['bowl:#f2e8d0:#2a8a9a', 'soup:#e8c27a', 'noodle:bun:#faf4e4', 'shrimp:#e0763a', 'meat:ball:#d9b88a', 'lime'],
      'Nước chấm "quậy" chanh ớt, bún, tôm, chả ngọt dai.', 'Gắn với những quán nhỏ trên đảo.', 'herb chili lime'],
    ['goi-ca-trich', 'Gỏi cá trích', 'kho', 'roll', 'ca-trich:3 dua:1 lac:1 rau-song:2 banh-trang:1 nuoc-mam:1', '322', 4,
      ['plate:#eef0e6', 'fish:fillet:#f2ead0', 'greens:#79ad4c', 'peanut', 'roll:fresh:#f4efe0', 'dip:#c98a4b'],
      'Cá tươi trộn dừa, lạc, cuốn rau chấm nước mắm.', 'Món gỏi biển đảo thanh mát.', 'herb chili lime'],
    ['bun-ken', 'Bún kèn', 'nuoc', 'soup', 'bun:2 ca-thu:1 nuoc-cot-dua:2 xa:1 rau-song:1', '321', 3,
      ['bowl:#f4eed8:#b8803a', 'soup:#f2e0a8', 'noodle:thin:#faf6e8', 'fish:fillet:#e8d0a0', 'herb:#79ad4c', 'coconut'],
      'Nước lèo béo cốt dừa, cá thơm sả.', 'Hương vị dịu ngọt vùng biển Nam.', 'herb chili lime'],
    ['cua-rang-muoi', 'Cua rang muối', 'nuong', 'fry', 'cua:3 muoi:2 toi:1 tieu:1 dau-an:1', '420', 3,
      ['plate:#efe3cb', 'crab:#d9402a:big', 'pepper', 'onion:#8cc063', 'lime'],
      'Cua rang giòn mặn, thơm tỏi tiêu.', 'Món hải sản đãi khách ngày vui.', 'pepper lime chili'],
    ['so-diep-nuong-mo-hanh', 'Sò điệp nướng mỡ hành', 'nuong', 'grill', 'so-diep:3 hanh-la:2 lac:1 dau-an:1 toi:1', '310', 3,
      ['plate:#eee6d2', 'shell:#f2d6b8:scallop', 'onion:#8cc063', 'peanut', 'shallot'],
      'Sò điệp nướng thơm, mỡ hành béo, lạc rang bùi.', 'Món nhậu nhẹ, ăn nóng.', 'peanut lime chili'],
    ['che-chuoi-nuoc-cot-dua', 'Chè chuối nước cốt dừa', 'ngot', 'sweet', 'chuoi:3 nuoc-cot-dua:2 duong:1 bot-nang:1 lac:1', '040', 2,
      ['bowl:#f6efe0:#b8803a', 'soup:#f6ecd0', 'banana', 'coconut', 'peanut'],
      'Chuối mềm ngọt, nước dừa béo thơm.', 'Món ngọt ấm lòng buổi tối.', 'peanut'],
  ],
};

// Công thức bí mật (hư cấu): mở khóa bằng cách gom đủ 3 trang sổ rách của miền tương ứng.
const SECRET_BLOCKS = {
  'secret-bac': [
    ['pho-ganh-hoa-sua', 'Phở gánh hoa sữa (hư cấu)', 'nuoc', 'soup', 'banh-pho:2 thit-bo:2 nuoc-dung:3 que-hoi:1 hanh-la:1 trung:1', '310', 5,
      ['bowl:#f9f2e2:#d9a23c', 'soup:#e6bd6a', 'noodle:flat:#f8efd8', 'meat:slice:#a8452e', 'egg:half', 'flower:#f2e8c8', 'steam'],
      'Công thức bí mật trong sổ rách: nước dùng thơm hoa lạ, ngọt sâu.', 'Món do trò chơi sáng tạo ra, không phải món có thật.', 'herb lime chili'],
  ],
  'secret-trung': [
    ['banh-la-mo-co-do', 'Bánh lá mơ cố đô (hư cấu)', 'banh', 'steam', 'bot-gao:2 tom:2 la-mot:1 hanh-phi:1 mam-ruoc:1', '312', 5,
      ['leaf', 'cake:flower:#c9dc9a', 'shrimp:#e0763a', 'greens:#6aa04a', 'shallot', 'dip:#b9743a'],
      'Công thức bí mật trong sổ rách: bánh thơm lá, vị mắm ruốc dịu.', 'Món do trò chơi sáng tạo ra, không phải món có thật.', 'chili shallot sauce'],
  ],
  'secret-nam': [
    ['che-song-dem-trang', 'Chè sông đêm trăng (hư cấu)', 'ngot', 'sweet', 'nuoc-cot-dua:2 thach:1 dau-xanh:1 dua:1 duong-thot-not:1', '040', 5,
      ['glass', 'liq:#2a3a6a,#7a8ac4,#f6efe0', 'ice', 'coconut', 'candy:#f4e3a0', 'straw:#f2e8c8'],
      'Công thức bí mật trong sổ rách: ba lớp xanh bạc như mặt sông đêm.', 'Món do trò chơi sáng tạo ra, không phải món có thật.', 'ice peanut'],
  ],
};

const SECRET_META = {
  'secret-bac': { region: 'bac', level: 6, tier: 3, page: 'trang-so-bac' },
  'secret-trung': { region: 'trung', level: 14, tier: 8, page: 'trang-so-trung' },
  'secret-nam': { region: 'nam', level: 24, tier: 12, page: 'trang-so-nam' },
};

function parseIngs(str) {
  const out = {};
  for (const part of str.trim().split(/\s+/)) {
    const [id, q] = part.split(':');
    out[id] = Number(q);
  }
  return out;
}

function buildDish(row, loc, region, tier, level, idx, secretPage) {
  const [id, name, cat, method, ings, taste, diff, art, desc, cult, gar] = row;
  const ingredients = parseIngs(ings);
  const cost = Object.entries(ingredients).reduce((s, [k, q]) => s + (INGREDIENTS[k] ? INGREDIENTS[k].price * q : 0), 0);
  const price = Math.round(cost * 1.55 + 6 + tier * 2);
  const [salt, sweet, spice] = taste.split('').map(Number);
  return {
    id, name, cat, method, loc, region, tier, level: level + (idx >= 3 ? 1 : 0), idx,
    ingredients, cost, price, learnCost: secretPage ? 0 : price * 2,
    taste: { salt, sweet, spice },
    spicy: spice >= 1 && cat !== 'ngot' && cat !== 'uong',
    diff, art, desc, cult, garnish: gar.split(' '),
    xp: Math.round(4 + price * 0.15 + diff),
    secret: Boolean(secretPage), page: secretPage || null,
    time: 20 + diff * 12,
  };
}


export const DISHES = [];
for (const [loc, rows] of Object.entries(BLOCKS)) {
  const L = LOCATION_BY_ID[loc];
  const tier = LOCATION_INDEX[loc];
  rows.forEach((row, i) => DISHES.push(buildDish(row, loc, L.region, tier, L.level, i, null)));
}
for (const [loc, rows] of Object.entries(SECRET_BLOCKS)) {
  const m = SECRET_META[loc];
  rows.forEach((row, i) => DISHES.push(buildDish(row, loc, m.region, m.tier, m.level, i, m.page)));
}

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));
export const START_DISHES = ['pho-bo', 'bun-cha', 'banh-cuon'];
