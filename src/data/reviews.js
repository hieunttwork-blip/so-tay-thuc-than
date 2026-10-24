// Lời đánh giá của khách. {m} sẽ được thay bằng tên món.
export const REVIEWS = {
  5: ['{m} ngon tuyệt, đúng vị luôn!', 'Hết sẩy, {m} ở đây ăn là nhớ.', 'Phục vụ nhanh, {m} thơm ngon. Sẽ quay lại!', 'Quán nhỏ mà tay nghề thật. {m} rất đáng tiền.', 'Ăn {m} mà muốn gọi thêm một phần nữa.'],
  4: ['{m} ngon, ăn rất vừa miệng.', 'Món ổn, {m} nấu khá chuẩn.', 'Quán sạch sẽ, {m} ngon. Cho 4 sao nhé.', '{m} ngon đấy, chỉ cần tinh tế thêm chút nữa là tuyệt.'],
  3: ['{m} tạm được, ăn không chê vào đâu được.', 'Món bình thường, {m} ăn được.', '{m} ổn nhưng chưa có gì đặc biệt.'],
  2: ['{m} chưa ngon lắm, vị còn lệch.', 'Hơi thất vọng với {m}, mong quán cải thiện.', '{m} ăn tạm, chưa đáng giá tiền.'],
  1: ['{m} dở quá, không quay lại.', 'Chờ lâu mà {m} lại không ngon.', 'Rất tệ, {m} không như mong đợi.'],
};
export const SLOW = ['Hơi chờ lâu một chút.', 'Phải đợi khá lâu mới có món.', 'Phục vụ chậm, mong quán nhanh hơn.'];
export const FAST = ['Lên món nhanh, rất ưng.', 'Phục vụ nhanh gọn.', 'Chưa kịp đói đã có món rồi.'];
export const PRICEY = ['Giá hơi cao so với chất lượng.', 'Giá nhỉnh hơn mặt bằng chung.'];
export const CHEAP = ['Giá hợp lý, rất ưng.', 'Giá mềm mà món ngon.'];
export const TASTE_UNDER = { salt: 'hơi nhạt', sweet: 'thiếu ngọt', sour: 'thiếu chua', spice: 'chưa đủ cay', giavi: 'hơi nhạt', thit: 'hơi ít nhân', haisan: 'hơi ít hải sản', bot: 'phần cái hơi ít', rau: 'thiếu rau', ngot: 'hơi thiếu ngọt', uong: 'hơi nhạt', dacsan: 'thiếu hương vị đặc trưng' };
export const TASTE_OVER = { salt: 'hơi mặn', sweet: 'ngọt gắt', sour: 'chua quá', spice: 'cay quá', giavi: 'hơi mặn gắt', thit: 'hơi ngấy', haisan: 'hơi tanh nồng', bot: 'hơi nhiều cái', rau: 'rau hơi át vị', ngot: 'hơi ngọt gắt', uong: 'hơi đậm', dacsan: 'vị đặc sản hơi lấn át' };
export const JUDGE_OK = ['Tay nghề đạt chuẩn. Tôi sẵn sàng cấp chứng nhận.', 'Món ăn cân bằng và có hồn. Xin chúc mừng!', 'Rất ấn tượng. Quán xứng đáng với chứng nhận này.'];
export const JUDGE_FAIL = ['Món chưa đạt yêu cầu. Tôi sẽ quay lại vào dịp khác.', 'Còn thiếu sự tinh tế. Hãy luyện thêm rồi tôi sẽ ghé lại.'];
export const CRITIC_5 = ['Một bài học về sự cân bằng. Đáng để viết thành một chuyên mục.', 'Chân thực, tinh tế, đúng chất địa phương. Tôi sẽ giới thiệu quán này.'];
export const CRITIC_LOW = ['Vị chưa tròn, kỹ thuật còn thô. Cần nhiều công hơn.', 'Chưa thuyết phục. Tôi sẽ không giới thiệu quán lúc này.'];
