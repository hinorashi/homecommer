# Tìm nhân vật anime giống mình - bản thiết kế thử nghiệm

## Mục tiêu và phạm vi

Người dùng trả lời các tình huống về cách họ thường hành động. Hệ thống trả về 3 nhân vật có cách ứng xử gần nhất, nêu 2 điểm giống và 1 điểm khác biệt có căn cứ. Đây là trải nghiệm giải trí, không phải đánh giá tâm lý hoặc kết luận người dùng "chính là" một nhân vật.

Danh sách biên tập ban đầu gồm 64 ứng viên từ 10 series; mục tiêu về sau là ít nhất 5 hồ sơ được duyệt cho mỗi series (tối thiểu 50 nhân vật). **Giai đoạn hiện tại chỉ hoàn thiện và thử bộ câu hỏi**, tạm dừng chấm nhân vật và chưa trả kết quả ghép. Bản đầu hướng tới website công khai miễn phí; nhóm biên tập hiện chỉ có thể đối chiếu qua tóm tắt chính thức, nên mục tiêu 50 hồ sơ là có điều kiện. Không dùng ngoại hình, giới tính, độ nổi tiếng, điểm IMDb hay sở thích waifu/husbando để tính độ giống. Chưa quyết định công nghệ triển khai hoặc nhà cung cấp AI; cần xác nhận với chủ dự án trước khi chọn.

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

### Mười hồ sơ thử đầu tiên

Mỗi series chọn một người để kiểm tra quy trình trước khi duyệt hàng loạt. Chọn cả tuyến đối kháng để bảo đảm sáu chiều đo hành vi, không ngầm đồng nhất độ giống với mức độ thiện/ác. Danh sách chỉ xác định **thứ tự biên tập**; chưa nhân vật nào có điểm được duyệt.

| Series | Nhân vật thử | Phạm vi cần chốt trước khi chấm |
| --- | --- | --- |
| Sousou no Frieren | Frieren | Hành trình sau khi tổ đội cũ tan rã; dùng các hồi tưởng có ghi bối cảnh. |
| Fullmetal Alchemist: Brotherhood | Envy | Những lựa chọn đối kháng trong bản Brotherhood, không gộp bản chuyển thể khác. |
| Steins;Gate | Rintarou Okabe | Tách thái độ thể hiện công khai khỏi quyết định khi chịu áp lực. |
| Gintama | Shinsuke Takasugi | Chọn arc có đủ hành động và động cơ để đánh giá. |
| Shingeki no Kyojin | Levi Ackerman | Ghi rõ mùa và hoàn cảnh của từng quyết định. |
| Hunter x Hunter (2011) | Meruem | Ghi rõ giai đoạn đầu/cuối arc Kiến Chimera; không trộn hai giai đoạn. |
| Ginga Eiyuu Densetsu | Yang Wen-li | Phân biệt hành vi trong quân đội và quan điểm cá nhân. |
| Kaguya-sama wa Kokurasetai: Ultra Romantic | Kaguya Shinomiya | Phân biệt chiến thuật gây cười và lựa chọn nghiêm túc. |
| Kusuriya no Hitorigoto | Maomao | Dùng phần truyện đã được chuyển thể; không suy động cơ từ manga/tiểu thuyết. |
| Vinland Saga Season 2 | Ketil | Đối chiếu hành vi trong nông trại theo tiến trình câu chuyện. |

Nếu thiếu bằng chứng trong bản anime nêu ở cột phạm vi, thay nhân vật khác cùng series trước khi chuyển sang chấm điểm. Không nhất thiết cân bằng số lượng hai tuyến ở mỗi series: Steins;Gate và Kaguya-sama không có phản diện cố định để áp một nhãn chung.

### Thử khả năng dùng nguồn chính thức: Frieren

