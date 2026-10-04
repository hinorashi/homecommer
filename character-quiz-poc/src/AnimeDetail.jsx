import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ExternalLink, Heart, Star, Users } from 'lucide-react'
import AppLayout from './AppLayout'
import './CharacterCatalog.css'
import './AnimeDetail.css'

const ROLE_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'MAIN', label: 'Nhân vật chính' },
  { id: 'SUPPORTING', label: 'Nhân vật phụ' },
  { id: 'BACKGROUND', label: 'Nền' },
]
const ROLE_LABELS = { MAIN: 'Chính', SUPPORTING: 'Phụ', BACKGROUND: 'Nền' }
const FORMAT_LABELS = { TV: 'TV', TV_SHORT: 'TV ngắn', MOVIE: 'Movie', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music' }
const STATUS_LABELS = {
  FINISHED: 'Đã kết thúc',
  RELEASING: 'Đang phát sóng',
  NOT_YET_RELEASED: 'Chưa phát sóng',
  CANCELLED: 'Đã hủy',
  HIATUS: 'Tạm ngưng',
}
const SEASON_LABELS = { WINTER: 'Đông', SPRING: 'Xuân', SUMMER: 'Hè', FALL: 'Thu' }
const RELATION_LABELS = {
  PREQUEL: 'Phần trước',
  SEQUEL: 'Phần sau',
  PARENT: 'Câu chuyện gốc',
  SIDE_STORY: 'Ngoại truyện',
  SPIN_OFF: 'Spin-off',
  ALTERNATIVE: 'Phiên bản khác',
  SUMMARY: 'Tóm tắt',
  SOURCE: 'Nguyên tác',
  ADAPTATION: 'Chuyển thể',
  CHARACTER: 'Chung nhân vật',
  COMPILATION: 'Tổng hợp',
  CONTAINS: 'Bao gồm',
  OTHER: 'Khác',
}
const MEDIA_FORMAT_LABELS = { ...FORMAT_LABELS, MANGA: 'Manga', NOVEL: 'Light novel', ONE_SHOT: 'One-shot' }
const numberFormat = new Intl.NumberFormat('vi-VN')

function groupRelations(relations = []) {
  const groups = new Map()
  for (const relation of relations) {
    const key = relation.relationType ?? 'OTHER'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(relation)
  }
  return [...groups.entries()].map(([type, items]) => ({ type, label: RELATION_LABELS[type] ?? type, items }))
}

export default function AnimeDetail({ seriesId, pathname, onNavigate }) {
  const [anime, setAnime] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/catalog/anime/${encodeURIComponent(seriesId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (response.status === 404) throw new Error('Không tìm thấy anime này trong database.')
        if (!response.ok) throw new Error(payload.error ?? `Anime API returned ${response.status}`)
        setAnime(payload.anime)
        setError('')
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [seriesId])

  useEffect(() => {
    if (!anime?.title) return undefined
    const previousTitle = document.title
    document.title = `${anime.title} · Nhân vật giống mình`
    return () => { document.title = previousTitle }
  }, [anime?.title])

  const roleCounts = useMemo(() => {
    const counts = { all: anime?.characters.length ?? 0 }
    for (const character of anime?.characters ?? []) {
      if (character.role) counts[character.role] = (counts[character.role] ?? 0) + 1
    }
    return counts
  }, [anime])
  const visibleCharacters = (anime?.characters ?? []).filter((character) => role === 'all' || character.role === role)

  function backToCatalog() {
    if (window.history.state?.fromCatalog) window.history.back()
    else onNavigate('/characters')
  }

  function openGenre(genreId) {
    onNavigate(`/characters?animeGenre=${encodeURIComponent(genreId)}`)
  }

  function openCharacter(characterId) {
    onNavigate(`/character/${encodeURIComponent(characterId)}`)
  }

  function openStudio(studioId) {
    onNavigate(`/characters?studio=${encodeURIComponent(studioId)}`)
  }

  const relationGroups = useMemo(() => groupRelations(anime?.relations), [anime])

  const facts = anime ? [
    anime.format && ['Định dạng', FORMAT_LABELS[anime.format] ?? anime.format],
    anime.episodes && ['Số tập', anime.episodes],
    anime.status && ['Trạng thái', STATUS_LABELS[anime.status] ?? anime.status],
    (anime.season || anime.seasonYear) && ['Mùa', [SEASON_LABELS[anime.season] ?? anime.season, anime.seasonYear].filter(Boolean).join(' ')],
    anime.studios?.length && ['Studio', (
      <span className="detail-studio-links">
        {anime.studios.map((studio, index) => (
          <span key={studio.id ?? studio.name}>
            {index > 0 ? ', ' : null}
            {studio.id ? (
              <a
                href={`/characters?studio=${encodeURIComponent(studio.id)}`}
                title={`Xem nhân vật trong các anime của ${studio.name}`}
                onClick={(event) => { event.preventDefault(); openStudio(studio.id) }}
              >
                {studio.name}
              </a>
            ) : studio.name}
          </span>
        ))}
      </span>
    )],
  ].filter(Boolean) : []

  return (
    <AppLayout
      pathname={pathname}
      onNavigate={onNavigate}
      mainClassName={`anime-main${anime?.bannerImage ? ' has-banner' : ''}`}
      before={anime?.bannerImage ? (
        <div className="anime-banner" style={{ backgroundImage: `url(${anime.bannerImage})` }} aria-hidden="true" />
      ) : null}
    >
        <nav className="anime-breadcrumb" aria-label="Breadcrumb">
          <button type="button" onClick={backToCatalog}><ArrowLeft size={14} /> Thư viện nhân vật</button>
          {anime ? <><span aria-hidden="true">/</span><span>{anime.title}</span></> : null}
        </nav>

        {error ? <p className="catalog-error" role="alert">{error}</p> : null}
        {loading ? <p className="catalog-status" role="status">Đang tải thông tin anime...</p> : null}

        {anime ? (
          <>
            <section className="anime-hero">
              <div className="anime-cover">
                {anime.coverImage ? <img src={anime.coverImage} alt={`Ảnh bìa ${anime.title}`} /> : <span>{anime.title.slice(0, 1)}</span>}
              </div>
              <div className="anime-info">
                <p className="catalog-eyebrow">
                  {[FORMAT_LABELS[anime.format] ?? anime.format, anime.seasonYear].filter(Boolean).join(' · ') || 'ANIME'}
                </p>
                <h1>{anime.title}</h1>
                <p className="anime-alt-titles">
                  {[anime.titleEnglish, anime.titleRomaji, anime.titleNative]
                    .filter((title, index, list) => title && title !== anime.title && list.indexOf(title) === index)
                    .join(' · ')}
                </p>

                <div className="anime-stats">
                  {anime.averageScore ? <span><Star size={14} /> {anime.averageScore}%</span> : null}
                  {anime.popularity ? <span><Users size={14} /> {numberFormat.format(anime.popularity)} thành viên</span> : null}
                  {anime.favourites ? <span><Heart size={14} /> {numberFormat.format(anime.favourites)} yêu thích</span> : null}
                </div>

                {facts.length ? (
                  <dl className="anime-facts">
                    {facts.map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                ) : null}

                {anime.genres.length ? (
                  <div className="catalog-metadata-line anime-genres">
                    {anime.genres.map((genre) => (
                      <button type="button" key={genre.id} className="catalog-chip-button" title={`Xem nhân vật thể loại ${genre.label}`} onClick={() => openGenre(genre.id)}>
                        {genre.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {anime.description ? (
                  <div className={`anime-description${expanded ? ' is-expanded' : ''}`}>
                    <p>{anime.description}</p>
                    {anime.description.length > 420 ? (
                      <button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>
                    ) : null}
                  </div>
                ) : null}

                {anime.pageUrl ? (
                  <a className="anime-external-link" href={anime.pageUrl} target="_blank" rel="noreferrer">
                    Xem trên AniList <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </section>

            {relationGroups.length ? (
              <section className="anime-relations" aria-labelledby="anime-relations-heading">
                <h2 id="anime-relations-heading">Liên quan <span>({anime.relations.length})</span></h2>
                <div className="anime-relation-list">
                  {relationGroups.flatMap((group) => group.items.map((relation) => {
                    const internal = Boolean(relation.seriesId)
                    const href = internal ? `/anime/${encodeURIComponent(relation.seriesId)}` : relation.siteUrl
                    const meta = [MEDIA_FORMAT_LABELS[relation.format] ?? relation.format ?? relation.mediaType, relation.seasonYear, STATUS_LABELS[relation.status]]
                      .filter(Boolean).join(' · ')
                    return (
                      <a
                        key={`${group.type}-${relation.anilistId}`}
                        className={`anime-relation-card${internal ? ' is-internal' : ''}`}
                        href={href ?? undefined}
                        target={internal ? undefined : '_blank'}
                        rel={internal ? undefined : 'noreferrer'}
                        onClick={internal ? (event) => { event.preventDefault(); onNavigate(href) } : undefined}
                      >
                        <span className="anime-relation-cover">
                          {relation.coverImage ? <img src={relation.coverImage} alt="" loading="lazy" /> : <span>{relation.title?.slice(0, 1)}</span>}
                        </span>
                        <span className="anime-relation-body">
                          <em>{group.label}</em>
                          <strong>{relation.title}</strong>
                          <small>{meta}{internal ? null : <> <ExternalLink size={10} /></>}</small>
                        </span>
                      </a>
                    )
                  }))}
                </div>
              </section>
            ) : null}

            <section className="anime-characters" aria-labelledby="anime-characters-heading">
              <div className="anime-characters-heading">
                <h2 id="anime-characters-heading">Nhân vật <span>({anime.characterTotal})</span></h2>
                <div className="anime-role-tabs" role="tablist" aria-label="Lọc theo vai trò">
                  {ROLE_TABS.filter((tab) => tab.id === 'all' || roleCounts[tab.id]).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={role === tab.id}
                      className={role === tab.id ? 'is-active' : ''}
                      onClick={() => setRole(tab.id)}
                    >
                      {tab.label} <span>{roleCounts[tab.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {anime.characters.length === 0 ? (
                <p className="catalog-empty" role="status">
                  Chưa có nhân vật cho anime này. Chạy <code>npm run crawl:characters</code> để đồng bộ từ AniList.
                </p>
              ) : null}

              <div className="anime-character-grid">
                {visibleCharacters.map((character) => (
                  <article className="anime-character-card" key={character.id}>
                    <div className="anime-character-image">
                      {character.image?.url
                        ? <img src={character.image.url} alt={character.name} loading="lazy" />
                        : <span>{character.name.slice(0, 1)}</span>}
                      {character.role ? <em className={`anime-role-badge role-${character.role.toLowerCase()}`}>{ROLE_LABELS[character.role] ?? character.role}</em> : null}
                    </div>
                    <div className="anime-character-body">
                      <h3>
                        <a
                          href={`/character/${encodeURIComponent(character.id)}`}
                          onClick={(event) => { event.preventDefault(); openCharacter(character.id) }}
                        >
                          {character.name}
                        </a>
                      </h3>
                      {character.nativeName ? <p>{character.nativeName}</p> : null}
                      <small>
                        {character.favourites ? <><Heart size={11} /> {numberFormat.format(character.favourites)}</> : null}
                        {character.seriesCount > 1 ? <> · {character.seriesCount} anime</> : null}
                        {character.sourceUrl ? <> · <a href={character.sourceUrl} target="_blank" rel="noreferrer">AniList</a></> : null}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
              {anime.characters.some((character) => character.image?.provider === 'AniList') ? (
                <p className="catalog-image-note">Ảnh lưu từ AniList · quyền tái sử dụng chưa xác minh</p>
              ) : null}
            </section>
          </>
        ) : null}
    </AppLayout>
  )
}
