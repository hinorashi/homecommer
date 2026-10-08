import { db } from './db.js'
import { saveCharacterDetails, saveAnimeRelations } from './crawl-store.js'
import { fetchAnimeRelations, fetchCharacterDetails } from './integrations/anilist-graphql.js'
import { TRAIT_GROUPS, TRAIT_LEXICON, getTrait } from './character-traits.js'

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value ?? JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const CHARACTER_ROLES = ['MAIN', 'SUPPORTING', 'BACKGROUND']
const ROLE_LABELS = [...CHARACTER_ROLES, null]
export const CHARACTER_SORTS = {
  name: 'c.name COLLATE NOCASE',
  favourites: 'c.favourites IS NULL, c.favourites DESC, c.name COLLATE NOCASE',
}
const NORMALIZED_GENDER = "lower(trim(COALESCE(c.gender, '')))"
const GENDER_SQL = {
  male: `(${NORMALIZED_GENDER} = 'male')`,
  female: `(${NORMALIZED_GENDER} = 'female')`,
  other: `(${NORMALIZED_GENDER} NOT IN ('male', 'female', 'unknown', ''))`,
  unknown: `(${NORMALIZED_GENDER} IN ('unknown', ''))`,
}

function toTraitChips(traitIds) {
  return traitIds.map((traitId) => getTrait(traitId)).filter(Boolean)
    .map(({ id, label, group, description }) => ({ id, label, group, description }))
}

/** Derived-trait lexicon grouped for the character filter, with character counts. */
export function listCharacterTraits() {
  const counts = new Map(db.prepare('SELECT trait_id AS id, COUNT(*) AS count FROM character_derived_traits GROUP BY trait_id').all()
    .map((row) => [row.id, row.count]))
  return TRAIT_GROUPS.map((group) => ({
    ...group,
    traits: TRAIT_LEXICON.filter((entry) => entry.group === group.id)
      .map((entry) => ({ id: entry.id, label: entry.label, description: entry.description, characterCount: counts.get(entry.id) ?? 0 }))
      .filter((entry) => entry.characterCount > 0),
  })).filter((group) => group.traits.length)
}

export function parseFilterList(value) {
  const values = Array.isArray(value) ? value : String(value ?? '').split(',')
  return [...new Set(values.map((item) => String(item).trim().toLowerCase()).filter((item) => item && item !== 'all'))].slice(0, 20)
}

