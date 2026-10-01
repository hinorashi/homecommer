# Tìm nhân vật anime giống mình - bản thiết kế thử nghiệm

## Mục tiêu và phạm vi

Người dùng trả lời các tình huống về cách họ thường hành động. Hệ thống trả về 3 nhân vật có cách ứng xử gần nhất, nêu 2 điểm giống và 1 điểm khác biệt có căn cứ. Đây là trải nghiệm giải trí, không phải đánh giá tâm lý hoặc kết luận người dùng "chính là" một nhân vật.

Danh sách biên tập ban đầu gồm 64 ứng viên từ 10 series; mục tiêu về sau là ít nhất 5 hồ sơ được duyệt cho mỗi series (tối thiểu 50 nhân vật). **Giai đoạn hiện tại hoàn thiện câu hỏi và bật màn preview ghép sau khi người dùng rà soát câu trả lời.** Preview chỉ dùng tag candidate có nguồn, ghi rõ tag/mốc anime chưa duyệt; chưa phải kết quả chính thức và chưa dùng để công bố. Chỉ khi trait và cutoff anime được biên tập duyệt mới đủ điều kiện thành kết quả sản phẩm. Không dùng ngoại hình, giới tính, độ nổi tiếng, điểm IMDb hay sở thích waifu/husbando để tính độ giống. Chưa quyết định công nghệ triển khai hoặc nhà cung cấp AI; cần xác nhận với chủ dự án trước khi chọn.

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

Hồ sơ ghi đặc điểm cốt lõi/đích đến của nhân vật theo cách xây dựng được thể hiện trong **bản anime đã phát hành** mới nhất được chọn, không chấm sự thay đổi qua từng tập hoặc từng arc. Một nhân vật có thể nhút nhát lúc đầu nhưng được xây dựng thành dũng cảm về sau; hồ sơ mô tả đặc điểm dũng cảm đã định hình, không lấy trung bình các giai đoạn. Không suy từ manga/ngoại truyện chưa chuyển thể. Vẫn cần nguồn có thể kiểm tra để xác nhận từng chiều được điền, nhưng không cần rà soát mọi tập: ưu tiên hồ sơ nhân vật chính thức và một số nguồn anime đại diện. Chiều thiếu căn cứ giữ `unknown`; không còn ngưỡng tối thiểu 4/6 để giữ hoặc loại nhân vật. Khi ghép từ ít chiều, kết quả phải cho biết độ bao phủ và không diễn giải quá mức dữ liệu. 64 tên chỉ là hàng đợi biên tập, không phải hồ sơ đã duyệt.

### Mười hồ sơ thử đầu tiên

Mỗi series chọn một người để kiểm tra quy trình trước khi duyệt hàng loạt. Có thể chọn nhiều tuyến nhân vật nhưng không đồng nhất độ giống với mức độ thiện/ác. Danh sách chỉ xác định **thứ tự biên tập**; traits chưa được trích xuất/duyệt.

| Series | Nhân vật thử | Đặc điểm cốt lõi cần xác nhận |
| --- | --- | --- |
| Sousou no Frieren | Frieren | Đặc điểm cốt lõi theo anime đã phát hành; không chấm riêng hồi tưởng hay từng chặng. |
| Fullmetal Alchemist: Brotherhood | Envy | Đặc điểm trong bản Brotherhood, không gộp bản chuyển thể khác. |
| Steins;Gate | Rintarou Okabe | Đặc điểm đã định hình trong anime; không lấy trung bình thái độ đầu/cuối. |
| Gintama | Shinsuke Takasugi | Đặc điểm xuyên suốt anime đã phát hành; không cần chấm từng arc. |
| Shingeki no Kyojin | Levi Ackerman | Đặc điểm cốt lõi theo anime đã phát hành, không lập điểm theo từng mùa. |
| Hunter x Hunter (2011) | Meruem | Đặc điểm được xây dựng trong anime; không tách điểm theo đầu/cuối arc. |
| Ginga Eiyuu Densetsu | Yang Wen-li | Đặc điểm tổng thể theo anime đã chọn, gồm vai trò và quan điểm cá nhân. |
| Kaguya-sama wa Kokurasetai: Ultra Romantic | Kaguya Shinomiya | Đặc điểm cốt lõi theo anime; không suy nhãn từ một gag đơn lẻ. |
| Kusuriya no Hitorigoto | Maomao | Đặc điểm theo phần anime đã phát hành; không suy từ manga/tiểu thuyết. |
| Vinland Saga Season 2 | Ketil | Đặc điểm tổng thể theo phần anime đã chọn, không chấm tiến trình từng tập. |

