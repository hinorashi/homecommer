import { db } from './db.js'
import { traitCatalog } from '../src/traitCatalog.js'

const slotDefinitions = {
  best: {
    type: 'best',
    title: 'Tương đồng cao nhất',
    badge: 'Best Overall Match',
    description: 'Nhân vật có tổng điểm tương đồng phong cách ứng xử cao nhất.',
  },
  soulmate: {
    type: 'soulmate',
    title: 'Nét đồng điệu hiếm gặp',
    badge: 'Soulmate / Niche Match',
    description: 'Nhân vật chia sẻ tag tính cách đặc thù và hiếm gặp nhất với bạn.',
  },
  wildcard: {
    type: 'wildcard',
    title: 'Gợi ý bất ngờ',
    badge: 'Wildcard Match',
    description: 'Nhân vật từ thể loại hoặc hình mẫu khác biệt nhưng vẫn có nét hành vi chung.',
  },
  standard: {
    type: 'standard',
    title: 'Phù hợp',
    badge: 'Relevant Match',
    description: 'Chia sẻ các nét tính cách tương đồng.',
  },
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(', ')
}

function dedupeAssertions(rows) {
  const byTag = new Map()
  rows.forEach((row) => {
    const existing = byTag.get(row.tag_id)
    if (!existing || (row.review_status === 'approved' && existing.review_status !== 'approved')) {
      byTag.set(row.tag_id, row)
    }
  })
  return [...byTag.values()]
}

function toTrait(row, sharedTagIds, idfMap, userTraitMap) {
  const idf = idfMap.get(row.tag_id) ?? 0
  const userTrait = userTraitMap.get(row.tag_id)
  return {
    tagId: row.tag_id,
    label: row.label,
    description: row.description,
    traitType: row.trait_type,
    sourceTerm: row.source_term,
    editorialInterpretation: row.editorial_interpretation,
    sourceTitle: row.source_title,
    sourceType: row.source_type,
    url: row.source_url,
    sourceAnimeTitle: row.source_anime_title,
    sourceReleaseMilestone: row.source_release_milestone,
    confidence: row.confidence,
    reviewStatus: row.review_status,
    spoiler: Boolean(row.spoiler),
    idf,
    traitWeight: Number(((userTrait?.count ?? 0) * idf).toFixed(3)),
    isShared: sharedTagIds.has(row.tag_id),
  }
}

function contextTokens(character) {
  return new Set([
    ...(character.contextGenres ?? []).map(({ id }) => `context:${id}`),
    ...(character.archetypes ?? []).map(({ id }) => `archetype:${id}`),
    ...(character.animeGenres ?? []).map((label) => `anime-genre:${label}`),
  ])
}

function contextDistance(left, right) {
  const leftTokens = contextTokens(left.character)
  const rightTokens = contextTokens(right.character)
  const union = new Set([...leftTokens, ...rightTokens])
  if (union.size === 0) return 0
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return 1 - shared / union.size
}

