import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, Filter, RefreshCw, Search, X } from 'lucide-react'
import AppLayout from './AppLayout'
import AnimeTagPicker from './AnimeTagPicker'
import './CharacterCatalog.css'
import './AnimeDetail.css'

const PAGE_SIZE = 24

function splitList(value) {
  if (!value || value === 'all') return []
  return [...new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))].slice(0, 20)
}

function buildCatalogUrl({ query, contextGenre, archetype, animeGenres, animeTags, genreMode, studio, offset }) {
  const params = new URLSearchParams({
    q: query,
    contextGenre,
    archetype,
    animeGenre: animeGenres.length ? animeGenres.join(',') : 'all',
    animeTag: animeTags.length ? animeTags.join(',') : 'all',
    genreMode,
    studio,
    limit: String(PAGE_SIZE),
    offset: String(offset),
  })
  return `/api/catalog/characters?${params}`
}

function readInitialState() {
  const params = new URLSearchParams(window.location.search)
  const offset = Math.max(0, Math.trunc(Number(params.get('offset')) || 0))
  return {
    query: (params.get('q') ?? '').slice(0, 100),
    contextGenre: params.get('contextGenre') || 'all',
    archetype: params.get('archetype') || 'all',
    animeGenres: splitList(params.get('animeGenre')),
    animeTags: splitList(params.get('animeTag')),
    genreMode: params.get('genreMode') === 'any' ? 'any' : 'all',
    studio: params.get('studio') || 'all',
    offset: offset - (offset % PAGE_SIZE),
  }
}

function buildPageUrl({ query, contextGenre, archetype, animeGenres, animeTags, genreMode, studio, offset }) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (animeGenres.length) params.set('animeGenre', animeGenres.join(','))
  if (animeTags.length) params.set('animeTag', animeTags.join(','))
  if (animeGenres.length + animeTags.length > 1 && genreMode === 'any') params.set('genreMode', 'any')
  if (studio !== 'all') params.set('studio', studio)
  if (contextGenre !== 'all') params.set('contextGenre', contextGenre)
  if (archetype !== 'all') params.set('archetype', archetype)
  if (offset) params.set('offset', String(offset))
  const search = params.toString()
  return `/characters${search ? `?${search}` : ''}`
}