Nguồn đã kiểm tra: [hồ sơ nhân vật Frieren](https://frieren-anime.jp/character/chara_group1/1-1/) và các tóm tắt tập ở bảng dưới trên website anime chính thức. Chỉ ghi nhận những việc trang nguồn thật sự nêu, không sao chép nguyên văn:

| Nguồn | Điều nguồn xác nhận | Chưa thể kết luận |
| --- | --- | --- |
| [Tập 1](https://frieren-anime.jp/story/1st/ep01/) | Frieren rời nhóm để tiếp tục tìm hiểu phép thuật; nhiều năm sau trở lại gặp đồng đội theo lời hẹn, rồi bắt đầu chuyến đi mới. | Một chuyến đi không đủ để kết luận mức chủ động/rủi ro ổn định. |
| [Tập 2](https://frieren-anime.jp/story/1st/ep02/) | Frieren nhận lời dạy phép thuật cho Fern, sau đó cùng cô lên đường. | Dạy học không tự chứng minh mức đồng cảm/hợp tác trên thang đo đã định nghĩa. |
| [Tập 4](https://frieren-anime.jp/story/1st/ep04/) | Frieren và Fern thăm Eisen; cả ba đi tìm ghi chép của Flamme theo lời nhờ. | Có hợp tác trong một nhiệm vụ, nhưng không rõ cách chia sẻ quyết định. |
| [Tập 6](https://frieren-anime.jp/story/1st/ep06/) | Frieren chủ động mời Stark cùng đối mặt với con rồng đe dọa làng. | Có sáng kiến mời hợp tác; chưa đủ để suy ra mức chấp nhận rủi ro. |
| [Tập 8](https://frieren-anime.jp/story/1st/ep08/) | Frieren định dùng phép với người của Aura tới gặp lãnh chúa và bị giam. | Có hành động đối đầu, nhưng lý do và cách xử lý xung đột giữa người với người chưa được mô tả đủ. |
| [Tập 10](https://frieren-anime.jp/story/1st/ep10/) | Tóm tắt xác nhận cuộc chiến giữa Frieren và Aura kết thúc. | Kết quả giao chiến không mô tả quá trình lựa chọn; không dùng để tự chấm rủi ro hay nguyên tắc. |
| [Tập 14](https://frieren-anime.jp/story/1st/ep14/) | Frieren nói chuyện với Sein khi Fern và Stark bất hòa. | Tóm tắt không nêu cô nói gì hoặc can thiệp thế nào; chưa thể chấm đồng cảm/xung đột. |
| Hồ sơ nhân vật | Trang chính thức cho biết nhân vật thay đổi mục tiêu tìm hiểu con người và tiếp tục đi cùng Fern, Stark. | Mô tả tổng quát không cho phép tự đặt điểm sáu chiều hay suy ra mọi hành vi giữa các tập. |

**Kết quả thử nguồn:** bảy tóm tắt tập và hồ sơ giới thiệu có tín hiệu về chủ động/hợp tác, nhưng chưa mô tả đủ các lựa chọn về đồng cảm, nguyên tắc, rủi ro và xung đột để duyệt 4/6 chiều. Không quy hành vi giao chiến với quái vật thành cách xử lý bất đồng giữa người với người. Cả sáu điểm vẫn là `unknown`; muốn biên tập thêm phải đọc các tóm tắt chính thức khác hoặc có nguồn quan sát bản anime hợp pháp. Dẫn chứng này là ghi chú nội bộ của đội biên tập, không phải giấy phép sao chép ảnh hoặc văn bản nguồn lên website.

### Phiếu biên tập một nhân vật

- Nhân vật / tên khác / series / bản chuyển thể: ...
- Phạm vi (mùa, arc, tập bắt đầu-kết thúc): ...
- Trạng thái: `ứng viên` -> `đang kiểm chứng` -> `được duyệt` hoặc `bác bỏ`.
- Người đề xuất / người duyệt độc lập / ngày duyệt: ...
- Nguồn tóm tắt chính thức và URL cho từng tập/arc dùng để đối chiếu: ...; quyền dùng ảnh: `chưa rõ` / `được phép` / `không dùng`.

| Chiều | Điểm (-2 đến +2, hoặc `unknown`) | Dẫn chứng: tập, hoàn cảnh, hành động (viết lại) | Mức tin cậy / ý kiến người duyệt |
| --- | --- | --- | --- |
| E - Đồng cảm | `unknown` | Chưa kiểm chứng | Chưa duyệt |
| I - Chủ động | `unknown` | Chưa kiểm chứng | Chưa duyệt |
| C - Hợp tác | `unknown` | Chưa kiểm chứng | Chưa duyệt |
| P - Nguyên tắc | `unknown` | Chưa kiểm chứng | Chưa duyệt |
| R - Chấp nhận rủi ro | `unknown` | Chưa kiểm chứng | Chưa duyệt |
| X - Đối diện xung đột | `unknown` | Chưa kiểm chứng | Chưa duyệt |

Mỗi điểm cần ít nhất một tình huống hành động cụ thể **được mô tả trong nguồn chính thức**, không chỉ lời người khác nhận xét hoặc suy luận từ vẻ ngoài. Nguồn chỉ nêu nội dung tổng quát không đủ để kết luận cách hành xử: giữ `unknown`, không tưởng tượng cảnh hay số tập. Nếu có bằng chứng trái chiều, ghi cả hai và chọn giai đoạn hẹp hơn; nếu vẫn mâu thuẫn, giữ `unknown`. Chỉ chuyển sang `được duyệt` khi có ít nhất 4 chiều đủ dẫn chứng, hai người biên tập thống nhất phạm vi, và lời giải thích spoiler đã được viết lại/đánh dấu phù hợp. Nếu các tóm tắt không đủ 4 chiều, cần bổ sung cách xem anime hợp pháp hoặc nguồn được cấp phép trước khi phát hành kết quả; không hạ chuẩn duyệt cho đủ 50 nhân vật.

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
| 1 | Cụ và đồng đội cùng chịu trách nhiệm bản nộp sau một giờ. Đồng đội vừa phát hiện lỗi khiến phần họ làm không dùng được; phần cụ làm vẫn ổn. A. Hỏi họ đang vướng gì rồi cùng sửa (`E+, C+`). B. Kiểm tra phần mình có liên đới không rồi báo để đồng đội tự sửa lỗi (`E0, C0`). C. Ưu tiên hoàn tất phần của mình rồi báo phần còn vướng (`E-, C-`). | E, C |
| 2 | Nhóm có ý tưởng mới nhưng chưa rõ có thành công không. A. Đề xuất thử một bản nhỏ ngay (`I+, R+`). B. Đợi có thêm thông tin rồi mới tham gia (`I-, R-`). C. Chuẩn bị vài phương án để nhóm cân nhắc trước khi thử (`I0, R-`). | I, R |
| 3 | Một quy định cản trở cách giải quyết nhanh trong lúc mọi người bất đồng. A. Giữ quy định và trình bày thẳng lý do (`P+, X+`). B. Tìm ngoại lệ rồi trao đổi riêng với người phụ trách (`P-, X-`). C. Tạm làm theo quy định nhưng nêu đề nghị sửa cho lần sau (`P0, X+`). | P, X |
| 4 | Bạn thân có vẻ khó chịu với một việc cụ chưa rõ nguyên nhân. A. Hỏi trực tiếp xem họ muốn nói chuyện không (`E+, X+`). B. Để họ có không gian và chờ họ chủ động kể (`E+, X-`). C. Hỏi thẳng việc này có ảnh hưởng kế hoạch chung không (`E-, X+`). | E, X |
| 5 | Công việc chung bị chậm, chưa ai phân chia nhiệm vụ. A. Rủ mọi người chia phần và nhận một phần (`C+, I+`). B. Chờ nhóm thống nhất người điều phối rồi nhận phần được phân (`C+, I-`). C. Tự xử lý một phần đang bị bỏ trống và báo kết quả sau (`C-, I+`). | C, I |
| 6 | Có một lối tắt đạt mục tiêu nhưng phải thay đổi cách làm đã cam kết. A. Giữ cam kết dù tiến độ chậm hơn (`R-, P+`). B. Thử lối tắt và báo rõ thay đổi (`R+, P-`). C. Xin đồng thuận trước khi thử cách mới (`R0, P0`). | R, P |
| 7 | Một người liên tục đến muộn vì đang gặp khó khăn riêng. A. Hỏi thăm và cùng tìm cách giữ cam kết (`E+, P+`). B. Tạm điều chỉnh thời hạn cho họ, rồi bàn lại với nhóm (`E+, P-`). C. Giữ thời hạn chung và phân lại phần việc để nhóm kịp tiến độ (`E0, P+`). | E, P |
| 8 | Hai người trong nhóm tranh luận gay gắt. A. Mời cả hai nói rõ bất đồng trước cả nhóm (`C+, X+`). B. Trao đổi riêng từng người rồi tìm điểm chung (`C+, X-`). C. Tạm tách các việc có thể làm ngay, hẹn lúc khác trở lại bất đồng (`C0, X0`). | C, X |
| 9 | Cụ muốn học một kỹ năng chưa từng thử và thời gian có hạn. A. Bắt đầu thực hành ngay, chấp nhận sai (`I+, R+`). B. Học nền tảng trước khi thử (`I+, R-`). C. Thử theo bài tập có hướng dẫn trước khi tự làm (`I0, R0`). | I, R |
| 10 | Cụ nhận ra cách làm chung có vẻ không công bằng với một người. A. Nêu vấn đề trực tiếp và đề nghị sửa quy tắc (`P+, X+`). B. Hỗ trợ riêng người đó trước rồi đề xuất ngoại lệ (`P-, X-`). C. Hỏi người phụ trách cách áp dụng quy tắc trong trường hợp này (`P0, X0`). | P, X |

Trong 10 câu, mỗi chiều xuất hiện ít nhất 3 lần và có ít nhất hai lựa chọn `+`, `0`, `-` trên toàn bộ bộ câu hỏi. Hai chiều cùng xuất hiện không đồng nghĩa chúng luôn đi cùng nhau: các lựa chọn cần được thử lại để tránh dẫn dắt, phán xét đạo đức hoặc có một đáp án rõ ràng "đẹp" hơn những đáp án khác. Các mã điểm vẫn chỉ là bản nháp; chưa dùng để chấm người dùng hoặc nhân vật khi chưa qua thử nghiệm.

### Thử bộ câu hỏi trước khi chấm điểm

Cho 5-10 người đọc độc lập, không giải thích mã điểm; mỗi người kể lại họ hiểu tình huống và ý nghĩa của từng đáp án ra sao. Hỏi thêm: câu nào thiếu bối cảnh, không có lựa chọn giống cách mình thường làm, hoặc có lựa chọn nghe "đúng đạo đức" hơn hai lựa chọn còn lại. Ghi câu trả lời tự do để sửa ngôn ngữ, không lưu thông tin cá nhân khi chưa được đồng ý. Đảo thứ tự ba đáp án giữa các lượt thử để kiểm tra thiên lệch vị trí.

Chỉ coi bộ câu hỏi là sẵn sàng thử tiếp khi tất cả 10 câu có cách diễn giải thống nhất trong nhóm thử, không có câu nào đa số người thử bỏ vì thiếu lựa chọn phù hợp, và hai người biên tập độc lập đồng ý chiều hành vi mà mỗi đáp án đại diện. Nếu không đạt, sửa chính câu gây nhầm rồi thử lại; không chuyển sang chấm nhân vật trong giai đoạn này.

**Thử vòng 1 (1 người, 30/09/2026):** 9/10 câu có lựa chọn; câu 2 được bỏ qua để thử chức năng, không xem là lỗi nội dung. Câu 1 bị đánh dấu thiếu bối cảnh; sau khi hỏi lại đã bổ sung vai trò, mức ảnh hưởng và thời gian còn lại. Câu 3 từng bị đánh dấu thiếu phương án nhưng người thử sau đó xác nhận cả ba lựa chọn hiện tại đã đủ, nên giữ nguyên câu và mã điểm. POC vẫn cho phép mô tả phương án khác nếu một người thử sau này thấy thiếu. Chưa đủ người thử hoặc đánh giá độc lập để kết luận bộ câu hỏi đạt chuẩn; không lưu đáp án cá nhân trong tài liệu này.

Từ vòng 2, tệp phản hồi có `questionSetVersion: 2026-09-30-r2`. Tệp vòng 1 chưa có trường này; không gộp hai vòng để tính tỷ lệ chọn từng đáp án vì câu 1 đã được viết lại.

**Tình trạng vòng 2:** người thử xác nhận qua trao đổi rằng câu 1 sau khi bổ sung bối cảnh đã rõ và ba phương án của câu 3 đã đủ. Chưa nhận được tệp JSON có `questionSetVersion: 2026-09-30-r2`, nên không suy ra lựa chọn hoặc cờ góp ý cho tám câu còn lại. Đây vẫn là cùng một người thử, không tính là người tham gia độc lập mới.

## Hồ sơ nhân vật và kiểm duyệt

Mỗi nhân vật cần: tên chuẩn, tên khác nếu có, tác phẩm liên quan, ID nội bộ, ID nguồn (nếu được phép sử dụng), phạm vi giai đoạn câu chuyện, 6 chiều hành vi, mức tin cậy từng chiều, dẫn chứng ngắn và vị trí nguồn để người biên tập kiểm tra. Ảnh có trường nguồn/quyền sử dụng riêng; thiếu quyền ảnh thì dùng hình thay thế, không tự sao chép ảnh từ API. Website công khai chỉ hiển thị lời giải thích do đội biên tập tự viết; không sao chép tóm tắt từ nguồn hoặc gắn ảnh khi chưa xác nhận quyền hiển thị công khai.

Quy trình: AI có thể đề xuất chiều và dẫn chứng để **người biên tập kiểm tra từ nguồn hợp lệ**, sửa hoặc bác bỏ. Không chấp nhận mô tả do AI tạo mà không kiểm chứng; không chép nguyên văn nội dung có bản quyền vào hồ sơ công khai. Duyệt độc lập một mẫu nhân vật để phát hiện bất đồng và hiệu chỉnh định nghĩa chiều. Giá trị chưa đủ căn cứ để trống (`unknown`), không tự điền 0.

Được phép dùng tình tiết truyện làm dẫn chứng. Mỗi dẫn chứng ghi URL nguồn tóm tắt chính thức, tác phẩm/mùa/tập (hoặc vị trí có thể kiểm tra), bối cảnh và giai đoạn nhân vật; lời giải thích công khai viết lại ngắn gọn bằng lời của đội biên tập. Dẫn chứng tiết lộ bước ngoặt hoặc kết cục phải có nhãn spoiler và được che mặc định cho tới khi người dùng chọn xem; phần kết quả mặc định chỉ nêu khuynh hướng không tiết lộ tình tiết quan trọng.

Chỉ đưa nhân vật vào tìm kiếm khi có ít nhất 4/6 chiều được duyệt, trong đó các chiều dùng để giải thích kết quả phải có dẫn chứng. Chỉ so khớp trên các chiều mà cả người dùng và nhân vật đều có dữ liệu; không xếp nhân vật thiếu dữ liệu lên cao chỉ vì ít điểm lệch. Giữ nhân vật anime làm đối tượng chính; anime là thông tin ngữ cảnh chứ không phải điểm ghép.

## Cách ghép và giải thích bản đầu

1. Với mỗi chiều, lấy trung bình các mã lựa chọn ở những câu thuộc chiều đó, rồi nhân 2 để đưa về khoảng -2 đến +2. Nếu bỏ qua câu hỏi, chỉ tính những câu đã trả lời; không đủ 2 quan sát cho một chiều thì đánh dấu chiều đó `unknown`.
2. So sánh khoảng cách tuyệt đối giữa người dùng và nhân vật trên các chiều có đủ dữ liệu. Bản đầu dùng trọng số bằng nhau, yêu cầu ít nhất 4 chiều hợp lệ. Với mỗi chiều nhân vật còn thiếu, cộng mức phạt 2 (trên khoảng cách tối đa 4); chia tổng cho 6 chiều cố định. Người dùng thiếu dữ liệu thì không áp mức phạt cho nhân vật ở chiều đó và chia theo số chiều người dùng có dữ liệu. Khi bằng điểm, ưu tiên hồ sơ có nhiều chiều được duyệt hơn; không dùng độ nổi tiếng làm điểm cộng ngầm.
3. Lấy 3 nhân vật gần nhất. Nêu hai chiều gần nhất cùng một chiều khác biệt đáng kể (nếu có), diễn đạt như khuynh hướng, kèm nguồn ở trang hồ sơ nhân vật. Nếu không đủ căn cứ cho hai điểm giống, không đưa nhân vật vào kết quả.
4. Không hiển thị tỷ lệ phần trăm "giống nhau" hay suy diễn sức khỏe tâm lý: thang đo chưa được kiểm định khoa học. Cho phép người dùng trả lời lại và gửi phản hồi khi kết quả không hợp lý. Không lưu câu trả lời cá nhân quá phiên sử dụng nếu chưa có sự đồng ý rõ ràng.

Ví dụ thử tay (hồ sơ giả định, **không gán cho nhân vật anime có thật**): người dùng có `E=+1, I=+1, C=+1, P=0, R=-1, X=+1`; hồ sơ A có `(+1,+1,+1,0,-1,0)`, hồ sơ B có `(-1,+1,-1,+1,+1,+1)`. Khoảng cách trung bình lần lượt là `1/6` và `7/6`, nên A đứng trước B. Lời giải thích A: gần ở đồng cảm và hợp tác, khác ở mức độ đối diện xung đột.

## Cách xác nhận trước khi mở rộng

- Hiện tại: chạy thử đọc hiểu với 5-10 người theo quy trình ở trên; sửa những câu bị hiểu khác nhau, thiếu lựa chọn hợp lý hoặc dẫn dắt đáp án. Không công bố điểm hay kết quả ghép từ câu trả lời trong giai đoạn này.
- Sau khi bộ câu hỏi được duyệt và chủ dự án đồng ý tiếp tục chấm: biên tập thử 10 nhân vật (mỗi series một người), mỗi hồ sơ có dẫn chứng cho ít nhất 4 chiều; đối chiếu hai người duyệt để chỉnh lại định nghĩa nếu cùng nhân vật mà chấm quá khác nhau.
- Chỉ khi có hồ sơ được duyệt mới kiểm tra logic ghép: thay đổi một đáp án chỉ tác động các chiều liên quan; bỏ qua câu không biến thành điểm 0; nhân vật thiếu dữ liệu không vượt nhân vật đủ dữ liệu chỉ do khoảng cách thấp giả tạo.
- Chỉ mở rộng đến tối thiểu 5 hồ sơ được duyệt cho mỗi series sau khi chất lượng câu hỏi và lời giải thích qua vòng thử; trước khi dùng dữ liệu/ảnh từ nguồn bên ngoài hoặc chọn công nghệ, xác nhận quyền sử dụng và hỏi chủ dự án.

## Quyết định cần hỏi ở bước tiếp theo

Đã thống nhất dùng bảng Top Anime MyAnimeList để ưu tiên tác phẩm, cho phép spoiler trong dẫn chứng (che mặc định cho người chưa muốn xem) và hướng tới website công khai miễn phí. **Đã chọn tạm dừng chấm nhân vật để hoàn thiện câu hỏi trước**; không mặc nhiên tiếp tục biên tập hồ sơ từ nguồn tóm tắt chính thức. Khi quay lại bước hồ sơ, cần xác nhận quyền sử dụng dữ liệu/ảnh và đánh giá nguồn có đủ hành vi để duyệt 4 chiều hay không. Trước mọi lựa chọn công nghệ cụ thể (cơ sở dữ liệu, frontend, backend, nhà cung cấp AI, nơi triển khai), hỏi cụ xác minh thay vì tự chốt.