export function searchCharacterCatalog({
  searchText = '',
  contextGenre = 'all',
  archetype = 'all',
  animeGenre = 'all',
  genreMode = 'all',
  animeTag = 'all',
  studio = 'all',
  trait = 'all',
  role = 'all',
  gender = 'all',
  sort = 'name',
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
  const animeGenres = parseFilterList(animeGenre)
  const animeTags = parseFilterList(animeTag)
  const studios = parseFilterList(studio)
  // Genre, tag and studio constraints must hold on the same anime. "all" mode requires every selected
  // genre/tag on that anime; "any" needs at least one per dimension.
  const seriesConditions = []
  const seriesParameters = []
  const addSetCondition = (table, column, values) => {
    const placeholders = values.map(() => '?').join(', ')
    const strict = genreMode !== 'any' && values.length > 1
    seriesConditions.push(`s.series_id IN (
      SELECT x.series_id FROM ${table} x WHERE x.${column} IN (${placeholders})
      ${strict ? `GROUP BY x.series_id HAVING COUNT(DISTINCT x.${column}) = ?` : ''}
    )`)
    seriesParameters.push(...values)
    if (strict) seriesParameters.push(values.length)
  }
  if (animeGenres.length) addSetCondition('series_genres', 'genre_id', animeGenres)
  if (animeTags.length) addSetCondition('series_tags', 'tag_id', animeTags)
  if (studios.length) {
    seriesConditions.push(`s.series_id IN (SELECT ss.series_id FROM series_studios ss WHERE ss.studio_id IN (${studios.map(() => '?').join(', ')}))`)
    seriesParameters.push(...studios)
  }
  const roles = parseFilterList(role).map((value) => value.toUpperCase()).filter((value) => CHARACTER_ROLES.includes(value))
  if (roles.length) {
    seriesConditions.push(`cs.role IN (${roles.map(() => '?').join(', ')})`)
    seriesParameters.push(...roles)
  }
  if (seriesConditions.length) {
    conditions.push(`c.id IN (
      SELECT cs.character_id FROM character_series cs
      JOIN anime_series s ON s.series_id = cs.series_id
      WHERE ${seriesConditions.join(' AND ')}
    )`)
    parameters.push(...seriesParameters)
  }

  const traits = parseFilterList(trait).filter((value) => getTrait(value))
  for (const traitId of traits) {
    conditions.push('c.id IN (SELECT dt.character_id FROM character_derived_traits dt WHERE dt.trait_id = ?)')
    parameters.push(traitId)
  }
  const genders = parseFilterList(gender).filter((value) => GENDER_SQL[value])
  if (genders.length) conditions.push(`(${genders.map((value) => GENDER_SQL[value]).join(' OR ')})`)

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
      c.latest_release_url AS releaseSourceUrl, c.gender, c.favourites,
      (SELECT MIN(${ROLE_ORDER}) FROM character_series cs WHERE cs.character_id = c.id) AS roleRank,
      COALESCE((SELECT json_group_array(dt.trait_id) FROM character_derived_traits dt WHERE dt.character_id = c.id), '[]') AS traitIdsJson,
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
        SELECT json_group_array(DISTINCT json_object('id', g.genre_id, 'label', g.label))
        FROM character_series cs
        JOIN series_genres sg ON sg.series_id = cs.series_id
        JOIN genres g ON g.genre_id = sg.genre_id
        WHERE cs.character_id = c.id
      ), '[]') AS animeGenreLinksJson,
      (
        SELECT json_object('id', s.series_id, 'title', s.title)
        FROM character_series cs
        JOIN anime_series s ON s.series_id = cs.series_id
        WHERE cs.character_id = c.id
        ORDER BY s.title = c.series DESC, s.popularity IS NULL, s.popularity DESC
        LIMIT 1
      ) AS primarySeriesJson,
      (SELECT COUNT(DISTINCT cs.series_id) FROM character_series cs WHERE cs.character_id = c.id) AS seriesCount,
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
    ORDER BY ${CHARACTER_SORTS[sort] ?? CHARACTER_SORTS.name}
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
    animeGenreLinks: parseJson(row.animeGenreLinksJson),
    primarySeries: parseJson(row.primarySeriesJson, null),
    seriesCount: row.seriesCount,
    gender: row.gender,
    favourites: row.favourites,
    role: ROLE_LABELS[row.roleRank] ?? null,
    traits: toTraitChips(parseJson(row.traitIdsJson)),
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
const ROLE_ORDER = "CASE cs.role WHEN 'MAIN' THEN 0 WHEN 'SUPPORTING' THEN 1 WHEN 'BACKGROUND' THEN 2 ELSE 3 END"