Nếu nguồn trong phạm vi anime đã chọn không xác nhận được một chiều, giữ chiều đó là `unknown`; không cần thay nhân vật chỉ vì hồ sơ có ít chiều được xác nhận. Không nhất thiết cân bằng số lượng hai tuyến ở mỗi series: Steins;Gate và Kaguya-sama không có phản diện cố định để áp một nhãn chung.

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
| Hồ sơ nhân vật | Trang chính thức cho biết nhân vật thay đổi mục tiêu tìm hiểu con người và tiếp tục đi cùng Fern, Stark. | Đây là nguồn để biên tập viên xác nhận traits cốt lõi; không suy diễn ngoài điều nguồn hỗ trợ. |

**Kết quả thử nguồn:** các tóm tắt tập và hồ sơ giới thiệu hiện có chưa đủ để tự xác nhận mọi chiều của Frieren. Theo cách làm mới, đây không phải lý do để rà soát toàn bộ tập hoặc loại nhân vật: dùng hồ sơ nhân vật chính thức và một số nguồn anime đại diện để xác nhận chiều nào có căn cứ; các chiều còn lại giữ `unknown`. Không quy hành vi giao chiến với quái vật thành cách xử lý bất đồng giữa người với người. Dẫn chứng này là ghi chú nội bộ của đội biên tập, không phải giấy phép sao chép ảnh hoặc văn bản nguồn lên website.

### Phiếu biên tập một nhân vật

- Nhân vật / tên khác / series / bản chuyển thể: ...
- Bản anime được chọn / mốc nội dung anime đã phát hành dùng để chốt đặc điểm: ...
- Trạng thái: `ứng viên` -> `đang kiểm chứng` -> `được duyệt` hoặc `bác bỏ`.
- Người đề xuất / người duyệt độc lập / ngày duyệt: ...
- Hồ sơ nhân vật chính thức và một số nguồn anime đại diện cùng URL để xác nhận đặc điểm: ...; quyền dùng ảnh: `chưa rõ` / `được phép` / `không dùng`.

| Category | Tag chuẩn | Nhãn/diễn giải nguồn (viết lại) | URL/loại nguồn và cutoff anime | Confidence / reviewer / status |
| --- | --- | --- | --- | --- |
| Behavior/personality | ... | ... | ... | ... |
| Quality/value | ... | ... | ... | ... |
| Ability | ... | ... | ... | ... |
| Appearance | ... | ... | ... | ... |

Mỗi trait công khai cần nguồn có thể kiểm tra xác nhận đặc điểm cốt lõi theo anime đã phát hành mới nhất; có thể dùng hồ sơ nhân vật chính thức và một số nguồn anime đại diện, không cần xem/chấm mọi tập. Không suy luận từ vẻ ngoài hay tự tưởng tượng chi tiết. Nếu nguồn không đủ rõ hoặc mâu thuẫn, không gán trait đó. Không có ngưỡng tối thiểu số trait để đưa hồ sơ vào catalog hoặc ghép; chỉ dùng tag đã được biên tập xác nhận, ghi độ bao phủ và mức tin cậy để người dùng hiểu giới hạn. Hai biên tập viên duyệt độc lập; nội dung có spoiler phải được đánh dấu và che mặc định. Không hạ chuẩn xác nhận cho đủ số lượng hồ sơ.

