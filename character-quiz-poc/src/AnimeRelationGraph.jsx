import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Network, Plus } from 'lucide-react'
import { ANIME_RELATION_LABELS, buildAnimeRelationGraph, groupAnimeRelations } from './animeRelationLayout'
import { FORMAT_LABELS } from './animeLabels'

export default function AnimeRelationGraph({ anime, onNavigate }) {
  const [animeOnly, setAnimeOnly] = useState(true)
  const [type, setType] = useState('all')
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const frame = useRef(null)
  const graph = useMemo(() => buildAnimeRelationGraph(anime.relations, { animeOnly, type }), [anime.relations, animeOnly, type])
  const groups = groupAnimeRelations(anime.relations)
  const centerY = graph.center.y + graph.center.height / 2
  const scale = zoom * fitScale

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setFitScale(Math.max(0.6, Math.min(1, (entry.contentRect.width - 2) / 910)))
    })
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="anime-relation-graph" ref={frame}>
      <div className="anime-graph-controls">
        <strong><Network size={16} /> Đồ thị quan hệ</strong>
        <label><input type="checkbox" checked={animeOnly} onChange={(event) => setAnimeOnly(event.target.checked)} /> Chỉ anime</label>
        <label className="visually-hidden" htmlFor="anime-graph-type">Loại quan hệ</label>
        <select id="anime-graph-type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Tất cả quan hệ</option>
          {groups.map((group) => <option key={group.type} value={group.type}>{group.label} ({group.items.length})</option>)}
        </select>
        <div className="anime-graph-zoom">
          <button type="button" aria-label="Thu nhỏ đồ thị" disabled={zoom <= 0.6} onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}><Minus size={14} /></button>
          <button type="button" aria-label="Đặt lại kích thước đồ thị" onClick={() => setZoom(1)}>{Math.round(scale * 100)}%</button>
          <button type="button" aria-label="Phóng to đồ thị" disabled={zoom >= 1.4} onClick={() => setZoom((value) => Math.min(1.4, value + 0.2))}><Plus size={14} /></button>
        </div>
      </div>
      <p className="anime-graph-note">Prequel ở trước → anime hiện tại → sequel ở sau. Spin-off và các quan hệ khác rẽ nhánh bên dưới; không phải thứ tự năm phát hành.</p>
      {graph.nodes.length ? (
        <div className="anime-graph-viewport" tabIndex={0} role="region" aria-label="Đồ thị quan hệ anime có thể cuộn">
          <div style={{ width: graph.width * scale, height: graph.height * scale }}>
            <div className="anime-graph-canvas" style={{ width: graph.width, height: graph.height, transform: `scale(${scale})` }}>
              <svg width={graph.width} height={graph.height} aria-hidden="true">
                <defs><marker id="anime-timeline-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#93baaa" /></marker></defs>
                {graph.nodes.map((node) => {
                  const y = node.y + node.height / 2
                  const path = node.lane === 'before'
                    ? `M 260 ${y} C 300 ${y}, 300 ${centerY}, 335 ${centerY}`
                    : node.lane === 'after'
                      ? `M 575 ${centerY} C 610 ${centerY}, 610 ${y}, 650 ${y}`
                      : `M 455 118 L 455 ${y} L ${node.x < 335 ? 260 : 650} ${y}`
                  return <path key={node.key} className="anime-graph-branch" markerEnd="url(#anime-timeline-arrow)" d={path} />
                })}
              </svg>
              <div className="anime-graph-node anime-graph-center" style={{ left: graph.center.x, top: graph.center.y, width: graph.center.width }}>
                {anime.coverImage ? <img src={anime.coverImage} alt="" /> : null}
                <div><small>Đang xem</small><strong>{anime.title}</strong></div>
              </div>
              {graph.nodes.map((node) => {
                const href = node.seriesId ? `/anime/${encodeURIComponent(node.seriesId)}` : node.siteUrl
                const content = <>
                  {node.coverImage ? <img src={node.coverImage} alt="" loading="lazy" /> : null}
                  <div><small className="anime-graph-relation-label">{ANIME_RELATION_LABELS[node.relationType] ?? node.relationType ?? 'Khác'}</small><strong>{node.title}</strong><small>{[FORMAT_LABELS[node.format] ?? node.format ?? node.mediaType, node.seasonYear, !node.seriesId && href ? 'AniList ↗' : null].filter(Boolean).join(' · ')}</small></div>
                </>
                const style = { left: node.x, top: node.y, width: node.width }
                return href ? (
                  <a key={node.key} className="anime-graph-node" style={style} href={href} title={node.title}
                    target={node.seriesId ? undefined : '_blank'} rel={node.seriesId ? undefined : 'noreferrer'}
                    onClick={node.seriesId ? (event) => { event.preventDefault(); onNavigate(href) } : undefined}>
                    {content}
                  </a>
                ) : <div key={node.key} className="anime-graph-node" style={style}>{content}</div>
              })}
            </div>
          </div>
        </div>
      ) : <p className="catalog-empty" role="status">Không có tác phẩm khớp bộ lọc đồ thị. Thử bỏ “Chỉ anime” hoặc chọn tất cả quan hệ.</p>}
      <p className="anime-graph-note">Nguồn: AniList. Midquel, interquel, paraquel, remake và reboot không có nhãn riêng trong dữ liệu AniList hiện tại; có thể được xếp vào “Ngoại truyện” hoặc “Phiên bản khác”. Đồ thị giữ nguyên phân loại nguồn, không tự suy đoán.</p>
    </div>
  )
}
