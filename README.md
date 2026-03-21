# Shop Acc Digital (Firebase)

Bản template này dùng:
- Firebase Auth
- Firestore
- Cloud Functions
- Giao diện hiện đại, có ảnh sản phẩm
- Tự tạo admin đầu tiên và tự seed dữ liệu mẫu nếu chưa có sản phẩm

## Chạy nhanh
1. Cài Firebase CLI
2. Vào thư mục `functions` và chạy:
   ```bash
   npm install
   ```
3. Đăng nhập Firebase:
   ```bash
   firebase login
   ```
4. Deploy:
   ```bash
   firebase deploy
   ```

## Lưu ý
- `firestore.rules` đang để mở hoàn toàn để test cho chạy nhanh.
- Khi dùng thật, bạn nên siết lại rules.
- Ảnh sản phẩm đang dùng URL trực tuyến; bạn có thể thay bằng link riêng.

## Cách dùng
- Đăng ký tài khoản đầu tiên → tự được cấp admin nếu hệ thống chưa có admin.
- Đăng nhập bằng username/mật khẩu.
- Admin có thể thêm sản phẩm, cộng số dư, đổi vai trò và xóa sản phẩm available.
- Nếu chưa có sản phẩm, hệ thống sẽ tự tạo dữ liệu mẫu.