## Mô hình trait linh hoạt

Không cố định một bộ sáu chiều. Lưu các đặc điểm được nguồn thể hiện thành tag có thể mở rộng; biên tập viên chuẩn hóa cách viết đồng nghĩa thành tag dùng chung nhưng vẫn giữ nguyên cách nguồn gọi để truy vết. Taxonomy ban đầu có thể có các nhóm như tính cách/hành vi, phẩm chất/giá trị, khả năng và ngoại hình; đây là nhóm phân loại, không phải danh sách trait đóng.

Mỗi tag nhân vật cần loại trait, tên chuẩn, cách gọi trong nguồn, diễn giải ngắn bằng lời biên tập, URL/loại nguồn, anime và mốc phát hành được chọn, độ tin cậy, trạng thái duyệt và cờ spoiler khi cần. Đặc điểm mô tả cách nhân vật được xây dựng ở trạng thái cốt lõi/đích đến trong anime đã phát hành mới nhất, không phải điểm trung bình qua từng tập hoặc arc. Manga và nội dung chưa chuyển thể không được dùng.

Quiz tình huống chỉ tạo trait người dùng thuộc nhóm hành vi/tính cách. Traits về khả năng, ngoại hình và sở thích thuộc luồng khám phá riêng, không ảnh hưởng behavioral match. Tag thiếu căn cứ là `unknown`/chưa có, không có nghĩa nhân vật mang trait đối lập. Mỗi trait được gán vẫn cần nguồn kiểm tra được và người biên tập duyệt; không có ngưỡng cố định về số trait để một nhân vật được ghép.

## Ngân hàng câu hỏi thử nghiệm

Người dùng chọn điều mình **thường làm**, không chọn điều mình nghĩ là "nên làm". Các trait gợi ý dưới đây chỉ là candidate để đối chiếu với taxonomy lấy từ 10 hồ sơ seed; chúng không phải bộ nhãn cố định hay mã điểm. Giữ tình huống hữu ích, rồi remap câu trả lời sang tag hành vi đã được chuẩn hóa và duyệt. Giao diện thử nghiệm không hiển thị mapping nội bộ.

