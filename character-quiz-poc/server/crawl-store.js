import { db, normalizeId, upsertSourceRecord } from './db.js'
import { cleanCharacterDescription, parseCharacterMentions } from './character-relations.js'
import { deriveTraits } from './character-traits.js'

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
addColumnIfMissing('anime_series', 'cover_image', 'TEXT')
addColumnIfMissing('anime_series', 'banner_image', 'TEXT')
addColumnIfMissing('anime_series', 'description', 'TEXT')
addColumnIfMissing('anime_series', 'episodes', 'INTEGER')
addColumnIfMissing('anime_series', 'status', 'TEXT')
addColumnIfMissing('anime_series', 'season', 'TEXT')
addColumnIfMissing('anime_series', 'average_score', 'INTEGER')
addColumnIfMissing('anime_series', 'studios_json', 'TEXT')
db.exec('CREATE INDEX IF NOT EXISTS idx_anime_series_popularity ON anime_series(popularity DESC)')
addColumnIfMissing('characters', 'description', 'TEXT')
addColumnIfMissing('characters', 'gender', 'TEXT')
addColumnIfMissing('characters', 'age', 'TEXT')
addColumnIfMissing('characters', 'date_of_birth', 'TEXT')
addColumnIfMissing('characters', 'blood_type', 'TEXT')
addColumnIfMissing('characters', 'details_synced_at', 'TEXT')
db.exec(`
  CREATE TABLE IF NOT EXISTS studios (
    studio_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS series_studios (
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    studio_id TEXT NOT NULL REFERENCES studios(studio_id) ON DELETE CASCADE,
    PRIMARY KEY (series_id, studio_id)
  );
  CREATE INDEX IF NOT EXISTS idx_series_studios_studio ON series_studios(studio_id, series_id);
  CREATE TABLE IF NOT EXISTS character_relations (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    related_anilist_id INTEGER NOT NULL,
    related_name TEXT NOT NULL,
    relation_label TEXT,
    context TEXT,
    spoiler INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (character_id, related_anilist_id)
  );
  CREATE INDEX IF NOT EXISTS idx_character_relations_related ON character_relations(related_anilist_id);
  CREATE INDEX IF NOT EXISTS idx_characters_anilist ON characters(anilist_id);
  CREATE TABLE IF NOT EXISTS anime_relations (
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    related_anilist_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL,
    related_media_type TEXT,
    related_title TEXT NOT NULL,
    related_format TEXT,
    related_status TEXT,
    related_season_year INTEGER,
    related_cover TEXT,
    related_site_url TEXT,
    PRIMARY KEY (series_id, related_anilist_id, relation_type)
  );
  CREATE INDEX IF NOT EXISTS idx_anime_series_anilist ON anime_series(anilist_id);
`)
addColumnIfMissing('anime_series', 'relations_synced_at', 'TEXT')
addColumnIfMissing('anime_series', 'tags_synced_at', 'TEXT')
addColumnIfMissing('anime_series', 'mal_id', 'INTEGER')
db.exec(`
  CREATE TABLE IF NOT EXISTS anime_tags (
    tag_id TEXT PRIMARY KEY,
    anilist_tag_id INTEGER,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    is_general_spoiler INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS series_tags (
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES anime_tags(tag_id) ON DELETE CASCADE,
    rank INTEGER,
    is_media_spoiler INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (series_id, tag_id)
  );
  CREATE INDEX IF NOT EXISTS idx_series_tags_tag ON series_tags(tag_id, series_id);
  CREATE TABLE IF NOT EXISTS character_derived_traits (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    trait_id TEXT NOT NULL,
    evidence TEXT,
    PRIMARY KEY (character_id, trait_id)
  );
  CREATE INDEX IF NOT EXISTS idx_character_derived_traits_trait ON character_derived_traits(trait_id, character_id);
  CREATE INDEX IF NOT EXISTS idx_character_series_role ON character_series(role, character_id);
`)
addColumnIfMissing('anime_series', 'imdb_id', 'TEXT')
addColumnIfMissing('anime_series', 'imdb_rating', 'REAL')
addColumnIfMissing('anime_series', 'imdb_votes', 'INTEGER')
addColumnIfMissing('anime_series', 'imdb_synced_at', 'TEXT')
db.exec('CREATE INDEX IF NOT EXISTS idx_anime_series_imdb ON anime_series(imdb_id)')

const deleteDerivedTraits = db.prepare('DELETE FROM character_derived_traits WHERE character_id = ?')
const insertDerivedTrait = db.prepare('INSERT OR REPLACE INTO character_derived_traits (character_id, trait_id, evidence) VALUES (?, ?, ?)')

