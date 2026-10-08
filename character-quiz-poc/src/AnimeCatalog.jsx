import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, Filter, Heart, Search, Star, Users, X } from 'lucide-react'
import AppLayout from './AppLayout'
import AnimeTagPicker from './AnimeTagPicker'
import { ANIME_SORT_OPTIONS, FORMAT_LABELS, STATUS_LABELS } from './animeLabels'
import './CharacterCatalog.css'
import './AnimeDetail.css'
import './AnimeCatalog.css'

const PAGE_SIZE = 24
const SCORE_OPTIONS = [60, 70, 75, 80, 85, 90]
const numberFormat = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

function splitList(value) {
  if (!value || value === 'all') return []
  return [...new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))].slice(0, 20)
}

const intOrEmpty = (value) => (/^\d{1,4}$/.test(value ?? '') ? value : '')

function readInitialState() {
  const params = new URLSearchParams(window.location.search)
  const offset = Math.max(0, Math.trunc(Number(params.get('offset')) || 0))
  const sort = params.get('sort')
  return {
    query: (params.get('q') ?? '').slice(0, 100),
    genres: splitList(params.get('animeGenre')),
    tags: splitList(params.get('animeTag')),
    genreMode: params.get('genreMode') === 'any' ? 'any' : 'all',
    studio: params.get('studio') || 'all',
    format: (params.get('format') || 'all').toUpperCase().replace('ALL', 'all'),
    status: (params.get('status') || 'all').toUpperCase().replace('ALL', 'all'),
    yearFrom: intOrEmpty(params.get('yearFrom')),
    yearTo: intOrEmpty(params.get('yearTo')),
    minScore: intOrEmpty(params.get('minScore')),
    sort: ANIME_SORT_OPTIONS.some((option) => option.id === sort) ? sort : 'popularity',
    offset: offset - (offset % PAGE_SIZE),
  }
}

function toParams(filters, { forApi }) {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.genres.length) params.set('animeGenre', filters.genres.join(','))
  if (filters.tags.length) params.set('animeTag', filters.tags.join(','))
  if (filters.genreMode === 'any' && filters.genres.length + filters.tags.length > 1) params.set('genreMode', 'any')
  for (const key of ['studio', 'format', 'status']) {
    if (filters[key] !== 'all') params.set(key, filters[key])
  }
  for (const key of ['yearFrom', 'yearTo', 'minScore']) {
    if (filters[key]) params.set(key, filters[key])
  }
  if (forApi || filters.sort !== 'popularity') params.set('sort', filters.sort)
  if (forApi) params.set('limit', String(PAGE_SIZE))
  if (forApi || filters.offset) params.set('offset', String(filters.offset))
  return params.toString()
}

