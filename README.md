# 🚀 HỆ THỐNG SHOP ACC TỰ ĐỘNG PREMIUM

Đây là mã nguồn hệ thống cửa hàng bán tài khoản game (Shop Acc) tự động 100% được xây dựng trên nền tảng Serverless của **Firebase**. Hệ thống sở hữu giao diện Glassmorphism hiện đại, siêu mượt, tương thích hoàn hảo trên mọi thiết bị (Responsive) và có đầy đủ tính năng quản trị.

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT

### 1. Dành cho Khách hàng (User)
* **Xác thực an toàn:** Đăng nhập/Đăng ký nhanh chóng qua Firebase Authentication.
* **Cửa hàng thông minh:** Hiển thị sản phẩm theo dạng lưới, có bộ lọc theo game và thanh tìm kiếm realtime.
* **Thanh toán tự động:** Mua tài khoản, trừ tiền và hiển thị tài khoản/mật khẩu ngay lập tức với hiệu ứng Pop-up Tích xanh.
* **Vòng quay nhân phẩm:** Minigame vòng quay vô cực, trừ tiền và trả kết quả trúng/trượt ngẫu nhiên.
* **Lịch sử giao dịch:** Lưu vết mọi hoạt động (mua hàng, trúng thưởng, nạp tiền) rõ ràng.
* **Nạp tiền:** Hiển thị thông tin chuyển khoản ngân hàng tự động kèm tính năng copy nội dung nạp một chạm.
* **Trang cá nhân (Profile):** Quản lý thông tin, lấy ID nội bộ (UID) và kiểm tra số dư.

### 2. Dành cho Quản trị viên (Admin)
* **Bảo mật phân quyền:** Trang Admin độc lập (`admin.html`), tự động chặn/đá văng những người không có quyền truy cập. *(Lưu ý: Người đầu tiên đăng ký tài khoản trên hệ thống sẽ tự động được cấp quyền Admin).*
* **Bảng lệnh Terminal:** Giao diện gõ lệnh siêu ngầu như Hacker để quản lý toàn hệ thống.
* **Quản lý Sản phẩm:** Thêm, sửa, xóa sản phẩm trực tiếp trên giao diện với hỗ trợ nhập nhiều ảnh cùng lúc.
* **Quản lý User & Bơm Tiền:** Tìm kiếm User theo Tên/UID/Email, phân quyền, Reset số dư, Khóa (Ban) tài khoản, và **Bơm tiền trực tiếp**.
* **Lịch sử Toàn hệ thống:** Theo dõi mọi dòng tiền và giao dịch của tất cả người dùng.

### 3. Giao diện & Trải nghiệm (UI/UX)
* Thiết kế **Glassmorphism** (kính mờ) trong suốt, hiệu ứng nền Orb chuyển động trôi nổi 3D.
* **Thanh Navigation ghim đáy (Bottom Nav)** tự động chia tỷ lệ linh hoạt (Fluid), hoạt ảnh giọt nước chạy siêu mượt không bao giờ bị lệch trên mọi dòng điện thoại.
* **Pop-up Hiệu ứng động:** Các thông báo giao dịch thành công đều sử dụng hoạt ảnh vẽ dấu Tích Xanh ấn tượng.
* 100% Responsive, chống bóp méo khung hình, chặn zoom ảo (`user-scalable=no`) khi gõ phím trên điện thoại.

---

## 📂 CẤU TRÚC THƯ MỤC

Hệ thống được chia thành kiến trúc Multi-Page Application (MPA) để dễ quản lý:

```text
├── .firebaserc             # Cấu hình project Firebase
├── firebase.json           # Cấu hình Firebase Hosting & Functions
├── firestore.indexes.json  # Cấu hình Index cho Database
├── firestore.rules         # Luật bảo mật Database
├── styles.css              # Tệp CSS cốt lõi (Giao diện & Hoạt ảnh)
├── app.js                  # Tệp JavaScript cốt lõi (Firebase API & Logic)
├── index.html              # Trang chủ & Form Đăng nhập/Đăng ký
├── shop.html               # Trang danh sách Sản phẩm
├── spin.html               # Trang Minigame Vòng Quay
├── history.html            # Trang Lịch sử mua hàng cá nhân
├── topup.html              # Trang thông tin Nạp tiền
├── profile.html            # Trang quản lý Tài khoản cá nhân
├── admin.html              # Trang Quản trị (Dành riêng cho Admin)
└── README.md               # Tài liệu hướng dẫn này