export function getAnimeDetail(seriesId, { characterLimit = 500 } = {}) {
  const id = String(seriesId ?? '').slice(0, 120)
  const series = db.prepare(`
    SELECT s.series_id AS id, s.anilist_id AS anilistId, s.title, s.title_english AS titleEnglish,
      s.title_romaji AS titleRomaji, s.title_native AS titleNative, s.page_url AS pageUrl,
      s.popularity, s.favourites, s.format, s.season, s.season_year AS seasonYear,
      s.episodes, s.status, s.average_score AS averageScore, s.description,
      s.cover_image AS coverImage, s.banner_image AS bannerImage, s.studios_json AS studiosJson,
      s.characters_synced_at AS charactersSyncedAt, s.relations_synced_at AS relationsSyncedAt,
      s.imdb_id AS imdbId, s.imdb_rating AS imdbRating, s.imdb_votes AS imdbVotes,
      (SELECT COUNT(*) FROM anime_series x WHERE x.imdb_id = s.imdb_id) AS imdbSharedCount
    FROM anime_series s
    WHERE s.series_id = ?
  `).get(id)
  if (!series) return null

  const genres = db.prepare(`
    SELECT DISTINCT g.genre_id AS id, g.label
    FROM series_genres sg JOIN genres g ON g.genre_id = sg.genre_id
    WHERE sg.series_id = ?
    ORDER BY g.label
  `).all(id)

  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(Number(characterLimit) || 500)))
  const characterRows = db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name, c.native_name AS nativeName,
      c.source_url AS sourceUrl, c.favourites, MIN(${ROLE_ORDER}) AS roleRank,
      (
        SELECT ei.image_url FROM character_external_images ei
        WHERE ei.character_id = c.id ORDER BY ei.fetched_at DESC LIMIT 1
      ) AS imageUrl,
      (SELECT COUNT(DISTINCT other.series_id) FROM character_series other WHERE other.character_id = c.id) AS seriesCount
    FROM character_series cs
    JOIN characters c ON c.id = cs.character_id
    WHERE cs.series_id = ?
    GROUP BY c.id
    ORDER BY roleRank, c.favourites IS NULL, c.favourites DESC, c.name COLLATE NOCASE
    LIMIT ?
  `).all(id, safeLimit)
  const characterTotal = db.prepare(`
    SELECT COUNT(DISTINCT character_id) AS count FROM character_series WHERE series_id = ?
  `).get(id).count

  const roleLabels = ['MAIN', 'SUPPORTING', 'BACKGROUND', null]
  const { studiosJson, ...rest } = series
  const studios = listSeriesStudios([id])
  const relations = db.prepare(`
    SELECT r.related_anilist_id AS anilistId, r.relation_type AS relationType, r.related_media_type AS mediaType,
      r.related_title AS title, r.related_format AS format, r.related_status AS status,
      r.related_season_year AS seasonYear, r.related_cover AS coverImage, r.related_site_url AS siteUrl,
      (SELECT s2.series_id FROM anime_series s2 WHERE s2.anilist_id = r.related_anilist_id AND r.related_media_type = 'ANIME' LIMIT 1) AS seriesId
    FROM anime_relations r
    WHERE r.series_id = ?
    ORDER BY CASE r.relation_type WHEN 'PREQUEL' THEN 0 WHEN 'SEQUEL' THEN 1 WHEN 'PARENT' THEN 2 WHEN 'SIDE_STORY' THEN 3
      WHEN 'SPIN_OFF' THEN 4 WHEN 'ALTERNATIVE' THEN 5 WHEN 'SUMMARY' THEN 6 WHEN 'SOURCE' THEN 7 WHEN 'ADAPTATION' THEN 8 ELSE 9 END,
      r.related_season_year IS NULL, r.related_season_year, r.related_title
  `).all(id)
  const tags = db.prepare(`
    SELECT t.tag_id AS id, t.name, t.category, t.description, st.rank,
      (st.is_media_spoiler OR t.is_general_spoiler) AS spoiler
    FROM series_tags st JOIN anime_tags t ON t.tag_id = st.tag_id
    WHERE st.series_id = ?
    ORDER BY st.rank IS NULL, st.rank DESC, t.name COLLATE NOCASE
  `).all(id).map((tag) => ({ ...tag, spoiler: Boolean(tag.spoiler) }))
  return {
    ...rest,
    relations,
    tags,
    studios: studios.length ? studios : parseJson(studiosJson).map((name) => ({ id: null, name })),
    genres,
    characterTotal,
    characters: characterRows.map(({ roleRank, imageUrl, ...character }) => ({
      ...character,
      role: roleLabels[roleRank] ?? null,
      image: imageUrl ? { url: imageUrl, provider: 'AniList' } : null,
    })),
  }
}

function listSeriesStudios(seriesIds) {
  if (!seriesIds.length) return []
  return db.prepare(`
    SELECT st.studio_id AS id, st.name, COUNT(DISTINCT ss.series_id) AS seriesCount
    FROM series_studios ss JOIN studios st ON st.studio_id = ss.studio_id
    WHERE ss.series_id IN (${seriesIds.map(() => '?').join(', ')})
    GROUP BY st.studio_id
    ORDER BY seriesCount DESC, st.name COLLATE NOCASE
  `).all(...seriesIds)
}

export function listStudios() {
  return db.prepare(`
    SELECT st.studio_id AS id, st.name, COUNT(DISTINCT ss.series_id) AS seriesCount
    FROM studios st JOIN series_studios ss ON ss.studio_id = st.studio_id
    GROUP BY st.studio_id
    ORDER BY st.name COLLATE NOCASE
  `).all()
}

export function listAnimeTags() {
  return db.prepare(`
    SELECT t.tag_id AS id, t.name, t.category, t.description, t.is_general_spoiler AS spoiler,
      COUNT(DISTINCT st.series_id) AS seriesCount
    FROM anime_tags t JOIN series_tags st ON st.tag_id = t.tag_id
    GROUP BY t.tag_id
    ORDER BY seriesCount DESC, t.name COLLATE NOCASE
  `).all().map((tag) => ({ ...tag, spoiler: Boolean(tag.spoiler) }))
}

export const ANIME_SORTS = {
  popularity: 's.popularity IS NULL, s.popularity DESC, s.title COLLATE NOCASE',
  score: 's.average_score IS NULL, s.average_score DESC, s.popularity DESC',
  favourites: 's.favourites IS NULL, s.favourites DESC, s.title COLLATE NOCASE',
  newest: 's.season_year IS NULL, s.season_year DESC, s.popularity DESC',
  oldest: 's.season_year IS NULL, s.season_year ASC, s.popularity DESC',
  title: 's.title COLLATE NOCASE',
  characters: 'characterCount DESC, s.popularity DESC',
  imdb: 's.imdb_rating IS NULL, s.imdb_rating DESC, s.imdb_votes DESC, s.popularity DESC',
}

const ANIME_TITLE_MATCH_SQL = `(
  instr(lower(s.title), ?) > 0
  OR instr(lower(COALESCE(s.title_english, '')), ?) > 0
  OR instr(lower(COALESCE(s.title_romaji, '')), ?) > 0
  OR instr(lower(COALESCE(s.title_native, '')), ?) > 0
)`

function toAnimeCard(row) {
  const { genresJson, studiosNamesJson, tagsJson, ...rest } = row
  return {
    ...rest,
    genres: parseJson(genresJson),
    studios: parseJson(studiosNamesJson),
    tags: parseJson(tagsJson),
  }
}

const ANIME_CARD_COLUMNS = `
  s.series_id AS id, s.anilist_id AS anilistId, s.title, s.title_english AS titleEnglish,
  s.title_native AS titleNative, s.format, s.season, s.season_year AS seasonYear, s.episodes,
  s.status, s.average_score AS averageScore, s.popularity, s.favourites, s.cover_image AS coverImage,
  s.imdb_id AS imdbId, s.imdb_rating AS imdbRating, s.imdb_votes AS imdbVotes,
  (SELECT COUNT(*) FROM anime_series x WHERE x.imdb_id = s.imdb_id) AS imdbSharedCount,
  (SELECT COUNT(DISTINCT cs.character_id) FROM character_series cs WHERE cs.series_id = s.series_id) AS characterCount,
  COALESCE((
    SELECT json_group_array(json_object('id', g.genre_id, 'label', g.label))
    FROM series_genres sg JOIN genres g ON g.genre_id = sg.genre_id WHERE sg.series_id = s.series_id
  ), '[]') AS genresJson,
  COALESCE((
    SELECT json_group_array(json_object('id', st.studio_id, 'name', st.name))
    FROM series_studios ss JOIN studios st ON st.studio_id = ss.studio_id WHERE ss.series_id = s.series_id
  ), '[]') AS studiosNamesJson,
  COALESCE((
    SELECT json_group_array(json_object('id', x.tag_id, 'name', x.name)) FROM (
      SELECT t.tag_id, t.name FROM series_tags st2 JOIN anime_tags t ON t.tag_id = st2.tag_id
      WHERE st2.series_id = s.series_id AND st2.is_media_spoiler = 0 AND t.is_general_spoiler = 0
      ORDER BY st2.rank DESC LIMIT 4
    ) x
  ), '[]') AS tagsJson`

/** Anime-level search: title text plus genre/tag/studio/format/status/year/score facets. */
export function searchAnimeCatalog({
  searchText = '',
  animeGenre = 'all',
  animeTag = 'all',
  genreMode = 'all',
  studio = 'all',
  format = 'all',
  status = 'all',
  yearFrom = null,
  yearTo = null,
  minScore = null,
  minImdb = null,
  sort = 'popularity',
  limit = 24,
  offset = 0,
} = {}) {
  const conditions = []
  const parameters = []
  const query = String(searchText ?? '').trim().slice(0, 100).toLocaleLowerCase('en')
  if (query) {
    conditions.push(ANIME_TITLE_MATCH_SQL)
    parameters.push(query, query, query, query)
  }
  const addSetCondition = (table, column, values) => {
    const strict = genreMode !== 'any' && values.length > 1
    conditions.push(`s.series_id IN (
      SELECT x.series_id FROM ${table} x WHERE x.${column} IN (${values.map(() => '?').join(', ')})
      ${strict ? `GROUP BY x.series_id HAVING COUNT(DISTINCT x.${column}) = ?` : ''}
    )`)
    parameters.push(...values)
    if (strict) parameters.push(values.length)
  }
  const genres = parseFilterList(animeGenre)
  const tags = parseFilterList(animeTag)
  const studios = parseFilterList(studio)
  if (genres.length) addSetCondition('series_genres', 'genre_id', genres)
  if (tags.length) addSetCondition('series_tags', 'tag_id', tags)
  if (studios.length) {
    conditions.push(`s.series_id IN (SELECT ss.series_id FROM series_studios ss WHERE ss.studio_id IN (${studios.map(() => '?').join(', ')}))`)
    parameters.push(...studios)
  }
  const formats = parseFilterList(format).map((value) => value.toUpperCase())
  if (formats.length) {
    conditions.push(`s.format IN (${formats.map(() => '?').join(', ')})`)
    parameters.push(...formats)
  }
  const statuses = parseFilterList(status).map((value) => value.toUpperCase())
  if (statuses.length) {
    conditions.push(`s.status IN (${statuses.map(() => '?').join(', ')})`)
    parameters.push(...statuses)
  }
  const toInt = (value) => (value === null || value === undefined || value === '' ? null : Math.trunc(Number(value)))
  const from = toInt(yearFrom)
  const to = toInt(yearTo)
  const score = toInt(minScore)
  if (Number.isFinite(from)) { conditions.push('s.season_year >= ?'); parameters.push(from) }
  if (Number.isFinite(to)) { conditions.push('s.season_year <= ?'); parameters.push(to) }
  if (Number.isFinite(score) && score > 0) { conditions.push('s.average_score >= ?'); parameters.push(score) }
  const imdb = minImdb === null || minImdb === undefined || minImdb === '' ? null : Number(minImdb)
  if (Number.isFinite(imdb) && imdb > 0) { conditions.push('s.imdb_rating >= ?'); parameters.push(imdb) }

  const where = conditions.length ? conditions.join(' AND ') : '1 = 1'
  const total = db.prepare(`SELECT COUNT(*) AS count FROM anime_series s WHERE ${where}`).get(...parameters).count
  const safeLimit = Math.max(1, Math.min(50, Math.trunc(Number(limit) || 24)))
  const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0))
  const orderBy = ANIME_SORTS[sort] ?? ANIME_SORTS.popularity
  const anime = db.prepare(`
    SELECT ${ANIME_CARD_COLUMNS}
    FROM anime_series s
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...parameters, safeLimit, safeOffset).map(toAnimeCard)
  return { anime, total, limit: safeLimit, offset: safeOffset, hasMore: safeOffset + anime.length < total }
}