export default function CharacterCatalog({ pathname = '/characters', onNavigate }) {
  const [initialState] = useState(readInitialState)
  const [queryInput, setQueryInput] = useState(initialState.query)
  const [query, setQuery] = useState(initialState.query)
  const [contextGenre, setContextGenre] = useState(initialState.contextGenre)
  const [archetype, setArchetype] = useState(initialState.archetype)
  const [animeGenres, setAnimeGenres] = useState(initialState.animeGenres)
  const [animeTags, setAnimeTags] = useState(initialState.animeTags)
  const [genreMode, setGenreMode] = useState(initialState.genreMode)
  const [studio, setStudio] = useState(initialState.studio)
  const [offset, setOffset] = useState(initialState.offset)
  const [catalog, setCatalog] = useState({ characters: [], total: 0, hasMore: false })
  const [filterOptions, setFilterOptions] = useState({ contextGenres: [], archetypes: [], animeGenres: [], studios: [], animeTags: [] })
  const animeGenreKey = animeGenres.join(',')
  const animeTagKey = animeTags.join(',')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncProgress, setSyncProgress] = useState(null)
  const syncController = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetch('/api/metadata/filters', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch('/api/metadata/anime-genres', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch('/api/metadata/studios', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch('/api/metadata/anime-tags', { signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([metadata, genres, studios, tags]) => {
      if (metadata) setFilterOptions({ ...metadata, animeGenres: genres?.genres ?? [], studios: studios?.studios ?? [], animeTags: tags?.tags ?? [] })
    }).catch((fetchError) => {
      if (fetchError.name !== 'AbortError') setError(fetchError.message)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const pageUrl = buildPageUrl({ query, contextGenre, archetype, animeGenres: splitList(animeGenreKey), animeTags: splitList(animeTagKey), genreMode, studio, offset })
    if (window.location.pathname + window.location.search !== pageUrl) {
      window.history.replaceState(window.history.state, '', pageUrl)
    }
  }, [query, contextGenre, archetype, animeGenreKey, animeTagKey, genreMode, studio, offset])

  useEffect(() => {
    const controller = new AbortController()
    fetch(buildCatalogUrl({ query, contextGenre, archetype, animeGenres: splitList(animeGenreKey), animeTags: splitList(animeTagKey), genreMode, studio, offset }), { signal: controller.signal })
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
  }, [query, contextGenre, archetype, animeGenreKey, animeTagKey, genreMode, studio, offset])

  useEffect(() => () => syncController.current?.abort(), [])

  function changeFilter(setter, value) {
    setLoading(true)
    setter(value)
    setOffset(0)
  }

  function toggleAnimeGenre(genreId) {
    changeFilter(setAnimeGenres, animeGenres.includes(genreId)
      ? animeGenres.filter((id) => id !== genreId)
      : [...animeGenres, genreId].slice(0, 20))
  }

  function toggleAnimeTag(tagId) {
    changeFilter(setAnimeTags, animeTags.includes(tagId)
      ? animeTags.filter((id) => id !== tagId)
      : [...animeTags, tagId].slice(0, 20))
  }

  function clearFilters() {
    setLoading(true)
    setAnimeGenres([])
    setAnimeTags([])
    setGenreMode('all')
    setStudio('all')
    setContextGenre('all')
    setArchetype('all')
    setOffset(0)
  }

  function openAnime(seriesId) {
    onNavigate(`/anime/${encodeURIComponent(seriesId)}`, { fromCatalog: true })
  }

  function openCharacter(characterId) {
    onNavigate(`/character/${encodeURIComponent(characterId)}`, { fromCatalog: true })
  }

  const genreLabel = (id) => filterOptions.animeGenres.find((genre) => genre.id === id)?.label ?? id
  const tagLabel = (id) => filterOptions.animeTags.find((tag) => tag.id === id)?.name ?? id
  const hasActiveFilters = animeGenres.length > 0 || animeTags.length > 0 || studio !== 'all' || contextGenre !== 'all' || archetype !== 'all'

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
      const response = await fetch(buildCatalogUrl({ query, contextGenre, archetype, animeGenres, animeTags, genreMode, studio, offset }))
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
    <AppLayout pathname={pathname} onNavigate={onNavigate}>
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

        <section className="catalog-genre-panel" aria-label="Lọc theo anime genre">
          <div className="catalog-genre-panel-head">
            <span className="catalog-genre-panel-title"><Filter size={13} /> Anime genre &amp; tag {animeGenres.length + animeTags.length ? <em>{animeGenres.length + animeTags.length} đã chọn</em> : null}</span>
            <div className="catalog-genre-mode" role="radiogroup" aria-label="Cách kết hợp thể loại và tag">
              <button
                type="button"
                role="radio"
                aria-checked={genreMode === 'all'}
                className={genreMode === 'all' ? 'is-active' : ''}
                title="Anime phải thuộc tất cả thể loại đã chọn"
                onClick={() => changeFilter(setGenreMode, 'all')}
              >
                Có tất cả
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={genreMode === 'any'}
                className={genreMode === 'any' ? 'is-active' : ''}
                title="Anime thuộc ít nhất một thể loại đã chọn"
                onClick={() => changeFilter(setGenreMode, 'any')}
              >
                Bất kỳ
              </button>
            </div>
          </div>
          <div className="catalog-genre-chips">
            {filterOptions.animeGenres.map((genre) => {
              const active = animeGenres.includes(genre.id)
              return (
                <button
                  type="button"
                  key={genre.id}
                  aria-pressed={active}
                  className={`catalog-genre-chip${active ? ' is-active' : ''}`}
                  onClick={() => toggleAnimeGenre(genre.id)}
                >
                  {genre.label}
                  {genre.seriesCount ? <small>{genre.seriesCount}</small> : null}
                </button>
              )
            })}
          </div>
          <AnimeTagPicker tags={filterOptions.animeTags} selected={animeTags} onToggle={toggleAnimeTag} />
        </section>

        <section className="catalog-filter-bar" aria-label="Bộ lọc nhân vật">
          <label className="catalog-filter"><span><Building2 size={13} /> Studio</span>
            <select value={studio} onChange={(event) => changeFilter(setStudio, event.target.value)}>
              <option value="all">Tất cả studio</option>
              {studio !== 'all' && !filterOptions.studios.some((item) => item.id === studio) ? <option value={studio}>{studio}</option> : null}
              {filterOptions.studios.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.seriesCount})</option>)}
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
          {hasActiveFilters ? (
            <button type="button" className="catalog-clear-filters" onClick={clearFilters}><X size={13} /> Xóa bộ lọc</button>
          ) : null}
          <span className="catalog-result-count">{catalog.total} hồ sơ</span>
        </section>

        {animeGenres.length || animeTags.length || studio !== 'all' ? (
          <p className="catalog-active-filters" aria-live="polite">
            Đang lọc:{' '}
            {[
              ...animeGenres.map((id) => ({ key: `g:${id}`, label: genreLabel(id), remove: () => toggleAnimeGenre(id), title: 'Bỏ thể loại này' })),
              ...animeTags.map((id) => ({ key: `t:${id}`, label: `#${tagLabel(id)}`, remove: () => toggleAnimeTag(id), title: 'Bỏ tag này' })),
            ].map((item, index) => (
              <span key={item.key}>
                {index > 0 ? <i>{genreMode === 'all' ? ' và ' : ' hoặc '}</i> : null}
                <button type="button" onClick={item.remove} title={item.title}>{item.label} <X size={11} /></button>
              </span>
            ))}
            {studio !== 'all' ? (
              <span>
                {animeGenres.length || animeTags.length ? <i> · </i> : null}
                <button type="button" onClick={() => changeFilter(setStudio, 'all')} title="Bỏ lọc studio">
                  Studio: {filterOptions.studios.find((item) => item.id === studio)?.name ?? studio} <X size={11} />
                </button>
              </span>
            ) : null}
          </p>
        ) : null}

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
                  <h2>
                    <a
                      className="catalog-character-link"
                      href={`/character/${encodeURIComponent(character.id)}`}
                      onClick={(event) => { event.preventDefault(); openCharacter(character.id) }}
                    >
                      {character.name}
                    </a>
                  </h2>
                  {character.primarySeries ? (
                    <p>
                      <a
                        className="catalog-series-link"
                        href={`/anime/${character.primarySeries.id}`}
                        onClick={(event) => { event.preventDefault(); openAnime(character.primarySeries.id) }}
                      >
                        {character.primarySeries.title}
                      </a>
                      {character.seriesCount > 1 ? <span className="catalog-series-more"> · +{character.seriesCount - 1} anime khác</span> : null}
                    </p>
                  ) : <p>{character.series}</p>}
                </div>
              </div>
              <div className="catalog-metadata-line">
                {(character.animeGenreLinks ?? []).map((genre) => (
                  <button
                    type="button"
                    key={genre.id}
                    aria-pressed={animeGenres.includes(genre.id)}
                    className={`catalog-chip-button${animeGenres.includes(genre.id) ? ' is-active' : ''}`}
                    title={animeGenres.includes(genre.id) ? `Bỏ lọc thể loại ${genre.label}` : `Thêm thể loại ${genre.label} vào bộ lọc`}
                    onClick={() => { toggleAnimeGenre(genre.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  >
                    {genre.label}
                  </button>
                ))}
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
    </AppLayout>
  )
}