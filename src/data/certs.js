// Chứng nhận ẩm thực: mỗi khi đạt mốc cấp độ, một vị giám khảo sẽ ghé quán và gọi một món. Nấu đủ sao thì nhận chứng nhận. Cấp cuối là THỰC THẦN.
export const CERTS = [
  { id: 'c1', name: 'Đầu bếp được công nhận', level: 5, need: 2, icon: 'b-spoon', judge: 'Giám khảo Hội Ẩm thực địa phương',
    desc: 'Giám khảo hội ẩm thực địa phương ghé thăm và thử món của bạn.', reward: { money: 400, xp: 150, rep: 4 } },
  { id: 'c2', name: 'Đầu bếp có nghề', level: 10, need: 2, icon: 'b-star', judge: 'Giám khảo Hiệp hội Đầu bếp',
    desc: 'Đại diện hiệp hội đầu bếp muốn kiểm tra tay nghề của bạn.', reward: { money: 900, xp: 300, rep: 5 } },
  { id: 'c3', name: 'Bếp trưởng', level: 15, need: 3, icon: 'b-hammer', judge: 'Bếp trưởng khách mời',
    desc: 'Một bếp trưởng lão luyện ghé quán, chỉ chấp nhận món xuất sắc.', reward: { money: 1800, xp: 600, rep: 6 } },
  { id: 'c4', name: 'Đại bếp ba miền', level: 20, need: 3, icon: 'b-map', judge: 'Nhà phê bình ẩm thực',
    desc: 'Nhà phê bình ẩm thực nổi tiếng đi khắp ba miền để chấm điểm quán của bạn.', reward: { money: 3500, xp: 1000, rep: 7 } },
  { id: 'c5', name: 'Sao vàng ẩm thực', level: 25, need: 3, icon: 'b-collect', judge: 'Hội đồng Sao vàng',
    desc: 'Hội đồng Sao vàng cử người đến thử món một cách kín đáo.', reward: { money: 7000, xp: 1800, rep: 8 } },
  { id: 'c6', name: 'THỰC THẦN', level: 30, need: 3, icon: 'b-level', judge: 'Hội đồng Thực Thần',
    desc: 'Chứng nhận cao nhất: Hội đồng Thực Thần đích thân thử món của bạn.', reward: { money: 20000, xp: 0, rep: 10 } },
];
export const CERT_BY_ID = Object.fromEntries(CERTS.map((c) => [c.id, c]));