| # | Tình huống và các lựa chọn | Trait ứng viên cần remap |
| --- | --- | --- |
| 1 | Đồng đội làm sai một phần việc ngay trước hạn chót. A. Hỏi họ đang vướng gì rồi cùng sửa. B. Sửa phần mình phụ trách và báo lại để họ xử lý phần còn lại. C. Ưu tiên hoàn tất phần của mình rồi báo phần còn vướng. | Hỗ trợ người khác; phối hợp; tự chủ; ưu tiên nhiệm vụ |
| 2 | Nhóm có ý tưởng mới nhưng chưa rõ có thành công không. A. Đề xuất thử một bản nhỏ ngay. B. Đợi có thêm thông tin rồi mới tham gia. C. Chuẩn bị vài phương án để nhóm cân nhắc trước khi thử. | Khởi xướng; thận trọng; chuẩn bị phương án |
| 3 | Một quy định cản trở cách giải quyết nhanh trong lúc mọi người bất đồng. A. Giữ quy định và trình bày thẳng lý do. B. Tìm ngoại lệ rồi trao đổi riêng với người phụ trách. C. Tạm làm theo quy định nhưng nêu đề nghị sửa cho lần sau. | Tôn trọng cam kết; linh hoạt; trao đổi thẳng |
| 4 | Bạn thân có vẻ khó chịu với một việc cụ chưa rõ nguyên nhân. A. Hỏi trực tiếp xem họ muốn nói chuyện không. B. Để họ có không gian và chờ họ chủ động kể. C. Hỏi thẳng việc này có ảnh hưởng kế hoạch chung không. | Quan tâm cảm xúc; tôn trọng không gian; trực tiếp; tập trung nhiệm vụ |
| 5 | Công việc chung bị chậm, chưa ai phân chia nhiệm vụ. A. Rủ mọi người chia phần và nhận một phần. B. Chờ nhóm thống nhất người điều phối rồi nhận phần được phân. C. Tự xử lý một phần đang bị bỏ trống và báo kết quả sau. | Phối hợp; chờ điều phối; chủ động; tự lực |
| 6 | Có một lối tắt đạt mục tiêu nhưng phải thay đổi cách làm đã cam kết. A. Giữ cam kết dù tiến độ chậm hơn. B. Thử lối tắt và báo rõ thay đổi. C. Xin đồng thuận trước khi thử cách mới. | Giữ cam kết; linh hoạt; minh bạch; tìm đồng thuận |
| 7 | Một người liên tục đến muộn vì đang gặp khó khăn riêng. A. Hỏi thăm và cùng tìm cách giữ cam kết. B. Tạm điều chỉnh thời hạn cho họ, rồi bàn lại với nhóm. C. Giữ thời hạn chung và phân lại phần việc để nhóm kịp tiến độ. | Quan tâm; hỗ trợ; linh hoạt; trách nhiệm chung |
| 8 | Hai người trong nhóm tranh luận gay gắt. A. Mời cả hai nói rõ bất đồng trước cả nhóm. B. Trao đổi riêng từng người rồi tìm điểm chung. C. Tạm tách các việc có thể làm ngay, hẹn lúc khác trở lại bất đồng. | Điều phối; trao đổi trực tiếp; hòa giải; trì hoãn xung đột |
| 9 | Cụ muốn học một kỹ năng chưa từng thử và thời gian có hạn. A. Bắt đầu thực hành ngay, chấp nhận sai. B. Học nền tảng trước khi thử. C. Thử theo bài tập có hướng dẫn trước khi tự làm. | Thử nghiệm; chuẩn bị; tìm hướng dẫn; học kỹ năng |
| 10 | Cụ nhận ra cách làm chung có vẻ không công bằng với một người. A. Nêu vấn đề trực tiếp và đề nghị sửa quy tắc. B. Hỗ trợ riêng người đó trước rồi đề xuất ngoại lệ. C. Hỏi người phụ trách cách áp dụng quy tắc trong trường hợp này. | Công bằng; lên tiếng; hỗ trợ cá nhân; tìm hướng dẫn |

Các trait ứng viên chỉ giúp nhóm biên tập kiểm tra nội dung; tag chuẩn và mapping cuối cùng phải được remap sau khi dựng taxonomy linh hoạt từ 10 hồ sơ seed. Các lựa chọn cần được thử để tránh dẫn dắt, phán xét đạo đức hoặc có một đáp án rõ ràng "đẹp" hơn các đáp án khác. Chưa tính điểm hay trả kết quả trong vòng thử này.

### Thử bộ câu hỏi trước khi chấm điểm

Chủ dự án tự thử trực tiếp một lượt trong POC, không giải thích trước ý đồ của câu hỏi; sau mỗi câu, tự diễn đạt lại tình huống và ý nghĩa từng đáp án. Ghi nhận câu nào chưa rõ, thiếu lựa chọn phù hợp hoặc có đáp án nghe "đúng" hơn hẳn; lưu phản hồi JSON tại máy để sửa câu chữ. Một lượt tự thử của chủ dự án là đủ cho phạm vi POC hiện tại; đây không phải nghiên cứu người dùng hay bằng chứng rằng câu hỏi đã được xác nhận với công chúng.

Với lượt tự thử hiện tại, cụ xác nhận mình hiểu nhất quán cả 10 tình huống và lựa chọn, không gặp câu thiếu phương án phù hợp hoặc dẫn dắt rõ rệt. Nếu gặp vấn đề, sửa đúng câu đó và tự thử lại. Việc tự thử chỉ hoàn tất cổng câu chữ cho POC; không đồng nghĩa đã duyệt taxonomy/tag mapping hoặc sẵn sàng ghép nhân vật. Nếu sau này mở sản phẩm cho công chúng, cần thử nghiệm người dùng rộng hơn.

