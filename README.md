# Sổ Tay Thực Thần

Game quản lý quán ăn và khám phá ẩm thực ba miền Bắc, Trung, Nam. Chạy hoàn toàn trên trình duyệt, **không cần cài thư viện nào**, chơi được khi không có mạng.

## Chạy game

Cần Node.js 18 trở lên.

```
npm start
```

Mở http://localhost:5173 (đổi cổng: `PORT=8080 npm start`).

Lệnh khác:

| Lệnh | Việc làm |
|---|---|
| `npm test` | 21 bài kiểm thử lõi game (dữ liệu, kinh tế, nấu, bán hàng, lưu/tải, bot chơi 60 ngày...) |
| `npm run assets` | Vẽ lại toàn bộ SVG vào thư mục `assets/` |
| `npm run check` | Kiểm tra mọi SVG hợp lệ và không có tham chiếu tệp gãy |

## Cách chơi

1. **Phục vụ**: mở quán, nhận đơn, nấu, giao món trước khi khách hết kiên nhẫn.
2. **Nấu bằng trí nhớ**: chọn nguyên liệu, chọn dụng cụ rồi chạm 3 đến 6 mục tiêu (sơ chế), chọn mức lửa rồi bấm Dừng (canh lửa), nêm mặn/ngọt/cay, chọn món ăn kèm. Quên thì mua **Gợi ý** từng bước (tốn tiền, bước đó tối đa 70 điểm). Cách nấu từ A đến Z của món đã học nằm trong **Sổ tay**. **Nấu thử** trong Sổ tay miễn phí, không tốn nguyên liệu, không tính điểm.
   - **Thông thạo món Lv1–5**: phục vụ khách đạt sao để tích điểm (1/2/4 điểm cho 1/2/3 sao), lên Lv2–4 tự động. Lv5 **THỰC THẦN** (khung vàng, 3 sao vàng, giá ×1.25) cần đủ 260 điểm và nguyên liệu thăng hoa (2 Hiếm của địa điểm gốc + 1 Quý của miền).
   - **Thu thập** (Kho & chợ > Thu thập, hoặc trên Bản đồ): nguyên liệu thường + cơ hội nhặt nguyên liệu Hiếm/Quý (có bảo hiểm sau 5 và 12 lần).
   - **Phụ bếp** (mở khóa cấp 6): sơ chế sẵn đơn bạn giao trong lúc bạn làm việc khác, hoặc nhờ ngay ở bước sơ chế. Điểm khá chứ không tuyệt đối, tính lương mỗi ngày.
   - **Nhạc nền vui nhộn** (nhịp nhanh) tự tổng hợp, bật/tắt và chỉnh âm lượng trong Thêm > Cài đặt.
3. **Kho & chợ**: mua nguyên liệu, chọn món vào thực đơn, chỉnh giá.
4. **Bản đồ**: đến 15 địa điểm, thu thập nguyên liệu, nói chuyện, nấu tặng nhân vật, học công thức. Gom 3 trang sổ rách mỗi miền để ghép công thức bí mật.
5. **Nhiệm vụ**: chính, ngày, tuần, nhân vật, lễ hội. **Thêm**: nâng cấp, kỹ năng, mở rộng cơ sở, thành tựu, thống kê, cài đặt.

Miền Trung mở ở cấp 10 (cộng nhiệm vụ "Chuyến tàu vào Trung"), Miền Nam ở cấp 19.

## Cấu trúc

```
index.html            trang duy nhất
src/main.js           điểm vào
src/style.css         giao diện (ưu tiên điện thoại, có bố cục máy tính)
src/data/             DỮ LIỆU: món ăn, nguyên liệu, địa điểm, nhân vật, nhiệm vụ, nâng cấp
src/core/             LÕI game thuần (không đụng DOM, kiểm thử được bằng Node)
src/art/              SVG vẽ bằng mã: món ăn, icon, người, cảnh, bản đồ
src/ui/               màn hình, hộp thoại, nấu ăn, lưu/nhập/xuất
scripts/              máy chủ tĩnh, xuất SVG, kiểm tra SVG
tests/                kiểm thử
assets/               SVG đã xuất (logo, icon, món, người, bản đồ...)
```

