import { useState } from 'react'
import { ArrowLeft, ArrowRight, Award, Check, Compass, Download, ExternalLink, Filter, Flame, RotateCcw, Sparkles, Tag, User, Zap } from 'lucide-react'
import { characterProfiles } from './characterProfiles'
import { drillDownQuestions, issueLabels, questions, questionSetVersion } from './questions'
import { buildUserTraits, matchCharacters, summarizeUserPersonality } from './matching'
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

  // Tier-2 Adaptive Drill-down state
  const [drillDownAnswers, setDrillDownAnswers] = useState(() => drillDownQuestions.map(() => null))
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownStep, setDrillDownStep] = useState(0)

  // Contextual filters
  const [genreFilter, setGenreFilter] = useState('all')
  const [archetypeFilter, setArchetypeFilter] = useState('all')

  const review = step === questions.length
  const results = step === questions.length + 1
  const completed = review || results
  const answered = answers.filter((answer) => answer !== null).length
  const drillDownAnsweredCount = drillDownAnswers.filter((a) => a !== null).length

  // Combine core quiz and drill-down answers for high-resolution matching
  const combinedQuestions = [
    ...questions,
    ...drillDownQuestions,
  ]
  const combinedAnswers = [
    ...answers,
    ...drillDownAnswers,
  ]
  const userTraits = buildUserTraits(combinedAnswers, combinedQuestions)
  const personalitySummary = summarizeUserPersonality(userTraits)
  const matches = matchCharacters(userTraits, characterProfiles, {
    includeProposed: true,
    genreFilter,
    archetypeFilter,
  }).slice(0, 3)

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
      drillDownAnswers: drillDownQuestions.map((q, idx) => ({
        questionId: q.id,
        prompt: q.prompt,
        choiceId: drillDownAnswers[idx] === null ? null : drillDownAnswers[idx] + 1,
        choice: drillDownAnswers[idx] === null ? null : q.choices[drillDownAnswers[idx]],
      })),
      filters: {
        genreFilter,
        archetypeFilter,
      },
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
    setDrillDownAnswers(drillDownQuestions.map(() => null))
    setDrillDownOpen(false)
    setDrillDownStep(0)
    setGenreFilter('all')
    setArchetypeFilter('all')
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
          <span>{completed ? '10/10' : `${String(step + 1).padStart(2, '0')}/10`}</span>
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
        <header className="topbar"><span>THỬ NGHIỆM / BỘ CÂU HỎI 06</span><span className="status"><i /> BẢN POC</span></header>
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
            <div className="bottom-actions"><button type="button" className="text-action" onClick={reset}><RotateCcw size={17} /> Làm lại</button><div className="right-actions"><button type="button" className="text-action" onClick={exportReport}><Download size={17} /> Tải phản hồi JSON</button><button type="button" className="primary-action" onClick={() => navigate(questions.length + 1)}><Sparkles size={17} /> Xem nhân vật phù hợp</button></div></div>
            <p className="review-footnote">Kết quả dưới đây là bản preview; các tag nhân vật còn chờ duyệt biên tập.</p>
          </div>
        ) : results ? (
          <div className="content-wrap results-wrap">
            <div className="section-label"><span className="label-number"><Sparkles size={17} /></span> / KẾT QUẢ SUY LUẬN & GHÉP ĐÔI</div>
            <h1>Nhân vật anime phù hợp</h1>
            <p className="question-hint">Tổng hợp từ {answered} câu trả lời của cụ và đối chiếu với dữ liệu tính cách từ các nguồn trực tuyến.</p>

            <section className="user-profile-assessment" aria-labelledby="user-assessment-title">
              <div className="assessment-card">
                <div className="assessment-header">
                  <div className="assessment-badge"><User size={15} /><span>HỒ SƠ TÍNH CÁCH CỦA BẠN</span></div>
                  <h2 id="user-assessment-title">Đánh giá phong cách ứng xử từ câu trả lời</h2>
                </div>
                <p className="assessment-headline">{personalitySummary.headline}</p>
                <div className="user-traits-list">
                  {userTraits.length > 0 ? (
                    userTraits.map((trait) => (
                      <div className="user-trait-item" key={trait.tagId}>
                        <div className="user-trait-top">
                          <span className="user-trait-name">{trait.label}</span>
                          <span className="user-trait-count">{trait.count} lần</span>
                        </div>
                        {trait.description && <p className="user-trait-desc">{trait.description}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="no-traits-note">Cụ chưa chọn câu trả lời nào để suy luận tính cách.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Cơ chế câu hỏi phân tầng (Adaptive Drill-Down) */}
            <section className="adaptive-drilldown-section" aria-labelledby="drilldown-heading">
              <div className="drilldown-card">
                <div className="drilldown-header">
                  <div className="drilldown-badge">
                    <Zap size={14} /> <span>CƠ CHẾ PHÂN TẦNG (ADAPTIVE DRILL-DOWN)</span>
                  </div>
                  <h3 id="drilldown-heading">
                    {drillDownAnsweredCount === 3
                      ? 'Đã mở khóa phân tích chuyên sâu (+3 câu hỏi Tầng 2)'
                      : 'Phân tích sâu hơn & Phá vỡ thế cân bằng giữa các nhân vật'}
                  </h3>
                  <p className="drilldown-desc">
                    {drillDownAnsweredCount === 3
                      ? 'Cụ đã hoàn thành 3 câu hỏi tình huống áp lực cao. Điểm tương đồng và trọng số độ hiếm đã được tái tính toán chi tiết hơn.'
                      : 'Khi kho nhân vật mở rộng, các nhân vật chính diện dễ có điểm trùng nhau. Hãy trả lời 3 câu hỏi tình huống hóc búa này để bóc tách nét tính cách tiềm ẩn.'}
                  </p>
                </div>

                {!drillDownOpen && drillDownAnsweredCount < 3 && (
                  <button
                    type="button"
                    className="drilldown-start-btn"
                    onClick={() => setDrillDownOpen(true)}
                  >
                    <Zap size={15} /> Bắt đầu 3 câu tình huống chuyên sâu
                  </button>
                )}

                {drillDownOpen && drillDownStep < drillDownQuestions.length && (
                  <div className="drilldown-quiz-box">
                    <div className="drilldown-step-bar">
                      <span>Tình huống nâng cao {drillDownStep + 1} / {drillDownQuestions.length}</span>
                      <span className="drilldown-tag-indicator">Câu {drillDownQuestions[drillDownStep].id}</span>
                    </div>
                    <p className="drilldown-prompt">{drillDownQuestions[drillDownStep].prompt}</p>
                    <div className="drilldown-choices">
                      {drillDownQuestions[drillDownStep].choices.map((choice, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          className={`drilldown-choice-btn ${drillDownAnswers[drillDownStep] === cIdx ? 'selected' : ''}`}
                          onClick={() => {
                            setDrillDownAnswers((prev) => {
                              const next = [...prev]
                              next[drillDownStep] = cIdx
                              return next
                            })
                            if (drillDownStep < drillDownQuestions.length - 1) {
                              setDrillDownStep(drillDownStep + 1)
                            } else {
                              setDrillDownOpen(false)
                            }
                          }}
                        >
                          <span className="choice-idx">0{cIdx + 1}</span>
                          <span className="choice-txt">{choice}</span>
                          {drillDownAnswers[drillDownStep] === cIdx && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                    <div className="drilldown-actions">
                      {drillDownStep > 0 && (
                        <button
                          type="button"
                          className="text-action"
                          onClick={() => setDrillDownStep(drillDownStep - 1)}
                        >
                          <ArrowLeft size={14} /> Câu trước
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-action close-action"
                        onClick={() => setDrillDownOpen(false)}
                      >
                        Đóng tạm thời
                      </button>
                    </div>
                  </div>
                )}

                {drillDownAnsweredCount > 0 && !drillDownOpen && (
                  <button
                    type="button"
                    className="text-action drilldown-retake-btn"
                    onClick={() => {
                      setDrillDownStep(0)
                      setDrillDownOpen(true)
                    }}
                  >
                    <RotateCcw size={14} /> Trả lời lại 3 câu hỏi chuyên sâu
                  </button>
                )}
              </div>
            </section>

            {/* Bộ lọc bối cảnh & thể loại / hình mẫu */}
            <section className="contextual-filters-panel" aria-label="Bộ lọc bối cảnh và hình mẫu">
              <div className="filter-group">
                <span className="filter-label"><Filter size={13} /> Thể loại:</span>
                <div className="filter-chips">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'action-fantasy', label: 'Hành động / Kỳ ảo' },
                    { id: 'psychological-school', label: 'Đấu trí / Học đường' },
                    { id: 'action-historical', label: 'Hành động / Lịch sử' },
                    { id: 'scifi-thriller', label: 'Khoa học / Đấu trí' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`filter-chip ${genreFilter === g.id ? 'active' : ''}`}
                      onClick={() => setGenreFilter(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label"><Compass size={13} /> Hình mẫu:</span>
                <div className="filter-chips">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'protagonist', label: 'Chính diện kiên định' },
                    { id: 'strategist', label: 'Chiến lược gia' },
                    { id: 'antihero', label: 'Thủ lĩnh / Khắc kỷ' },
                    { id: 'mentor', label: 'Chiêm nghiệm' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`filter-chip ${archetypeFilter === a.id ? 'active' : ''}`}
                      onClick={() => setArchetypeFilter(a.id)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="preview-notice" role="note">
              <strong><Sparkles size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Thu thập từ nguồn mạng & Trọng số độ hiếm (TF-IDF)</strong>
              <span>Áp dụng thuật toán trọng số nghịch đảo (IDF) để giảm ưu thế của tag đại trà và tôn vinh nét tính cách hiếm gặp. Kết quả phân bổ theo các vị trí đại diện (Best Match, Soulmate/Niche, Wildcard).</span>
            </div>

            {matches.length > 0 ? (
              <section className="match-list" aria-label="Nhân vật và tiêu chí trùng">
                {matches.map(({ character, sharedTraits, allTraits, slot, weightedScore }, index) => (
                  <article className="match-row" key={character.id}>
                    {slot && (
                      <div className={`slot-badge slot-${slot.type}`}>
                        {slot.type === 'best' && <Award size={14} />}
                        {slot.type === 'soulmate' && <Flame size={14} />}
                        {slot.type === 'wildcard' && <Sparkles size={14} />}
                        <span>{slot.badge}</span>
                        <small className="slot-title-text">— {slot.title}</small>
                      </div>
                    )}

                    <div className="match-row-header">
                      <span className="match-rank">{String(index + 1).padStart(2, '0')}</span>

                      <div className="character-avatar-box">
                        {character.imageUrl ? (
                          <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="character-avatar-image"
                            loading="eager"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="character-avatar-fallback" style={character.imageUrl ? { display: 'none' } : { display: 'flex' }}>
                          {character.name.charAt(0)}
                        </div>
                      </div>

                      <div className="character-main-info">
                        <div className="match-title-row">
                          <h2>{character.name}</h2>
                          <span className="source-tag">Nguồn mạng</span>
                          {character.genreLabel && <span className="meta-badge genre-badge">{character.genreLabel}</span>}
                          {character.archetypeLabel && <span className="meta-badge archetype-badge">{character.archetypeLabel}</span>}
                        </div>
                        <p className="series-name">{character.series}</p>
                        <p className="milestone-text">{character.releaseMilestone}</p>
                      </div>

                      <div className="match-count-badge">
                        <strong title="Điểm tương đồng tính theo trọng số độ hiếm (IDF)">{weightedScore}</strong>
                        <span>Điểm tương đồng (IDF)</span>
                        <small>{sharedTraits.length} tag trùng</small>
                      </div>
                    </div>

                    <div className="match-body">
                      {slot?.description && (
                        <p className="slot-explanation-note">
                          <strong>Vị trí đề xuất:</strong> {slot.description}
                        </p>
                      )}

                      <div className="shared-traits-block">
                        <span className="block-label"><Check size={14} /> Điểm tương đồng được suy luận ({sharedTraits.length} tag):</span>
                        <div className="criteria-list">
                          {sharedTraits.map((trait) => (
                            <div className="criteria-row" key={trait.tagId}>
                              <div className="criteria-row-top">
                                <span className="matched-tag-badge"><Check size={12} /> {trait.label}</span>
                                <span className="trait-rarity-badge" title="Độ hiếm của tag (IDF weight càng cao càng độc đáo)">
                                  Độ hiếm: +{trait.idf}
                                </span>
                                {trait.sourceTerm && <span className="source-term-text">Thuật ngữ gốc: <em>"{trait.sourceTerm}"</em></span>}
                              </div>
                              <p className="criteria-interpretation">{trait.editorialInterpretation || trait.description}</p>
                              <a className="source-link" href={trait.url} target="_blank" rel="noreferrer">
                                <ExternalLink size={12} /> {trait.sourceTitle}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="all-character-traits-block">
                        <span className="block-label"><Tag size={13} /> Tất cả tag tính cách của nhân vật ({allTraits.length}):</span>
                        <div className="character-tags-cloud">
                          {allTraits.map((trait) => (
                            <span
                              key={trait.tagId}
                              className={`character-tag-pill ${trait.isShared ? 'is-shared' : ''}`}
                              title={trait.editorialInterpretation || trait.label}
                            >
                              {trait.isShared && <Check size={11} className="pill-check-icon" />}
                              {trait.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <div className="match-empty" role="status">
                <strong>Chưa có tiêu chí chung cho bộ lọc này</strong>
                <p>Không có nhân vật nào thỏa mãn đồng thời các tag tính cách và tiêu chí thể loại/hình mẫu được chọn. Cụ có thể chọn "Tất cả" để xem toàn bộ danh sách.</p>
              </div>
            )}

            <div className="bottom-actions">
              <button type="button" className="text-action" onClick={() => navigate(questions.length)}>
                <ArrowLeft size={18} /> Rà soát câu trả lời
              </button>
              <div className="right-actions">
                <button type="button" className="text-action" onClick={reset}>
                  <RotateCcw size={17} /> Làm lại
                </button>
                <button type="button" className="primary-action" onClick={exportReport}>
                  <Download size={18} /> Tải phản hồi JSON
                </button>
              </div>
            </div>
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
        <footer className="page-footer"><span>NHÂN VẬT GIỐNG MÌNH</span><span>{completed ? 'HOÀN TẤT' : `${seen.filter(Boolean).length} / 10 ĐÃ XEM`}</span></footer>
      </main>
    </div>
  )
}