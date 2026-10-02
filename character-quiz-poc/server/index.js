import express from 'express'
import process from 'node:process'
import { db, getDatabasePath, getMetadataFilterOptions, seedDatabase } from './db.js'
import { searchAniListCharacters, syncAniListCharacterMetadataBatch } from './integrations/anilist.js'
import { matchFromDatabase } from './match-service.js'

const app = express()
const port = Number(process.env.API_PORT || 3001)
const host = process.env.API_HOST || '127.0.0.1'

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
  const { userTraits, genreFilter = 'all', archetypeFilter = 'all', includeProposed = true } = request.body ?? {}
  if (!Array.isArray(userTraits) || userTraits.length > 100) {
    return response.status(400).json({ error: 'userTraits must be an array with at most 100 items.' })
  }

  try {
    const matches = matchFromDatabase({ userTraits, genreFilter, archetypeFilter, includeProposed })
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