export function matchFromDatabase({
  userTraits = [],
  genreFilter = 'all',
  archetypeFilter = 'all',
  animeGenreFilter = 'all',
  searchText = '',
  includeProposed = true,
}) {
  const userTraitMap = new Map(
    userTraits
      .filter((trait) => traitCatalog[trait.tagId]?.type === 'personality-behavior')
      .map((trait) => [trait.tagId, { ...trait, count: Math.max(1, Number(trait.count) || 1) }])
  )
  if (userTraitMap.size === 0) return []

  const reviewStatuses = includeProposed ? ['approved', 'proposed', 'web-sourced'] : ['approved']
  const statusSlots = placeholders(reviewStatuses.length)
  const userTagIds = [...userTraitMap.keys()]
  const tagSlots = placeholders(userTagIds.length)

  const corpus = db.prepare(`
    SELECT COUNT(DISTINCT ct.character_id) AS character_count
    FROM character_traits ct
    JOIN trait_tags t ON t.tag_id = ct.tag_id
    WHERE t.trait_type = 'personality-behavior'
      AND ct.review_status IN (${statusSlots})
  `).get(...reviewStatuses).character_count

  if (!corpus) return []

  const tagFrequencies = db.prepare(`
    SELECT ct.tag_id, COUNT(DISTINCT ct.character_id) AS document_frequency
    FROM character_traits ct
    JOIN trait_tags t ON t.tag_id = ct.tag_id
    WHERE t.trait_type = 'personality-behavior'
      AND ct.review_status IN (${statusSlots})
      AND ct.tag_id IN (${tagSlots})
    GROUP BY ct.tag_id
  `).all(...reviewStatuses, ...userTagIds)

  const idfMap = new Map(tagFrequencies.map(({ tag_id, document_frequency }) => [
    tag_id,
    Math.log(1 + corpus / (document_frequency + 0.5)),
  ]))

  const normUser = Math.sqrt([...userTraitMap.entries()].reduce((sum, [tagId, trait]) => {
    const idf = idfMap.get(tagId) ?? 0
    return sum + ((trait.count * idf) ** 2)
  }, 0))

  const conditions = [
    `t.trait_type = 'personality-behavior'`,
    `ct.review_status IN (${statusSlots})`,
    `ct.tag_id IN (${tagSlots})`,
  ]
  const filterParams = []
  if (genreFilter !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_context_genres cg
      WHERE cg.character_id = c.id AND cg.genre_id = ?
    )`)
    filterParams.push(genreFilter)
  }
  if (archetypeFilter !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_archetypes ca
      WHERE ca.character_id = c.id AND ca.archetype_id = ?
        AND ca.review_status IN ('approved', 'proposed')
    )`)
    filterParams.push(archetypeFilter)
  }
  if (animeGenreFilter !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_series cs
      JOIN series_genres sg ON sg.series_id = cs.series_id
      WHERE cs.character_id = c.id AND sg.genre_id = ?
    )`)
    filterParams.push(animeGenreFilter)
  }

  const normalizedSearch = String(searchText ?? '').trim().slice(0, 100).toLocaleLowerCase('en')
  if (normalizedSearch) {
    conditions.push(`(
      instr(lower(c.name), ?) > 0
      OR instr(lower(COALESCE(c.native_name, '')), ?) > 0
      OR instr(lower(c.series), ?) > 0
      OR EXISTS (
        SELECT 1 FROM character_aliases ca
        WHERE ca.character_id = c.id AND ca.spoiler = 0
          AND instr(lower(ca.alias), ?) > 0
      )
      OR EXISTS (
        SELECT 1 FROM character_series cs
        JOIN anime_series s ON s.series_id = cs.series_id
        WHERE cs.character_id = c.id AND (
          instr(lower(s.title), ?) > 0
          OR instr(lower(COALESCE(s.title_english, '')), ?) > 0
          OR instr(lower(COALESCE(s.title_romaji, '')), ?) > 0
          OR instr(lower(COALESCE(s.title_native, '')), ?) > 0
        )
      )
    )`)
    filterParams.push(...Array.from({ length: 8 }, () => normalizedSearch))
  }

  const candidateRows = db.prepare(`
    SELECT DISTINCT c.id, c.anilist_id, c.name, c.native_name, c.series,
      c.source_url, c.latest_release, c.latest_release_url,
      c.latest_release_verified, c.trait_cutoff_aligned,
      COALESCE((
        SELECT json_group_array(DISTINCT json_object('id', cg.genre_id, 'label', g.label))
        FROM character_context_genres cg
        JOIN context_genres g ON g.genre_id = cg.genre_id
        WHERE cg.character_id = c.id
      ), '[]') AS context_genres_json,
      COALESCE((
        SELECT json_group_array(DISTINCT json_object('id', ca.archetype_id, 'label', a.label))
        FROM character_archetypes ca
        JOIN archetypes a ON a.archetype_id = ca.archetype_id
        WHERE ca.character_id = c.id AND ca.review_status IN ('approved', 'proposed')
      ), '[]') AS archetypes_json,
      COALESCE((
        SELECT json_group_array(DISTINCT g.label)
        FROM character_series cs
        JOIN series_genres sg ON sg.series_id = cs.series_id
        JOIN genres g ON g.genre_id = sg.genre_id
        WHERE cs.character_id = c.id
      ), '[]') AS anime_genres_json
    FROM characters c
    JOIN character_traits ct ON ct.character_id = c.id
    JOIN trait_tags t ON t.tag_id = ct.tag_id
    WHERE ${conditions.join(' AND ')}
  `).all(...reviewStatuses, ...userTagIds, ...filterParams)

  if (candidateRows.length === 0) return []
  const characterIds = candidateRows.map((row) => row.id)
  const characterSlots = placeholders(characterIds.length)

  const allTraitRows = db.prepare(`
    SELECT ct.character_id, ct.tag_id, ct.source_id, ct.source_term,
      ct.editorial_interpretation, ct.source_anime_title,
      ct.source_release_milestone, ct.confidence, ct.review_status, ct.spoiler,
      t.label, t.description, t.trait_type,
      s.url AS source_url, s.title AS source_title, s.source_type
    FROM character_traits ct
    JOIN trait_tags t ON t.tag_id = ct.tag_id
    JOIN sources s ON s.id = ct.source_id
    WHERE ct.character_id IN (${characterSlots})
      AND t.trait_type = 'personality-behavior'
      AND ct.review_status IN (${statusSlots})
    ORDER BY ct.character_id, ct.tag_id, ct.review_status = 'approved' DESC
  `).all(...characterIds, ...reviewStatuses)

  const imageRows = db.prepare(`
    SELECT character_id, image_url, page_url, license_short_name,
      license_url, attribution, provider, identity_match_status
    FROM character_images
    WHERE license_verified = 1 AND character_id IN (${characterSlots})
    ORDER BY id DESC
  `).all(...characterIds)
  const imageByCharacter = new Map()
  imageRows.forEach((image) => {
    if (!imageByCharacter.has(image.character_id)) imageByCharacter.set(image.character_id, image)
  })
  const externalImageRows = db.prepare(`
    SELECT i.character_id, i.image_url, i.page_url,
      i.storage_permission_status, i.reuse_permission_status
    FROM character_external_images i
    JOIN sources s ON s.id = i.source_id
    WHERE s.source_type = 'anime-database-api'
      AND i.character_id IN (${characterSlots})
    ORDER BY i.fetched_at DESC
  `).all(...characterIds)
  externalImageRows.forEach((image) => {
    if (!imageByCharacter.has(image.character_id)) {
      imageByCharacter.set(image.character_id, {
        ...image,
        provider: 'AniList',
      })
    }
  })

  const traitsByCharacter = new Map()
  allTraitRows.forEach((row) => {
    if (!traitsByCharacter.has(row.character_id)) traitsByCharacter.set(row.character_id, [])
    traitsByCharacter.get(row.character_id).push(row)
  })

  const matches = candidateRows.map((characterRow) => {
    const contextGenres = JSON.parse(characterRow.context_genres_json ?? '[]')
    const archetypes = JSON.parse(characterRow.archetypes_json ?? '[]')
    const animeGenres = JSON.parse(characterRow.anime_genres_json ?? '[]')
    const assertions = dedupeAssertions(traitsByCharacter.get(characterRow.id) ?? [])
    const sharedAssertions = assertions.filter((assertion) => userTraitMap.has(assertion.tag_id))
    const sharedTagIds = new Set(sharedAssertions.map((assertion) => assertion.tag_id))
    const normCharacter = Math.sqrt(assertions.reduce((sum, assertion) => {
      const idf = idfMap.get(assertion.tag_id) ?? 0
      return sum + (idf ** 2)
    }, 0))
    const dotProduct = sharedAssertions.reduce((sum, assertion) => {
      const idf = idfMap.get(assertion.tag_id) ?? 0
      const userCount = userTraitMap.get(assertion.tag_id)?.count ?? 0
      return sum + (userCount * idf * idf)
    }, 0)
    const weightedScore = normUser > 0 && normCharacter > 0
      ? dotProduct / (normUser * normCharacter)
      : 0
    const sharedTraits = sharedAssertions
      .map((assertion) => toTrait(assertion, sharedTagIds, idfMap, userTraitMap))
      .sort((left, right) => right.traitWeight - left.traitWeight)
    const allTraits = assertions.map((assertion) => toTrait(assertion, sharedTagIds, idfMap, userTraitMap))
    const image = imageByCharacter.get(characterRow.id)

    return {
      character: {
        id: characterRow.id,
        anilistId: characterRow.anilist_id,
        name: characterRow.name,
        nativeName: characterRow.native_name,
        series: characterRow.series,
        sourceUrl: characterRow.source_url,
        releaseMilestone: characterRow.latest_release,
        releaseSourceUrl: characterRow.latest_release_url,
        latestReleaseVerified: Boolean(characterRow.latest_release_verified),
        traitCutoffAligned: Boolean(characterRow.trait_cutoff_aligned),
        contextGenres,
        archetypes,
        animeGenres,
        genre: contextGenres[0]?.id ?? 'unknown',
        genreLabel: contextGenres.map(({ label }) => label).join(' / ') || 'Chưa phân loại',
        archetype: archetypes[0]?.id ?? 'unknown',
        archetypeLabel: archetypes.map(({ label }) => label).join(' / ') || 'Chưa phân loại',
        image: image ? {
          url: image.image_url,
          pageUrl: image.page_url,
          license: image.license_short_name,
          licenseUrl: image.license_url,
          attribution: image.attribution,
          provider: image.provider,
          identityMatchStatus: image.identity_match_status,
          storagePermissionStatus: image.storage_permission_status,
          reusePermissionStatus: image.reuse_permission_status,
        } : null,
      },
      sharedTraits,
      allTraits,
      matchScore: sharedTraits.length,
      weightedScore: Number(weightedScore.toFixed(4)),
      maxRarity: sharedTraits.length ? Math.max(...sharedTraits.map((trait) => trait.idf)) : 0,
    }
  }).filter((match) => match.sharedTraits.length > 0)

  const sorted = matches.sort((a, b) =>
    b.weightedScore - a.weightedScore ||
    b.matchScore - a.matchScore ||
    a.character.name.localeCompare(b.character.name, 'vi')
  )
  const selected = []
  const used = new Set()
  const best = sorted[0]

  if (best) {
    selected.push({ ...best, slot: slotDefinitions.best })
    used.add(best.character.id)
  }

  const remaining = sorted.filter((match) => !used.has(match.character.id))
  if (remaining.length) {
    const niche = [...remaining].sort((a, b) =>
      b.maxRarity - a.maxRarity || b.weightedScore - a.weightedScore
    )[0]
    selected.push({ ...niche, slot: slotDefinitions.soulmate })
    used.add(niche.character.id)
  }

  const wildcardPool = sorted.filter((match) => !used.has(match.character.id))
  if (wildcardPool.length) {
    const wildcard = [...wildcardPool].sort((left, right) =>
      contextDistance(right, best) - contextDistance(left, best) ||
      right.weightedScore - left.weightedScore
    )[0]
    const isDifferent = contextDistance(wildcard, best) > 0
    selected.push({ ...wildcard, slot: isDifferent ? slotDefinitions.wildcard : slotDefinitions.standard })
    used.add(wildcard.character.id)
  }

  sorted.filter((match) => !used.has(match.character.id)).forEach((match) => {
    selected.push({ ...match, slot: slotDefinitions.standard })
  })

  return selected
}
