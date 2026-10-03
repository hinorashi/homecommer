import { db, normalizeId, upsertSourceRecord } from './db.js'

function addColumnIfMissing(table, column, definition) {
  const columns = db.pragma(`table_info(${table})`)
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

addColumnIfMissing('anime_series', 'popularity', 'INTEGER')
addColumnIfMissing('anime_series', 'favourites', 'INTEGER')
addColumnIfMissing('anime_series', 'format', 'TEXT')
addColumnIfMissing('anime_series', 'season_year', 'INTEGER')
addColumnIfMissing('anime_series', 'characters_synced_at', 'TEXT')
addColumnIfMissing('characters', 'favourites', 'INTEGER')
db.exec('CREATE INDEX IF NOT EXISTS idx_anime_series_popularity ON anime_series(popularity DESC)')

const anilistSourceId = () => upsertSourceRecord({
  url: 'https://anilist.co',
  title: 'AniList API',
  sourceType: 'anime-database-api',
})

export function saveGenres(labels) {
  const save = db.prepare(`
    INSERT INTO genres (genre_id, label) VALUES (?, ?)
    ON CONFLICT(genre_id) DO UPDATE SET label = excluded.label
  `)
  let count = 0
  db.transaction(() => {
    for (const label of new Set(labels)) {
      const genreId = normalizeId(label)
      if (!genreId) continue
      save.run(genreId, label)
      count += 1
    }
  })()
  return count
}

export function listGenreLabels() {
  return db.prepare('SELECT label FROM genres ORDER BY label').all().map((row) => row.label)
}

const findSeriesByAniListId = db.prepare(`
  SELECT series_id AS seriesId FROM anime_series WHERE anilist_id = ?
  UNION ALL
  SELECT se.series_id FROM series_external_ids se
  JOIN sources s ON s.id = se.source_id
  WHERE s.url = 'https://anilist.co' AND se.external_id = ?
  LIMIT 1
`)
const findSeedSeriesByTitle = db.prepare(`
  SELECT series_id AS seriesId FROM anime_series
  WHERE anilist_id IS NULL AND lower(title) IN (?, ?, ?, ?)
  LIMIT 1
`)
const upsertSeries = db.prepare(`
  INSERT INTO anime_series (
    series_id, anilist_id, title, title_english, title_romaji, title_native, page_url,
    source_id, synced_at, popularity, favourites, format, season_year
  ) VALUES (
    @seriesId, @anilistId, @title, @titleEnglish, @titleRomaji, @titleNative, @pageUrl,
    @sourceId, CURRENT_TIMESTAMP, @popularity, @favourites, @format, @seasonYear
  )
  ON CONFLICT(series_id) DO UPDATE SET
    anilist_id = excluded.anilist_id,
    title = excluded.title,
    title_english = excluded.title_english,
    title_romaji = excluded.title_romaji,
    title_native = excluded.title_native,
    page_url = excluded.page_url,
    synced_at = CURRENT_TIMESTAMP,
    popularity = excluded.popularity,
    favourites = excluded.favourites,
    format = excluded.format,
    season_year = excluded.season_year,
    updated_at = CURRENT_TIMESTAMP
`)
const insertSeriesExternalId = db.prepare(`
  INSERT OR IGNORE INTO series_external_ids (series_id, source_id, external_id, page_url)
  VALUES (?, ?, ?, ?)
`)
const deleteSeriesGenres = db.prepare('DELETE FROM series_genres WHERE series_id = ? AND source_id = ?')
const insertGenre = db.prepare('INSERT OR IGNORE INTO genres (genre_id, label) VALUES (?, ?)')
const linkSeriesGenre = db.prepare('INSERT OR IGNORE INTO series_genres (series_id, genre_id, source_id) VALUES (?, ?, ?)')

function lower(value) {
  return String(value ?? '').toLocaleLowerCase('en')
}

function saveAnimeRecord(media, sourceId) {
  const title = media.title?.userPreferred || media.title?.english || media.title?.romaji || `AniList #${media.id}`
  const existing = findSeriesByAniListId.get(media.id, String(media.id))
    ?? findSeedSeriesByTitle.get(lower(title), lower(media.title?.english), lower(media.title?.romaji), lower(media.title?.native))
  const seriesId = existing?.seriesId ?? `anilist-${media.id}`
  const pageUrl = media.siteUrl || `https://anilist.co/anime/${media.id}`

  upsertSeries.run({
    seriesId,
    anilistId: media.id,
    title,
    titleEnglish: media.title?.english ?? null,
    titleRomaji: media.title?.romaji ?? null,
    titleNative: media.title?.native ?? null,
    pageUrl,
    sourceId,
    popularity: media.popularity ?? null,
    favourites: media.favourites ?? null,
    format: media.format ?? null,
    seasonYear: media.seasonYear ?? null,
  })
  insertSeriesExternalId.run(seriesId, sourceId, String(media.id), pageUrl)

  deleteSeriesGenres.run(seriesId, sourceId)
  for (const label of new Set(media.genres ?? [])) {
    const genreId = normalizeId(label)
    if (!genreId) continue
    insertGenre.run(genreId, label)
    linkSeriesGenre.run(seriesId, genreId, sourceId)
  }
  return seriesId
}

export function saveAnimeList(mediaList) {
  const sourceId = anilistSourceId()
  let created = 0
  const countSeries = db.prepare('SELECT COUNT(*) AS count FROM anime_series')
  db.transaction(() => {
    const before = countSeries.get().count
    for (const media of mediaList) saveAnimeRecord(media, sourceId)
    created = countSeries.get().count - before
  })()
  return { saved: mediaList.length, created }
}

export function findAnimeForCharacterCrawl({ limit = 100000, force = false, genre = '' } = {}) {
  const conditions = ['s.anilist_id IS NOT NULL']
  const parameters = []
  if (!force) conditions.push('s.characters_synced_at IS NULL')
  if (genre) {
    conditions.push(`EXISTS (
      SELECT 1 FROM series_genres sg WHERE sg.series_id = s.series_id AND sg.genre_id = ?
    )`)
    parameters.push(normalizeId(genre))
  }
  return db.prepare(`
    SELECT s.series_id AS seriesId, s.anilist_id AS anilistId, s.title, s.popularity
    FROM anime_series s
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.popularity IS NULL, s.popularity DESC
    LIMIT ?
  `).all(...parameters, limit)
}

const findCharacterByAniListId = db.prepare(`
  SELECT id FROM characters WHERE anilist_id = ?
  UNION ALL
  SELECT ce.character_id FROM character_external_ids ce
  JOIN sources s ON s.id = ce.source_id
  WHERE s.url = 'https://anilist.co' AND ce.external_id = ?
  LIMIT 1
`)
const insertCharacter = db.prepare(`
  INSERT INTO characters (id, anilist_id, name, native_name, series, source_url, favourites, metadata_synced_at)
  VALUES (@id, @anilistId, @name, @nativeName, @series, @sourceUrl, @favourites, CURRENT_TIMESTAMP)
`)
const updateCharacter = db.prepare(`
  UPDATE characters SET
    anilist_id = COALESCE(anilist_id, @anilistId),
    name = CASE WHEN id LIKE 'anilist-%' THEN @name ELSE name END,
    native_name = COALESCE(@nativeName, native_name),
    source_url = COALESCE(source_url, @sourceUrl),
    favourites = @favourites,
    metadata_synced_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = @id
`)
const insertCharacterExternalId = db.prepare(`
  INSERT OR IGNORE INTO character_external_ids (character_id, source_id, external_id, page_url)
  VALUES (?, ?, ?, ?)
`)
const upsertCharacterSeries = db.prepare(`
  INSERT INTO character_series (character_id, series_id, role, source_id)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(character_id, series_id, source_id) DO UPDATE SET
    role = excluded.role,
    fetched_at = CURRENT_TIMESTAMP
`)
const insertAlias = db.prepare(`
  INSERT OR IGNORE INTO character_aliases (character_id, alias, source_id, spoiler)
  VALUES (?, ?, ?, 0)
`)
const upsertImage = db.prepare(`
  INSERT INTO character_external_images (
    character_id, source_id, image_url, page_url, storage_permission_status, reuse_permission_status
  ) VALUES (?, ?, ?, ?, 'confirmed', 'unverified')
  ON CONFLICT(character_id, source_id) DO UPDATE SET
    image_url = excluded.image_url,
    page_url = excluded.page_url,
    fetched_at = CURRENT_TIMESTAMP
`)
const markAnimeCrawled = db.prepare(`
  UPDATE anime_series SET characters_synced_at = CURRENT_TIMESTAMP WHERE series_id = ?
`)

function saveCharacterEdge(edge, anime, sourceId) {
  const node = edge.node
  const name = node?.name?.full?.trim()
  if (!node?.id || !name) return false

  const pageUrl = node.siteUrl || `https://anilist.co/character/${node.id}`
  const record = {
    anilistId: node.id,
    name,
    nativeName: node.name?.native ?? null,
    series: anime.title,
    sourceUrl: pageUrl,
    favourites: node.favourites ?? null,
  }
  const existing = findCharacterByAniListId.get(node.id, String(node.id))
  let created = false
  let characterId = existing?.id
  if (characterId) {
    updateCharacter.run({ ...record, id: characterId })
  } else {
    characterId = `anilist-${node.id}`
    insertCharacter.run({ ...record, id: characterId })
    created = true
  }

  insertCharacterExternalId.run(characterId, sourceId, String(node.id), pageUrl)
  upsertCharacterSeries.run(characterId, anime.seriesId, edge.role ?? null, sourceId)
  for (const alias of new Set(node.name?.alternative ?? [])) {
    const trimmed = String(alias ?? '').trim()
    if (trimmed && trimmed !== name && trimmed !== record.nativeName) insertAlias.run(characterId, trimmed.slice(0, 200), sourceId)
  }
  const imageUrl = node.image?.large || node.image?.medium
  if (imageUrl) upsertImage.run(characterId, sourceId, imageUrl, pageUrl)
  return created
}

export function saveAnimeCharacters(anime, edges, { complete = true } = {}) {
  const sourceId = anilistSourceId()
  let created = 0
  db.transaction(() => {
    for (const edge of edges) {
      if (saveCharacterEdge(edge, anime, sourceId)) created += 1
    }
    if (complete) markAnimeCrawled.run(anime.seriesId)
  })()
  return { saved: edges.length, created }
}

export function getCrawlStats() {
  const count = (sql) => db.prepare(sql).get().count
  return {
    genres: count('SELECT COUNT(*) AS count FROM genres'),
    anime: count('SELECT COUNT(*) AS count FROM anime_series WHERE anilist_id IS NOT NULL'),
    animeWithCharacters: count('SELECT COUNT(*) AS count FROM anime_series WHERE characters_synced_at IS NOT NULL'),
    characters: count('SELECT COUNT(*) AS count FROM characters'),
  }
}