## Hồ sơ nhân vật và kiểm duyệt

Mỗi nhân vật cần: tên chuẩn/tên khác, tác phẩm, bản anime và mốc nội dung mới nhất đã phát hành, cùng các trait ở những nhóm có ích (ví dụ hành vi/tính cách, phẩm chất/giá trị, khả năng, ngoại hình). Mỗi trait là một record riêng gồm nhãn nguồn, tag chuẩn hóa, diễn giải ngắn bằng lời biên tập, URL và loại nguồn, mức tin cậy, trạng thái duyệt và cờ spoiler nếu cần. Lưu riêng nguồn/quyền ảnh; quyền chưa rõ thì dùng placeholder. Không sao chép toàn văn nguồn vào DB/public profile nếu chưa có quyền.

Quy trình: AI có thể trích xuất **candidate trait** từ nguồn được phép để biên tập viên kiểm tra, chuẩn hóa, sửa hoặc bác bỏ. Ưu tiên nguồn chính thức; có thể dùng nguồn phụ trợ uy tín khi nguồn chính thức thiếu thông tin và phải ghi rõ loại nguồn. AI không tự xuất bản hay tự xác nhận trait; trait không đủ căn cứ thì không gán. Duyệt độc lập mẫu 10 nhân vật đầu để thống nhất cách chuẩn hóa đồng nghĩa và mức tin cậy.

Không cần rà từng tập: hồ sơ thể hiện đặc điểm cốt lõi/đích đến theo anime đã phát hành mới nhất, kể cả khi các tập đầu thể hiện nhân vật chưa có đặc điểm đó. Ghi URL nguồn và vị trí có thể kiểm tra cho mỗi trait được duyệt; diễn giải công khai dùng lời riêng của đội biên tập. Dẫn chứng tiết lộ bước ngoặt/kết cục phải gắn spoiler và mặc định được che tới khi người dùng chọn xem.

Quiz chỉ đối chiếu traits thuộc nhóm hành vi/tính cách; khám phá nhân vật có thể lọc theo những nhóm trait khác như khả năng hoặc ngoại hình. So khớp trên tag hành vi đã duyệt có ở cả hồ sơ người dùng và nhân vật; trait vắng mặt là chưa biết, không phải trait đối lập hay phủ định. Không có ngưỡng cố định số tag để đưa nhân vật vào kết quả; luôn cho biết số trait và độ tin cậy làm căn cứ. Không dùng anime, ngoại hình, độ nổi tiếng hay gu waifu/husbando làm điểm hành vi.

## Cách ghép và giải thích bản đầu

1. POC ánh xạ lựa chọn sang tag hành vi candidate và, sau khi người dùng chọn “Xem nhân vật phù hợp”, trình bày preview tối đa ba nhân vật có tag chung cùng tiêu chí/nguồn. Các tag nhân vật và cutoff anime phải hiện trạng thái duyệt; preview không phải kết quả chính thức.
2. Sau khi câu hỏi và mapping được duyệt, câu trả lời đã chọn tạo một tập behavioral tag cho người dùng. Câu bỏ qua không tạo tag; không diễn dịch câu trả lời thiếu thành trait đối lập.
3. Preview có thể so khớp tag candidate nhưng phải dán nhãn đề xuất/chưa duyệt. Kết quả sản phẩm chỉ so tag hành vi đã được biên tập duyệt và có cutoff anime hợp lệ. Cả hai trường hợp chỉ so tag có căn cứ ở hai phía; tag chưa ghi nhận không có nghĩa trait đó vắng mặt. Nêu số tag chung, nguồn, độ tin cậy và trạng thái duyệt; không đặt ngưỡng số tag cố định, không dùng tag ngoại hình, khả năng, độ nổi tiếng hoặc gu waifu/husbando trong behavioral match.
4. Trả tối đa 3 nhân vật phù hợp nhất. Giải thích bằng các tag chung, kèm nguồn/trạng thái; không suy điểm khác biệt từ trait thiếu. Nếu chưa có tag chung, nêu rõ chưa có tiêu chí match thay vì bịa kết quả. Cách xếp hạng chính xác cần được thử trên dữ liệu seed trước khi chốt.
5. Không hiển thị tỷ lệ phần trăm "giống nhau" hay suy diễn sức khỏe tâm lý. Cho phép người dùng trả lời lại và gửi phản hồi khi kết quả không hợp lý. Không lưu câu trả lời cá nhân quá phiên sử dụng nếu chưa có sự đồng ý rõ ràng.

