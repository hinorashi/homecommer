import { db } from './db.js'

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value ?? JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

export function searchCharacterCatalog({
  searchText = '',
  contextGenre = 'all',
  archetype = 'all',
  animeGenre = 'all',
  limit = 24,
  offset = 0,
} = {}) {
  const conditions = []
  const parameters = []
  const query = String(searchText ?? '').trim().slice(0, 100).toLocaleLowerCase('en')

  if (query) {
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
    parameters.push(...Array.from({ length: 8 }, () => query))
  }
  if (contextGenre !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_context_genres cg
      WHERE cg.character_id = c.id AND cg.genre_id = ?
    )`)
    parameters.push(contextGenre)
  }
  if (archetype !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_archetypes ca
      WHERE ca.character_id = c.id AND ca.archetype_id = ?
        AND ca.review_status IN ('approved', 'proposed')
    )`)
    parameters.push(archetype)
  }
  if (animeGenre !== 'all') {
    conditions.push(`EXISTS (
      SELECT 1 FROM character_series cs
      JOIN series_genres sg ON sg.series_id = cs.series_id
      WHERE cs.character_id = c.id AND sg.genre_id = ?
    )`)
    parameters.push(animeGenre)
  }

  const where = conditions.length ? conditions.join(' AND ') : '1 = 1'
  const total = db.prepare(`
    SELECT COUNT(DISTINCT c.id) AS count
    FROM characters c
    WHERE ${where}
  `).get(...parameters).count

  const safeLimit = Math.max(1, Math.min(50, Math.trunc(Number(limit) || 24)))
  const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0))
  const rows = db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name, c.native_name AS nativeName,
      c.series, c.source_url AS sourceUrl, c.latest_release AS releaseMilestone,
      c.latest_release_url AS releaseSourceUrl,
      COALESCE((
        SELECT json_group_array(DISTINCT json_object('id', cg.genre_id, 'label', g.label))
        FROM character_context_genres cg
        JOIN context_genres g ON g.genre_id = cg.genre_id
        WHERE cg.character_id = c.id
      ), '[]') AS contextGenresJson,
      COALESCE((
        SELECT json_group_array(DISTINCT json_object('id', ca.archetype_id, 'label', a.label))
        FROM character_archetypes ca
        JOIN archetypes a ON a.archetype_id = ca.archetype_id
        WHERE ca.character_id = c.id AND ca.review_status IN ('approved', 'proposed')
      ), '[]') AS archetypesJson,
      COALESCE((
        SELECT json_group_array(DISTINCT g.label)
        FROM character_series cs
        JOIN series_genres sg ON sg.series_id = cs.series_id
        JOIN genres g ON g.genre_id = sg.genre_id
        WHERE cs.character_id = c.id
      ), '[]') AS animeGenresJson,
      COALESCE((
        SELECT json_object(
          'url', i.image_url, 'pageUrl', i.page_url, 'provider', i.provider,
          'license', i.license_short_name, 'licenseUrl', i.license_url,
          'attribution', i.attribution, 'identityMatchStatus', i.identity_match_status
        )
        FROM character_images i
        WHERE i.character_id = c.id AND i.license_verified = 1
        ORDER BY i.id DESC LIMIT 1
      ), (
        SELECT json_object(
          'url', ei.image_url, 'pageUrl', ei.page_url, 'provider', 'AniList',
          'storagePermissionStatus', ei.storage_permission_status,
          'reusePermissionStatus', ei.reuse_permission_status
        )
        FROM character_external_images ei
        JOIN sources es ON es.id = ei.source_id
        WHERE ei.character_id = c.id AND es.source_type = 'anime-database-api'
        ORDER BY ei.fetched_at DESC LIMIT 1
      )) AS imageJson
    FROM characters c
    WHERE ${where}
    ORDER BY c.name COLLATE NOCASE
    LIMIT ? OFFSET ?
  `).all(...parameters, safeLimit, safeOffset)

  const characters = rows.map((row) => ({
    id: row.id,
    anilistId: row.anilistId,
    name: row.name,
    nativeName: row.nativeName,
    series: row.series,
    sourceUrl: row.sourceUrl,
    releaseMilestone: row.releaseMilestone,
    releaseSourceUrl: row.releaseSourceUrl,
    contextGenres: parseJson(row.contextGenresJson),
    archetypes: parseJson(row.archetypesJson),
    animeGenres: parseJson(row.animeGenresJson),
    image: parseJson(row.imageJson, null),
  }))

  return {
    characters,
    total,
    limit: safeLimit,
    offset: safeOffset,
    hasMore: safeOffset + characters.length < total,
  }
}