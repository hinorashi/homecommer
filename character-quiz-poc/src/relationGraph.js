export const RELATION_LABELS_VI = {
  sister: 'Chị/em gái',
  brother: 'Anh/em trai',
  father: 'Cha',
  mother: 'Mẹ',
  parent: 'Cha mẹ',
  son: 'Con trai',
  daughter: 'Con gái',
  spouse: 'Vợ/chồng',
  fiance: 'Hôn phu/thê',
  lover: 'Người yêu',
  crush: 'Thầm thương',
  friend: 'Bạn bè',
  'best-friend': 'Bạn thân',
  'childhood-friend': 'Bạn thuở nhỏ',
  rival: 'Đối thủ',
  enemy: 'Kẻ thù',
  servant: 'Servant',
  master: 'Master/Chủ nhân',
  teacher: 'Thầy/cô',
  student: 'Học trò',
  classmate: 'Bạn cùng lớp',
  senpai: 'Senpai',
  kouhai: 'Kouhai',
  roommate: 'Bạn cùng phòng',
  partner: 'Cộng sự',
  teammate: 'Đồng đội',
  leader: 'Thủ lĩnh',
  subordinate: 'Cấp dưới',
  'uncle-aunt': 'Chú/bác/cô/dì',
  'nephew-niece': 'Cháu',
  cousin: 'Anh chị em họ',
  guardian: 'Người giám hộ',
  bodyguard: 'Vệ sĩ',
  creator: 'Người tạo ra',
  clone: 'Bản sao',
  ancestor: 'Tổ tiên',
  descendant: 'Hậu duệ',
  successor: 'Người kế thừa',
  twin: 'Song sinh',
  sibling: 'Anh chị em',
  grandparent: 'Ông/bà',
  grandchild: 'Cháu',
}

export function relationLabelVi(label) {
  if (!label) return 'Có liên hệ'
  return RELATION_LABELS_VI[label] ?? label
}

const TAU = Math.PI * 2

function polar(cx, cy, radius, angle) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
}

function round(value) {
  return Math.round(value * 10) / 10
}

/**
 * Builds a radial tree: center character → group hubs (direct relations, one per anime cluster) → characters.
 * Each group receives an angular sector proportional to its size; crowded sectors stagger children over two rings.
 */
export function buildRelationGraph(relations, {
  size = 760,
  showSpoilers = false,
  showDirect = true,
  showClusters = true,
  maxDirect = 16,
  maxPerCluster = 6,
  maxClusters = 4,
} = {}) {
  const cx = size / 2
  const cy = size / 2
  const hubRadius = size * 0.2
  const leafRadius = size * 0.37
  const staggerOffset = size * 0.075
  const groups = []

  if (showDirect) {
    const direct = (relations?.direct ?? []).filter((item) => showSpoilers || !item.spoiler).slice(0, maxDirect)
    if (direct.length) {
      groups.push({
        id: 'direct',
        kind: 'direct',
        label: 'Quan hệ trực tiếp',
        children: direct.map((item) => ({
          key: `direct-${item.anilistId}`,
          name: item.character?.name ?? item.name,
          image: item.character?.image ?? null,
          characterId: item.character?.id ?? null,
          anilistId: item.anilistId,
          edgeLabel: relationLabelVi(item.label ?? item.reverseLabel),
          spoiler: Boolean(item.spoiler),
          direction: item.direction,
        })),
      })
    }
  }

  if (showClusters) {
    for (const cluster of (relations?.clusters ?? []).slice(0, maxClusters)) {
      const children = (cluster.characters ?? []).slice(0, maxPerCluster).map(({ role, character }) => ({
        key: `cluster-${cluster.series.id}-${character.id}`,
        name: character.name,
        image: character.image ?? null,
        characterId: character.id,
        anilistId: character.anilistId,
        edgeLabel: null,
        role,
      }))
      if (children.length) {
        groups.push({
          id: `cluster-${cluster.series.id}`,
          kind: 'cluster',
          label: cluster.series.title,
          seriesId: cluster.series.id,
          coverImage: cluster.series.coverImage ?? null,
          children,
        })
      }
    }
  }

  const leafCount = groups.reduce((total, group) => total + group.children.length, 0)
  const hubs = []
  const leaves = []
  const edges = []
  if (!groups.length) return { size, center: { x: cx, y: cy }, hubs, leaves, edges, leafCount }

  // A little extra weight per group keeps tiny groups from being squeezed; direct relations carry labels, so they get more room.
  const weights = groups.map((group) => group.children.length * (group.kind === 'direct' ? 1.6 : 1) + 1)
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  let cursor = -Math.PI / 2 - (weights[0] / totalWeight) * TAU / 2

  groups.forEach((group, groupIndex) => {
    const sweep = (weights[groupIndex] / totalWeight) * TAU
    const start = cursor
    const middle = start + sweep / 2
    cursor += sweep

    const hubPoint = polar(cx, cy, groups.length === 1 ? hubRadius * 0.7 : hubRadius, middle)
    const hub = { ...group, x: round(hubPoint.x), y: round(hubPoint.y), angle: middle, childCount: group.children.length }
    delete hub.children
    hubs.push(hub)
    edges.push({ key: `edge-center-${group.id}`, kind: 'trunk', groupId: group.id, groupKind: group.kind, from: { x: cx, y: cy }, to: hubPoint })

    const count = group.children.length
    const padding = Math.min(sweep * 0.12, 0.18)
    const usable = Math.max(sweep - padding * 2, 0)
    const step = count > 1 ? usable / (count - 1) : 0
    // Labels are ~100px wide, so neighbours closer than that alternate across rings.
    const arcGap = step * leafRadius
    const ringOffsets = count < 2 || arcGap >= 110 ? [0] : [0, staggerOffset]

    group.children.forEach((child, childIndex) => {
      const angle = count > 1 ? start + padding + step * childIndex : middle
      const radius = leafRadius + ringOffsets[childIndex % ringOffsets.length]
      const point = polar(cx, cy, radius, angle)
      const leaf = { ...child, groupId: group.id, groupKind: group.kind, x: round(point.x), y: round(point.y), angle }
      leaves.push(leaf)
      edges.push({
        key: `edge-${group.id}-${child.key}`,
        kind: 'branch',
        groupId: group.id,
        groupKind: group.kind,
        from: hubPoint,
        to: point,
        label: child.edgeLabel,
        spoiler: child.spoiler,
        leafKey: child.key,
      })
    })
  })

  return { size, center: { x: cx, y: cy }, hubs, leaves, edges, leafCount }
}

/** Splits text containing AniList `~! … !~` spoiler markers into plain and spoiler segments. */
export function splitSpoilers(text) {
  if (!text) return []
  const segments = []
  const pattern = /~!([\s\S]*?)!~/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) segments.push({ spoiler: false, text: text.slice(last, match.index) })
    if (match[1].trim()) segments.push({ spoiler: true, text: match[1] })
    last = match.index + match[0].length
  }
  if (last < text.length) segments.push({ spoiler: false, text: text.slice(last) })
  return segments
}
