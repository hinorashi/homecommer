import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Building2, Eye, EyeOff, ExternalLink, Heart, Network, Users } from 'lucide-react'
import AppLayout from './AppLayout'
import { buildRelationGraph, relationLabelVi, splitSpoilers } from './relationGraph'
import './CharacterCatalog.css'
import './AnimeDetail.css'
import './CharacterDetail.css'

const ROLE_LABELS = { MAIN: 'Chính', SUPPORTING: 'Phụ', BACKGROUND: 'Nền' }
const FORMAT_LABELS = { TV: 'TV', TV_SHORT: 'TV ngắn', MOVIE: 'Movie', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music' }
const GENDER_LABELS = { Male: 'Nam', Female: 'Nữ', 'Non-binary': 'Phi nhị nguyên' }
const DIRECTION_LABELS = {
  out: 'Nhắc trong mô tả nhân vật này',
  in: 'Nhắc trong mô tả nhân vật kia',
  both: 'Hai bên cùng nhắc tới nhau',
}
const numberFormat = new Intl.NumberFormat('vi-VN')

function shortName(name, max = 16) {
  if (!name) return ''
  return name.length > max ? `${name.slice(0, max - 1)}…` : name
}

function anilistCharacterUrl(anilistId) {
  return `https://anilist.co/character/${anilistId}`
}

function Avatar({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`detail-avatar ${className}`.trim()}>
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span>{name?.slice(0, 1)}</span>}
    </span>
  )
}

function SpoilerText({ text, revealAll }) {
  const [revealed, setRevealed] = useState(() => new Set())
  const toggle = (index) => setRevealed((current) => {
    const next = new Set(current)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    return next
  })
  return splitSpoilers(text).map((segment, index) => {
    if (!segment.spoiler) return <span key={index}>{segment.text}</span>
    const open = revealAll || revealed.has(index)
    const onKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggle(index)
      }
    }
    if (!open) {
      // Hidden spoilers never put their text in the DOM, so it cannot leak via copy, find-in-page or CSS overrides.
      return (
        <span key={index} role="button" tabIndex={0} className="detail-spoiler" title="Bấm để xem đoạn spoiler này" onClick={() => toggle(index)} onKeyDown={onKeyDown}>
          <EyeOff size={11} aria-hidden="true" /> Spoiler · {segment.text.trim().split(/\s+/).length} từ
        </span>
      )
    }
    return (
      <span
        key={index}
        className="detail-spoiler is-open"
        {...(revealAll ? {} : { role: 'button', tabIndex: 0, title: 'Bấm để ẩn lại', onClick: () => toggle(index), onKeyDown })}
      >
        {segment.text}
      </span>
    )
  })
}

