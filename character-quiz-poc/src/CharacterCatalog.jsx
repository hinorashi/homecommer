import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Filter, Home, RefreshCw, Search } from 'lucide-react'
import './CharacterCatalog.css'

const PAGE_SIZE = 24

function buildCatalogUrl({ query, contextGenre, archetype, animeGenre, offset }) {
  const params = new URLSearchParams({
    q: query,
    contextGenre,
    archetype,
    animeGenre,
    limit: String(PAGE_SIZE),
    offset: String(offset),
  })
  return `/api/catalog/characters?${params}`
}

export default function CharacterCatalog({ onHome, onAdmin }) {
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [contextGenre, setContextGenre] = useState('all')
  const [archetype, setArchetype] = useState('all')
  const [animeGenre, setAnimeGenre] = useState('all')
  const [offset, setOffset] = useState(0)
  const [catalog, setCatalog] = useState({ characters: [], total: 0, hasMore: false })
  const [filterOptions, setFilterOptions] = useState({ contextGenres: [], archetypes: [], animeGenres: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncProgress, setSyncProgress] = useState(null)
  const syncController = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetch('/api/metadata/filters', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch('/api/metadata/anime-genres', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([metadata, genres]) => {
      if (metadata) setFilterOptions({ ...metadata, animeGenres: genres?.genres ?? [] })
    }).catch((fetchError) => {
      if (fetchError.name !== 'AbortError') setError(fetchError.message)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch(buildCatalogUrl({ query, contextGenre, archetype, animeGenre, offset }), { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? `Catalog API returned ${response.status}`)
        setCatalog(payload)
        setError('')
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, contextGenre, archetype, animeGenre, offset])

  useEffect(() => () => syncController.current?.abort(), [])

  function changeFilter(setter, value) {
    setLoading(true)
    setter(value)
    setOffset(0)
  }

  async function syncCurrentPage() {
    const characters = catalog.characters
    if (!characters.length || syncProgress?.running) return

    const controller = new AbortController()
    syncController.current = controller
    setSyncProgress({ running: true, completed: 0, total: characters.length, errors: 0 })

    for (let index = 0; index < characters.length; index += 1) {
      if (controller.signal.aborted) return
      const character = characters[index]
      let errors = 0
      try {
        const response = await fetch('/api/anilist/characters/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            characters: [{
              id: character.id,
              anilistId: character.anilistId,
              name: character.name,
              series: character.series,
            }],
          }),
        })
        if (!response.ok) errors = 1
      } catch (syncError) {
        if (syncError.name === 'AbortError') return
        errors = 1
      }

      if (!controller.signal.aborted) {
        setSyncProgress((current) => ({
          running: true,
          completed: index + 1,
          total: characters.length,
          errors: (current?.errors ?? 0) + errors,
        }))
      }
    }

    if (controller.signal.aborted) return
    syncController.current = null
    setSyncProgress((current) => ({ ...current, running: false }))
    try {
      const response = await fetch(buildCatalogUrl({ query, contextGenre, archetype, animeGenre, offset }))
      if (response.ok) setCatalog(await response.json())
    } catch {
      // Keep the current page if refreshing after sync fails.
    }
  }

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(catalog.total / PAGE_SIZE))
  const syncPercent = syncProgress?.total
    ? Math.floor((syncProgress.completed / syncProgress.total) * 100)
    : 0

  return (
    <div className="catalog-shell">
      <header className="catalog-topbar">
        <a className="catalog-brand" href="/" onClick={(event) => { event.preventDefault(); onHome() }}>
          <span className="catalog-brand-mark">N<span>.</span></span>
          <span>NHÂN VẬT<br />GIỐNG MÌNH</span>
        </a>
        <nav className="catalog-navigation" aria-label="Điều hướng chính">
          <a href="/" onClick={(event) => { event.preventDefault(); onHome() }}><Home size={15} /> Làm bài</a>
          <a href="/characters" aria-current="page"><Search size={15} /> Tìm nhân vật</a>
          <a href="/admin" onClick={(event) => { event.preventDefault(); onAdmin() }}>Admin</a>
        </nav>
      </header>

      <main className="catalog-main">
        <div className="catalog-heading-row">
          <div>
            <p className="catalog-eyebrow">THƯ VIỆN NHÂN VẬT</p>
            <h1>Tìm nhân vật anime</h1>
            <p className="catalog-subtitle">Tìm theo tên, bí danh hoặc series; lọc theo thể loại và hình mẫu.</p>
          </div>
          <button
            type="button"
            className="catalog-sync-button"
            disabled={!catalog.characters.length || loading || syncProgress?.running}
            onClick={syncCurrentPage}
          >
            <RefreshCw size={16} className={syncProgress?.running ? 'sync-spinning' : ''} />
            {syncProgress?.running ? 'Đang đồng bộ' : `Đồng bộ trang (${catalog.characters.length})`}
          </button>
        </div>

        <form className="catalog-search-form" role="search" onSubmit={(event) => { event.preventDefault(); setLoading(true); setOffset(0); setQuery(queryInput.trim()) }}>
          <label className="visually-hidden" htmlFor="catalog-search">Tìm theo tên nhân vật hoặc series</label>
          <Search size={18} aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            maxLength={100}
            placeholder="Tên nhân vật, bí danh, tên series..."
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <section className="catalog-filter-bar" aria-label="Bộ lọc nhân vật">
          <label className="catalog-filter"><span><Filter size={13} /> Anime genre</span>
            <select value={animeGenre} onChange={(event) => changeFilter(setAnimeGenre, event.target.value)}>
              <option value="all">Tất cả</option>
              {filterOptions.animeGenres.map((genre) => <option key={genre.id} value={genre.id}>{genre.label}</option>)}
            </select>
          </label>
          <label className="catalog-filter"><span>Thể loại bối cảnh</span>
            <select value={contextGenre} onChange={(event) => changeFilter(setContextGenre, event.target.value)}>
              <option value="all">Tất cả</option>
              {filterOptions.contextGenres.map((genre) => <option key={genre.id} value={genre.id}>{genre.label}</option>)}
            </select>
          </label>
          <label className="catalog-filter"><span>Hình mẫu</span>
            <select value={archetype} onChange={(event) => changeFilter(setArchetype, event.target.value)}>
              <option value="all">Tất cả</option>
              {filterOptions.archetypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <span className="catalog-result-count">{catalog.total} hồ sơ</span>
        </section>

        {syncProgress && (
          <section className="catalog-sync-progress" aria-live="polite">
            <div className="catalog-progress-label">
              <span>{syncProgress.running ? 'Đang đồng bộ metadata' : 'Đồng bộ hoàn tất'}</span>
              <strong>{syncPercent}%</strong>
            </div>
            <progress max={100} value={syncPercent} aria-label={`Tiến độ đồng bộ ${syncPercent}%`} />
            <small>{syncProgress.completed}/{syncProgress.total} hồ sơ đã xử lý{syncProgress.errors ? ` · ${syncProgress.errors} lỗi` : ''}</small>
          </section>
        )}

        {error ? <p className="catalog-error" role="alert">{error}</p> : null}
        {loading ? <p className="catalog-status" role="status">Đang tải thư viện...</p> : null}
        {!loading && !error && catalog.characters.length === 0 ? (
          <p className="catalog-empty" role="status">Không tìm thấy nhân vật phù hợp.</p>
        ) : null}

        <section className="catalog-grid" aria-label="Danh sách nhân vật">
          {catalog.characters.map((character) => (
            <article className="catalog-character" key={character.id}>
              <div className="catalog-character-head">
                <div className="catalog-avatar">
                  {character.image?.url ? <img src={character.image.url} alt={character.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'flex' }} /> : null}
                  <span style={character.image?.url ? { display: 'none' } : undefined}>{character.name.slice(0, 1)}</span>
                </div>
                <div className="catalog-character-title">
                  <h2>{character.name}</h2>
                  <p>{character.series}</p>
                </div>
              </div>
              <div className="catalog-metadata-line">
                {character.animeGenres.map((genre) => <span key={genre}>{genre}</span>)}
              </div>
              <div className="catalog-metadata-line catalog-editorial-line">
                {character.contextGenres.map((genre) => <span key={genre.id}>{genre.label}</span>)}
                {character.archetypes.map((item) => <span key={item.id}>{item.label}</span>)}
              </div>
              {character.image?.provider === 'AniList' ? <p className="catalog-image-note">Ảnh lưu từ AniList · quyền tái sử dụng chưa xác minh</p> : null}
            </article>
          ))}
        </section>

        <footer className="catalog-pagination">
          <button type="button" disabled={offset === 0 || loading} onClick={() => { setLoading(true); setOffset((value) => Math.max(0, value - PAGE_SIZE)) }}>
            <ArrowLeft size={15} /> Trang trước
          </button>
          <span>Trang {currentPage} / {pageCount}</span>
          <button type="button" disabled={!catalog.hasMore || loading} onClick={() => { setLoading(true); setOffset((value) => value + PAGE_SIZE) }}>
            Trang sau <ArrowRight size={15} />
          </button>
        </footer>
      </main>
    </div>
  )
}