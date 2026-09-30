# POC - Nhân vật giống mình

Ứng dụng React/Vite để thử 10 tình huống trong [bản thiết kế](../anime-character-match.md). POC chỉ kiểm tra câu chữ và lựa chọn: **chưa chấm điểm hoặc ghép nhân vật**.

## Chạy thử

Yêu cầu Node.js 20.19+ hoặc 22.12+ và npm. Trên PowerShell (nếu `npm` bị chặn bởi execution policy, dùng `npm.cmd`):

```powershell
cd character-quiz-poc
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Lệnh `npm.cmd run build` kiểm tra bản phát hành; `npm.cmd run lint` kiểm tra mã nguồn.

## Cách dùng

Trả lời hoặc bỏ qua từng câu; có thể quay lại từ thanh tiến độ hoặc màn tổng kết. Chọn cờ góp ý và nhập nhận xét nếu câu hỏi chưa rõ, thiếu lựa chọn hoặc một lựa chọn có vẻ đúng hơn. Khi hoàn tất, nhấn **Tải phản hồi JSON** để lưu đáp án và góp ý về máy.

Đáp án và góp ý chỉ nằm trong bộ nhớ của tab; tải lại hoặc đóng tab sẽ xóa phiên. Không có backend và không gửi câu trả lời lên máy chủ. Trang có thể tải phông chữ từ Google Fonts, nhưng không gửi nội dung câu trả lời trong yêu cầu tải phông chữ. JSON chỉ được tạo khi người dùng nhấn tải; hãy xem lại nội dung trước khi chia sẻ.