function RelationGraph({ relations, showSpoilers, onToggleSpoilers, onOpenCharacter, onOpenAnime, center }) {
  const [showDirect, setShowDirect] = useState(true)
  const [showClusters, setShowClusters] = useState(true)
  const [hovered, setHovered] = useState(null)
  const graph = useMemo(
    () => buildRelationGraph(relations, { showSpoilers, showDirect, showClusters }),
    [relations, showSpoilers, showDirect, showClusters],
  )
  const hiddenSpoilers = showSpoilers ? 0 : (relations?.direct ?? []).filter((item) => item.spoiler).length
  const nodeRadius = 24
  const activeGroup = hovered ? graph.leaves.find((leaf) => leaf.key === hovered)?.groupId ?? hovered : null
  const dimmed = (groupId, leafKey) => hovered && hovered !== leafKey && activeGroup !== groupId

  function openLeaf(event, leaf) {
    event.preventDefault()
    if (leaf.characterId) onOpenCharacter(leaf.characterId)
    else window.open(anilistCharacterUrl(leaf.anilistId), '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="detail-section detail-graph-section" aria-labelledby="relation-graph-heading">
      <div className="detail-section-head">
        <h2 id="relation-graph-heading"><Network size={20} /> Cây quan hệ</h2>
        <div className="detail-graph-toggles">
          <label><input type="checkbox" checked={showDirect} onChange={(event) => setShowDirect(event.target.checked)} /> Quan hệ trực tiếp</label>
          <label><input type="checkbox" checked={showClusters} onChange={(event) => setShowClusters(event.target.checked)} /> Cùng anime</label>
        </div>
      </div>
      <p className="detail-section-note">
        AniList không có API quan hệ nhân vật; cây được suy ra từ liên kết trong mô tả nhân vật (quan hệ trực tiếp)
        và dàn nhân vật nổi bật của các anime mà nhân vật xuất hiện.
        {hiddenSpoilers ? (
          <>
            {` ${hiddenSpoilers} quan hệ đang ẩn vì có spoiler. `}
            <button type="button" className="detail-inline-link" onClick={onToggleSpoilers}>Hiện spoiler</button>
          </>
        ) : null}
      </p>

      {graph.leafCount === 0 ? (
        <p className="catalog-empty">Chưa có dữ liệu quan hệ cho nhân vật này.</p>
      ) : (
        <div className="detail-graph-frame">
          <svg
            className="detail-graph"
            viewBox={`0 0 ${graph.size} ${graph.size}`}
            role="img"
            aria-label={`Cây quan hệ của ${center.name}`}
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <clipPath id="relation-node-clip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5" /></clipPath>
              <clipPath id="relation-hub-clip" clipPathUnits="objectBoundingBox"><rect width="1" height="1" rx=".18" /></clipPath>
            </defs>

            {graph.edges.map((edge) => {
              const midX = (edge.from.x + edge.to.x) / 2
              const midY = (edge.from.y + edge.to.y) / 2
              const faded = edge.kind === 'branch' ? dimmed(edge.groupId, edge.leafKey) : hovered && activeGroup !== edge.groupId
              return (
                <g key={edge.key} className={`graph-edge graph-edge-${edge.kind} graph-edge-${edge.groupKind}${faded ? ' is-dimmed' : ''}`}>
                  <line x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} />
                  {edge.label && edge.kind === 'branch' && hovered === edge.leafKey ? (
                    <g className="graph-edge-label" transform={`translate(${midX} ${midY})`}>
                      <rect x={-edge.label.length * 3.4 - 6} y="-10" width={edge.label.length * 6.8 + 12} height="20" rx="10" />
                      <text textAnchor="middle" dy="4">{edge.label}</text>
                    </g>
                  ) : null}
                </g>
              )
            })}

            {graph.hubs.map((hub) => {
              const faded = hovered && activeGroup !== hub.id
              const content = hub.kind === 'cluster' && hub.coverImage ? (
                <image href={hub.coverImage} x={hub.x - 20} y={hub.y - 28} width="40" height="56" preserveAspectRatio="xMidYMid slice" clipPath="url(#relation-hub-clip)" />
              ) : (
                <circle cx={hub.x} cy={hub.y} r="20" />
              )
              const labelY = hub.y + (hub.kind === 'cluster' ? 42 : 34)
              return (
                <g key={hub.id} className={`graph-hub graph-hub-${hub.kind}${faded ? ' is-dimmed' : ''}`} onMouseEnter={() => setHovered(hub.id)}>
                  {hub.kind === 'cluster' ? (
                    <a href={`/anime/${encodeURIComponent(hub.seriesId)}`} onClick={(event) => { event.preventDefault(); onOpenAnime(hub.seriesId) }}>
                      <title>{`${hub.label} — mở trang anime`}</title>
                      {content}
                      <text x={hub.x} y={labelY} textAnchor="middle">{shortName(hub.label, 22)}</text>
                    </a>
                  ) : (
                    <>
                      {content}
                      <text x={hub.x} y={hub.y + 4} textAnchor="middle" className="graph-hub-count">{hub.childCount}</text>
                      <text x={hub.x} y={labelY} textAnchor="middle">{hub.label}</text>
                    </>
                  )}
                </g>
              )
            })}

            {graph.leaves.map((leaf) => {
              const faded = dimmed(leaf.groupId, leaf.key)
              const href = leaf.characterId ? `/character/${encodeURIComponent(leaf.characterId)}` : anilistCharacterUrl(leaf.anilistId)
              return (
                <g
                  key={leaf.key}
                  className={`graph-leaf graph-leaf-${leaf.groupKind}${leaf.characterId ? '' : ' is-external'}${leaf.spoiler ? ' is-spoiler' : ''}${faded ? ' is-dimmed' : ''}${hovered === leaf.key ? ' is-hovered' : ''}`}
                  onMouseEnter={() => setHovered(leaf.key)}
                  onFocus={() => setHovered(leaf.key)}
                >
                  <a href={href} onClick={(event) => openLeaf(event, leaf)}>
                    <title>{`${leaf.name}${leaf.edgeLabel ? ` · ${leaf.edgeLabel}` : ''}${leaf.role ? ` · vai ${ROLE_LABELS[leaf.role] ?? leaf.role}` : ''}${leaf.characterId ? '' : ' · mở AniList'}`}</title>
                    <circle className="graph-leaf-ring" cx={leaf.x} cy={leaf.y} r={nodeRadius + 2} />
                    {leaf.image ? (
                      <image href={leaf.image} x={leaf.x - nodeRadius} y={leaf.y - nodeRadius} width={nodeRadius * 2} height={nodeRadius * 2} preserveAspectRatio="xMidYMin slice" clipPath="url(#relation-node-clip)" />
                    ) : (
                      <text x={leaf.x} y={leaf.y + 6} textAnchor="middle" className="graph-leaf-initial">{leaf.name?.slice(0, 1)}</text>
                    )}
                    <text x={leaf.x} y={leaf.y + nodeRadius + 14} textAnchor="middle" className="graph-leaf-name">{shortName(leaf.name)}</text>
                    {leaf.edgeLabel && leaf.groupKind === 'direct' ? (
                      <text x={leaf.x} y={leaf.y + nodeRadius + 26} textAnchor="middle" className="graph-leaf-relation">{shortName(leaf.edgeLabel, 18)}</text>
                    ) : null}
                  </a>
                </g>
              )
            })}

            <g className="graph-center">
              <circle cx={graph.center.x} cy={graph.center.y} r="46" className="graph-center-ring" />
              {center.image ? (
                <image href={center.image} x={graph.center.x - 42} y={graph.center.y - 42} width="84" height="84" preserveAspectRatio="xMidYMin slice" clipPath="url(#relation-node-clip)" />
              ) : (
                <text x={graph.center.x} y={graph.center.y + 10} textAnchor="middle" className="graph-leaf-initial">{center.name.slice(0, 1)}</text>
              )}
              <text x={graph.center.x} y={graph.center.y + 64} textAnchor="middle" className="graph-center-name">{shortName(center.name, 24)}</text>
            </g>
          </svg>
          <p className="detail-graph-legend">
            <span className="legend-direct" /> Quan hệ trực tiếp
            <span className="legend-cluster" /> Cùng anime
            <span className="legend-external" /> Chưa có trong database (mở AniList)
          </p>
        </div>
      )}
    </section>
  )
}

