import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { characterProfiles } from '../src/characterProfiles.js'
import { traitCatalog } from '../src/traitCatalog.js'

const here = dirname(fileURLToPath(import.meta.url))
const databasePath = process.env.SQLITE_PATH || resolve(here, 'data', 'character-match.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })

export const db = new Database(databasePath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL,
    license_note TEXT,
    checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trait_tags (
    tag_id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    trait_type TEXT NOT NULL,
    aliases_json TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    anilist_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    native_name TEXT,
    series TEXT NOT NULL,
    source_url TEXT,
    latest_release TEXT,
    latest_release_url TEXT,
    latest_release_verified INTEGER NOT NULL DEFAULT 0,
    trait_cutoff_aligned INTEGER NOT NULL DEFAULT 0,
    metadata_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS character_traits (
    id INTEGER PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES trait_tags(tag_id),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    source_term TEXT NOT NULL,
    editorial_interpretation TEXT NOT NULL,
    source_anime_title TEXT,
    source_release_milestone TEXT,
    confidence TEXT NOT NULL DEFAULT 'low',
    review_status TEXT NOT NULL DEFAULT 'web-sourced',
    spoiler INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, tag_id, source_id, source_term)
  );

  CREATE TABLE IF NOT EXISTS character_images (
    id INTEGER PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    page_url TEXT NOT NULL,
    provider TEXT NOT NULL,
    license_short_name TEXT NOT NULL,
    license_url TEXT NOT NULL,
    attribution TEXT NOT NULL,
    license_verified INTEGER NOT NULL DEFAULT 0,
    identity_match_status TEXT NOT NULL DEFAULT 'candidate',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, page_url)
  );

  CREATE TABLE IF NOT EXISTS anime_series (
    series_id TEXT PRIMARY KEY,
    anilist_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    title_english TEXT,
    title_romaji TEXT,
    title_native TEXT,
    page_url TEXT,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    synced_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS genres (
    genre_id TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS series_genres (
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    genre_id TEXT NOT NULL REFERENCES genres(genre_id),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (series_id, genre_id, source_id)
  );

  CREATE TABLE IF NOT EXISTS character_series (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    role TEXT,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, series_id, source_id)
  );

  CREATE TABLE IF NOT EXISTS character_aliases (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    spoiler INTEGER NOT NULL DEFAULT 0,
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, alias, source_id)
  );

  CREATE TABLE IF NOT EXISTS character_external_ids (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    external_id TEXT NOT NULL,
    page_url TEXT,
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, source_id),
    UNIQUE (source_id, external_id)
  );

  CREATE TABLE IF NOT EXISTS series_external_ids (
    series_id TEXT NOT NULL REFERENCES anime_series(series_id) ON DELETE CASCADE,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    external_id TEXT NOT NULL,
    page_url TEXT,
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (series_id, source_id),
    UNIQUE (source_id, external_id)
  );

  CREATE TABLE IF NOT EXISTS context_genres (
    genre_id TEXT PRIMARY KEY,
    label TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS character_context_genres (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    genre_id TEXT NOT NULL REFERENCES context_genres(genre_id),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    confidence TEXT NOT NULL DEFAULT 'medium',
    review_status TEXT NOT NULL DEFAULT 'proposed',
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, genre_id, source_id)
  );

  CREATE TABLE IF NOT EXISTS archetypes (
    archetype_id TEXT PRIMARY KEY,
    label TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS character_archetypes (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    archetype_id TEXT NOT NULL REFERENCES archetypes(archetype_id),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    source_term TEXT NOT NULL DEFAULT '',
    confidence TEXT NOT NULL DEFAULT 'medium',
    review_status TEXT NOT NULL DEFAULT 'proposed',
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, archetype_id, source_id)
  );

  CREATE TABLE IF NOT EXISTS character_external_images (
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    image_url TEXT NOT NULL,
    page_url TEXT NOT NULL,
    storage_permission_status TEXT NOT NULL DEFAULT 'unconfirmed',
    reuse_permission_status TEXT NOT NULL DEFAULT 'unverified',
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, source_id)
  );

  CREATE TABLE IF NOT EXISTS crawl_jobs (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL,
    query TEXT NOT NULL,
    status TEXT NOT NULL,
    items_found INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_character_traits_tag_status ON character_traits(tag_id, review_status, character_id);
  CREATE INDEX IF NOT EXISTS idx_character_traits_character ON character_traits(character_id, review_status);
  CREATE INDEX IF NOT EXISTS idx_images_license ON character_images(license_verified, character_id);
  CREATE INDEX IF NOT EXISTS idx_character_series_series ON character_series(series_id, character_id);
  CREATE INDEX IF NOT EXISTS idx_series_genres_genre ON series_genres(genre_id, series_id);
  CREATE INDEX IF NOT EXISTS idx_context_genres_genre ON character_context_genres(genre_id, character_id);
  CREATE INDEX IF NOT EXISTS idx_character_archetypes_type ON character_archetypes(archetype_id, character_id);
`)

const characterImageColumns = db.pragma('table_info(character_images)')
if (!characterImageColumns.some((column) => column.name === 'identity_match_status')) {
  db.exec("ALTER TABLE character_images ADD COLUMN identity_match_status TEXT NOT NULL DEFAULT 'candidate'")
}
const characterColumns = db.pragma('table_info(characters)')
if (!characterColumns.some((column) => column.name === 'metadata_synced_at')) {
  db.exec('ALTER TABLE characters ADD COLUMN metadata_synced_at TEXT')
}
migrateLegacyTaxonomies(characterColumns)

export function seedDatabase() {
  const insertTag = db.prepare(`
    INSERT INTO trait_tags (tag_id, label, description, trait_type)
    VALUES (@tagId, @label, @description, @traitType)
    ON CONFLICT(tag_id) DO UPDATE SET
      label = excluded.label,
      description = excluded.description,
      trait_type = excluded.trait_type
  `)
  const insertCharacter = db.prepare(`
    INSERT INTO characters (
      id, name, series, source_url, latest_release, latest_release_url,
      latest_release_verified, trait_cutoff_aligned
    ) VALUES (
      @id, @name, @series, @sourceUrl, @latestRelease, @latestReleaseUrl,
      @latestReleaseVerified, @traitCutoffAligned
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      series = excluded.series,
      source_url = excluded.source_url,
      latest_release = excluded.latest_release,
      latest_release_url = excluded.latest_release_url,
      latest_release_verified = excluded.latest_release_verified,
      trait_cutoff_aligned = excluded.trait_cutoff_aligned,
      updated_at = CURRENT_TIMESTAMP
  `)
  const insertSource = db.prepare(`
    INSERT INTO sources (url, title, source_type)
    VALUES (@url, @title, @sourceType)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      source_type = excluded.source_type,
      checked_at = CURRENT_TIMESTAMP
  `)
  const getSourceId = db.prepare('SELECT id FROM sources WHERE url = ?')
  const insertAssertion = db.prepare(`
    INSERT INTO character_traits (
      character_id, tag_id, source_id, source_term, editorial_interpretation,
      source_anime_title, source_release_milestone, confidence, review_status, spoiler
    ) VALUES (
      @characterId, @tagId, @sourceId, @sourceTerm, @interpretation,
      @animeTitle, @releaseMilestone, @confidence, @reviewStatus, @spoiler
    )
    ON CONFLICT(character_id, tag_id, source_id, source_term) DO UPDATE SET
      editorial_interpretation = excluded.editorial_interpretation,
      source_anime_title = excluded.source_anime_title,
      source_release_milestone = excluded.source_release_milestone,
      confidence = excluded.confidence,
      review_status = CASE
        WHEN character_traits.review_status = 'approved' THEN 'approved'
        ELSE excluded.review_status
      END,
      spoiler = excluded.spoiler
  `)
  const insertReleaseSource = db.prepare(`
    INSERT INTO sources (url, title, source_type)
    VALUES (@url, @title, @sourceType)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      source_type = excluded.source_type,
      checked_at = CURRENT_TIMESTAMP
  `)

  const seed = db.transaction(() => {
    for (const [tagId, tag] of Object.entries(traitCatalog)) {
      insertTag.run({
        tagId,
        label: tag.label,
        description: tag.description ?? '',
        traitType: tag.type,
      })
    }

    for (const character of characterProfiles) {
      insertCharacter.run({
        id: character.id,
        name: character.name,
        series: character.series,
        sourceUrl: character.assertions[0]?.url ?? null,
        latestRelease: character.releaseMilestone,
        latestReleaseUrl: character.releaseSourceUrl,
        latestReleaseVerified: character.latestReleaseVerified ? 1 : 0,
        traitCutoffAligned: character.traitCutoffAligned ? 1 : 0,
      })

      for (const assertion of character.assertions) {
        insertSource.run({
          url: assertion.url,
          title: assertion.sourceTitle,
          sourceType: assertion.sourceType,
        })
        const sourceId = getSourceId.get(assertion.url).id
        insertAssertion.run({
          characterId: character.id,
          tagId: assertion.tagId,
          sourceId,
          sourceTerm: assertion.sourceTerm,
          interpretation: assertion.editorialInterpretation,
          animeTitle: assertion.animeTitle,
          releaseMilestone: assertion.releaseMilestone,
          confidence: assertion.confidence,
          reviewStatus: assertion.reviewStatus,
          spoiler: assertion.spoiler ? 1 : 0,
        })
      }

      if (character.releaseSourceUrl) {
        insertReleaseSource.run({
          url: character.releaseSourceUrl,
          title: `${character.name} - anime release cutoff`,
          sourceType: 'official-release-schedule',
        })
      }
    }
  })

  seed()
  seedEditorialMetadata()
  seedExternalIds()
}

export function getDatabasePath() {
  return databasePath
}

const upsertDiscoveredCharacter = db.prepare(`
  INSERT INTO characters (id, anilist_id, name, native_name, series, source_url)
  VALUES (@id, @anilistId, @name, @nativeName, @series, @sourceUrl)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    native_name = COALESCE(excluded.native_name, characters.native_name),
    source_url = COALESCE(excluded.source_url, characters.source_url),
    updated_at = CURRENT_TIMESTAMP
`)

const upsertCrawlerSource = db.prepare(`
  INSERT INTO sources (url, title, source_type)
  VALUES (@url, @title, @sourceType)
  ON CONFLICT(url) DO UPDATE SET
    title = excluded.title,
    source_type = excluded.source_type,
    checked_at = CURRENT_TIMESTAMP
`)

const findSourceId = db.prepare('SELECT id FROM sources WHERE url = ?')

const upsertCrawlerTrait = db.prepare(`
  INSERT INTO character_traits (
    character_id, tag_id, source_id, source_term, editorial_interpretation,
    source_anime_title, source_release_milestone, confidence, review_status, spoiler
  ) VALUES (
    @characterId, @tagId, @sourceId, @sourceTerm, @interpretation,
    @animeTitle, @releaseMilestone, @confidence, @reviewStatus, @spoiler
  )
  ON CONFLICT(character_id, tag_id, source_id, source_term) DO UPDATE SET
    editorial_interpretation = excluded.editorial_interpretation,
    confidence = excluded.confidence,
    review_status = CASE
      WHEN character_traits.review_status = 'approved' THEN 'approved'
      ELSE excluded.review_status
    END
`)

const insertLicensedImage = db.prepare(`
  INSERT INTO character_images (
    character_id, image_url, page_url, provider, license_short_name,
    license_url, attribution, license_verified, identity_match_status
  ) VALUES (
    @characterId, @imageUrl, @pageUrl, @provider, @licenseShortName,
    @licenseUrl, @attribution, 1, @identityMatchStatus
  )
  ON CONFLICT(character_id, page_url) DO UPDATE SET
    image_url = excluded.image_url,
    license_short_name = excluded.license_short_name,
    license_url = excluded.license_url,
    attribution = excluded.attribution,
    license_verified = 1,
    identity_match_status = excluded.identity_match_status
`)

export function saveDiscoveredCharacter(character) {
  const id = `anilist-${character.anilistId}`
  upsertDiscoveredCharacter.run({ ...character, id })
  return id
}

export function saveCrawlerTrait(assertion) {
  upsertCrawlerSource.run({
    url: assertion.sourceUrl,
    title: assertion.sourceTitle,
    sourceType: assertion.sourceType,
  })
  const sourceId = findSourceId.get(assertion.sourceUrl).id
  upsertCrawlerTrait.run({
    characterId: assertion.characterId,
    tagId: assertion.tagId,
    sourceId,
    sourceTerm: assertion.sourceTerm.slice(0, 120),
    interpretation: assertion.interpretation,
    animeTitle: assertion.animeTitle,
    releaseMilestone: assertion.releaseMilestone,
    confidence: assertion.confidence,
    reviewStatus: assertion.reviewStatus,
    spoiler: assertion.spoiler ? 1 : 0,
  })
}

export function saveLicensedImageCandidate(image) {
  insertLicensedImage.run(image)
}

export function recordCrawlJob(job) {
  const result = db.prepare(`
    INSERT INTO crawl_jobs (provider, query, status, items_found, message, finished_at)
    VALUES (@provider, @query, @status, @itemsFound, @message, CURRENT_TIMESTAMP)
  `).run(job)
  return result.lastInsertRowid
}

export function normalizeId(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function migrateLegacyTaxonomies(columns) {
  const columnNames = new Set(columns.map((column) => column.name))
  const legacyColumns = ['genre', 'genre_label', 'archetype', 'archetype_label']
  if (!legacyColumns.some((name) => columnNames.has(name))) return

  const sourceId = upsertSourceRecord({
    url: 'urn:homecomer:editorial-taxonomy:v1',
    title: 'Homecomer editorial context and archetype taxonomy',
    sourceType: 'editorial-taxonomy',
  })
  const rows = db.prepare(`
    SELECT id, genre, genre_label, archetype, archetype_label
    FROM characters
  `).all()
  const saveContextGenre = db.prepare(`
    INSERT INTO context_genres (genre_id, label) VALUES (?, ?)
    ON CONFLICT(genre_id) DO UPDATE SET label = excluded.label
  `)
  const saveCharacterGenre = db.prepare(`
    INSERT OR IGNORE INTO character_context_genres (character_id, genre_id, source_id)
    VALUES (?, ?, ?)
  `)
  const saveArchetype = db.prepare(`
    INSERT INTO archetypes (archetype_id, label) VALUES (?, ?)
    ON CONFLICT(archetype_id) DO UPDATE SET label = excluded.label
  `)
  const saveCharacterArchetype = db.prepare(`
    INSERT OR IGNORE INTO character_archetypes (character_id, archetype_id, source_id, source_term)
    VALUES (?, ?, ?, ?)
  `)

  const migrate = db.transaction(() => {
    for (const row of rows) {
      if (row.genre) {
        saveContextGenre.run(row.genre, row.genre_label || row.genre)
        saveCharacterGenre.run(row.id, row.genre, sourceId)
      }
      if (row.archetype) {
        saveArchetype.run(row.archetype, row.archetype_label || row.archetype)
        saveCharacterArchetype.run(row.id, row.archetype, sourceId, row.archetype_label || row.archetype)
      }
    }

    db.exec('DROP INDEX IF EXISTS idx_characters_genre')
    db.exec('DROP INDEX IF EXISTS idx_characters_archetype')
    for (const column of legacyColumns) {
      if (columnNames.has(column)) db.exec(`ALTER TABLE characters DROP COLUMN ${column}`)
    }
  })
  migrate()
}

export function upsertSourceRecord({ url, title, sourceType }) {
  db.prepare(`
    INSERT INTO sources (url, title, source_type)
    VALUES (@url, @title, @sourceType)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      source_type = excluded.source_type,
      checked_at = CURRENT_TIMESTAMP
  `).run({ url, title, sourceType })
  return db.prepare('SELECT id FROM sources WHERE url = ?').get(url).id
}

function seedEditorialMetadata() {
  const taxonomySourceId = upsertSourceRecord({
    url: 'urn:homecomer:editorial-taxonomy:v1',
    title: 'Homecomer editorial context and archetype taxonomy',
    sourceType: 'editorial-taxonomy',
  })
  const upsertContextGenre = db.prepare(`
    INSERT INTO context_genres (genre_id, label) VALUES (@id, @label)
    ON CONFLICT(genre_id) DO UPDATE SET label = excluded.label
  `)
  const upsertCharacterGenre = db.prepare(`
    INSERT INTO character_context_genres (character_id, genre_id, source_id, confidence, review_status)
    VALUES (@characterId, @genreId, @sourceId, 'medium', 'proposed')
    ON CONFLICT(character_id, genre_id, source_id) DO UPDATE SET fetched_at = CURRENT_TIMESTAMP
  `)
  const upsertArchetype = db.prepare(`
    INSERT INTO archetypes (archetype_id, label) VALUES (@id, @label)
    ON CONFLICT(archetype_id) DO UPDATE SET label = excluded.label
  `)
  const upsertCharacterArchetype = db.prepare(`
    INSERT INTO character_archetypes (
      character_id, archetype_id, source_id, source_term, confidence, review_status
    ) VALUES (@characterId, @archetypeId, @sourceId, @sourceTerm, 'medium', 'proposed')
    ON CONFLICT(character_id, archetype_id, source_id) DO UPDATE SET
      source_term = excluded.source_term,
      fetched_at = CURRENT_TIMESTAMP
  `)
  const upsertSeries = db.prepare(`
    INSERT INTO anime_series (series_id, title, source_id)
    VALUES (@seriesId, @title, @sourceId)
    ON CONFLICT(series_id) DO UPDATE SET title = excluded.title
  `)
  const upsertCharacterSeries = db.prepare(`
    INSERT INTO character_series (character_id, series_id, role, source_id)
    VALUES (@characterId, @seriesId, 'seed-candidate', @sourceId)
    ON CONFLICT(character_id, series_id, source_id) DO UPDATE SET fetched_at = CURRENT_TIMESTAMP
  `)

  const seedMetadata = db.transaction(() => {
    for (const character of characterProfiles) {
      const contextGenreId = character.genre ?? 'unknown'
      const contextGenreLabel = character.genreLabel ?? 'Chưa phân loại'
      upsertContextGenre.run({ id: contextGenreId, label: contextGenreLabel })
      upsertCharacterGenre.run({
        characterId: character.id,
        genreId: contextGenreId,
        sourceId: taxonomySourceId,
      })

      const archetypeId = character.archetype ?? 'unknown'
      const archetypeLabel = character.archetypeLabel ?? 'Chưa phân loại'
      upsertArchetype.run({ id: archetypeId, label: archetypeLabel })
      upsertCharacterArchetype.run({
        characterId: character.id,
        archetypeId,
        sourceId: taxonomySourceId,
        sourceTerm: archetypeLabel,
      })

      const seriesId = `seed-${normalizeId(character.series)}`
      upsertSeries.run({ seriesId, title: character.series, sourceId: taxonomySourceId })
      upsertCharacterSeries.run({
        characterId: character.id,
        seriesId,
        sourceId: taxonomySourceId,
      })
    }
  })
  seedMetadata()
}

function seedExternalIds() {
  const sourceId = upsertSourceRecord({
    url: 'https://anilist.co',
    title: 'AniList API',
    sourceType: 'anime-database-api',
  })
  db.prepare(`
    INSERT OR IGNORE INTO character_external_ids (character_id, source_id, external_id, page_url)
    SELECT id, ?, CAST(anilist_id AS TEXT), source_url
    FROM characters WHERE anilist_id IS NOT NULL
  `).run(sourceId)
}

export function getAniListMetadataStatus(characterId) {
  return db.prepare(`
    SELECT COALESCE((
        SELECT external_id FROM character_external_ids ei
        JOIN sources es ON es.id = ei.source_id
        WHERE ei.character_id = c.id AND es.url = 'https://anilist.co'
        LIMIT 1
      ), c.anilist_id) AS anilistId,
      c.metadata_synced_at AS syncedAt,
      i.image_url AS imageUrl, i.page_url AS pageUrl,
      i.storage_permission_status AS storagePermissionStatus,
      i.reuse_permission_status AS reusePermissionStatus,
      COALESCE((
        SELECT json_group_array(DISTINCT g.label)
        FROM character_series cs
        JOIN series_genres sg ON sg.series_id = cs.series_id
        JOIN genres g ON g.genre_id = sg.genre_id
        WHERE cs.character_id = c.id
      ), '[]') AS genresJson,
      (
        SELECT s.title FROM character_series cs
        JOIN anime_series s ON s.series_id = cs.series_id
        WHERE cs.character_id = c.id
        ORDER BY cs.fetched_at DESC LIMIT 1
      ) AS seriesTitle
    FROM characters c
    LEFT JOIN character_external_images i ON i.character_id = c.id
    LEFT JOIN sources s ON s.id = i.source_id AND s.source_type = 'anime-database-api'
    WHERE c.id = ?
    ORDER BY i.fetched_at DESC
    LIMIT 1
  `).get(characterId) ?? null
}

export function saveAniListCharacterMetadata(metadata) {
  const character = db.prepare('SELECT id FROM characters WHERE id = ?').get(metadata.characterId)
  if (!character) throw new Error('Character not found in SQLite.')

  const characterSourceId = upsertSourceRecord({
    url: metadata.character.pageUrl,
    title: `AniList character profile: ${metadata.character.name}`,
    sourceType: 'anime-database-api',
  })
  const seriesSourceId = upsertSourceRecord({
    url: metadata.series.pageUrl,
    title: `AniList anime: ${metadata.series.title}`,
    sourceType: 'anime-database-api',
  })
  const anilistSourceId = upsertSourceRecord({
    url: 'https://anilist.co',
    title: 'AniList API',
    sourceType: 'anime-database-api',
  })

  const relatedSeries = db.prepare(`
    SELECT series_id AS seriesId FROM anime_series
    WHERE anilist_id = ? OR lower(title) = lower(?)
    LIMIT 1
  `).get(metadata.series.id, metadata.series.title)
  const seriesId = relatedSeries?.seriesId ?? `anilist-${metadata.series.id}`

  const save = db.transaction(() => {
    db.prepare(`
      UPDATE characters
      SET anilist_id = @anilistId,
        native_name = COALESCE(@nativeName, native_name),
        source_url = COALESCE(@pageUrl, source_url),
        metadata_synced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @characterId
    `).run({
      anilistId: metadata.character.id,
      nativeName: metadata.character.nativeName,
      pageUrl: metadata.character.pageUrl,
      characterId: metadata.characterId,
    })

    db.prepare(`
      INSERT INTO character_external_ids (character_id, source_id, external_id, page_url)
      VALUES (@characterId, @sourceId, @externalId, @pageUrl)
      ON CONFLICT(character_id, source_id) DO UPDATE SET
        external_id = excluded.external_id,
        page_url = excluded.page_url,
        fetched_at = CURRENT_TIMESTAMP
    `).run({
      characterId: metadata.characterId,
      sourceId: anilistSourceId,
      externalId: String(metadata.character.id),
      pageUrl: metadata.character.pageUrl,
    })

    const saveAlias = db.prepare(`
      INSERT INTO character_aliases (character_id, alias, source_id, spoiler)
      VALUES (@characterId, @alias, @sourceId, 0)
      ON CONFLICT(character_id, alias, source_id) DO UPDATE SET fetched_at = CURRENT_TIMESTAMP
    `)
    db.prepare('DELETE FROM character_aliases WHERE character_id = ? AND source_id = ?')
      .run(metadata.characterId, characterSourceId)
    for (const alias of new Set(metadata.character.aliases ?? [])) {
      if (alias && alias !== metadata.character.name && alias !== metadata.character.nativeName) {
        saveAlias.run({ characterId: metadata.characterId, alias, sourceId: characterSourceId })
      }
    }

    db.prepare(`
      INSERT INTO anime_series (
        series_id, anilist_id, title, title_english, title_romaji, title_native,
        page_url, source_id, synced_at
      ) VALUES (
        @seriesId, @anilistId, @title, @titleEnglish, @titleRomaji, @titleNative,
        @pageUrl, @sourceId, CURRENT_TIMESTAMP
      )
      ON CONFLICT(series_id) DO UPDATE SET
        anilist_id = excluded.anilist_id,
        title = excluded.title,
        title_english = excluded.title_english,
        title_romaji = excluded.title_romaji,
        title_native = excluded.title_native,
        page_url = excluded.page_url,
        source_id = excluded.source_id,
        synced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `).run({
      seriesId,
      anilistId: metadata.series.id,
      title: metadata.series.title,
      titleEnglish: metadata.series.titleEnglish,
      titleRomaji: metadata.series.titleRomaji,
      titleNative: metadata.series.titleNative,
      pageUrl: metadata.series.pageUrl,
      sourceId: seriesSourceId,
    })

    db.prepare(`
      INSERT INTO series_external_ids (series_id, source_id, external_id, page_url)
      VALUES (@seriesId, @sourceId, @externalId, @pageUrl)
      ON CONFLICT(series_id, source_id) DO UPDATE SET
        external_id = excluded.external_id,
        page_url = excluded.page_url,
        fetched_at = CURRENT_TIMESTAMP
    `).run({
      seriesId,
      sourceId: anilistSourceId,
      externalId: String(metadata.series.id),
      pageUrl: metadata.series.pageUrl,
    })

    db.prepare(`
      INSERT INTO character_series (character_id, series_id, role, source_id)
      VALUES (@characterId, @seriesId, @role, @sourceId)
      ON CONFLICT(character_id, series_id, source_id) DO UPDATE SET
        role = excluded.role,
        fetched_at = CURRENT_TIMESTAMP
    `).run({
      characterId: metadata.characterId,
      seriesId,
      role: metadata.character.role,
      sourceId: characterSourceId,
    })

    const deleteGenres = db.prepare('DELETE FROM series_genres WHERE series_id = ? AND source_id = ?')
    deleteGenres.run(seriesId, anilistSourceId)
    const saveGenre = db.prepare('INSERT OR IGNORE INTO genres (genre_id, label) VALUES (?, ?)')
    const linkGenre = db.prepare(`
      INSERT OR IGNORE INTO series_genres (series_id, genre_id, source_id)
      VALUES (?, ?, ?)
    `)
    for (const label of new Set(metadata.series.genres ?? [])) {
      const genreId = normalizeId(label)
      if (!genreId) continue
      saveGenre.run(genreId, label)
      linkGenre.run(seriesId, genreId, anilistSourceId)
    }

    if (metadata.imageUrl) {
      db.prepare(`
        INSERT INTO character_external_images (
          character_id, source_id, image_url, page_url,
          storage_permission_status, reuse_permission_status
        ) VALUES (@characterId, @sourceId, @imageUrl, @pageUrl, 'confirmed', 'unverified')
        ON CONFLICT(character_id, source_id) DO UPDATE SET
          image_url = excluded.image_url,
          page_url = excluded.page_url,
          storage_permission_status = 'confirmed',
          reuse_permission_status = 'unverified',
          fetched_at = CURRENT_TIMESTAMP
      `).run({
        characterId: metadata.characterId,
        sourceId: characterSourceId,
        imageUrl: metadata.imageUrl,
        pageUrl: metadata.character.pageUrl,
      })
    }
  })
  save()

  return getAniListMetadataStatus(metadata.characterId)
}

export function getMetadataFilterOptions() {
  return {
    contextGenres: db.prepare(`
      SELECT genre_id AS id, label
      FROM context_genres
      WHERE EXISTS (
        SELECT 1 FROM character_context_genres cg WHERE cg.genre_id = context_genres.genre_id
      )
      ORDER BY label
    `).all(),
    archetypes: db.prepare(`
      SELECT archetype_id AS id, label
      FROM archetypes
      WHERE EXISTS (
        SELECT 1 FROM character_archetypes ca WHERE ca.archetype_id = archetypes.archetype_id
      )
      ORDER BY label
    `).all(),
  }
}

export function findCharactersForMetadataSync({ name = '', series = '', limit = 100000 } = {}) {
  const conditions = []
  const parameters = []
  const normalizedName = String(name).trim().toLocaleLowerCase('en')
  const normalizedSeries = String(series).trim().toLocaleLowerCase('en')

  if (normalizedName) {
    conditions.push(`(
      instr(lower(c.name), ?) > 0
      OR instr(lower(COALESCE(c.native_name, '')), ?) > 0
      OR EXISTS (
        SELECT 1 FROM character_aliases ca
        WHERE ca.character_id = c.id AND ca.spoiler = 0
          AND instr(lower(ca.alias), ?) > 0
      )
    )`)
    parameters.push(normalizedName, normalizedName, normalizedName)
  }
  if (normalizedSeries) {
    conditions.push(`(
      instr(lower(c.series), ?) > 0
      OR EXISTS (
        SELECT 1 FROM character_series cs
        JOIN anime_series s ON s.series_id = cs.series_id
        WHERE cs.character_id = c.id AND (
          instr(lower(s.title), ?) > 0
          OR instr(lower(COALESCE(s.title_english, '')), ?) > 0
          OR instr(lower(COALESCE(s.title_romaji, '')), ?) > 0
        )
      )
    )`)
    parameters.push(normalizedSeries, normalizedSeries, normalizedSeries, normalizedSeries)
  }
  const safeLimit = Math.max(1, Math.min(100000, Math.trunc(Number(limit) || 100000)))
  const where = conditions.length ? conditions.join(' AND ') : '1 = 1'
  return db.prepare(`
    SELECT c.id, c.anilist_id AS anilistId, c.name, c.series
    FROM characters c
    WHERE ${where}
    ORDER BY c.metadata_synced_at IS NOT NULL, c.name COLLATE NOCASE
    LIMIT ?
  `).all(...parameters, safeLimit)
}