Ví dụ khái niệm (tag minh họa, chưa phải taxonomy đã duyệt): người dùng có các tag hành vi `chủ động`, `hỗ trợ người khác`, `thận trọng`; hồ sơ A có `chủ động`, `hỗ trợ người khác`; hồ sơ B có `giữ cam kết`. A có nhiều tag hành vi chung hơn, nhưng hệ thống chỉ được đưa ra thứ hạng sau khi tag, mapping và quy tắc trọng số đã qua duyệt/thử nghiệm; luôn hiển thị số tag làm căn cứ.

## Cách xác nhận trước khi mở rộng

- Hiện tại: cụ tự chạy một lượt đọc hiểu 10 câu; ghi lại câu nào khó hiểu, thiếu lựa chọn hoặc dẫn dắt, rồi sửa và tự thử lại câu đó. POC được phép cho xem preview candidate sau phần rà soát; đây là xác nhận cá nhân, không phải kiểm định công chúng.
- Trước kết quả sản phẩm: biên tập thử 10 nhân vật (mỗi series một người) theo trait cốt lõi trong anime mới nhất đã phát hành; xác minh mốc phát hành và nguồn từng trait, rồi duyệt assertion trước khi bỏ nhãn preview.
- Kiểm tra matching: một tag hành vi chung có thể tạo preview/ghép không cần ngưỡng số lượng; chỉ tag được duyệt dùng ở sản phẩm; tag thiếu không biến thành trait đối lập; nguồn và trạng thái phải hiển thị cùng tiêu chí.
- Chỉ mở rộng đến tối thiểu 5 hồ sơ được duyệt cho mỗi series sau khi chất lượng câu hỏi và lời giải thích qua vòng thử; trước khi dùng dữ liệu/ảnh từ nguồn bên ngoài hoặc chọn công nghệ, xác nhận quyền sử dụng và hỏi chủ dự án.

## Quyết định cần hỏi ở bước tiếp theo

Đã thống nhất dùng bảng Top Anime MyAnimeList để ưu tiên tác phẩm, cho phép spoiler (che mặc định) và hướng tới website công khai miễn phí. Sau khi rà soát câu trả lời, POC hiển thị preview tối đa ba nhân vật theo tag hành vi chung, kèm source term, diễn giải, nguồn trait và nguồn cutoff anime. Mọi tag vẫn là candidate chưa được biên tập duyệt. Cutoff Kaguya đã xác định là special `Otona e no Kaidan` (phát sóng 31/12/2025, streaming từ 01/01/2026), nhưng trait đang lấy từ hồ sơ Ultra Romantic 2022 và chưa xác nhận còn áp dụng ở special. Edward có nguồn phim `The Sacred Star of Milos` (2011), nhưng latest franchise cutoff chưa xác minh; Takasugi có anime Ginpachi-sensei kết thúc năm 2025, nhưng trait nguồn mainline chưa đối chiếu với cutoff đó. Vì vậy preview không phải kết quả chính thức. Trait vắng mặt không được coi là đối lập; khi chưa có tag chung, POC nêu rõ chưa có tiêu chí match. Trước mọi lựa chọn công nghệ cụ thể (cơ sở dữ liệu, frontend, backend, nhà cung cấp AI, nơi triển khai), hỏi cụ xác minh thay vì tự chốt.