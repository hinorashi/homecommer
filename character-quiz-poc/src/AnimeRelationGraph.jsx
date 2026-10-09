import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Network, Plus } from 'lucide-react'
import { buildAnimeRelationGraph, groupAnimeRelations } from './animeRelationLayout'
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
      <p className="anime-graph-note">Quan hệ tính từ anime đang xem đến tác phẩm ở bên phải. Cuộn để xem toàn bộ; bấm một anime để mở chi tiết.</p>
      {graph.nodes.length ? (
        <div className="anime-graph-viewport" tabIndex={0} role="region" aria-label="Đồ thị quan hệ anime có thể cuộn">
          <div style={{ width: graph.width * scale, height: graph.height * scale }}>
            <div className="anime-graph-canvas" style={{ width: graph.width, height: graph.height, transform: `scale(${scale})` }}>
              <svg width={graph.width} height={graph.height} aria-hidden="true">
                {graph.hubs.map((hub) => (
                  <path key={hub.type} className="anime-graph-trunk" d={`M 250 ${centerY} C 305 ${centerY}, 305 ${hub.y}, 365 ${hub.y}`} />
                ))}
                {graph.nodes.map((node) => {
                  const hub = graph.hubs.find((item) => item.type === (node.relationType ?? 'OTHER'))
                  const y = node.y + node.height / 2
                  return <path key={node.key} className="anime-graph-branch" d={`M 550 ${hub.y} C 595 ${hub.y}, 595 ${y}, 640 ${y}`} />
                })}
              </svg>
              <div className="anime-graph-node anime-graph-center" style={{ left: graph.center.x, top: graph.center.y, width: graph.center.width }}>
                {anime.coverImage ? <img src={anime.coverImage} alt="" /> : null}
                <div><small>Đang xem</small><strong>{anime.title}</strong></div>
              </div>
              {graph.hubs.map((hub) => (
                <div key={hub.type} className="anime-graph-hub" style={{ left: hub.x, top: hub.y - 26 }}>
                  <strong>{hub.label}</strong><small>{hub.count} tác phẩm</small>
                </div>
              ))}
              {graph.nodes.map((node) => {
                const href = node.seriesId ? `/anime/${encodeURIComponent(node.seriesId)}` : node.siteUrl
                const content = <>
                  {node.coverImage ? <img src={node.coverImage} alt="" loading="lazy" /> : null}
                  <div><strong>{node.title}</strong><small>{[FORMAT_LABELS[node.format] ?? node.format ?? node.mediaType, node.seasonYear, !node.seriesId && href ? 'AniList ↗' : null].filter(Boolean).join(' · ')}</small></div>
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
