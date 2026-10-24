# Hướng dẫn phát hành "Sổ Tay Thực Thần" bằng GitHub + Netlify (từ A đến Z)

## Mục tiêu
Có một đường link game (ví dụ `https://so-tay-thuc-than.netlify.app`) gửi cho ai cũng chơi được. Sau này bạn sửa game hoặc thêm món mới chỉ cần **bấm 2 nút (Commit + Push)** trên máy, khoảng 1 phút sau Netlify tự đăng bản mới, người chơi mở game sẽ thấy thanh báo **"Có bản mới! Cập nhật"**. Tiến trình chơi của họ không bị mất.

Cách hoạt động: GitHub giữ mã nguồn của bạn. Netlify nhìn vào GitHub, mỗi khi có thay đổi thì tự chạy `npm run build` và đăng thư mục `dist`.

## Chuẩn bị
1. Tài khoản GitHub và Netlify (bạn đã có).
2. Thư mục dự án `so-tay-thuc-than` đã giải nén trên máy (ví dụ `C:\SoTayThucThan`).
3. Chạy thử trước: mở thư mục bằng VS Code, mở Terminal (Terminal > New Terminal), gõ:
   ```
   npm test
   npm run check
   ```
   Thấy `fail 0` và `SVG hợp lệ` là được.

## PHẦN 1. Đưa mã nguồn lên GitHub (dùng GitHub Desktop, dễ nhất)
1. Tải **GitHub Desktop** tại https://desktop.github.com và cài đặt. Mở lên, bấm **Sign in to GitHub.com**, đăng nhập tài khoản GitHub của bạn.
2. Menu **File > Add local repository...** > bấm **Choose...** > chọn thư mục dự án (`C:\SoTayThucThan`).
3. Nếu hiện thông báo "This directory does not appear to be a Git repository", bấm dòng chữ xanh **create a repository** > giữ nguyên tên `so-tay-thuc-than` > bấm **Create repository**.
4. Cột bên trái liệt kê các tệp. **Không thấy** `dist` và `node_modules` là đúng (đã được chặn bởi tệp `.gitignore`).
5. Ô **Summary** bên dưới gõ: `Phát hành lần đầu`. Bấm **Commit to main**.
6. Bấm nút **Publish repository** (phía trên). Bỏ dấu tích **Keep this code private** nếu bạn muốn công khai mã nguồn, hoặc để nguyên nếu muốn riêng tư (cả hai đều dùng được với Netlify). Bấm **Publish repository**.
7. Kiểm tra: vào https://github.com, thấy kho `so-tay-thuc-than` có các thư mục `src`, `assets`, tệp `index.html`, `netlify.toml`.

## PHẦN 2. Cho Netlify đăng game
1. Vào https://app.netlify.com, đăng nhập.
2. Bấm **Add new site > Import an existing project**.
3. Chọn **Deploy with GitHub**. Lần đầu sẽ hỏi quyền: bấm **Authorize** và chọn cho Netlify xem kho `so-tay-thuc-than`.
4. Chọn kho `so-tay-thuc-than`.
5. Màn hình cấu hình: thường đã tự điền theo `netlify.toml`. Kiểm tra:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Bấm **Deploy**. Đợi 1-2 phút đến khi chữ **Published** màu xanh hiện ra.
7. Đổi tên link cho đẹp: **Site configuration > General > Change site name**, gõ ví dụ `so-tay-thuc-than`. Link của bạn là `https://so-tay-thuc-than.netlify.app` (nếu tên bị trùng, thử tên khác).
8. Bấm vào link, chơi thử.

## PHẦN 3. Kiểm tra bản phát hành
1. Mở link trên điện thoại: thấy màn hình bản đồ, bấm Chơi mới, chơi được một lượt.
2. Bấm nút **GÓP Ý**: mở đúng biểu mẫu Google Form của bạn.
3. Bấm nút **Ủng hộ**: thấy mã QR.
4. Trên Chrome (Android): menu 3 chấm > **Thêm vào Màn hình chính** để cài như ứng dụng. Trên iPhone (Safari): nút Chia sẻ > **Thêm vào MH chính**.
5. Tắt mạng rồi mở lại game: vẫn chơi được (lần đầu phải mở có mạng một lần).