export default function AnimeCatalog({ pathname = '/anime', onNavigate }) {
  const [initial] = useState(readInitialState)
  const [queryInput, setQueryInput] = useState(initial.query)
  const [filters, setFilters] = useState(initial)
  const [result, setResult] = useState({ anime: [], total: 0, hasMore: false })
  const [options, setOptions] = useState({ genres: [], tags: [], studios: [], formats: [], statuses: [], years: { min: null, max: null } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const filterKey = toParams(filters, { forApi: true })

  useEffect(() => {
    const controller = new AbortController()
    const get = (url) => fetch(url, { signal: controller.signal }).then((response) => (response.ok ? response.json() : null))
    Promise.all([get('/api/metadata/anime-genres'), get('/api/metadata/anime-tags'), get('/api/metadata/studios'), get('/api/metadata/anime-facets')])
      .then(([genres, tags, studios, facets]) => setOptions({
        genres: genres?.genres ?? [],
        tags: tags?.tags ?? [],
        studios: studios?.studios ?? [],
        formats: facets?.formats ?? [],
        statuses: facets?.statuses ?? [],
        years: facets?.years ?? { min: null, max: null },
      }))
      .catch((fetchError) => { if (fetchError.name !== 'AbortError') setError(fetchError.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const search = toParams(filters, { forApi: false })
    const pageUrl = `/anime${search ? `?${search}` : ''}`
    if (window.location.pathname + window.location.search !== pageUrl) {
      window.history.replaceState(window.history.state, '', pageUrl)
    }
  }, [filters])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/catalog/anime?${filterKey}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error ?? `Anime API returned ${response.status}`)
        setResult(payload)
        setError('')
      })
      .catch((fetchError) => { if (fetchError.name !== 'AbortError') setError(fetchError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [filterKey])

  function update(patch, { keepOffset = false } = {}) {
    setLoading(true)
    setFilters((current) => ({ ...current, ...patch, ...(keepOffset ? {} : { offset: 0 }) }))
    if (keepOffset) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleIn = (key, id) => update({
    [key]: filters[key].includes(id) ? filters[key].filter((item) => item !== id) : [...filters[key], id].slice(0, 20),
  })

  function clearFilters() {
    update({ genres: [], tags: [], genreMode: 'all', studio: 'all', format: 'all', status: 'all', yearFrom: '', yearTo: '', minScore: '' })
  }

  function openAnime(seriesId) {
    onNavigate(`/anime/${encodeURIComponent(seriesId)}`, { fromCatalog: true })
  }

  const years = useMemo(() => {
    const max = options.years.max ?? new Date().getFullYear()
    const min = options.years.min ?? 1970
    return Array.from({ length: max - min + 1 }, (_, index) => String(max - index))
  }, [options.years])

  const label = {
    genre: (id) => options.genres.find((item) => item.id === id)?.label ?? id,
    tag: (id) => options.tags.find((item) => item.id === id)?.name ?? id,
    studio: (id) => options.studios.find((item) => item.id === id)?.name ?? id,
  }
  const setChips = [
    ...filters.genres.map((id) => ({ key: `g:${id}`, text: label.genre(id), remove: () => toggleIn('genres', id) })),
    ...filters.tags.map((id) => ({ key: `t:${id}`, text: `#${label.tag(id)}`, remove: () => toggleIn('tags', id) })),
  ]
  const otherChips = [
    filters.studio !== 'all' && { key: 'studio', text: `Studio: ${label.studio(filters.studio)}`, remove: () => update({ studio: 'all' }) },
    filters.format !== 'all' && { key: 'format', text: FORMAT_LABELS[filters.format] ?? filters.format, remove: () => update({ format: 'all' }) },
    filters.status !== 'all' && { key: 'status', text: STATUS_LABELS[filters.status] ?? filters.status, remove: () => update({ status: 'all' }) },
    (filters.yearFrom || filters.yearTo) && {
      key: 'year',
      text: `Năm ${filters.yearFrom || '…'}–${filters.yearTo || '…'}`,
      remove: () => update({ yearFrom: '', yearTo: '' }),
    },
    filters.minScore && { key: 'score', text: `Điểm ≥ ${filters.minScore}%`, remove: () => update({ minScore: '' }) },
  ].filter(Boolean)
  const hasActiveFilters = setChips.length + otherChips.length > 0

  const currentPage = Math.floor(filters.offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE))

  return (
    <AppLayout pathname={pathname} onNavigate={onNavigate}>
      <div className="catalog-heading-row">
        <div>
          <p className="catalog-eyebrow">THƯ VIỆN ANIME</p>
          <h1>Khám phá anime</h1>
          <p className="catalog-subtitle">Lọc theo thể loại, tag, studio, định dạng, năm và điểm; mở anime để xem dàn nhân vật.</p>
        </div>
      </div>

      <form
        className="catalog-search-form"
        role="search"
        onSubmit={(event) => { event.preventDefault(); update({ query: queryInput.trim() }) }}
      >
        <label className="visually-hidden" htmlFor="anime-search">Tìm anime theo tên</label>
        <Search size={18} aria-hidden="true" />
        <input
          id="anime-search"
          type="search"
          maxLength={100}
          placeholder="Tên anime (Romaji, tiếng Anh hoặc tiếng Nhật)..."
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
        />
        <button type="submit">Tìm kiếm</button>
      </form>

      <section className="catalog-genre-panel" aria-label="Lọc theo thể loại và tag">
        <div className="catalog-genre-panel-head">
          <span className="catalog-genre-panel-title">
            <Filter size={13} /> Thể loại &amp; tag {setChips.length ? <em>{setChips.length} đã chọn</em> : null}
          </span>
          <div className="catalog-genre-mode" role="radiogroup" aria-label="Cách kết hợp thể loại và tag">
            {[['all', 'Có tất cả', 'Anime phải có tất cả thể loại/tag đã chọn'], ['any', 'Bất kỳ', 'Anime có ít nhất một thể loại/tag đã chọn']].map(([id, text, title]) => (
              <button
                type="button"
                role="radio"
                key={id}
                aria-checked={filters.genreMode === id}
                className={filters.genreMode === id ? 'is-active' : ''}
                title={title}
                onClick={() => update({ genreMode: id })}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="catalog-genre-chips">
          {options.genres.map((genre) => {
            const active = filters.genres.includes(genre.id)
            return (
              <button
                type="button"
                key={genre.id}
                aria-pressed={active}
                className={`catalog-genre-chip${active ? ' is-active' : ''}`}
                onClick={() => toggleIn('genres', genre.id)}
              >
                {genre.label}
                {genre.seriesCount ? <small>{genre.seriesCount}</small> : null}
              </button>
            )
          })}
        </div>
        <AnimeTagPicker tags={options.tags} selected={filters.tags} onToggle={(id) => toggleIn('tags', id)} />
      </section>

      <section className="catalog-filter-bar anime-filter-bar" aria-label="Bộ lọc anime">
        <label className="catalog-filter"><span><Building2 size={13} /> Studio</span>
          <select value={filters.studio} onChange={(event) => update({ studio: event.target.value })}>
            <option value="all">Tất cả studio</option>
            {filters.studio !== 'all' && !options.studios.some((item) => item.id === filters.studio) ? <option value={filters.studio}>{filters.studio}</option> : null}
            {options.studios.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.seriesCount})</option>)}
          </select>
        </label>
        <label className="catalog-filter"><span>Định dạng</span>
          <select value={filters.format} onChange={(event) => update({ format: event.target.value })}>
            <option value="all">Tất cả</option>
            {options.formats.map((item) => <option key={item.id} value={item.id}>{FORMAT_LABELS[item.id] ?? item.id} ({item.seriesCount})</option>)}
          </select>
        </label>
        <label className="catalog-filter"><span>Trạng thái</span>
          <select value={filters.status} onChange={(event) => update({ status: event.target.value })}>
            <option value="all">Tất cả</option>
            {options.statuses.map((item) => <option key={item.id} value={item.id}>{STATUS_LABELS[item.id] ?? item.id} ({item.seriesCount})</option>)}
          </select>
        </label>
        <div className="catalog-filter anime-year-filter">
          <span>Năm phát sóng</span>
          <div>
            <select aria-label="Từ năm" value={filters.yearFrom} onChange={(event) => update({ yearFrom: event.target.value })}>
              <option value="">Từ</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select aria-label="Đến năm" value={filters.yearTo} onChange={(event) => update({ yearTo: event.target.value })}>
              <option value="">Đến</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
        <label className="catalog-filter"><span><Star size={12} /> Điểm tối thiểu</span>
          <select value={filters.minScore} onChange={(event) => update({ minScore: event.target.value })}>
            <option value="">Bất kỳ</option>
            {SCORE_OPTIONS.map((score) => <option key={score} value={String(score)}>≥ {score}%</option>)}
          </select>
        </label>
        <label className="catalog-filter"><span>Sắp xếp</span>
          <select value={filters.sort} onChange={(event) => update({ sort: event.target.value })}>
            {ANIME_SORT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        {hasActiveFilters ? (
          <button type="button" className="catalog-clear-filters" onClick={clearFilters}><X size={13} /> Xóa bộ lọc</button>
        ) : null}
        <span className="catalog-result-count">{result.total} anime</span>
      </section>

      {hasActiveFilters ? (
        <p className="catalog-active-filters" aria-live="polite">
          Đang lọc:{' '}
          {setChips.map((chip, index) => (
            <span key={chip.key}>
              {index > 0 ? <i>{filters.genreMode === 'all' ? ' và ' : ' hoặc '}</i> : null}
              <button type="button" onClick={chip.remove} title="Bỏ điều kiện này">{chip.text} <X size={11} /></button>
            </span>
          ))}
          {otherChips.map((chip, index) => (
            <span key={chip.key}>
              {index > 0 || setChips.length ? <i> · </i> : null}
              <button type="button" onClick={chip.remove} title="Bỏ điều kiện này">{chip.text} <X size={11} /></button>
            </span>
          ))}
        </p>
      ) : null}

      {error ? <p className="catalog-error" role="alert">{error}</p> : null}
      {loading ? <p className="catalog-status" role="status">Đang tải danh sách anime...</p> : null}
      {!loading && !error && result.anime.length === 0 ? <p className="catalog-empty" role="status">Không tìm thấy anime phù hợp.</p> : null}

      <section className="anime-card-grid" aria-label="Danh sách anime">
        {result.anime.map((anime) => (
          <article className="anime-card" key={anime.id}>
            <a
              className="anime-card-cover"
              href={`/anime/${encodeURIComponent(anime.id)}`}
              onClick={(event) => { event.preventDefault(); openAnime(anime.id) }}
              tabIndex={-1}
              aria-hidden="true"
            >
              {anime.coverImage ? <img src={anime.coverImage} alt="" loading="lazy" /> : <span>{anime.title.slice(0, 1)}</span>}
              {anime.averageScore ? <b className="anime-card-score"><Star size={10} /> {anime.averageScore}%</b> : null}
            </a>
            <div className="anime-card-body">
              <p className="anime-card-meta">
                {[FORMAT_LABELS[anime.format] ?? anime.format, anime.seasonYear, anime.episodes ? `${anime.episodes} tập` : null].filter(Boolean).join(' · ')}
              </p>
              <h2>
                <a
                  className="catalog-character-link"
                  href={`/anime/${encodeURIComponent(anime.id)}`}
                  onClick={(event) => { event.preventDefault(); openAnime(anime.id) }}
                >
                  {anime.title}
                </a>
              </h2>
              {anime.titleEnglish && anime.titleEnglish !== anime.title ? <p className="anime-card-alt">{anime.titleEnglish}</p> : null}
              <p className="anime-card-stats">
                {anime.popularity ? <span title="Thành viên AniList"><Users size={11} /> {numberFormat.format(anime.popularity)}</span> : null}
                {anime.favourites ? <span title="Yêu thích"><Heart size={11} /> {numberFormat.format(anime.favourites)}</span> : null}
                {anime.characterCount ? <span>{anime.characterCount} nhân vật</span> : null}
              </p>
              {anime.studios.length ? (
                <p className="anime-card-studios">
                  {anime.studios.slice(0, 2).map((studio, index) => (
                    <span key={studio.id}>
                      {index > 0 ? ', ' : null}
                      <button type="button" title={`Lọc anime của ${studio.name}`} onClick={() => update({ studio: studio.id })}>{studio.name}</button>
                    </span>
                  ))}
                </p>
              ) : null}
              <div className="anime-card-chips">
                {anime.genres.map((genre) => (
                  <button
                    type="button"
                    key={genre.id}
                    aria-pressed={filters.genres.includes(genre.id)}
                    className={`catalog-chip-button${filters.genres.includes(genre.id) ? ' is-active' : ''}`}
                    title={filters.genres.includes(genre.id) ? `Bỏ lọc ${genre.label}` : `Lọc thêm thể loại ${genre.label}`}
                    onClick={() => toggleIn('genres', genre.id)}
                  >
                    {genre.label}
                  </button>
                ))}
                {anime.tags.map((tag) => (
                  <button
                    type="button"
                    key={tag.id}
                    aria-pressed={filters.tags.includes(tag.id)}
                    className={`anime-card-tag${filters.tags.includes(tag.id) ? ' is-active' : ''}`}
                    title={filters.tags.includes(tag.id) ? `Bỏ lọc tag ${tag.name}` : `Lọc thêm tag ${tag.name}`}
                    onClick={() => toggleIn('tags', tag.id)}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="catalog-pagination">
        <button type="button" disabled={filters.offset === 0 || loading} onClick={() => update({ offset: Math.max(0, filters.offset - PAGE_SIZE) }, { keepOffset: true })}>
          <ArrowLeft size={15} /> Trang trước
        </button>
        <span>Trang {currentPage} / {pageCount}</span>
        <button type="button" disabled={!result.hasMore || loading} onClick={() => update({ offset: filters.offset + PAGE_SIZE }, { keepOffset: true })}>
          Trang sau <ArrowRight size={15} />
        </button>
      </footer>
    </AppLayout>
  )
}
