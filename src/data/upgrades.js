// Nâng cấp quán (tốn tiền), kỹ năng (tốn điểm kỹ năng khi lên cấp) và các giai đoạn mở rộng cơ sở.
export const UPGRADES = {
  stove: { name: 'Bếp & lửa', icon: 'u-stove', max: 5, cost: [200, 380, 650, 1100, 1800], req: [1, 4, 8, 14, 20],
    desc: 'Vùng canh lửa rộng hơn (+3 mỗi cấp), dễ nấu chín đúng độ.' },
  tools: { name: 'Dụng cụ nhà bếp', icon: 'u-tools', max: 4, cost: [150, 320, 600, 1000], req: [1, 3, 7, 12],
    desc: 'Sơ chế nhanh hơn: cần ít lần thao tác hơn (-10% mỗi cấp).' },
  seats: { name: 'Bàn ghế', icon: 'u-seats', max: 4, cost: [180, 350, 700, 1300], req: [1, 5, 10, 16],
    desc: 'Quán trông đông vui hơn: khách ghé dày hơn mỗi cấp (không giới hạn chỗ ngồi).' },
  decor: { name: 'Trang trí quán', icon: 'u-decor', max: 4, cost: [250, 500, 900, 1500], req: [2, 6, 12, 18],
    desc: 'Khách kiên nhẫn hơn (+8% mỗi cấp) và danh tiếng tăng thêm 5% mỗi cấp.' },
  storage: { name: 'Kho lạnh', icon: 'u-storage', max: 3, cost: [300, 700, 1400], req: [3, 9, 15],
    desc: 'Mỗi nguyên liệu chứa thêm 10 SL (mặc định 20).' },
  menu: { name: 'Bảng thực đơn', icon: 'u-menu', max: 5, cost: [120, 250, 450, 800, 1300], req: [1, 4, 8, 13, 19],
    desc: 'Thêm 2 chỗ trong thực đơn (mặc định 4 món).' },
  assistant: { name: 'Thuê phụ bếp', icon: 'u-assistant', max: 2, cost: [500, 1500], req: [6, 14], wage: [12, 25],
    desc: 'Mở khóa ở cấp 6. Phụ bếp sơ chế sẵn nguyên liệu cho đơn bạn giao (điểm sơ chế khá, không tuyệt đối) trong lúc bạn lo việc khác. Cấp 2: sơ chế nhanh hơn, làm 2 đơn cùng lúc, điểm cao hơn. Tính lương mỗi ngày.' },
  sign: { name: 'Biển hiệu', icon: 'u-sign', max: 3, cost: [400, 900, 1800], req: [4, 10, 17],
    desc: 'Thêm 1 khách mỗi ngày mỗi cấp và tăng nhẹ danh tiếng.' },
};
export const UPGRADE_ORDER = ['stove', 'tools', 'seats', 'decor', 'storage', 'menu', 'assistant', 'sign'];

export const SKILLS = {
  dao: { name: 'Dao thớt', icon: 'k-dao', max: 5, desc: 'Giảm 8% số lần thao tác khi sơ chế mỗi cấp.' },
  lua: { name: 'Canh lửa', icon: 'k-lua', max: 5, desc: 'Mở rộng vùng nấu chín thêm 2 mỗi cấp.' },
  vi: { name: 'Vị giác', icon: 'k-vi', max: 5, desc: 'Nêm nếm chính xác hơn: cộng 6 điểm cho bước nêm mỗi cấp.' },
  bay: { name: 'Bày biện', icon: 'k-bay', max: 5, desc: 'Trình bày đẹp hơn: cộng điểm bước trang trí và tăng 8% tiền tip mỗi cấp.' },
};
export const SKILL_ORDER = ['dao', 'lua', 'vi', 'bay'];

// Mở rộng cơ sở: từ quán nhỏ thành thương hiệu.
export const VENUES = [
  { id: 'quan-nho', name: 'Quán nhỏ đầu ngõ', cost: 0, level: 1, seats: 0, customers: 0, rep: 0 },
  { id: 'quan-khang-trang', name: 'Quán khang trang', cost: 1500, level: 8, seats: 1, customers: 2, rep: 0.1 },
  { id: 'nha-hang', name: 'Nhà hàng Thực Thần', cost: 6000, level: 18, seats: 2, customers: 3, rep: 0.15 },
  { id: 'thuong-hieu', name: 'Thương hiệu ẩm thực ba miền', cost: 15000, level: 26, seats: 2, customers: 4, rep: 0.2 },
];

// Uy tín của quán chạy trên thang 0 đến 100.
export const REP_RANKS = [
  [0, 'Quán chưa ai biết'], [15, 'Quán quen của xóm'], [30, 'Quán được nhắc tên'], [45, 'Quán có tiếng'],
  [60, 'Quán đáng ghé'], [75, 'Quán nổi danh'], [88, 'Địa chỉ ẩm thực'], [96, 'Huyền thoại ba miền'],
];

export const LEVEL_TITLES = [
  [1, 'Đầu bếp mới vào nghề'], [4, 'Đầu bếp quán nhỏ'], [8, 'Đầu bếp có nghề'], [12, 'Đầu bếp lành nghề'],
  [17, 'Bếp trưởng'], [22, 'Bếp trưởng nổi danh'], [27, 'Đại sư ẩm thực'], [30, 'Thực Thần'],
];

export const MAX_LEVEL = 30;