## PHẦN 4. Mỗi lần nâng cấp hoặc thêm nội dung (làm đi làm lại)
1. Sửa tệp trong VS Code (ví dụ thêm món ở `src/data/dishes.js`, đổi link góp ý ở `src/data/links.js`).
2. Gõ `npm start`, mở http://localhost:5173 chơi thử xem có đúng không. Gõ `npm test` để chắc không hỏng chỗ khác.
3. Mở **GitHub Desktop**: cột trái hiện các tệp đã sửa. Ô **Summary** gõ mô tả ngắn, ví dụ `Thêm 3 món miền Trung`. Bấm **Commit to main**.
4. Bấm **Push origin** (nút phía trên).
5. Đợi khoảng 1 phút. Vào Netlify > **Deploys**, thấy bản mới **Published**.
6. Người chơi mở game (hoặc quay lại tab) sẽ thấy thanh **"Có bản mới! Cập nhật"**. Họ bấm **Cập nhật** để tải bản mới. Tiến trình chơi vẫn giữ nguyên.

### Quy tắc để người chơi cũ không bị mất tiến trình
- **Không đổi mã (`id`) của món, nguyên liệu, địa điểm đã phát hành** (ví dụ `pho-bo`). Bản lưu của người chơi nhớ theo mã này. Muốn đổi tên hiển thị thì đổi chữ `name`, đừng đổi `id`.
- Thêm món, nguyên liệu, nhiệm vụ mới: thoải mái.
- Sau mỗi lần sửa nhớ chạy `npm test`.

### Nếu bản mới bị lỗi
Vào Netlify > **Deploys**, bấm vào bản cũ chạy tốt > **Publish deploy**. Game quay về bản cũ ngay, bạn sửa lỗi xong rồi đẩy lại.

## Logo/khung Netlify ở góc phải che game
Đó là **Netlify Drawer** (công cụ góp ý dành cho nhóm làm game), không phải của game. Cách tắt:
1. Vào Netlify, mở site của bạn.
2. Vào **Project configuration > Developer settings > Continuous deployment > Collaboration tools**.
3. Bấm **Configure** và **tắt Netlify Drawer**.
4. Mở lại link game (bấm tải lại trang). Người chơi bình thường thường không thấy khung này, nhưng tắt đi cho chắc.
Mẹo tạm thời: thêm `?ntl-drawer-state=hidden` vào cuối link để ẩn khung ở lần mở đó.

## Nếu lỗi
- **Netlify báo build failed**: mở bản deploy, đọc dòng đỏ cuối cùng. Thường do tệp bị thiếu: kiểm tra trên GitHub có đủ thư mục `src`, `assets`, `scripts`, tệp `package.json`.
- **Link mở ra trang trắng**: Publish directory phải là `dist`, Build command phải là `npm run build`.
- **Đã đẩy bản mới mà người chơi vẫn thấy bản cũ**: bảo họ đóng hẳn game rồi mở lại một lần, hoặc bấm tải lại trang. Thanh báo cập nhật sẽ hiện.
- **GitHub Desktop không thấy thay đổi**: nhớ lưu tệp trong VS Code (Ctrl + S).
- **Nút GÓP Ý không mở được**: kiểm tra link trong `src/data/links.js` và biểu mẫu Google Form đã bật "Chấp nhận phản hồi".

## Checklist
- [ ] `npm test` báo `fail 0`
- [ ] Đã Commit và Publish repository lên GitHub
- [ ] Netlify đã Import project, trạng thái Published
- [ ] Đã đổi tên link (site name)
- [ ] Chơi thử trên điện thoại, GÓP Ý và Ủng hộ hoạt động
- [ ] Đã thử quy trình cập nhật một lần: sửa nhỏ, Commit, Push, thấy bản mới trên Netlify

## Ghi chú
- Gói miễn phí của Netlify đủ cho game này (khoảng 1,3 MB mỗi lần tải).
- Ảnh mã QR ủng hộ nằm trong kho GitHub, ai xem được kho công khai cũng thấy ảnh đó. Nếu bạn không muốn vậy, để kho ở chế độ riêng tư (Netlify vẫn đăng bình thường).