Nguyên tắc: giao diện chỉ gọi hàm trong `core/`, lõi sửa một đối tượng `state` thuần rồi `commit()` để lưu và vẽ lại.

## Thêm nội dung (chỉ sửa dữ liệu)

- **Món mới**: thêm một dòng vào khối địa điểm tương ứng trong `src/data/dishes.js` (id, tên, nhóm, kỹ thuật, nguyên liệu, mức độ khó, mô tả SVG bằng các mã như `bowl:#f6efe0:#a8452e`).
- **Địa điểm / nhân vật**: `src/data/locations.js`, `src/data/npcs.js`.
- **Nhiệm vụ, thành tựu, lễ hội**: `src/data/quests.js`. **Nâng cấp, kỹ năng, cơ sở**: `src/data/upgrades.js`.

## Cân bằng (các núm chỉnh)

- Giá bán và kinh nghiệm món: công thức `price`, `xp` trong `src/data/dishes.js`.
- Đường cong cấp độ `xpForLevel`, thể lực `maxStamina`: `src/core/progression.js`.
- Tiền theo sao `STAR_PAY`, ngưỡng sao `STAR_MIN`: `src/core/cooking.js`.
- Tỉ lệ XP nhận từ nhiệm vụ `XP_SCALE`: `src/core/quests.js`.

Bot hoàn hảo trong bài kiểm thử đạt cấp 10 khoảng ngày 9, mở Miền Nam khoảng ngày 36, cấp 30 khoảng ngày 103.

## Lưu trữ

Tự lưu vào `localStorage` sau mỗi hành động quan trọng, có checksum và bản sao lưu liền trước. Bản lưu hỏng không bị xóa: game hiện màn hình khôi phục (dùng bản sao lưu, xuất bản hỏng, hoặc chơi mới). Có xuất/nhập tệp .json và xóa tiến trình (xác nhận hai lần) trong **Thêm > Cài đặt**.

## Giới hạn đã biết

- Nguyên liệu không hết hạn; kho chỉ giới hạn theo sức chứa.
- Độ kiên nhẫn của khách dừng khi bạn đang nấu hoặc mở hộp thoại (để chơi trên điện thoại không bị bất công).
- Âm thanh tự tổng hợp đơn giản bằng Web Audio, không có nhạc nền.
- Lễ hội chạy theo "tháng" 30 ngày trong game, không theo lịch thật.
- Một ca bán hàng mỗi ngày game.
- Không có Service Worker/PWA: cần mở máy chủ cục bộ (`npm start`) mỗi lần chơi.


## Bản v3 (cập nhật)
- Nấu ăn gọn 3 bước: chọn số lượng nguyên liệu (dư/thiếu làm lệch vị), sơ chế, canh lửa. Gợi ý: 3 lần miễn phí mỗi món, sau đó tốn tiền và trừ điểm.
- Uy tín 0 đến 100 ảnh hưởng lượng khách; đánh giá và lời nhận xét của khách; giám khảo và 6 chứng nhận (cuối cùng THỰC THẦN).
- Quản lý thực đơn hiện lãi/tỷ suất và sắp xếp theo lợi nhuận; Kết thúc ngày, báo cáo, Qua ngày mới.
- Thể lực hồi theo thời gian; thu thập bằng 3 thẻ úp; icon nguyên liệu riêng; nút "!" tiểu sử món; đổi tên quán, chủ đề và màu.
- Phát hành: xem `HUONG_DAN_PHAT_HANH.md` (`npm run build` tạo thư mục `dist`).