function replaceDerivedTraits(characterId, description) {
  deleteDerivedTraits.run(characterId)
  const traits = deriveTraits(description)
  for (const entry of traits) insertDerivedTrait.run(characterId, entry.traitId, entry.evidence)
  return traits.length
}

export function rebuildDerivedTraits() {
  const rows = db.prepare('SELECT id, description FROM characters WHERE description IS NOT NULL').all()
  let links = 0
  db.transaction(() => {
    db.exec('DELETE FROM character_derived_traits')
    for (const row of rows) links += replaceDerivedTraits(row.id, row.description)
  })()
  return { characters: rows.length, links }
}

// Fribb/anime-lists entries: { anilist_id, mal_id, imdb_id: string | string[] }.
export function saveImdbMapping(entries) {
  const byAniList = new Map()
  const byMal = new Map()
  for (const entry of entries) {
    const imdbIds = (Array.isArray(entry.imdb_id) ? entry.imdb_id : [entry.imdb_id]).filter((id) => /^tt\d+$/.test(String(id ?? '')))
    if (!imdbIds.length) continue
    if (entry.anilist_id && !byAniList.has(entry.anilist_id)) byAniList.set(Number(entry.anilist_id), imdbIds[0])
    if (entry.mal_id && !byMal.has(entry.mal_id)) byMal.set(Number(entry.mal_id), imdbIds[0])
  }
  const rows = db.prepare('SELECT series_id AS seriesId, anilist_id AS anilistId, mal_id AS malId FROM anime_series').all()
  const update = db.prepare('UPDATE anime_series SET imdb_id = ? WHERE series_id = ?')
  let mapped = 0
  db.transaction(() => {
    for (const row of rows) {
      const imdbId = byAniList.get(Number(row.anilistId)) ?? byMal.get(Number(row.malId)) ?? null
      update.run(imdbId, row.seriesId)
      if (imdbId) mapped += 1
    }
  })()
  return { series: rows.length, mapped }
}

export function listMappedImdbIds() {
  return new Set(db.prepare('SELECT DISTINCT imdb_id FROM anime_series WHERE imdb_id IS NOT NULL').pluck().all())
}

export function saveImdbRatings(ratings) {
  const rows = db.prepare('SELECT series_id AS seriesId, imdb_id AS imdbId FROM anime_series').all()
  const update = db.prepare('UPDATE anime_series SET imdb_rating = ?, imdb_votes = ?, imdb_synced_at = CURRENT_TIMESTAMP WHERE series_id = ?')
  let rated = 0
  db.transaction(() => {
    for (const row of rows) {
      const rating = row.imdbId ? ratings.get(row.imdbId) : null
      update.run(rating?.rating ?? null, rating?.votes ?? null, row.seriesId)
      if (rating) rated += 1
    }
  })()
  return { rated }
}

const upsertTag = db.prepare(`
  INSERT INTO anime_tags (tag_id, anilist_tag_id, name, category, description, is_general_spoiler)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(tag_id) DO UPDATE SET
    anilist_tag_id = excluded.anilist_tag_id, name = excluded.name, category = excluded.category,
    description = excluded.description, is_general_spoiler = excluded.is_general_spoiler
`)
const deleteSeriesTags = db.prepare('DELETE FROM series_tags WHERE series_id = ?')
const linkSeriesTag = db.prepare('INSERT OR REPLACE INTO series_tags (series_id, tag_id, rank, is_media_spoiler) VALUES (?, ?, ?, ?)')
const markTagsSynced = db.prepare('UPDATE anime_series SET tags_synced_at = CURRENT_TIMESTAMP, mal_id = COALESCE(?, mal_id) WHERE series_id = ?')

/** Stores AniList Media.tags (Youkai, Ninja, Isekai...); adult tags are skipped. No-op when the query did not request tags. */
function saveSeriesTags(seriesId, media) {
  if (!Array.isArray(media.tags)) return
  deleteSeriesTags.run(seriesId)
  for (const tag of media.tags) {
    const tagId = normalizeId(tag?.name)
    if (!tagId || tag.isAdult) continue
    upsertTag.run(tagId, tag.id ?? null, tag.name, tag.category ?? null, tag.description ?? null, tag.isGeneralSpoiler ? 1 : 0)
    linkSeriesTag.run(seriesId, tagId, tag.rank ?? null, tag.isMediaSpoiler ? 1 : 0)
  }
  markTagsSynced.run(media.idMal ?? null, seriesId)
}