export function listAnimeFacets() {
  const formats = db.prepare(`
    SELECT format AS id, COUNT(*) AS seriesCount FROM anime_series WHERE format IS NOT NULL GROUP BY format ORDER BY seriesCount DESC
  `).all()
  const statuses = db.prepare(`
    SELECT status AS id, COUNT(*) AS seriesCount FROM anime_series WHERE status IS NOT NULL GROUP BY status ORDER BY seriesCount DESC
  `).all()
  const years = db.prepare('SELECT MIN(season_year) AS min, MAX(season_year) AS max FROM anime_series').get()
  return { formats, statuses, years }
}

/** Global quick search: top anime and top characters for one query, ranked by match quality then popularity. */
export function quickSearch(searchText, { limit = 6 } = {}) {
  const query = String(searchText ?? '').trim().slice(0, 100).toLocaleLowerCase('en')
  if (query.length < 2) return { query, anime: [], animeTotal: 0, characters: [], characterTotal: 0 }
  const safeLimit = Math.max(1, Math.min(12, Math.trunc(Number(limit) || 6)))
  const prefix = `${query}%`

  const animeWhere = ANIME_TITLE_MATCH_SQL
  const animeParams = [query, query, query, query]
  const animeTotal = db.prepare(`SELECT COUNT(*) AS count FROM anime_series s WHERE ${animeWhere}`).get(...animeParams).count
  const anime = db.prepare(`
    SELECT s.series_id AS id, s.title, s.title_english AS titleEnglish, s.format, s.season_year AS seasonYear,
      s.average_score AS averageScore, s.popularity, s.cover_image AS coverImage
    FROM anime_series s
    WHERE ${animeWhere}
    ORDER BY (lower(s.title) = ? OR lower(COALESCE(s.title_english, '')) = ?) DESC,
      (lower(s.title) LIKE ? OR lower(COALESCE(s.title_english, '')) LIKE ?) DESC,
      s.popularity IS NULL, s.popularity DESC
    LIMIT ?
  `).all(...animeParams, query, query, prefix, prefix, safeLimit)

  const characterWhere = `(
    instr(lower(c.name), ?) > 0
    OR instr(lower(COALESCE(c.native_name, '')), ?) > 0
    OR EXISTS (SELECT 1 FROM character_aliases ca WHERE ca.character_id = c.id AND ca.spoiler = 0 AND instr(lower(ca.alias), ?) > 0)
  )`
  const characterParams = [query, query, query]
  const characterTotal = db.prepare(`SELECT COUNT(*) AS count FROM characters c WHERE ${characterWhere}`).get(...characterParams).count
  const characters = db.prepare(`
    SELECT c.id, c.name, c.native_name AS nativeName, c.favourites, c.series,
      ${CHARACTER_IMAGE_SQL} AS imageUrl,
      ${PRIMARY_SERIES_SQL} AS primarySeriesJson
    FROM characters c
    WHERE ${characterWhere}
    ORDER BY lower(c.name) = ? DESC, lower(c.name) LIKE ? DESC,
      (' ' || lower(c.name)) LIKE ? DESC,
      c.favourites IS NULL, c.favourites DESC, c.name COLLATE NOCASE
    LIMIT ?
  `).all(...characterParams, query, prefix, `% ${query}%`, safeLimit)
    .map(({ primarySeriesJson, ...row }) => ({ ...row, primarySeries: parseJson(primarySeriesJson, null) }))

  return { query, anime, animeTotal, characters, characterTotal }
}

