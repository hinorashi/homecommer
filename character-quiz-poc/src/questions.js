export const questionSetVersion = '2026-10-01-r6'

export const questions = [
  { id: 1, prompt: 'Cụ và đồng đội cùng chịu trách nhiệm bản nộp sau một giờ. Đồng đội vừa phát hiện lỗi khiến phần họ làm không dùng được; phần cụ làm vẫn ổn.', choices: [
    'Hỏi họ đang vướng gì rồi cùng sửa',
    'Sửa phần mình phụ trách và báo lại để họ xử lý phần còn lại',
    'Ưu tiên hoàn tất phần của mình rồi báo phần còn vướng',
  ], choiceTraits: [['offers-peer-support', 'collaborates'], ['takes-responsibility'], ['prioritizes-own-task']] },
  { id: 2, prompt: 'Nhóm có ý tưởng mới nhưng chưa rõ có thành công không.', choices: [
    'Đề xuất thử một bản nhỏ ngay',
    'Đợi có thêm thông tin rồi mới tham gia',
    'Chuẩn bị vài phương án để nhóm cân nhắc trước khi thử',
  ], choiceTraits: [['experiments-early', 'acts-under-uncertainty'], ['seeks-more-information'], ['plans-alternatives']] },
  { id: 3, prompt: 'Một quy định cản trở cách giải quyết nhanh trong lúc mọi người bất đồng.', choices: [
    'Giữ quy định và trình bày thẳng lý do',
    'Tìm ngoại lệ rồi trao đổi riêng với người phụ trách',
    'Tạm làm theo quy định nhưng nêu đề nghị sửa cho lần sau',
  ], choiceTraits: [['follows-rules', 'communicates-directly'], ['seeks-rule-exceptions', 'resolves-privately'], ['proposes-process-change', 'communicates-directly']] },
  { id: 4, prompt: 'Bạn thân có vẻ khó chịu với một việc cụ chưa rõ nguyên nhân.', choices: [
    'Hỏi trực tiếp xem họ muốn nói chuyện không',
    'Để họ có không gian và chờ họ chủ động kể',
    'Hỏi thẳng việc này có ảnh hưởng kế hoạch chung không',
  ], choiceTraits: [['checks-in-on-others', 'communicates-directly'], ['respects-personal-space'], ['focuses-on-task-impact', 'communicates-directly']] },
  { id: 5, prompt: 'Công việc chung bị chậm, chưa ai phân chia nhiệm vụ.', choices: [
    'Rủ mọi người chia phần và nhận một phần',
    'Chờ nhóm thống nhất người điều phối rồi nhận phần được phân',
    'Tự xử lý một phần đang bị bỏ trống và báo kết quả sau',
  ], choiceTraits: [['leads-group', 'collaborates'], ['accepts-group-coordination'], ['takes-initiative', 'self-directed']] },
  { id: 6, prompt: 'Có một lối tắt đạt mục tiêu nhưng phải thay đổi cách làm đã cam kết.', choices: [
    'Giữ cam kết dù tiến độ chậm hơn',
    'Thử lối tắt và báo rõ thay đổi',
    'Xin đồng thuận trước khi thử cách mới',
  ], choiceTraits: [['honors-commitments'], ['tries-uncertain-options', 'communicates-changes'], ['seeks-consensus']] },
  { id: 7, prompt: 'Một người liên tục đến muộn vì đang gặp khó khăn riêng.', choices: [
    'Hỏi thăm và cùng tìm cách giữ cam kết',
    'Tạm điều chỉnh thời hạn cho họ, rồi bàn lại với nhóm',
    'Giữ thời hạn chung và phân lại phần việc để nhóm kịp tiến độ',
  ], choiceTraits: [['supports-with-accountability'], ['adapts-expectations'], ['prioritizes-shared-deadline', 'redistributes-work']] },
  { id: 8, prompt: 'Hai người trong nhóm tranh luận gay gắt.', choices: [
    'Mời cả hai nói rõ bất đồng trước cả nhóm',
    'Trao đổi riêng từng người rồi tìm điểm chung',
    'Tạm tách các việc có thể làm ngay, hẹn lúc khác trở lại bất đồng',
  ], choiceTraits: [['facilitates-open-discussion', 'communicates-directly'], ['resolves-privately', 'seeks-common-ground'], ['deescalates-conflict']] },
  { id: 9, prompt: 'Cụ muốn học một kỹ năng chưa từng thử và thời gian có hạn.', choices: [
    'Bắt đầu thực hành ngay, chấp nhận sai',
    'Học nền tảng trước khi thử',
    'Thử theo bài tập có hướng dẫn trước khi tự làm',
  ], choiceTraits: [['learns-by-doing', 'accepts-mistakes'], ['prepares-before-action'], ['seeks-guided-learning']] },
  { id: 10, prompt: 'Cụ nhận ra cách làm chung có vẻ không công bằng với một người.', choices: [
    'Nêu vấn đề trực tiếp và đề nghị sửa quy tắc',
    'Hỗ trợ riêng người đó trước rồi đề xuất ngoại lệ',
    'Hỏi người phụ trách cách áp dụng quy tắc trong trường hợp này',
  ], choiceTraits: [['advocates-for-fairness', 'communicates-directly'], ['supports-individuals-privately'], ['seeks-authoritative-guidance']] },
]