const insertStudio = db.prepare(`
  INSERT INTO studios (studio_id, name) VALUES (?, ?)
  ON CONFLICT(studio_id) DO UPDATE SET name = excluded.name
`)
const linkSeriesStudio = db.prepare('INSERT OR IGNORE INTO series_studios (series_id, studio_id) VALUES (?, ?)')
const deleteSeriesStudios = db.prepare('DELETE FROM series_studios WHERE series_id = ?')

function saveSeriesStudios(seriesId, names) {
  deleteSeriesStudios.run(seriesId)
  for (const name of new Set(names)) {
    const studioId = normalizeId(name)
    if (!studioId) continue
    insertStudio.run(studioId, name)
    linkSeriesStudio.run(seriesId, studioId)
  }
}

function backfillSeriesStudios() {
  const pending = db.prepare(`
    SELECT series_id AS seriesId, studios_json AS studiosJson FROM anime_series s
    WHERE studios_json IS NOT NULL AND studios_json <> '[]'
      AND NOT EXISTS (SELECT 1 FROM series_studios ss WHERE ss.series_id = s.series_id)
  `).all()
  if (!pending.length) return
  db.transaction(() => {
    for (const row of pending) {
      try {
        saveSeriesStudios(row.seriesId, JSON.parse(row.studiosJson))
      } catch {
        // Ignore malformed legacy JSON.
      }
    }
  })()
}
backfillSeriesStudios()

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
    source_id, synced_at, popularity, favourites, format, season_year,
    cover_image, banner_image, description, episodes, status, season, average_score, studios_json
  ) VALUES (
    @seriesId, @anilistId, @title, @titleEnglish, @titleRomaji, @titleNative, @pageUrl,
    @sourceId, CURRENT_TIMESTAMP, @popularity, @favourites, @format, @seasonYear,
    @coverImage, @bannerImage, @description, @episodes, @status, @season, @averageScore, @studiosJson
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
    cover_image = COALESCE(excluded.cover_image, anime_series.cover_image),
    banner_image = COALESCE(excluded.banner_image, anime_series.banner_image),
    description = COALESCE(excluded.description, anime_series.description),
    episodes = COALESCE(excluded.episodes, anime_series.episodes),
    status = COALESCE(excluded.status, anime_series.status),
    season = COALESCE(excluded.season, anime_series.season),
    average_score = COALESCE(excluded.average_score, anime_series.average_score),
    studios_json = COALESCE(excluded.studios_json, anime_series.studios_json),
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

export function cleanDescription(value) {
  if (!value) return null
  const text = String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text ? text.slice(0, 5000) : null
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
    coverImage: media.coverImage?.extraLarge || media.coverImage?.large || null,
    bannerImage: media.bannerImage ?? null,
    description: cleanDescription(media.description),
    episodes: media.episodes ?? null,
    status: media.status ?? null,
    season: media.season ?? null,
    averageScore: media.averageScore ?? null,
    studiosJson: media.studios?.nodes ? JSON.stringify(media.studios.nodes.map((studio) => studio.name)) : null,
  })
  insertSeriesExternalId.run(seriesId, sourceId, String(media.id), pageUrl)
  if (media.studios?.nodes) saveSeriesStudios(seriesId, media.studios.nodes.map((studio) => studio.name).filter(Boolean))
  saveSeriesTags(seriesId, media)

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
    charactersWithDetails: count('SELECT COUNT(*) AS count FROM characters WHERE details_synced_at IS NOT NULL'),
    characterRelations: count('SELECT COUNT(*) AS count FROM character_relations'),
    studios: count('SELECT COUNT(*) AS count FROM studios'),
    animeRelations: count('SELECT COUNT(*) AS count FROM anime_relations'),
    animeTags: count('SELECT COUNT(*) AS count FROM anime_tags'),
    animeWithTags: count('SELECT COUNT(*) AS count FROM anime_series WHERE tags_synced_at IS NOT NULL'),
  }
}

const updateCharacterDetails = db.prepare(`
  UPDATE characters SET
    description = @description,
    gender = @gender,
    age = @age,
    date_of_birth = @dateOfBirth,
    blood_type = @bloodType,
    favourites = COALESCE(@favourites, favourites),
    details_synced_at = CURRENT_TIMESTAMP
  WHERE id = @id
`)
const deleteCharacterRelations = db.prepare('DELETE FROM character_relations WHERE character_id = ?')
const insertCharacterRelation = db.prepare(`
  INSERT OR REPLACE INTO character_relations (character_id, related_anilist_id, related_name, relation_label, context, spoiler)
  VALUES (?, ?, ?, ?, ?, ?)
`)

