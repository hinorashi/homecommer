import express from 'express'
import process from 'node:process'
import { db, getDatabasePath, getMetadataFilterOptions, seedDatabase } from './db.js'
import { searchCharacterCatalog } from './catalog-service.js'
import { getMetadataSyncJob, startFullMetadataSync } from './admin-metadata-sync.js'
import { searchAniListCharacters, syncAniListCharacterMetadataBatch } from './integrations/anilist.js'
import { matchFromDatabase } from './match-service.js'

const app = express()
const port = Number(process.env.API_PORT || 3001)
const host = process.env.API_HOST || '127.0.0.1'
const adminAllowed = ['127.0.0.1', 'localhost', '::1'].includes(host) || process.env.ALLOW_REMOTE_ADMIN_SYNC === 'true'

app.disable('x-powered-by')
app.use(express.json({ limit: '128kb' }))

seedDatabase()

app.get('/api/health', (_request, response) => {
  const characterCount = db.prepare('SELECT COUNT(*) AS count FROM characters').get().count
  const traitCount = db.prepare('SELECT COUNT(*) AS count FROM character_traits').get().count
  const seriesCount = db.prepare('SELECT COUNT(*) AS count FROM anime_series').get().count
  const genreCount = db.prepare('SELECT COUNT(*) AS count FROM genres').get().count
  response.json({ status: 'ok', database: 'sqlite', databasePath: getDatabasePath(), characterCount, traitCount, seriesCount, genreCount })
})

app.post('/api/match', (request, response) => {
  const {
    userTraits,
    genreFilter = 'all',
    archetypeFilter = 'all',
    animeGenreFilter = 'all',
    searchText = '',
    includeProposed = true,
  } = request.body ?? {}
  if (!Array.isArray(userTraits) || userTraits.length > 100) {
    return response.status(400).json({ error: 'userTraits must be an array with at most 100 items.' })
  }
  if (typeof searchText !== 'string' || searchText.length > 100) {
    return response.status(400).json({ error: 'searchText must be a string with at most 100 characters.' })
  }

  try {
    const matches = matchFromDatabase({
      userTraits,
      genreFilter,
      archetypeFilter,
      animeGenreFilter,
      searchText,
      includeProposed,
    })
    return response.json({ matches, database: 'sqlite', preview: Boolean(includeProposed) })
  } catch (error) {
    return response.status(500).json({ error: `Matching failed: ${error.message}` })
  }
})

app.get('/api/anilist/characters/search', async (request, response) => {
  try {
    const results = await searchAniListCharacters(request.query.q)
    return response.json({ results })
  } catch (error) {
    return response.status(400).json({ error: error.message })
  }
})

app.post('/api/anilist/characters/sync', async (request, response) => {
  const characters = request.body?.characters
  if (!Array.isArray(characters) || characters.length > 3) {
    return response.status(400).json({ error: 'Provide at most 3 characters for on-demand metadata sync.' })
  }

  const results = await syncAniListCharacterMetadataBatch(characters)
  return response.json({ results, stored: true, provider: 'AniList' })
})

app.get('/api/metadata/filters', (_request, response) => {
  response.json(getMetadataFilterOptions())
})

app.get('/api/metadata/anime-genres', (_request, response) => {
  const genres = db.prepare(`
    SELECT g.genre_id AS id, g.label, COUNT(DISTINCT sg.series_id) AS seriesCount
    FROM genres g
    LEFT JOIN series_genres sg ON sg.genre_id = g.genre_id
    GROUP BY g.genre_id, g.label
    ORDER BY g.label
  `).all()
  response.json({ genres })
})

app.get('/api/catalog/characters', (request, response) => {
  const { q = '', contextGenre = 'all', archetype = 'all', animeGenre = 'all' } = request.query
  const limit = Number(request.query.limit ?? 24)
  const offset = Number(request.query.offset ?? 0)
  if (typeof q !== 'string' || q.length > 100) {
    return response.status(400).json({ error: 'q must be a string with at most 100 characters.' })
  }
  if (![contextGenre, archetype, animeGenre].every((value) => typeof value === 'string' && value.length <= 100)) {
    return response.status(400).json({ error: 'Filter values must be strings with at most 100 characters.' })
  }
  if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0) {
    return response.status(400).json({ error: 'limit must be positive and offset must not be negative.' })
  }

  try {

function requireLocalAdmin(request, response, next) {
  if (!adminAllowed) {
    return response.status(403).json({ error: 'Admin metadata sync is disabled for non-local API hosts.' })
  }
  return next()
}

app.get('/api/admin/metadata/sync', requireLocalAdmin, (_request, response) => {
  return response.json({ job: getMetadataSyncJob() })
})

app.post('/api/admin/metadata/sync-all', requireLocalAdmin, (request, response) => {
  const job = startFullMetadataSync({ force: Boolean(request.body?.force) })
  return response.status(job.status === 'running' ? 202 : 200).json({ job })
})

app.get('/api/admin/metadata/sync/:jobId', requireLocalAdmin, (request, response) => {
  const job = getMetadataSyncJob(request.params.jobId)
  if (!job) return response.status(404).json({ error: 'Metadata sync job not found.' })
  return response.json({ job })
})
    return response.json(searchCharacterCatalog({
      searchText: q,
      contextGenre,
      archetype,
      animeGenre,
      limit,
      offset,
    }))
  } catch (error) {
    return response.status(500).json({ error: `Catalog search failed: ${error.message}` })
  }
})

app.get('/api/admin/metadata/sync', (_request, response) => {
  if (!adminAllowed) return response.status(403).json({ error: 'Admin sync is disabled for non-local API hosts.' })
  return response.json({ job: getMetadataSyncJob() })
})

app.post('/api/admin/metadata/sync-all', (request, response) => {
  if (!adminAllowed) return response.status(403).json({ error: 'Admin sync is disabled for non-local API hosts.' })
  const job = startFullMetadataSync({ force: Boolean(request.body?.force) })
  return response.status(job.status === 'running' ? 202 : 200).json({ job })
})

app.get('/api/admin/metadata/sync/:jobId', (request, response) => {
  if (!adminAllowed) return response.status(403).json({ error: 'Admin sync is disabled for non-local API hosts.' })
  const job = getMetadataSyncJob(request.params.jobId)
  if (!job) return response.status(404).json({ error: 'Metadata sync job not found.' })
  return response.json({ job })
})

app.use((error, request, response, next) => {
  console.error(`${request.method} ${request.path}`, error)
  if (error.type === 'entity.too.large') return response.status(413).json({ error: 'Request body is too large.' })
  if (response.headersSent) return next(error)
  return response.status(500).json({ error: 'Unexpected API error.' })
})

const server = app.listen(port, host, () => {
  console.log(`Character API listening on http://${host}:${port}`)
  console.log(`SQLite database: ${getDatabasePath()}`)
})

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
