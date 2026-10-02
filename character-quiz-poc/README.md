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

## Kiến trúc dữ liệu

`npm.cmd run dev` chạy Vite và Node/Express API cùng lúc. Vite chuyển tiếp `/api` đến `127.0.0.1:3001`; SQLite dùng `better-sqlite3`, bật WAL/foreign keys và lưu tại `server/data/character-match.sqlite` (được gitignore). API `/api/health` trả số hồ sơ/tag; `/api/match` tính IDF/cosine similarity trực tiếp từ SQLite. Chỉ tag hành vi của người dùng được gửi để đối sánh; câu trả lời thô và góp ý không được lưu trong DB.

AniList được tích hợp như nguồn metadata bên thứ ba qua package `anilist-node`; không crawl toàn bộ catalog. Khi kết quả cần làm giàu dữ liệu, backend sync tối đa ba nhân vật/lượt theo AniList ID hoặc tên chính xác cộng series tương ứng. SQLite chuẩn hóa nhân vật, aliases, series, genres theo series, quan hệ character-series, nguồn metadata, ngày đồng bộ, context genre và archetype biên tập thành các bảng riêng. Các hồ sơ seed được migrate idempotent; metadata AniList cập nhật theo external ID và nguồn để có thể bổ sung provider khác sau này. Không lưu mô tả nhân vật dài.

AniList profile image URL cũng được lưu với `storage_permission_status` tách biệt khỏi `reuse_permission_status`. Thỏa thuận lưu trữ đã xác nhận cho phép lưu metadata/URL; trạng thái quyền tái sử dụng ảnh vẫn `unverified` cho tới khi có xác nhận riêng. Ảnh đã có license kiểm chứng được ưu tiên hơn; ảnh AniList hiển thị kèm cảnh báo và link hồ sơ.

Matching tính IDF/cosine chỉ từ behavioral traits như trước. Context genre và archetype biên tập được dùng cho filter; AniList genres theo series được hiển thị và dùng làm tín hiệu đa dạng cho Wildcard, không cộng vào điểm tính cách. Archetype lưu source, confidence và review status; giá trị seed hiện là `proposed`, không phải nhãn khách quan do AniList cấp.

## Ảnh và quyền sử dụng

Ảnh lưu từ AniList kèm liên kết hồ sơ; quyền lưu theo thỏa thuận của dự án không tự xác minh quyền tái sử dụng ảnh. Giao diện gắn nhãn quyền tái sử dụng chưa xác minh. Nếu chưa có ảnh phù hợp hoặc sync thất bại, giao diện dùng chữ cái đầu tên nhân vật. Các ảnh Commons cũ nếu có vẫn giữ metadata license riêng.

Các route tiện dụng: `GET /api/health`, `GET /api/metadata/filters`, `GET /api/metadata/anime-genres`, `GET /api/anilist/characters/search?q=...`, `POST /api/anilist/characters/sync` và `POST /api/match`. Sync được tuần tự hóa theo giới hạn tốc độ cục bộ, tối đa ba nhân vật mỗi request; không có crawl hàng loạt. `sources` cùng các khóa external ID/source cho phép thêm adapter Jikan/MAL hoặc nguồn khác mà không đổi mô hình genre/archetype; hiện chỉ AniList được triển khai. Đây là POC, chưa có xác thực API hoặc rà soát pháp lý đầy đủ cho phát hành production.

Trang có thể tải phông chữ từ Google Fonts, nhưng không gửi câu trả lời thô trong yêu cầu tải phông chữ. JSON phản hồi chỉ được tạo khi người dùng nhấn tải; hãy xem lại nội dung trước khi chia sẻ.
