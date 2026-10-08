import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import AppLayout from './AppLayout'
import AdminCrawlPanel from './AdminCrawlPanel'
import './CharacterCatalog.css'

export default function MetadataAdmin({ pathname = '/admin', onNavigate }) {
  const [job, setJob] = useState(null)
  const [force, setForce] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let timer

    async function poll() {
      try {
        const response = await fetch('/api/admin/metadata/sync')
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? `Admin API returned ${response.status}`)
        if (!active) return
        setJob(payload.job)
        setError('')
        if (payload.job?.status === 'running') timer = window.setTimeout(poll, 1000)
      } catch (pollError) {
        if (!active) return
        setError(pollError.message)
      }
    }

    poll()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  async function startSync() {
    setStarting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/metadata/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? `Admin API returned ${response.status}`)
      setJob(payload.job)
      if (payload.job?.status === 'running') {
        const poll = async () => {
          try {
            const statusResponse = await fetch(`/api/admin/metadata/sync/${payload.job.id}`)
            const statusPayload = await statusResponse.json()
            if (!statusResponse.ok) throw new Error(statusPayload.error ?? 'Could not read sync status.')
            setJob(statusPayload.job)
            if (statusPayload.job.status === 'running') window.setTimeout(poll, 1000)
          } catch (pollError) {
            setError(pollError.message)
          }
        }
        window.setTimeout(poll, 250)
      }
    } catch (startError) {
      setError(startError.message)
    } finally {
      setStarting(false)
    }
  }

  const running = job?.status === 'running'

  return (
    <AppLayout pathname={pathname} onNavigate={onNavigate} mainClassName="admin-main">
        <p className="catalog-eyebrow">QUẢN TRỊ DỮ LIỆU</p>
        <h1>Đồng bộ metadata AniList</h1>
        <p className="catalog-subtitle">Đồng bộ toàn bộ hồ sơ character đang có trong SQLite. Tiến độ tính theo từng hồ sơ đã xử lý.</p>

        <section className="admin-sync-panel">
          <label className="admin-force-option">
            <input type="checkbox" checked={force} onChange={(event) => setForce(event.target.checked)} disabled={running || starting} />
            <span>Buộc làm mới cả metadata còn trong cache 30 ngày</span>
          </label>
          <button type="button" className="catalog-sync-button" onClick={startSync} disabled={running || starting}>
            <RefreshCw size={16} className={running ? 'sync-spinning' : ''} />
            {running ? 'Đang đồng bộ catalog' : starting ? 'Đang khởi tạo...' : 'Đồng bộ toàn bộ character'}
          </button>
          <p>Tiến trình chạy tuần tự theo rate limit AniList; có thể mất thời gian khi catalog lớn. Hồ sơ không ghép được vẫn được báo riêng, không bị loại khỏi database.</p>
        </section>

        {error ? <p className="catalog-error" role="alert">{error}</p> : null}
        {job ? (
          <section className="catalog-sync-progress admin-job-progress" aria-live="polite">
            <div className="catalog-progress-label">
              <span>{running ? `Đang xử lý: ${job.currentCharacter?.name ?? 'Chuẩn bị...'}` : 'Lần đồng bộ gần nhất'}</span>
              <strong>{job.percent}%</strong>
            </div>
            <progress max={100} value={job.percent} aria-label={`Tiến độ đồng bộ ${job.percent}%`} />
            <small>{job.completed}/{job.total} hồ sơ · {job.synced} đã sync · {job.cached} cache · {job.unmatched} không khớp · {job.errors} lỗi</small>
          </section>
        ) : <p className="catalog-status">Chưa có job đồng bộ trong phiên server này.</p>}

        {job?.results?.length > 0 ? (
          <section className="admin-results" aria-label="Kết quả từng hồ sơ">
            <h2>Chi tiết hồ sơ</h2>
            <div className="admin-results-list">
              {job.results.slice().reverse().map((result) => (
                <article className="admin-result-row" key={`${job.id}-${result.id}`}>
                  <div><strong>{result.name}</strong><span>{result.series}</span></div>
                  <span className={`admin-status admin-status-${result.status}`}>{result.status}</span>
                  <small>{result.genres?.join(', ') || result.reason || 'Không có genre trả về'}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <AdminCrawlPanel />

        <button type="button" className="text-action admin-back" onClick={() => onNavigate('/characters')}><ArrowLeft size={15} /> Về thư viện nhân vật</button>
    </AppLayout>
  )
}