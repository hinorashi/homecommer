export const ANIME_RELATION_LABELS = {
  PREQUEL: 'Prequel · Phần trước',
  SEQUEL: 'Sequel · Phần sau',
  MIDQUEL: 'Midquel · Trong phần gốc',
  INTERQUEL: 'Interquel · Giữa hai phần',
  PARAQUEL: 'Paraquel · Diễn ra song song',
  SPIN_OFF: 'Spin-off · Câu chuyện nhánh',
  REMAKE: 'Remake · Làm lại',
  REBOOT: 'Reboot · Khởi động lại',
  PARENT: 'Câu chuyện gốc',
  SIDE_STORY: 'Ngoại truyện',
  ALTERNATIVE: 'Phiên bản khác',
  SUMMARY: 'Tóm tắt',
  SOURCE: 'Nguyên tác',
  ADAPTATION: 'Chuyển thể',
  CHARACTER: 'Chung nhân vật',
  COMPILATION: 'Tổng hợp',
  CONTAINS: 'Bao gồm',
  OTHER: 'Khác',
}

export function groupAnimeRelations(relations = []) {
  const groups = new Map()
  for (const relation of relations) {
    const type = relation.relationType ?? 'OTHER'
    if (!groups.has(type)) groups.set(type, [])
    groups.get(type).push(relation)
  }
  return [...groups].map(([type, items]) => ({
    type,
    label: ANIME_RELATION_LABELS[type] ?? type,
    items,
  }))
}

export function buildAnimeRelationGraph(relations, { animeOnly = true, type = 'all' } = {}) {
  const filtered = relations.filter((relation) =>
    (!animeOnly || relation.mediaType === 'ANIME') && (type === 'all' || (relation.relationType ?? 'OTHER') === type))
  const groups = groupAnimeRelations(filtered)
  const nodes = []
  const hubs = []
  let cursor = 30
  for (const group of groups) {
    const firstY = cursor
    group.items.forEach((relation, index) => {
      nodes.push({ ...relation, key: `${group.type}-${relation.anilistId}-${index}`, x: 640, y: cursor, width: 240, height: 84 })
      cursor += 102
    })
    hubs.push({ type: group.type, label: group.label, count: group.items.length, x: 365, y: (firstY + cursor - 102) / 2 + 42 })
    cursor += 24
  }
  const height = Math.max(300, cursor + 6)
  return { width: 910, height, center: { x: 20, y: Math.min(height / 2 - 42, 200), width: 230, height: 84 }, hubs, nodes }
}
