# POC - Nhân vật giống mình

25.413 nhân vật từ 1.898 anime (say no to hentai)

Ứng dụng React/Vite để thử 10 tình huống trong [bản thiết kế](../anime-character-match.md). Sau khi rà soát câu trả lời, POC cho xem trước tối đa ba nhân vật anime dựa trên tag hành vi chung và tiêu chí có dẫn nguồn. Tag seed chưa được biên tập duyệt và mốc anime mới nhất chưa xác minh, nên kết quả chỉ là preview.

## Chạy thử

Yêu cầu Node.js 20.19+ hoặc 22.12+ và npm. Trên PowerShell (nếu `npm` bị chặn bởi execution policy, dùng `npm`):

```powershell
cd character-quiz-poc
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Lệnh `npm run build` kiểm tra bản phát hành; `npm run lint` kiểm tra mã nguồn.

## Cách dùng

Trả lời hoặc bỏ qua từng câu; có thể quay lại từ thanh tiến độ hoặc màn tổng kết. Chọn cờ góp ý và nhập nhận xét nếu câu hỏi chưa rõ, thiếu lựa chọn hoặc một lựa chọn có vẻ đúng hơn. Ở màn xem lại, cụ có thể tải JSON hoặc mở kết quả preview; mỗi tag trùng hiển thị diễn giải, nguồn và mốc anime.

Preview hiển thị phần suy luận tính cách của người dùng, tag trùng của từng nhân vật và các tag tính cách khác. Xếp hạng dùng trọng số độ hiếm IDF, có các slot Best Overall, Soulmate/Niche và Wildcard, bộ lọc thể loại/hình mẫu, cùng ba câu drill-down tùy chọn để tinh chỉnh kết quả.

## Kiến trúc dữ liệu

`npm run dev` chạy Vite và Node/Express API cùng lúc. Vite chuyển tiếp `/api` đến `127.0.0.1:3001`; SQLite dùng `better-sqlite3`, bật WAL/foreign keys và lưu tại `server/data/character-match.sqlite` (được gitignore). API `/api/health` trả số hồ sơ/tag; `/api/match` tính IDF/cosine similarity trực tiếp từ SQLite. Chỉ tag hành vi của người dùng được gửi để đối sánh; câu trả lời thô và góp ý không được lưu trong DB.

AniList được tích hợp như nguồn metadata bên thứ ba qua package `anilist-node`; không crawl toàn bộ catalog. Khi kết quả cần làm giàu dữ liệu, backend sync tối đa ba nhân vật/lượt theo AniList ID hoặc tên chính xác cộng series tương ứng. SQLite chuẩn hóa nhân vật, aliases, series, genres theo series, quan hệ character-series, nguồn metadata, ngày đồng bộ, context genre và archetype biên tập thành các bảng riêng. Các hồ sơ seed được migrate idempotent; metadata AniList cập nhật theo external ID và nguồn để có thể bổ sung provider khác sau này. Không lưu mô tả nhân vật dài.

Màn thư viện riêng tại `/characters` tìm theo tên/bí danh/tên series, lọc context genre, archetype, nhiều AniList anime genre cùng lúc (`animeGenre=action,fantasy`; mặc định anime phải thuộc tất cả thể loại đã chọn, `genreMode=any` để chỉ cần một) và studio (`studio=ufotable`), có phân trang, đồng bộ bộ lọc lên URL và không yêu cầu hoàn thành quiz. Tên nhân vật mở trang chi tiết `/character/:id` (mô tả có ẩn spoiler, đồ thị quan hệ, bạn diễn, anime xuất hiện); tên anime mở `/anime/:id` (thông tin, studio, anime liên quan, danh sách nhân vật). Studio trên hai trang chi tiết là link lọc thư viện theo studio. Mọi trang dùng chung layout với thanh điều hướng dính trên cùng. Nút đồng bộ xử lý các hồ sơ của trang đang xem và hiển thị phần trăm hoàn tất theo số hồ sơ thực đã xử lý. Các bộ lọc catalog không thay đổi điểm matching.

Đồng bộ metadata chủ động từ terminal (mặc định toàn bộ catalog SQLite):

```powershell
npm run metadata:sync -- --name "Kaguya Shinomiya"
npm run metadata:sync -- --series "Steins;Gate" --limit 3
npm run metadata:sync -- --limit 3
```

Không truyền `--name`/`--series` sẽ chọn hồ sơ chưa đồng bộ hoặc đã quá 30 ngày. Dùng `npm run metadata:sync -- --help` để xem trợ giúp. Lệnh chỉ đồng bộ hồ sơ đã tồn tại trong SQLite, không tải toàn bộ catalog AniList.

Crawl hàng loạt từ AniList để làm đầy database (theo pipeline thể loại → anime → nhân vật, ưu tiên anime phổ biến):

```powershell
npm run crawl:genres                                   # 1. đồng bộ GenreCollection
npm run crawl:anime -- --pages 4                       # 2. top 200 anime phổ biến mỗi thể loại (bỏ Hentai, isAdult)
npm run crawl:anime -- --genre Romance --pages 10      #    hoặc một thể loại cụ thể / --popular cho bảng xếp hạng chung
npm run crawl:characters -- --limit 500 --max-pages 2  # 3. nhân vật của anime trong DB, anime phổ biến nhất trước
npm run crawl:details                                  # 4. mô tả/bio nhân vật + studio, phân tích link quan hệ (nhiều favourite trước)
npm run crawl:anime-relations                          # 5. quan hệ giữa các anime (phần trước/sau, spin-off, chuyển thể...)
npm run crawl:all                                      # chạy bước 1-3 với tham số mặc định
npm run crawl -- stats                                 # xem số lượng
```

AniList không có API quan hệ giữa nhân vật. Đồ thị ở trang `/character/:id` được suy ra từ hai nguồn: (1) link `[Tên](https://anilist.co/character/ID)` trong mô tả nhân vật (theo cả hai chiều, kèm câu ngữ cảnh và nhãn gợi ý như "con trai", "servant"; đoạn nằm trong `~! !~` được đánh dấu spoiler và ẩn mặc định), và (2) đồng xuất hiện — nhân vật cùng anime, gom theo từng anime ("cụm"). Nhãn quan hệ là heuristic từ từ khóa gần link nên có thể không chính xác về chiều; giao diện hiển thị câu ngữ cảnh gốc để người đọc tự đối chiếu. Mô tả lưu trong DB đã bỏ link, nên muốn phân tích lại cần `crawl:details -- --force`.

Crawler tuân thủ rate limit AniList (~30 request/phút, tự chờ khi gặp 429), gộp tối đa 25 anime/request cho trang nhân vật đầu tiên và có thể resume: anime đã crawl nhân vật được đánh dấu `characters_synced_at`, chạy lại sẽ chỉ xử lý phần còn lại (`--force` để crawl lại, `--max-pages 0` để lấy toàn bộ nhân vật). Nhấn Ctrl+C một lần để dừng an toàn sau request hiện tại.

Có thể đồng bộ toàn bộ catalog hiện có trong database từ màn quản trị tại `/admin`. Trang hiển thị phần trăm, số hồ sơ synced/cached/not matched/lỗi và lý do từng hồ sơ; checkbox force sẽ bỏ qua cache 30 ngày. Endpoint admin chỉ hoạt động khi API bind loopback (`127.0.0.1`, `localhost` hoặc `::1`); không bật `ALLOW_REMOTE_ADMIN_SYNC` trên môi trường công khai nếu chưa bổ sung xác thực.

AniList profile image URL cũng được lưu với `storage_permission_status` tách biệt khỏi `reuse_permission_status`. Thỏa thuận lưu trữ đã xác nhận cho phép lưu metadata/URL; trạng thái quyền tái sử dụng ảnh vẫn `unverified` cho tới khi có xác nhận riêng. Ảnh đã có license kiểm chứng được ưu tiên hơn; ảnh AniList hiển thị kèm cảnh báo và link hồ sơ.

Matching tính IDF/cosine chỉ từ behavioral traits như trước. Context genre và archetype biên tập được dùng cho filter; AniList genres theo series được hiển thị và dùng làm tín hiệu đa dạng cho Wildcard, không cộng vào điểm tính cách. Archetype lưu source, confidence và review status; giá trị seed hiện là `proposed`, không phải nhãn khách quan do AniList cấp.

## Ảnh và quyền sử dụng

Ảnh lưu từ AniList kèm liên kết hồ sơ; quyền lưu theo thỏa thuận của dự án không tự xác minh quyền tái sử dụng ảnh. Giao diện gắn nhãn quyền tái sử dụng chưa xác minh. Nếu chưa có ảnh phù hợp hoặc sync thất bại, giao diện dùng chữ cái đầu tên nhân vật. Các ảnh Commons cũ nếu có vẫn giữ metadata license riêng.

Các route tiện dụng: `GET /api/health`, `GET /api/catalog/characters`, `GET /api/catalog/anime/:seriesId` (chi tiết anime + studio + anime liên quan + danh sách nhân vật, dùng cho trang `/anime/:id`), `GET /api/catalog/character/:characterId` (chi tiết nhân vật + quan hệ + cụm đồng xuất hiện, dùng cho trang `/character/:id`), `GET /api/metadata/filters`, `GET /api/metadata/anime-genres`, `GET /api/metadata/studios`, `GET /api/anilist/characters/search?q=...`, `POST /api/anilist/characters/sync`, `POST /api/admin/metadata/sync-all`, `GET /api/admin/metadata/sync`, `GET /api/admin/metadata/sync/:jobId` và `POST /api/match`. Sync AniList được tuần tự hóa theo giới hạn tốc độ; sync-on-demand giới hạn ba nhân vật/request, admin job xử lý tuần tự toàn bộ hồ sơ SQLite. Tên hiển thị có thể khác tên chuẩn AniList (ví dụ Levi Ackerman/Levi); resolver thử canonical first-name rồi yêu cầu series anime khớp trước khi lưu. `sources` cùng external IDs theo provider cho phép thêm adapter Jikan/MAL hoặc nguồn khác mà không đổi mô hình genre/archetype; hiện chỉ AniList được triển khai. Đây là POC, chưa có xác thực API hoặc rà soát pháp lý đầy đủ cho phát hành production.

Trang có thể tải phông chữ từ Google Fonts, nhưng không gửi câu trả lời thô trong yêu cầu tải phông chữ. JSON phản hồi chỉ được tạo khi người dùng nhấn tải; hãy xem lại nội dung trước khi chia sẻ.
