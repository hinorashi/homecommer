import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, RotateCcw } from 'lucide-react'
import { issueLabels, questions, questionSetVersion } from './questions'
import './Quiz.css'

function shuffledOrders() {
  return questions.map(() => {
    const order = [0, 1, 2]
    for (let index = order.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1))
      const previous = order[index]
      order[index] = order[other]
      order[other] = previous
    }
    return order
  })
}

function emptyFeedback() {
  return questions.map(() => ({ issues: [], note: '' }))
}

export default function Quiz() {
  const [orders, setOrders] = useState(shuffledOrders)
  const [answers, setAnswers] = useState(() => questions.map(() => null))
  const [feedback, setFeedback] = useState(emptyFeedback)
  const [seen, setSeen] = useState(() => questions.map((_, index) => index === 0))
  const [step, setStep] = useState(0)
  const [generalNote, setGeneralNote] = useState('')
  const review = step === questions.length
  const answered = answers.filter((answer) => answer !== null).length

  function navigate(index) {
    setStep(index)
    if (index < questions.length) {
      setSeen((current) => current.map((value, position) => value || position === index))
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setChoice(choice) {
    setAnswers((current) => current.map((value, index) => index === step ? choice : value))
  }

  function toggleIssue(issue) {
    setFeedback((current) => current.map((item, index) => index === step ? {
      ...item,
      issues: item.issues.includes(issue)
        ? item.issues.filter((value) => value !== issue)
        : [...item.issues, issue],
    } : item))
  }

  function setNote(note) {
    setFeedback((current) => current.map((item, index) => index === step ? { ...item, note } : item))
  }

  function exportReport() {
    const report = {
      version: 1,
      questionSetVersion,
      createdAt: new Date().toISOString(),
      answers: questions.map((question, index) => ({
        questionId: question.id,
        question: question.prompt,
        choiceId: answers[index] === null ? null : answers[index] + 1,
        choice: answers[index] === null ? null : question.choices[answers[index]],
        issues: feedback[index].issues,
        note: feedback[index].note.trim(),
      })),
      generalNote: generalNote.trim(),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'phan-hoi-nhan-vat-giong-minh.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function reset() {
    setOrders(shuffledOrders())
    setAnswers(questions.map(() => null))
    setFeedback(emptyFeedback())
    setSeen(questions.map((_, index) => index === 0))
    setGeneralNote('')
    navigate(0)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">N<span>.</span></span><span>NHÂN VẬT<br />GIỐNG MÌNH</span></div>
        <div className="orbit" aria-hidden="true">
          <svg viewBox="0 0 240 240" role="presentation">
            <circle cx="120" cy="120" r="88" fill="none" stroke="currentColor" strokeWidth="1" opacity=".3" />
            <circle cx="120" cy="120" r="55" fill="none" stroke="currentColor" strokeWidth="1" opacity=".15" />
            {questions.map((question, index) => {
              const angle = index * Math.PI * 2 / questions.length - Math.PI / 2
              return <circle key={question.id} cx={120 + Math.cos(angle) * 88} cy={120 + Math.sin(angle) * 88} r={index === step ? 8 : 5} fill={answers[index] !== null ? '#e68459' : index === step ? '#e7eee2' : '#68938d'} />
            })}
          </svg>
          <span>{review ? '10/10' : `${String(step + 1).padStart(2, '0')}/10`}</span>
        </div>
        <div className="side-heading"><span>TIẾN ĐỘ</span><span>{answered} đã chọn</span></div>
        <nav className="question-nav" aria-label="Danh sách câu hỏi">
          {questions.map((question, index) => (
            <button type="button" key={question.id} className={`step-link ${index === step ? 'current' : ''}`} onClick={() => navigate(index)} aria-label={`Câu ${question.id}${answers[index] !== null ? ', đã chọn' : ''}`} aria-current={index === step ? 'step' : undefined}>
              <span>{String(question.id).padStart(2, '0')}</span><span className="step-line" /><span className="step-state">{answers[index] !== null ? <Check size={14} /> : seen[index] ? '·' : ''}</span>
            </button>
          ))}
        </nav>
        <p className="privacy-note">Câu trả lời chỉ ở trong tab này. Đóng hoặc tải lại trang sẽ xóa phiên thử.</p>
      </aside>

      <main className="workspace">
        <header className="topbar"><span>THỬ NGHIỆM / BỘ CÂU HỎI 02</span><span className="status"><i /> BẢN POC</span></header>
        {review ? (
          <div className="content-wrap review-wrap">
            <div className="section-label"><span className="label-number">✓</span> / HOÀN TẤT</div>
            <h1>Xem lại câu trả lời</h1>
            <p className="question-hint">{answered} câu đã chọn · {questions.length - answered} câu bỏ qua</p>
            <div className="review-list">
              {questions.map((question, index) => (
                <button type="button" className="review-row" key={question.id} onClick={() => navigate(index)}>
                  <span className="review-number">{String(question.id).padStart(2, '0')}</span>
                  <span className="review-content"><strong>{question.prompt}</strong><small>{answers[index] === null ? 'Đã bỏ qua' : question.choices[answers[index]]}{feedback[index].issues.length || feedback[index].note.trim() ? ' · Có góp ý' : ''}</small></span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
            <section className="feedback-panel overall-panel"><label className="note-label" htmlFor="general-note">Nhận xét chung về bộ câu hỏi</label><textarea id="general-note" rows="3" placeholder="Câu nào khiến cụ phân vân nhất?" value={generalNote} onChange={(event) => setGeneralNote(event.target.value)} /></section>
            <div className="bottom-actions"><button type="button" className="text-action" onClick={reset}><RotateCcw size={17} /> Làm lại</button><button type="button" className="primary-action" onClick={exportReport}><Download size={18} /> Tải phản hồi JSON</button></div>
            <p className="review-footnote">Chưa có kết quả ghép nhân vật trong giai đoạn thử câu hỏi.</p>
          </div>
        ) : (
          <div className="content-wrap question-wrap" key={step}>
            <div className="section-label"><span className="label-number">{String(step + 1).padStart(2, '0')}</span> / TÌNH HUỐNG {String(step + 1).padStart(2, '0')}</div>
            <h1>{questions[step].prompt}</h1>
            <p className="question-hint">Cụ thường sẽ làm gì trong tình huống này?</p>
            <div className="answer-list" role="group" aria-label="Các lựa chọn">
              {orders[step].map((choiceIndex, position) => (
                <button type="button" key={choiceIndex} className={`answer-option ${answers[step] === choiceIndex ? 'selected' : ''}`} aria-pressed={answers[step] === choiceIndex} onClick={() => setChoice(choiceIndex)}>
                  <span className="option-index">{String(position + 1).padStart(2, '0')}</span><span className="option-text">{questions[step].choices[choiceIndex]}</span><span className="option-check">{answers[step] === choiceIndex && <Check size={18} />}</span>
                </button>
              ))}
            </div>
            <section className="feedback-panel" aria-labelledby="feedback-title">
              <div className="panel-heading"><div><span className="eyebrow">GÓP Ý VỀ CÂU NÀY</span><h2 id="feedback-title">Có điều gì chưa ổn?</h2></div><span className="optional">Không bắt buộc</span></div>
              <div className="issue-list">
                {Object.entries(issueLabels).map(([key, label]) => <label key={key} className={`issue-toggle ${feedback[step].issues.includes(key) ? 'active' : ''}`}><input type="checkbox" checked={feedback[step].issues.includes(key)} onChange={() => toggleIssue(key)} /><span>{label}</span></label>)}
              </div>
              <label className="note-label" htmlFor="question-note">{feedback[step].issues.includes('missing') ? 'Cụ sẽ chọn cách nào khác?' : 'Nhận xét thêm'}</label><textarea id="question-note" rows="2" placeholder={feedback[step].issues.includes('missing') ? 'Mô tả cách cụ thường sẽ làm...' : 'Viết điều cụ muốn góp ý...'} value={feedback[step].note} onChange={(event) => setNote(event.target.value)} />
            </section>
            <div className="bottom-actions"><button type="button" className="text-action" onClick={() => navigate(step - 1)} disabled={step === 0}><ArrowLeft size={18} /> Câu trước</button><div className="right-actions">{answers[step] === null && <button type="button" className="skip-action" onClick={() => navigate(step + 1)}>Bỏ qua</button>}<button type="button" className="primary-action" disabled={answers[step] === null} onClick={() => navigate(step + 1)}>{step === questions.length - 1 ? 'Xem lại' : 'Tiếp tục'} <ArrowRight size={18} /></button></div></div>
          </div>
        )}
        <footer className="page-footer"><span>NHÂN VẬT GIỐNG MÌNH</span><span>{review ? 'HOÀN TẤT' : `${seen.filter(Boolean).length} / 10 ĐÃ XEM`}</span></footer>
      </main>
    </div>
  )
}