function formatDateOfBirth(value) {
  if (!value?.month && !value?.day && !value?.year) return null
  return [value.year, value.month, value.day].map((part) => (part ? String(part).padStart(2, '0') : '??')).join('-')
}

/** Saves AniList Character nodes (description + bio fields) and their parsed mention relations. */
export function saveCharacterDetails(nodes) {
  let saved = 0
  let relations = 0
  db.transaction(() => {
    for (const node of nodes) {
      const characterId = findCharacterByAniListId.get(node.id, String(node.id))?.id
      if (!characterId) continue
      const description = cleanCharacterDescription(node.description)
      replaceDerivedTraits(characterId, description)
      updateCharacterDetails.run({
        id: characterId,
        description,
        gender: node.gender ?? null,
        age: node.age ? String(node.age).slice(0, 60) : null,
        dateOfBirth: formatDateOfBirth(node.dateOfBirth),
        bloodType: node.bloodType ?? null,
        favourites: node.favourites ?? null,
      })
      deleteCharacterRelations.run(characterId)
      for (const mention of parseCharacterMentions(node.description, node.id)) {
        insertCharacterRelation.run(characterId, mention.anilistId, mention.name, mention.label, mention.context, mention.spoiler ? 1 : 0)
        relations += 1
      }
      saved += 1
    }
  })()
  return { saved, relations }
}

export function findCharactersForDetailCrawl({ limit = 100000, force = false, genre = '' } = {}) {
  const conditions = ['c.anilist_id IS NOT NULL']
  const parameters = []
  if (!force) conditions.push('c.details_synced_at IS NULL')
  if (genre) {
    conditions.push(`c.id IN (
      SELECT cs.character_id FROM series_genres sg
      JOIN character_series cs ON cs.series_id = sg.series_id
      WHERE sg.genre_id = ?
    )`)
    parameters.push(normalizeId(genre))
  }
  return db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name
    FROM characters c
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.favourites IS NULL, c.favourites DESC
    LIMIT ?
  `).all(...parameters, limit)
}

const findSeriesIdByAniListId = db.prepare('SELECT series_id AS seriesId FROM anime_series WHERE anilist_id = ? LIMIT 1')
const deleteAnimeRelations = db.prepare('DELETE FROM anime_relations WHERE series_id = ?')
const insertAnimeRelation = db.prepare(`
  INSERT OR REPLACE INTO anime_relations (
    series_id, related_anilist_id, relation_type, related_media_type, related_title,
    related_format, related_status, related_season_year, related_cover, related_site_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const markRelationsSynced = db.prepare('UPDATE anime_series SET relations_synced_at = CURRENT_TIMESTAMP WHERE series_id = ?')

/** Saves AniList Media.relations edges (prequel, sequel, spin-off, adaptation...). */
export function saveAnimeRelations(mediaList) {
  let saved = 0
  let relations = 0
  db.transaction(() => {
    for (const media of mediaList) {
      const seriesId = findSeriesIdByAniListId.get(media.id)?.seriesId
      if (!seriesId) continue
      deleteAnimeRelations.run(seriesId)
      for (const edge of media.relations?.edges ?? []) {
        const node = edge.node
        if (!node?.id || node.isAdult || !edge.relationType) continue
        insertAnimeRelation.run(
          seriesId, node.id, edge.relationType, node.type ?? null,
          node.title?.userPreferred || `AniList #${node.id}`,
          node.format ?? null, node.status ?? null, node.seasonYear ?? null,
          node.coverImage?.large ?? null,
          node.siteUrl || `https://anilist.co/${String(node.type ?? 'anime').toLowerCase()}/${node.id}`,
        )
        relations += 1
      }
      markRelationsSynced.run(seriesId)
      saveSeriesTags(seriesId, media)
      saved += 1
    }
  })()
  return { saved, relations }
}

export function findAnimeForRelationCrawl({ limit = 100000, force = false } = {}) {
  return db.prepare(`
    SELECT s.series_id AS seriesId, s.anilist_id AS anilistId, s.title
    FROM anime_series s
    WHERE s.anilist_id IS NOT NULL ${force ? '' : 'AND (s.relations_synced_at IS NULL OR s.tags_synced_at IS NULL)'}
    ORDER BY s.popularity IS NULL, s.popularity DESC
    LIMIT ?
  `).all(limit)
}