export const issueLabels = {
  unclear: 'Câu hỏi chưa rõ',
  missing: 'Thiếu phương án phù hợp',
  biased: 'Một phương án nghe đúng hơn',
}

export const drillDownQuestions = [
  {
    id: 11,
    tier: 2,
    prompt: 'Trước một biến cố lớn, cụ buộc phải lựa chọn giữa bảo vệ người thân yêu hoặc tuân thủ nguyên tắc/lợi ích chung của tập thể.',
    choices: [
      'Quyết liệt bảo vệ người thân yêu bằng mọi giá',
      'Giữ trọn cam kết và đặt sứ mệnh chung lên vị trí ưu tiên cao nhất',
      'Tìm kiếm phương án thứ ba linh hoạt để dung hòa cả hai mục tiêu',
    ],
    choiceTraits: [
      ['reacts-intensely-to-threats-near-loved-ones', 'self-directed'],
      ['prioritizes-shared-deadline', 'honors-commitments'],
      ['plans-alternatives', 'pursues-goals-strategically'],
    ],
  },
  {
    id: 12,
    tier: 2,
    prompt: 'Khi phát hiện một tổ chức hoặc người từng tin tưởng có dấu hiệu đối xử bất công hoặc phản bội.',
    choices: [
      'Trực diện lên tiếng công khai và yêu cầu làm rõ ngay lập tức',
      'Âm thầm lập kế hoạch dài hạn, chuẩn bị lực lượng riêng để xoay chuyển cục diện',
      'Giữ khoảng cách thận trọng, bảo toàn vị thế và tập trung vào con đường của mình',
    ],
    choiceTraits: [
      ['advocates-for-fairness', 'communicates-directly'],
      ['plans-confrontational-action', 'self-directed'],
      ['respects-personal-space', 'prepares-before-action'],
    ],
  },
  {
    id: 13,
    tier: 2,
    prompt: 'Khi một kế hoạch lớn bất ngờ sụp đổ hoàn toàn và thời gian hành động còn rất ít.',
    choices: [
      'Hành động quyết đoán ngay theo trực giác thực chiến, vừa làm vừa khắc phục',
      'Bình tĩnh lùi lại quan sát, chuẩn bị kỹ lưỡng cho một đòn xoay chuyển duy nhất',
      'Lập tức huy động đồng đội chia sẻ trách nhiệm và phối hợp ứng biến tập thể',
    ],
    choiceTraits: [
      ['acts-under-uncertainty', 'learns-by-doing'],
      ['prepares-before-action', 'self-directed'],
      ['collaborates', 'leads-group'],
    ],
  },
]