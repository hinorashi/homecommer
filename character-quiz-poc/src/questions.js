export const questionSetVersion = '2026-09-30-r2'

export const questions = [
  { id: 1, prompt: 'Cụ và đồng đội cùng chịu trách nhiệm bản nộp sau một giờ. Đồng đội vừa phát hiện lỗi khiến phần họ làm không dùng được; phần cụ làm vẫn ổn.', choices: [
    'Hỏi họ đang vướng gì rồi cùng sửa',
    'Kiểm tra phần mình có liên đới không rồi báo để đồng đội tự sửa lỗi',
    'Ưu tiên hoàn tất phần của mình rồi báo phần còn vướng',
  ] },
  { id: 2, prompt: 'Nhóm có ý tưởng mới nhưng chưa rõ có thành công không.', choices: [
    'Đề xuất thử một bản nhỏ ngay',
    'Đợi có thêm thông tin rồi mới tham gia',
    'Chuẩn bị vài phương án để nhóm cân nhắc trước khi thử',
  ] },
  { id: 3, prompt: 'Một quy định cản trở cách giải quyết nhanh trong lúc mọi người bất đồng.', choices: [
    'Giữ quy định và trình bày thẳng lý do',
    'Tìm ngoại lệ rồi trao đổi riêng với người phụ trách',
    'Tạm làm theo quy định nhưng nêu đề nghị sửa cho lần sau',
  ] },
  { id: 4, prompt: 'Bạn thân có vẻ khó chịu với một việc cụ chưa rõ nguyên nhân.', choices: [
    'Hỏi trực tiếp xem họ muốn nói chuyện không',
    'Để họ có không gian và chờ họ chủ động kể',
    'Hỏi thẳng việc này có ảnh hưởng kế hoạch chung không',
  ] },
  { id: 5, prompt: 'Công việc chung bị chậm, chưa ai phân chia nhiệm vụ.', choices: [
    'Rủ mọi người chia phần và nhận một phần',
    'Chờ nhóm thống nhất người điều phối rồi nhận phần được phân',
    'Tự xử lý một phần đang bị bỏ trống và báo kết quả sau',
  ] },
  { id: 6, prompt: 'Có một lối tắt đạt mục tiêu nhưng phải thay đổi cách làm đã cam kết.', choices: [
    'Giữ cam kết dù tiến độ chậm hơn',
    'Thử lối tắt và báo rõ thay đổi',
    'Xin đồng thuận trước khi thử cách mới',
  ] },
  { id: 7, prompt: 'Một người liên tục đến muộn vì đang gặp khó khăn riêng.', choices: [
    'Hỏi thăm và cùng tìm cách giữ cam kết',
    'Tạm điều chỉnh thời hạn cho họ, rồi bàn lại với nhóm',
    'Giữ thời hạn chung và phân lại phần việc để nhóm kịp tiến độ',
  ] },
  { id: 8, prompt: 'Hai người trong nhóm tranh luận gay gắt.', choices: [
    'Mời cả hai nói rõ bất đồng trước cả nhóm',
    'Trao đổi riêng từng người rồi tìm điểm chung',
    'Tạm tách các việc có thể làm ngay, hẹn lúc khác trở lại bất đồng',
  ] },
  { id: 9, prompt: 'Cụ muốn học một kỹ năng chưa từng thử và thời gian có hạn.', choices: [
    'Bắt đầu thực hành ngay, chấp nhận sai',
    'Học nền tảng trước khi thử',
    'Thử theo bài tập có hướng dẫn trước khi tự làm',
  ] },
  { id: 10, prompt: 'Cụ nhận ra cách làm chung có vẻ không công bằng với một người.', choices: [
    'Nêu vấn đề trực tiếp và đề nghị sửa quy tắc',
    'Hỗ trợ riêng người đó trước rồi đề xuất ngoại lệ',
    'Hỏi người phụ trách cách áp dụng quy tắc trong trường hợp này',
  ] },
]

export const issueLabels = {
  unclear: 'Câu hỏi chưa rõ',
  missing: 'Thiếu phương án phù hợp',
  biased: 'Một phương án nghe đúng hơn',
}