const CHARACTER_IMAGE_SQL = `COALESCE(
  (SELECT i.image_url FROM character_images i WHERE i.character_id = c.id AND i.license_verified = 1 ORDER BY i.id DESC LIMIT 1),
  (SELECT ei.image_url FROM character_external_images ei WHERE ei.character_id = c.id ORDER BY ei.fetched_at DESC LIMIT 1)
)`
const PRIMARY_SERIES_SQL = `(
  SELECT json_object('id', s.series_id, 'title', s.title)
  FROM character_series cs2 JOIN anime_series s ON s.series_id = cs2.series_id
  WHERE cs2.character_id = c.id
  ORDER BY s.title = c.series DESC, s.popularity IS NULL, s.popularity DESC
  LIMIT 1
)`

function toCharacterNode(row) {
  if (!row?.id) return null
  return {
    id: row.id,
    anilistId: row.anilistId ?? null,
    name: row.name,
    image: row.imageUrl ?? null,
    primarySeries: parseJson(row.primarySeriesJson, null),
    favourites: row.favourites ?? null,
  }
}

function lookupCharacterNodes(ids) {
  if (!ids.length) return new Map()
  const rows = db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name, c.favourites,
      ${CHARACTER_IMAGE_SQL} AS imageUrl, ${PRIMARY_SERIES_SQL} AS primarySeriesJson
    FROM characters c WHERE c.id IN (${ids.map(() => '?').join(', ')})
  `).all(...ids)
  return new Map(rows.map((row) => [row.id, toCharacterNode(row)]))
}

const DIRECT_RELATION_LIMIT = 40
const CLUSTER_ANIME_LIMIT = 4
const CLUSTER_CHARACTER_LIMIT = 6

export function getCharacterDetail(characterId) {
  const id = String(characterId ?? '').slice(0, 120)
  const character = db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name, c.native_name AS nativeName, c.series,
      c.source_url AS sourceUrl, c.favourites, c.description, c.gender, c.age,
      c.date_of_birth AS dateOfBirth, c.blood_type AS bloodType, c.details_synced_at AS detailsSyncedAt,
      ${CHARACTER_IMAGE_SQL} AS imageUrl
    FROM characters c WHERE c.id = ?
  `).get(id)
  if (!character) return null

  const aliases = db.prepare(`
    SELECT DISTINCT alias FROM character_aliases WHERE character_id = ? AND spoiler = 0 ORDER BY alias LIMIT 30
  `).all(id).map((row) => row.alias)

  const roleLabels = ['MAIN', 'SUPPORTING', 'BACKGROUND', null]
  const anime = db.prepare(`
    SELECT s.series_id AS id, s.title, s.cover_image AS coverImage, s.format, s.season_year AS seasonYear,
      s.popularity, MIN(${ROLE_ORDER}) AS roleRank
    FROM character_series cs JOIN anime_series s ON s.series_id = cs.series_id
    WHERE cs.character_id = ?
    GROUP BY s.series_id
    ORDER BY s.popularity IS NULL, s.popularity DESC, s.title COLLATE NOCASE
  `).all(id).map(({ roleRank, ...item }) => ({ ...item, role: roleLabels[roleRank] ?? null }))
  const seriesIds = anime.map((item) => item.id)

  const genres = seriesIds.length ? db.prepare(`
    SELECT g.genre_id AS id, g.label, COUNT(DISTINCT sg.series_id) AS seriesCount
    FROM series_genres sg JOIN genres g ON g.genre_id = sg.genre_id
    WHERE sg.series_id IN (${seriesIds.map(() => '?').join(', ')})
    GROUP BY g.genre_id
    ORDER BY seriesCount DESC, g.label
  `).all(...seriesIds) : []

  // Explicit relations: links inside this character's description (out) and other descriptions linking here (in).
  const direct = new Map()
  const outgoing = db.prepare(`
    SELECT r.related_anilist_id AS anilistId, r.related_name AS name, r.relation_label AS label,
      r.context, r.spoiler, MIN(c.id) AS localId
    FROM character_relations r LEFT JOIN characters c ON c.anilist_id = r.related_anilist_id
    WHERE r.character_id = ?
    GROUP BY r.related_anilist_id
    LIMIT ?
  `).all(id, DIRECT_RELATION_LIMIT)
  for (const row of outgoing) {
    direct.set(row.localId ?? `anilist:${row.anilistId}`, {
      anilistId: row.anilistId, name: row.name, localId: row.localId,
      label: row.label, context: row.context, spoiler: Boolean(row.spoiler), direction: 'out',
    })
  }
  if (character.anilistId) {
    const incoming = db.prepare(`
      SELECT r.character_id AS localId, c.anilist_id AS anilistId, c.name, r.relation_label AS label,
        r.context, r.spoiler
      FROM character_relations r JOIN characters c ON c.id = r.character_id
      WHERE r.related_anilist_id = ? AND r.character_id <> ?
      ORDER BY c.favourites IS NULL, c.favourites DESC
      LIMIT ?
    `).all(character.anilistId, id, DIRECT_RELATION_LIMIT)
    for (const row of incoming) {
      const existing = direct.get(row.localId)
      if (existing) {
        existing.direction = 'both'
        existing.reverseLabel = row.label
        existing.reverseContext = row.context
        if (!existing.label && row.label) existing.label = row.label
        existing.spoiler = existing.spoiler && Boolean(row.spoiler)
      } else {
        direct.set(row.localId, {
          anilistId: row.anilistId, name: row.name, localId: row.localId,
          label: row.label, context: row.context, spoiler: Boolean(row.spoiler), direction: 'in',
        })
      }
    }
  }
  const directIds = [...direct.values()].map((item) => item.localId).filter(Boolean)

  // Implicit relations: characters sharing the most anime, plus the leading cast of the most popular anime.
  const coStarRows = db.prepare(`
    SELECT other.character_id AS id, COUNT(DISTINCT other.series_id) AS sharedCount,
      MIN(CASE other.role WHEN 'MAIN' THEN 0 WHEN 'SUPPORTING' THEN 1 WHEN 'BACKGROUND' THEN 2 ELSE 3 END) AS roleRank,
      (SELECT favourites FROM characters WHERE id = other.character_id) AS favourites
    FROM character_series mine
    JOIN character_series other ON other.series_id = mine.series_id AND other.character_id <> mine.character_id
    WHERE mine.character_id = ?
    GROUP BY other.character_id
    ORDER BY sharedCount DESC, roleRank, favourites IS NULL, favourites DESC
    LIMIT 12
  `).all(id)

  const clusterAnime = anime.slice(0, CLUSTER_ANIME_LIMIT)
  const clusterMembers = db.prepare(`
    SELECT cs.character_id AS id, MIN(${ROLE_ORDER}) AS roleRank, c.favourites
    FROM character_series cs JOIN characters c ON c.id = cs.character_id
    WHERE cs.series_id = ? AND cs.character_id <> ?
    GROUP BY cs.character_id
    ORDER BY roleRank, c.favourites IS NULL, c.favourites DESC
    LIMIT ?
  `)
  const clusterRows = clusterAnime.map((series) => ({
    series,
    members: clusterMembers.all(series.id, id, CLUSTER_CHARACTER_LIMIT),
  }))

  const nodes = lookupCharacterNodes([...new Set([
    ...directIds,
    ...coStarRows.map((row) => row.id),
    ...clusterRows.flatMap((cluster) => cluster.members.map((row) => row.id)),
  ])])

  return {
    id: character.id,
    anilistId: character.anilistId,
    name: character.name,
    nativeName: character.nativeName,
    sourceUrl: character.sourceUrl,
    favourites: character.favourites,
    description: character.description,
    gender: character.gender,
    age: character.age,
    dateOfBirth: character.dateOfBirth,
    bloodType: character.bloodType,
    detailsSyncedAt: character.detailsSyncedAt,
    traits: db.prepare('SELECT trait_id AS id, evidence FROM character_derived_traits WHERE character_id = ?').all(id)
      .map((row) => ({ ...toTraitChips([row.id])[0], evidence: row.evidence })).filter((item) => item.label),
    image: character.imageUrl ? { url: character.imageUrl, provider: 'AniList' } : null,
    aliases,
    anime,
    genres,
    studios: listSeriesStudios(seriesIds),
    relations: {
      direct: [...direct.values()].map(({ localId, ...item }) => ({ ...item, character: localId ? nodes.get(localId) ?? null : null })),
      coStars: coStarRows.map((row) => ({
        sharedCount: row.sharedCount,
        role: roleLabels[row.roleRank] ?? null,
        character: nodes.get(row.id),
      })).filter((item) => item.character),
      clusters: clusterRows.map(({ series, members }) => ({
        series: { id: series.id, title: series.title, coverImage: series.coverImage },
        role: series.role,
        characters: members.map((row) => ({ role: roleLabels[row.roleRank] ?? null, character: nodes.get(row.id) }))
          .filter((item) => item.character),
      })),
    },
  }
}

