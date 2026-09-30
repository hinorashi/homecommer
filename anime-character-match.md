# Tìm nhân vật anime giống mình - bản thiết kế thử nghiệm

## Mục tiêu và phạm vi

Người dùng trả lời các tình huống về cách họ thường hành động. Hệ thống trả về 3 nhân vật có cách ứng xử gần nhất, nêu 2 điểm giống và 1 điểm khác biệt có căn cứ. Đây là trải nghiệm giải trí, không phải đánh giá tâm lý hoặc kết luận người dùng "chính là" một nhân vật.

Danh sách biên tập ban đầu gồm 64 ứng viên từ 10 series; mục tiêu phát hành ít nhất 5 hồ sơ được duyệt cho mỗi series (tối thiểu 50 nhân vật), 10 câu hỏi có 3 lựa chọn mỗi câu. Không dùng ngoại hình, giới tính, độ nổi tiếng, điểm IMDb hay sở thích waifu/husbando để tính độ giống. Chưa quyết định công nghệ triển khai hoặc nhà cung cấp AI; cần xác nhận với chủ dự án trước khi chọn.

## Danh sách thử nghiệm từ Top Anime MyAnimeList

Tham khảo thủ công [bảng Top Anime của MyAnimeList](https://myanimelist.net/topanime.php) ngày 30/09/2026. Bảng thay đổi theo thời gian và có nhiều mùa/phim của cùng một series: giữ 10 **series khác nhau đã chọn ở bản trước từ nhóm đầu bảng**, không phải đúng 10 vị trí đầu của bảng hay "top 5 nhân vật" theo lượt yêu thích. Danh sách dưới đây là **ứng viên biên tập**, chưa phải hồ sơ tính cách đã xác minh. Tên ở cột đối kháng có thể tiết lộ tình tiết; vai trò chỉ đúng trong một phần câu chuyện, không phải phán xét nhân vật tốt/xấu. Không sao chép điểm, thứ hạng, mô tả hoặc ảnh MAL vào cơ sở dữ liệu sản phẩm nếu chưa có quyền sử dụng.

| Tác phẩm | Tuyến chính/đồng minh (ứng viên) | Đối kháng theo giai đoạn (ứng viên) |
| --- | --- | --- |
| Sousou no Frieren | Frieren, Fern, Stark, Himmel, Heiter | Aura, Lugner |
| Fullmetal Alchemist: Brotherhood | Edward Elric, Alphonse Elric, Roy Mustang, Riza Hawkeye, Winry Rockbell | Father, Envy |
| Steins;Gate | Rintarou Okabe, Kurisu Makise, Mayuri Shiina, Itaru Hashida, Suzuha Amane | Moeka Kiryuu (chỉ đối kháng ở một phần mạch truyện) |
| Gintama | Gintoki Sakata, Shinpachi Shimura, Kagura, Kotarou Katsura, Toushirou Hijikata | Shinsuke Takasugi (một số arc) |
| Shingeki no Kyojin | Levi Ackerman, Eren Yeager, Mikasa Ackerman, Armin Arlert, Erwin Smith | Reiner Braun, Zeke Yeager (theo góc nhìn/giai đoạn) |
| Hunter x Hunter (2011) | Gon Freecss, Killua Zoldyck, Kurapika, Leorio Paradinight | Hisoka Morow, Chrollo Lucilfer, Meruem (theo từng arc) |
| Ginga Eiyuu Densetsu | Reinhard von Lohengramm, Yang Wen-li, Siegfried Kircheis, Paul von Oberstein, Oskar von Reuenthal | Adrian Rubinsky (đối kháng chính trị) |
| Kaguya-sama wa Kokurasetai: Ultra Romantic | Kaguya Shinomiya, Miyuki Shirogane, Chika Fujiwara, Yuu Ishigami, Ai Hayasaka, Miko Iino | Không gán phản diện chỉ để đủ cơ cấu; xung đột chủ yếu giữa các nhân vật chính |
| Kusuriya no Hitorigoto (gồm mùa 2 trong bảng MAL) | Maomao, Jinshi, Gyokuyou, Xiaolan, Lakan | Suirei (vai trò theo mạch truyện; kiểm tra giai đoạn trước khi gắn nhãn) |
| Vinland Saga Season 2 | Thorfinn, Einar, Arnheid, Snake, Canute | Ketil (đối kháng theo diễn biến nông trại) |

Một nhân vật có thể thuộc nhiều tuyến hoặc thay đổi theo arc; để biên tập phải ghi rõ **bản anime/mùa/tập** và giai đoạn của nhân vật. Chỉ lấy hành vi xuất hiện trong bản anime đã chọn (không suy từ manga/ngoại truyện chưa chuyển thể). Với series có nhiều bản chuyển thể hoặc phần tiếp theo, đối chiếu sự xuất hiện của nhân vật trong đúng bản được chọn trước khi duyệt. Nếu ứng viên thiếu dẫn chứng đáng tin cho ít nhất 4 chiều, thay nhân vật khác cùng series; không gán điểm để đủ số lượng. 64 tên chỉ là hàng đợi, chưa đủ điều kiện được trả về cho người dùng.

## Sáu chiều hành vi

Mỗi chiều có thang từ -2 đến +2; giá trị 0 là trung tính hoặc không nổi bật, **không phải thiếu dữ liệu**. Không chiều nào biểu thị người tốt/xấu.

| Ký hiệu | Chiều | Đầu âm (-2) | Đầu dương (+2) |
| --- | --- | --- | --- |
| E | Đồng cảm | Ưu tiên xử lý việc trước cảm xúc | Chú ý cảm xúc và hoàn cảnh người khác |
| I | Chủ động | Chờ thêm tín hiệu hoặc người dẫn dắt | Tự khởi xướng bước tiếp theo |
| C | Hợp tác | Thích tự giải quyết | Chủ động phối hợp, chia sẻ việc |
| P | Nguyên tắc | Linh hoạt theo hoàn cảnh | Kiên định với quy tắc/cam kết |
| R | Chấp nhận rủi ro | Ưu tiên phương án chắc chắn | Sẵn sàng thử khi chưa chắc kết quả |
| X | Đối diện xung đột | Trì hoãn, giảm căng thẳng trước | Nói thẳng vấn đề để giải quyết |

Các chiều mô tả khuynh hướng trong bối cảnh cụ thể, không gắn nhãn cố định cho mọi giai đoạn phát triển nhân vật. Với nhân vật thay đổi nhiều, hồ sơ phải ghi rõ giai đoạn hoặc không đưa vào bản đầu.

## Ngân hàng câu hỏi thử nghiệm

Người dùng chọn điều mình **thường làm**, không chọn điều mình nghĩ là "nên làm". Mã trong ngoặc là gợi ý quy đổi từng lựa chọn trên đúng hai chiều được ghi ở cột cuối: `+` = +1, `0` = 0, `-` = -1. Đây là giả thuyết nội dung ban đầu, phải kiểm tra với người dùng và người biên tập trước khi áp dụng chính thức. Giao diện không hiển thị mã này.

| # | Tình huống và các lựa chọn | Chiều |
| --- | --- | --- |
| 1 | Đồng đội vừa mắc lỗi và đang bối rối. A. Hỏi họ cần gì rồi cùng khắc phục (`E+, C+`). B. Tự sửa phần ảnh hưởng tới mình (`E0, C-`). C. Lắng nghe họ trước, để họ tự xử lý khi sẵn sàng (`E+, C0`). | E, C |
| 2 | Nhóm có ý tưởng mới nhưng chưa rõ có thành công không. A. Đề xuất thử một bản nhỏ ngay (`I+, R+`). B. Đợi có thêm thông tin rồi mới tham gia (`I-, R-`). C. Tự chuẩn bị phương án an toàn để đề xuất sau (`I+, R-`). | I, R |
| 3 | Một quy định cản trở cách giải quyết nhanh trong lúc mọi người bất đồng. A. Giữ quy định và trình bày thẳng lý do (`P+, X+`). B. Tìm ngoại lệ trước khi trao đổi tiếp (`P-, X-`). C. Nêu vấn đề trực tiếp, đề nghị điều chỉnh quy định (`P-, X+`). | P, X |
| 4 | Bạn thân có vẻ khó chịu với một việc cụ chưa rõ nguyên nhân. A. Hỏi thẳng nhưng cho họ thời gian giải thích (`E+, X+`). B. Đợi họ chủ động nói khi sẵn sàng (`E+, X-`). C. Nói ngay về phần việc đang bị ảnh hưởng (`E0, X+`). | E, X |
| 5 | Công việc chung bị chậm, chưa ai phân chia nhiệm vụ. A. Rủ mọi người chia phần và nhận một phần (`C+, I+`). B. Tự làm phần mình có thể kiểm soát (`C-, I+`). C. Chờ nhóm thống nhất vai trò rồi thực hiện (`C+, I-`). | C, I |
| 6 | Có một lối tắt đạt mục tiêu nhưng phải thay đổi cách làm đã cam kết. A. Giữ cam kết dù tiến độ chậm hơn (`R-, P+`). B. Thử lối tắt và báo rõ thay đổi (`R+, P-`). C. Xin đồng thuận trước khi thử cách mới (`R0, P+`). | R, P |
| 7 | Một người liên tục đến muộn vì đang gặp khó khăn riêng. A. Hỏi thăm và cùng tìm cách giữ cam kết (`E+, P+`). B. Linh động thời hạn cho họ mà không đặt điều kiện mới (`E+, P-`). C. Nhắc rõ thời hạn áp dụng chung cho cả nhóm (`E0, P+`). | E, P |
| 8 | Hai người trong nhóm tranh luận gay gắt. A. Mời cả hai nói rõ bất đồng trước cả nhóm (`C+, X+`). B. Trao đổi riêng từng người rồi tìm điểm chung (`C+, X-`). C. Tập trung hoàn tất phần việc của mình (`C-, X-`). | C, X |
| 9 | Cụ muốn học một kỹ năng chưa từng thử và thời gian có hạn. A. Bắt đầu thực hành ngay, chấp nhận sai (`I+, R+`). B. Học nền tảng trước khi thử (`I+, R-`). C. Tạm chưa bắt đầu, đợi lúc có hướng dẫn (`I-, R-`). | I, R |
| 10 | Cụ nhận ra cách làm chung có vẻ không công bằng với một người. A. Nêu vấn đề trực tiếp và đề nghị sửa quy tắc (`P+, X+`). B. Giúp người đó trong riêng tư trước, tránh tranh luận chung (`P-, X-`). C. Góp ý với người phụ trách trước khi đưa ra nhóm (`P+, X-`). | P, X |

Trong 10 câu, mỗi chiều xuất hiện ít nhất 3 lần. Hai chiều cùng xuất hiện không đồng nghĩa chúng luôn đi cùng nhau: các lựa chọn cần được thử lại để tránh dẫn dắt, phán xét đạo đức hoặc có một đáp án rõ ràng "đẹp" hơn những đáp án khác.

## Hồ sơ nhân vật và kiểm duyệt

Mỗi nhân vật cần: tên chuẩn, tên khác nếu có, tác phẩm liên quan, ID nội bộ, ID nguồn (nếu được phép sử dụng), phạm vi giai đoạn câu chuyện, 6 chiều hành vi, mức tin cậy từng chiều, dẫn chứng ngắn và vị trí nguồn để người biên tập kiểm tra. Ảnh có trường nguồn/quyền sử dụng riêng; thiếu quyền ảnh thì dùng hình thay thế, không tự sao chép ảnh từ API.

Quy trình: AI có thể đề xuất chiều và dẫn chứng để **người biên tập kiểm tra từ nguồn hợp lệ**, sửa hoặc bác bỏ. Không chấp nhận mô tả do AI tạo mà không kiểm chứng; không chép nguyên văn nội dung có bản quyền vào hồ sơ công khai. Duyệt độc lập một mẫu nhân vật để phát hiện bất đồng và hiệu chỉnh định nghĩa chiều. Giá trị chưa đủ căn cứ để trống (`unknown`), không tự điền 0.

Được phép dùng tình tiết truyện làm dẫn chứng. Mỗi dẫn chứng ghi tác phẩm/mùa/tập (hoặc vị trí có thể kiểm tra), bối cảnh và giai đoạn nhân vật; lời giải thích công khai viết lại ngắn gọn bằng lời của đội biên tập. Dẫn chứng tiết lộ bước ngoặt hoặc kết cục phải có nhãn spoiler và được che mặc định cho tới khi người dùng chọn xem; phần kết quả mặc định chỉ nêu khuynh hướng không tiết lộ tình tiết quan trọng.

Chỉ đưa nhân vật vào tìm kiếm khi có ít nhất 4/6 chiều được duyệt, trong đó các chiều dùng để giải thích kết quả phải có dẫn chứng. Chỉ so khớp trên các chiều mà cả người dùng và nhân vật đều có dữ liệu; không xếp nhân vật thiếu dữ liệu lên cao chỉ vì ít điểm lệch. Giữ nhân vật anime làm đối tượng chính; anime là thông tin ngữ cảnh chứ không phải điểm ghép.

## Cách ghép và giải thích bản đầu

1. Với mỗi chiều, lấy trung bình các mã lựa chọn ở những câu thuộc chiều đó, rồi nhân 2 để đưa về khoảng -2 đến +2. Nếu bỏ qua câu hỏi, chỉ tính những câu đã trả lời; không đủ 2 quan sát cho một chiều thì đánh dấu chiều đó `unknown`.
2. So sánh khoảng cách tuyệt đối giữa người dùng và nhân vật trên các chiều có đủ dữ liệu. Bản đầu dùng trọng số bằng nhau, yêu cầu ít nhất 4 chiều hợp lệ. Với mỗi chiều nhân vật còn thiếu, cộng mức phạt 2 (trên khoảng cách tối đa 4); chia tổng cho 6 chiều cố định. Người dùng thiếu dữ liệu thì không áp mức phạt cho nhân vật ở chiều đó và chia theo số chiều người dùng có dữ liệu. Khi bằng điểm, ưu tiên hồ sơ có nhiều chiều được duyệt hơn; không dùng độ nổi tiếng làm điểm cộng ngầm.
3. Lấy 3 nhân vật gần nhất. Nêu hai chiều gần nhất cùng một chiều khác biệt đáng kể (nếu có), diễn đạt như khuynh hướng, kèm nguồn ở trang hồ sơ nhân vật. Nếu không đủ căn cứ cho hai điểm giống, không đưa nhân vật vào kết quả.
4. Không hiển thị tỷ lệ phần trăm "giống nhau" hay suy diễn sức khỏe tâm lý: thang đo chưa được kiểm định khoa học. Cho phép người dùng trả lời lại và gửi phản hồi khi kết quả không hợp lý. Không lưu câu trả lời cá nhân quá phiên sử dụng nếu chưa có sự đồng ý rõ ràng.

Ví dụ thử tay (hồ sơ giả định, **không gán cho nhân vật anime có thật**): người dùng có `E=+1, I=+1, C=+1, P=0, R=-1, X=+1`; hồ sơ A có `(+1,+1,+1,0,-1,0)`, hồ sơ B có `(-1,+1,-1,+1,+1,+1)`. Khoảng cách trung bình lần lượt là `1/6` và `7/6`, nên A đứng trước B. Lời giải thích A: gần ở đồng cảm và hợp tác, khác ở mức độ đối diện xung đột.

## Cách xác nhận trước khi mở rộng

- Biên tập thử 10 nhân vật (mỗi series một người), mỗi hồ sơ có dẫn chứng cho ít nhất 4 chiều; đối chiếu hai người duyệt để chỉnh lại định nghĩa nếu cùng nhân vật mà chấm quá khác nhau.
- Cho 5-10 người dùng thử 10 câu; hỏi riêng câu nào khó hiểu, có đáp án bị xem là "đúng" về mặt đạo đức, và kết quả nào thiếu thuyết phục.
- Dùng ví dụ trả lời cố định để kiểm tra: thay đổi một đáp án chỉ tác động các chiều liên quan; bỏ qua câu không biến thành điểm 0; nhân vật thiếu dữ liệu không vượt nhân vật đủ dữ liệu chỉ do khoảng cách thấp giả tạo.
- Chỉ mở rộng đến tối thiểu 5 hồ sơ được duyệt cho mỗi series sau khi nội dung câu hỏi và lời giải thích qua vòng thử; trước khi dùng dữ liệu/ảnh từ nguồn bên ngoài hoặc chọn công nghệ, xác nhận quyền sử dụng và hỏi chủ dự án.

## Quyết định cần hỏi ở bước tiếp theo

Đã thống nhất dùng bảng Top Anime MyAnimeList để ưu tiên tác phẩm và cho phép spoiler trong dẫn chứng (che mặc định cho người chưa muốn xem). Trước khi nhập dữ liệu/ảnh từ nguồn bên ngoài, cần xác nhận đối tượng sử dụng (nội bộ hay công khai) và quyền sử dụng tương ứng. Trước mọi lựa chọn công nghệ cụ thể (cơ sở dữ liệu, frontend, backend, nhà cung cấp AI, nơi triển khai), hỏi cụ xác minh thay vì tự chốt.