export default function CharacterDetail({ characterId, pathname, onNavigate }) {
  const [character, setCharacter] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/catalog/character/${encodeURIComponent(characterId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (response.status === 404) throw new Error('Không tìm thấy nhân vật này trong database.')
        if (!response.ok) throw new Error(payload.error ?? `Character API returned ${response.status}`)
        setCharacter(payload.character)
        setError('')
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') setError(fetchError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [characterId])

  useEffect(() => {
    if (!character?.name) return undefined
    const previousTitle = document.title
    document.title = `${character.name} · Nhân vật giống mình`
    return () => { document.title = previousTitle }
  }, [character?.name])

  function backToCatalog() {
    if (window.history.state?.fromCatalog) window.history.back()
    else onNavigate('/characters')
  }

  const openCharacter = (id) => onNavigate(`/character/${encodeURIComponent(id)}`)
  const openAnime = (id) => onNavigate(`/anime/${encodeURIComponent(id)}`)
  const linkTo = (path) => (event) => { event.preventDefault(); onNavigate(path) }

  const facts = character ? [
    character.gender && ['Giới tính', GENDER_LABELS[character.gender] ?? character.gender],
    character.age && ['Tuổi', character.age],
    character.dateOfBirth && ['Sinh nhật', character.dateOfBirth],
    character.bloodType && ['Nhóm máu', character.bloodType],
    character.anime?.length && ['Xuất hiện', `${character.anime.length} anime`],
  ].filter(Boolean) : []
  const direct = character?.relations?.direct ?? []
  const coStars = character?.relations?.coStars ?? []
  const hiddenRelationSpoilers = direct.filter((item) => item.spoiler).length
  const bioSpoilerCount = useMemo(() => splitSpoilers(character?.description ?? '').filter((segment) => segment.spoiler).length, [character?.description])
  const hasSpoilerContent = bioSpoilerCount > 0 || hiddenRelationSpoilers > 0

  return (
    <AppLayout pathname={pathname} onNavigate={onNavigate} mainClassName="character-detail-main">
      <nav className="anime-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={backToCatalog}><ArrowLeft size={14} /> Thư viện nhân vật</button>
        {character?.anime?.[0] ? (
          <>
            <span aria-hidden="true">/</span>
            <a href={`/anime/${encodeURIComponent(character.anime[0].id)}`} onClick={linkTo(`/anime/${encodeURIComponent(character.anime[0].id)}`)}>{character.anime[0].title}</a>
          </>
        ) : null}
        {character ? <><span aria-hidden="true">/</span><span>{character.name}</span></> : null}
      </nav>

      {error ? <p className="catalog-error" role="alert">{error}</p> : null}
      {loading ? <p className="catalog-status" role="status">Đang tải thông tin nhân vật...</p> : null}

      {character ? (
        <>
          <section className="anime-hero detail-hero">
            <div className="anime-cover detail-portrait">
              {character.image?.url ? <img src={character.image.url} alt={character.name} /> : <span>{character.name.slice(0, 1)}</span>}
            </div>
            <div className="anime-info">
              <p className="catalog-eyebrow">NHÂN VẬT</p>
              <h1>{character.name}</h1>
              {character.nativeName ? <p className="anime-alt-titles">{character.nativeName}</p> : null}
              {character.aliases?.length ? (
                <p className="detail-aliases" title={character.aliases.join(', ')}>
                  Còn gọi là: {character.aliases.slice(0, 6).join(' · ')}{character.aliases.length > 6 ? ` · +${character.aliases.length - 6}` : ''}
                </p>
              ) : null}

              <div className="anime-stats">
                {character.favourites ? <span><Heart size={14} /> {numberFormat.format(character.favourites)} yêu thích</span> : null}
                {direct.length ? <span><Network size={14} /> {direct.length} quan hệ trực tiếp</span> : null}
                {coStars.length ? <span><Users size={14} /> {coStars.length} bạn diễn</span> : null}
              </div>

              {facts.length ? (
                <dl className="anime-facts">
                  {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                  {character.studios?.length ? (
                    <div className="detail-fact-wide">
                      <dt>Studio</dt>
                      <dd className="detail-studio-links">
                        {character.studios.map((studio, index) => (
                          <span key={studio.id}>
                            {index > 0 ? ', ' : null}
                            <a
                              href={`/characters?studio=${encodeURIComponent(studio.id)}`}
                              title={`Xem nhân vật trong các anime của ${studio.name}`}
                              onClick={linkTo(`/characters?studio=${encodeURIComponent(studio.id)}`)}
                            >
                              {studio.name}
                            </a>
                          </span>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {character.genres?.length ? (
                <div className="catalog-metadata-line anime-genres">
                  {character.genres.map((genre) => (
                    <button
                      type="button"
                      key={genre.id}
                      className="catalog-chip-button"
                      title={`Xem nhân vật thể loại ${genre.label}`}
                      onClick={() => onNavigate(`/characters?animeGenre=${encodeURIComponent(genre.id)}`)}
                    >
                      {genre.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {character.description || hasSpoilerContent ? (
                <div className="detail-bio-head">
                  <h2>Tiểu sử</h2>
                  {hasSpoilerContent ? (
                    <div className="detail-spoiler-switch">
                      <span>
                        {[bioSpoilerCount && `${bioSpoilerCount} đoạn spoiler`, hiddenRelationSpoilers && `${hiddenRelationSpoilers} quan hệ spoiler`].filter(Boolean).join(' · ')}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        className="detail-spoiler-toggle"
                        aria-checked={showSpoilers}
                        onClick={() => setShowSpoilers((value) => !value)}
                        title="Áp dụng cho tiểu sử, cây quan hệ và danh sách quan hệ"
                      >
                        {showSpoilers ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showSpoilers ? 'Đang hiện spoiler' : 'Đang ẩn spoiler'}
                        <span className="detail-switch-track" aria-hidden="true"><span /></span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {character.description ? (
                <div className={`anime-description detail-description${expanded ? ' is-expanded' : ''}`}>
                  <p><SpoilerText key={showSpoilers ? 'shown' : 'hidden'} text={character.description} revealAll={showSpoilers} /></p>
                  {character.description.length > 420 ? (
                    <button type="button" className="detail-expand" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</button>
                  ) : null}
                </div>
              ) : (
                <p className="detail-section-note">{character.detailsSyncedAt ? 'AniList chưa có mô tả cho nhân vật này.' : 'Chưa đồng bộ mô tả từ AniList.'}</p>
              )}

              <div className="detail-hero-actions">
                {character.sourceUrl ? (
                  <a className="anime-external-link" href={character.sourceUrl} target="_blank" rel="noreferrer">Xem trên AniList <ExternalLink size={13} /></a>
                ) : null}
              </div>
            </div>
          </section>

          <RelationGraph
            relations={character.relations}
            showSpoilers={showSpoilers}
            onToggleSpoilers={() => setShowSpoilers(true)}
            onOpenCharacter={openCharacter}
            onOpenAnime={openAnime}
            center={{ name: character.name, image: character.image?.url }}
          />

          {direct.length ? (
            <section className="detail-section" aria-labelledby="direct-relations-heading">
              <h2 id="direct-relations-heading">Quan hệ trực tiếp <span>({direct.length})</span></h2>
              <div className="detail-relation-list">
                {direct.map((relation) => {
                  const node = relation.character
                  const hidden = relation.spoiler && !showSpoilers
                  const name = node?.name ?? relation.name
                  const href = node ? `/character/${encodeURIComponent(node.id)}` : anilistCharacterUrl(relation.anilistId)
                  return (
                    <article key={relation.anilistId} className={`detail-relation-card${hidden ? ' is-spoiler' : ''}`}>
                      <Avatar src={node?.image} name={name} />
                      <div>
                        <h3>
                          <a
                            href={href}
                            target={node ? undefined : '_blank'}
                            rel={node ? undefined : 'noreferrer'}
                            onClick={node ? linkTo(href) : undefined}
                          >
                            {name}
                          </a>
                          <em>{relationLabelVi(relation.label ?? relation.reverseLabel)}</em>
                          {relation.spoiler ? <em className="detail-spoiler-badge">Spoiler</em> : null}
                        </h3>
                        {node?.primarySeries ? (
                          <p className="detail-relation-series">
                            <a href={`/anime/${encodeURIComponent(node.primarySeries.id)}`} onClick={linkTo(`/anime/${encodeURIComponent(node.primarySeries.id)}`)}>{node.primarySeries.title}</a>
                          </p>
                        ) : !node ? <p className="detail-relation-series">Chưa có trong database · mở AniList</p> : null}
                        <blockquote className={hidden ? 'is-blurred' : ''} title={hidden ? 'Bật “Hiện spoiler” để xem' : undefined}>
                          {relation.context || relation.reverseContext}
                        </blockquote>
                        {relation.direction === 'both' && relation.reverseContext && relation.context ? (
                          <blockquote className={`is-reverse${hidden ? ' is-blurred' : ''}`}>{relation.reverseContext}</blockquote>
                        ) : null}
                        <small>{DIRECTION_LABELS[relation.direction] ?? ''}</small>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {coStars.length ? (
            <section className="detail-section" aria-labelledby="costars-heading">
              <h2 id="costars-heading">Bạn diễn thường gặp <span>({coStars.length})</span></h2>
              <div className="detail-costar-grid">
                {coStars.map(({ character: node, sharedCount, role }) => (
                  <a key={node.id} className="detail-costar" href={`/character/${encodeURIComponent(node.id)}`} onClick={linkTo(`/character/${encodeURIComponent(node.id)}`)}>
                    <Avatar src={node.image} name={node.name} />
                    <span>
                      <strong>{node.name}</strong>
                      <small>{sharedCount} anime chung{role ? ` · vai ${ROLE_LABELS[role] ?? role}` : ''}</small>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {character.anime?.length ? (
            <section className="detail-section" aria-labelledby="character-anime-heading">
              <h2 id="character-anime-heading">Xuất hiện trong <span>({character.anime.length})</span></h2>
              <div className="anime-relation-list">
                {character.anime.map((series) => (
                  <a key={series.id} className="anime-relation-card is-internal" href={`/anime/${encodeURIComponent(series.id)}`} onClick={linkTo(`/anime/${encodeURIComponent(series.id)}`)}>
                    <span className="anime-relation-cover">
                      {series.coverImage ? <img src={series.coverImage} alt="" loading="lazy" /> : <span>{series.title.slice(0, 1)}</span>}
                    </span>
                    <span className="anime-relation-body">
                      {series.role ? <em>Vai {ROLE_LABELS[series.role] ?? series.role}</em> : null}
                      <strong>{series.title}</strong>
                      <small>{[FORMAT_LABELS[series.format] ?? series.format, series.seasonYear].filter(Boolean).join(' · ')}</small>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {character.studios?.length ? (
            <p className="detail-studio-footer">
              <Building2 size={13} /> Lọc nhân vật cùng studio:{' '}
              {character.studios.map((studio) => (
                <a key={studio.id} href={`/characters?studio=${encodeURIComponent(studio.id)}`} onClick={linkTo(`/characters?studio=${encodeURIComponent(studio.id)}`)}>
                  {studio.name} <small>({studio.seriesCount})</small>
                </a>
              ))}
            </p>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  )
}
