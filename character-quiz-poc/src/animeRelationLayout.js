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
  const nodes = []
  const before = filtered.filter((item) => item.relationType === 'PREQUEL')
  const after = filtered.filter((item) => item.relationType === 'SEQUEL')
  const branches = filtered.filter((item) => !['PREQUEL', 'SEQUEL'].includes(item.relationType))
  const add = (relation, index, x, y, lane) => nodes.push({
    ...relation, key: `${relation.relationType}-${relation.anilistId}-${index}`,
    x, y, width: 240, height: 84, lane,
  })
  before.forEach((item, index) => add(item, index, 20, 34 + index * 100, 'before'))
  after.forEach((item, index) => add(item, index, 650, 34 + index * 100, 'after'))
  const branchTop = 34 + Math.max(1, before.length, after.length) * 100 + 24
  branches.forEach((item, index) => add(item, index, index % 2 ? 650 : 20, branchTop + Math.floor(index / 2) * 100, 'branch'))
  const height = Math.max(160, ...nodes.map((node) => node.y + node.height + 20))
  return { width: 910, height, center: { x: 335, y: 34, width: 240, height: 84 }, nodes }
}
