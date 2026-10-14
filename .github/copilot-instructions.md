# Hướng dẫn Copilot cho workspace

## Phạm vi

- Workspace gồm tài liệu kiến trúc doanh nghiệp/AWS và ứng dụng POC `character-quiz-poc/`. Xác định đúng phần người dùng hỏi; không áp dụng giả định của tài liệu kiến trúc vào ứng dụng hoặc ngược lại.
- `character-quiz-poc/` dùng React/Vite ở `src/`, Node/Express và SQLite ở `server/`; package scripts và dependency nằm trong `character-quiz-poc/package.json`.
- Với crawler, metadata, API và giới hạn nguồn dữ liệu, xem `character-quiz-poc/README.md` là tài liệu vận hành chuẩn. Không chép lại danh sách lệnh dài từ README vào hướng dẫn hoặc mã nguồn.

## Khi sửa ứng dụng

- Trước khi sửa, lần theo đúng component/service và bài test gần nhất; giữ thay đổi trong phạm vi yêu cầu, bảo toàn API và hành vi hiện có nếu không được yêu cầu đổi.
- Dùng pattern hiện có: test Node.js qua `node:test`, file test đặt cạnh module tương ứng với hậu tố `.test.js`.
- Khi thêm hoặc đổi crawl/sync, ưu tiên batch có giới hạn và khả năng tiếp tục; tuân thủ rate limit, tránh tải dữ liệu rộng ngoài phạm vi yêu cầu, và không xóa/ghi đè SQLite hiện có.
- Phân biệt quyền lưu metadata/URL với quyền tái sử dụng ảnh. Không đánh dấu ảnh được cấp phép nếu chưa có nguồn xác minh; giữ trạng thái chưa xác minh và thông tin nguồn hiện có.
- Không lưu câu trả lời thô của quiz hoặc góp ý vào database/API nếu yêu cầu không thay đổi rõ ràng nguyên tắc riêng tư này.

## Kiểm tra

- Chạy lệnh từ `character-quiz-poc/`; trên PowerShell dùng `npm.cmd` nếu `npm` bị chặn bởi execution policy.
- Sau thay đổi ứng dụng, ưu tiên kiểm tra hẹp trước; khi phù hợp chạy `npm.cmd test`, `npm.cmd run lint` và `npm.cmd run build`.
- Không chạy crawl/sync diện rộng chỉ để kiểm tra code. Dùng test, fixture hoặc batch nhỏ có giới hạn.

## Giao tiếp

- Ưu tiên tiếng Việt khi người dùng trao đổi bằng tiếng Việt; nêu rõ giả định, lệnh kiểm tra đã chạy và phần chưa xác minh.
- Khi yêu cầu có thể ảnh hưởng dữ liệu ngoài phạm vi, dữ liệu người dùng, quyền sử dụng nội dung hoặc chi phí API, làm rõ tác động trước khi mở rộng phạm vi.