const detailSyncAttempts = new Map()
const DETAIL_RETRY_MS = 10 * 60 * 1000

/** Fetches description/relations from AniList the first time a character page is opened. */
export async function syncCharacterDetailsIfMissing(characterId, { timeoutMs = 8000 } = {}) {
  const row = db.prepare('SELECT anilist_id AS anilistId, details_synced_at AS syncedAt FROM characters WHERE id = ?').get(characterId)
  if (!row?.anilistId || row.syncedAt) return false
  const lastAttempt = detailSyncAttempts.get(characterId)
  if (lastAttempt && Date.now() - lastAttempt < DETAIL_RETRY_MS) return false
  detailSyncAttempts.set(characterId, Date.now())
  try {
    const node = await Promise.race([
      fetchCharacterDetails(row.anilistId),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('AniList timeout')), timeoutMs)),
    ])
    if (!node) return false
    saveCharacterDetails([node])
    detailSyncAttempts.delete(characterId)
    return true
  } catch {
    return false
  }
}

const relationSyncAttempts = new Map()

/** Fetches prequel/sequel/spin-off links from AniList the first time an anime page is opened. */
export async function syncAnimeRelationsIfMissing(seriesId, { timeoutMs = 8000 } = {}) {
  const row = db.prepare(`
    SELECT anilist_id AS anilistId, relations_synced_at IS NOT NULL AND tags_synced_at IS NOT NULL AS syncedAt
    FROM anime_series WHERE series_id = ?
  `).get(seriesId)
  if (!row?.anilistId || row.syncedAt) return false
  const lastAttempt = relationSyncAttempts.get(seriesId)
  if (lastAttempt && Date.now() - lastAttempt < DETAIL_RETRY_MS) return false
  relationSyncAttempts.set(seriesId, Date.now())
  try {
    const media = await Promise.race([
      fetchAnimeRelations(row.anilistId),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('AniList timeout')), timeoutMs)),
    ])
    if (!media) return false
    saveAnimeRelations([media])
    relationSyncAttempts.delete(seriesId)
    return true
  } catch {
    return false
  }
}