## v3.2 — bổ sung
- Màn hình bắt đầu dùng ảnh bản đồ `assets/ui/title-map.jpg`.
- Nút **GÓP Ý**: mở `src/data/links.js`, dán link Google Form vào `FEEDBACK_URL` (giữa hai dấu nháy) rồi lưu. Để trống thì nút chỉ hiện thông báo "sẽ sớm mở".
- Nút **Ủng hộ** hiện ảnh QR `assets/ui/donate-qr.jpg` (có trên màn hình bắt đầu và thanh trên cùng khi chơi). Muốn đổi QR, thay ảnh cùng tên.

## v3.3 — bổ sung
- Màn hình bắt đầu: nút Chơi mới / Tiếp tục nằm đúng khung dưới logo; GÓP Ý và Ủng hộ ở khoảng trống bên trái, không che bản đồ.
- Khách đến không còn giới hạn ghế hay số khách: tần suất theo uy tín, cấp độ, quán lớn; khách chờ càng lâu thì đánh giá càng thấp (đánh giá tốt/xấu thật hơn).
- Chợ: giỏ hàng + nút Thanh toán (không vượt quá tiền đang có), nút "Mua nhanh" mỗi loại 1 hoặc 5 phần (có hỏi lại).
- Báo cáo cuối ngày có đủ Thu / Chi / LÃI-LỖ và tiền đầu ngày, tiền hiện có.
- Uy tín dùng biểu tượng ngôi sao. Món đạt cấp 5 có khung vàng, 3 ngôi sao và chữ THỰC THẦN bên dưới.

## v3.4 — bổ sung
- Tiền hiển thị dạng VNĐ (1 đơn vị trong game = 1.000 VNĐ); "phần" đổi thành "SL".
- Bước nguyên liệu: hiện "Cần N", người chơi tự bấm đúng số lượng (không điền sẵn).
- Bước nêm vị: khách gọi (ví dụ "Mặn vừa · Ngọt nhiều · Ít chua"), người chơi chọn đúng mức cho từng vị.
- Khách đến đều hơn, tính theo uy tín hiện tại: khách thứ hai đến sau khoảng 7–11 giây; uy tín cao thì đông, phục vụ không kịp sẽ bị đánh giá thấp và uy tín tụt.
- Tên đầu bếp: ô nhập để trống, chỉ hiện gợi ý mờ.
- Nút Góp ý / Ủng hộ trên màn hình bắt đầu nâng cao hơn, không đè lên bản đồ.

## v3.5 — bổ sung
- Đồng hồ ngày vẫn chạy khi đang nấu (khách vẫn đến). Ngày dài hơn (330 giây), khách đến thưa hơn lúc đầu và dày dần theo uy tín.
- Nấu xong có nút "Giao món ngay" và "Giao & nấu khách kế" ngay trong bảng kết quả.
- Link Góp ý đã gắn vào `src/data/links.js`.
- Phát hành bằng GitHub + Netlify: xem `HUONG_DAN_PHAT_HANH.md`. Có thanh "Có bản mới! Cập nhật" cho người chơi, `netlify.toml`, `.gitignore`, build tự đổi phiên bản.

## v3.6 — bổ sung
- Giao diện điện thoại gọn hơn (thanh trên cùng, thẻ khách, bảng nấu vừa một màn hình, giỏ hàng một hàng).
- Chợ có ô tìm kiếm không dấu + gợi ý; nguyên liệu chỉ mở khóa khi đã học món cần nó.
- Chấm sao công tâm: một bước yếu (ví dụ canh lửa trượt) thì không thể đạt 3 sao.
- Tải nhanh hơn: build chỉ đưa tệp thật sự dùng (49 tệp, dưới 1 MB), tải song song mô-đun, ảnh nền WebP, đăng ký chế độ offline sau khi game hiện ra.

## v3.7
- Hộp thoại có ô nhập (nhập tên, tìm kiếm) nằm phía trên và tự cuộn vào giữa khi bàn phím hiện, không bị che.
