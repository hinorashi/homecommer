import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Database, Play, Square } from 'lucide-react'

const STATUS_LABELS = {
  running: 'Đang chạy',
  stopping: 'Đang dừng…',
  completed: 'Hoàn tất',
  failed: 'Lỗi',
  stopped: 'Đã dừng',
}

const STAT_LABELS = [
  ['genres', 'Thể loại'],
  ['anime', 'Anime'],
  ['animeWithCharacters', 'Anime đã có nhân vật'],
  ['characters', 'Nhân vật'],
  ['charactersWithDetails', 'Nhân vật có chi tiết'],
  ['characterRelations', 'Quan hệ nhân vật'],
  ['animeRelations', 'Quan hệ anime'],
  ['studios', 'Studio'],
  ['animeWithTags', 'Anime có tag'],
  ['animeWithImdb', 'Anime có điểm IMDb'],
  ['characterTraitLinks', 'Liên kết trait'],
]

async function readJson(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? `Admin API returned ${response.status}`)
  return payload
}

export default function AdminCrawlPanel() {
  const [commands, setCommands] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedId, setSelectedId] = useState('anime')
  const [values, setValues] = useState({})
  const [job, setJob] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef(null)
  const pollTimer = useRef(0)
  const pollRef = useRef(null)

  const running = job?.status === 'running' || job?.status === 'stopping'
  const selected = useMemo(() => commands.find((command) => command.id === selectedId), [commands, selectedId])

  const poll = useCallback(async () => {
    window.clearTimeout(pollTimer.current)
    try {
      const payload = await readJson(await fetch('/api/admin/crawl/status'))
      setJob(payload.job)
      setStats(payload.stats)
      if (payload.job?.status === 'running' || payload.job?.status === 'stopping') {
        pollTimer.current = window.setTimeout(() => pollRef.current?.(), 1000)
      }
    } catch (pollError) {
      setError(pollError.message)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/admin/crawl/commands').then(readJson),
      fetch('/api/metadata/anime-genres').then(readJson).catch(() => ({ genres: [] })),
    ]).then(([commandPayload, genrePayload]) => {
      if (!active) return
      setCommands(commandPayload.commands)
      setValues({ ...(commandPayload.commands.find((command) => command.id === 'anime')?.defaults ?? {}) })
      setGenres(genrePayload.genres ?? [])
    }).catch((loadError) => active && setError(loadError.message))
    pollTimer.current = window.setTimeout(() => pollRef.current?.(), 0)
    return () => {
      active = false
      window.clearTimeout(pollTimer.current)
    }
  }, [])

  useEffect(() => {
    pollRef.current = poll
  }, [poll])

  function selectCommand(command) {
    setSelectedId(command.id)
    setValues({ ...command.defaults })
  }

  useEffect(() => {
    const element = logRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [job?.lineCount])

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function toggleGenre(key, label, single) {
    setValues((current) => {
      const list = current[key] ?? []
      if (list.includes(label)) return { ...current, [key]: list.filter((item) => item !== label) }
      return { ...current, [key]: single ? [label] : [...list, label] }
    })
  }

  async function run() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const payload = await readJson(await fetch('/api/admin/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: selected.id, options: values }),
      }))
      setJob(payload.job)
      pollTimer.current = window.setTimeout(poll, 500)
    } catch (runError) {
      setError(runError.message)
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    setError('')
    try {
      const payload = await readJson(await fetch('/api/admin/crawl/stop', { method: 'POST' }))
      setJob(payload.job)
      poll()
    } catch (stopError) {
      setError(stopError.message)
    }
  }

  return (
    <section className="admin-crawl" aria-labelledby="admin-crawl-title">
      <h2 id="admin-crawl-title"><Database size={18} /> Crawl dữ liệu AniList</h2>
      <p className="catalog-subtitle">Chạy các lệnh <code>npm run crawl</code> / <code>enrich</code> ngay trên giao diện. Mỗi lần chỉ chạy một lệnh; nút Dừng sẽ đợi request hiện tại xong rồi mới thoát.</p>

      <div className="admin-crawl-commands" role="radiogroup" aria-label="Chọn lệnh crawl">
        {commands.map((command) => (
          <button
            type="button"
            role="radio"
            aria-checked={command.id === selectedId}
            key={command.id}
            className={`admin-crawl-command${command.id === selectedId ? ' is-active' : ''}`}
            onClick={() => selectCommand(command)}
            disabled={running}
          >
            <strong>{command.label}</strong>
            <small>{command.description}</small>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="admin-crawl-options">
          {selected.options.map((option) => {
            if (option.type === 'boolean') {
              return (
                <label className="admin-force-option" key={option.key}>
                  <input type="checkbox" checked={Boolean(values[option.key])} onChange={(event) => setValue(option.key, event.target.checked)} disabled={running} />
                  <span>{option.label}</span>
                </label>
              )
            }
            if (option.type === 'integer') {
              return (
                <label className="admin-crawl-number" key={option.key}>
                  <span>{option.label}</span>
                  <input
                    type="number"
                    min={option.min}
                    max={option.max}
                    value={values[option.key] ?? ''}
                    placeholder="mặc định"
                    onChange={(event) => setValue(option.key, event.target.value === '' ? '' : Number(event.target.value))}
                    disabled={running}
                  />
                </label>
              )
            }
            const chosen = values[option.key] ?? []
            const disabledByPopular = option.key === 'genre' && values.popular
            return (
              <fieldset className="admin-crawl-genres" key={option.key} disabled={running || disabledByPopular}>
                <legend>{option.label}{chosen.length ? ` · đã chọn ${chosen.length}` : ''}</legend>
                <div className="catalog-chip-list">
                  {genres.map((genre) => (
                    <button
                      type="button"
                      key={genre.id}
                      className={`catalog-chip-button${chosen.includes(genre.label) ? ' is-active' : ''}`}
                      aria-pressed={chosen.includes(genre.label)}
                      onClick={() => toggleGenre(option.key, genre.label, option.single)}
                    >
                      {genre.label}
                    </button>
                  ))}
                  {!genres.length ? <small>Chưa có thể loại — hãy chạy “Đồng bộ thể loại” trước.</small> : null}
                </div>
              </fieldset>
            )
          })}
          <div className="admin-crawl-actions">
            <button type="button" className="catalog-sync-button" onClick={run} disabled={running || busy}>
              <Play size={16} /> {busy ? 'Đang khởi tạo…' : `Chạy: ${selected.label}`}
            </button>
            {running ? (
              <button type="button" className="admin-crawl-stop" onClick={stop}>
                <Square size={14} /> {job.status === 'stopping' ? 'Buộc dừng' : 'Dừng'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="catalog-error" role="alert">{error}</p> : null}

      {job ? (
        <div className="admin-crawl-job" aria-live="polite">
          <div className="admin-crawl-job-head">
            <strong>{job.label}</strong>
            <span className={`admin-status admin-crawl-status-${job.status}`}>{STATUS_LABELS[job.status] ?? job.status}</span>
            <small>Bắt đầu {new Date(job.startedAt).toLocaleTimeString('vi-VN')}{job.finishedAt ? ` · kết thúc ${new Date(job.finishedAt).toLocaleTimeString('vi-VN')}` : ''}</small>
          </div>
          <pre className="admin-crawl-log" ref={logRef}>{job.log.join('\n')}</pre>
        </div>
      ) : <p className="catalog-status">Chưa có lệnh crawl nào trong phiên server này.</p>}

      {stats ? (
        <dl className="admin-crawl-stats">
          {STAT_LABELS.map(([key, label]) => (stats[key] === undefined ? null : (
            <div key={key}><dt>{label}</dt><dd>{stats[key].toLocaleString('vi-VN')}</dd></div>
          )))}
        </dl>
      ) : null}
    </section>
  )
}
