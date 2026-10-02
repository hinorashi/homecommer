# POC - Nhân vật giống mình

Ứng dụng React/Vite để thử 10 tình huống trong [bản thiết kế](../anime-character-match.md). Sau khi rà soát câu trả lời, POC cho xem trước tối đa ba nhân vật anime dựa trên tag hành vi chung và tiêu chí có dẫn nguồn. Tag seed chưa được biên tập duyệt và mốc anime mới nhất chưa xác minh, nên kết quả chỉ là preview.

## Chạy thử

Yêu cầu Node.js 20.19+ hoặc 22.12+ và npm. Trên PowerShell (nếu `npm` bị chặn bởi execution policy, dùng `npm.cmd`):

```powershell
cd character-quiz-poc
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Lệnh `npm.cmd run build` kiểm tra bản phát hành; `npm.cmd run lint` kiểm tra mã nguồn.

## Cách dùng

Trả lời hoặc bỏ qua từng câu; có thể quay lại từ thanh tiến độ hoặc màn tổng kết. Chọn cờ góp ý và nhập nhận xét nếu câu hỏi chưa rõ, thiếu lựa chọn hoặc một lựa chọn có vẻ đúng hơn. Ở màn xem lại, cụ có thể tải JSON hoặc mở kết quả preview; mỗi tag trùng hiển thị diễn giải, nguồn và mốc anime.

Preview hiển thị phần suy luận tính cách của người dùng, tag trùng của từng nhân vật và các tag tính cách khác. Xếp hạng dùng trọng số độ hiếm IDF, có các slot Best Overall, Soulmate/Niche và Wildcard, bộ lọc thể loại/hình mẫu, cùng ba câu drill-down tùy chọn để tinh chỉnh kết quả.

Hồ sơ nhân vật hiện là dữ liệu seed có source URL; chưa có crawler/backend tự động nhập và chuẩn hóa hồ sơ ở quy mô lớn. Tag đang ở trạng thái candidate, một số cutoff anime chưa xác minh; preview không phải dữ liệu đã được biên tập duyệt hay kết quả production. Ảnh trong bản demo dùng asset placeholder cục bộ.

Đáp án và góp ý chỉ nằm trong bộ nhớ của tab; tải lại hoặc đóng tab sẽ xóa phiên. Không có backend và không gửi câu trả lời lên máy chủ. Trang có thể tải phông chữ từ Google Fonts, nhưng không gửi nội dung câu trả lời trong yêu cầu tải phông chữ. JSON chỉ được tạo khi người dùng nhấn tải; hãy xem lại nội dung trước khi chia sẻ.
