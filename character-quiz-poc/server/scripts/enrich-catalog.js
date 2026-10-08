import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import readline from 'node:readline'
import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'
import { db, recordCrawlJob, seedDatabase } from '../db.js'
import { listMappedImdbIds, rebuildDerivedTraits, saveImdbMapping, saveImdbRatings } from '../crawl-store.js'

const MAPPING_URL = 'https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-full.json'
const RATINGS_URL = 'https://datasets.imdbws.com/title.ratings.tsv.gz'

function printUsage() {
  console.log(`Usage: node server/scripts/enrich-catalog.js <command> [options]

Commands:
  imdb     Map anime to IMDb via Fribb/anime-lists (AniList id, fallback MAL id), then load
           ratings from the IMDb non-commercial dataset title.ratings.tsv.gz.
  traits   Rebuild heuristic character traits from stored AniList descriptions (offline).

IMDb options:
  --mapping-file <path>   Use a local anime-list-full.json instead of downloading it.
  --ratings-file <path>   Use a local title.ratings.tsv(.gz) instead of downloading it.

IMDb data is for personal and non-commercial use only: https://developer.imdb.com/non-commercial-datasets/`)
}

function parseArguments(argv) {
  const [command, ...rest] = argv
  const options = { command, mappingFile: '', ratingsFile: '' }
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (argument === '--mapping-file') options.mappingFile = rest[++index] ?? ''
    else if (argument === '--ratings-file') options.ratingsFile = rest[++index] ?? ''
    else throw new Error(`Unknown option: ${argument}`)
  }
  return options
}

async function loadMapping(file) {
  if (file) return JSON.parse(await readFile(file, 'utf8'))
  console.log(`Downloading ${MAPPING_URL}...`)
  const response = await fetch(MAPPING_URL)
  if (!response.ok) throw new Error(`Mapping download failed: HTTP ${response.status}`)
  return response.json()
}

async function openRatingsStream(file) {
  if (file) {
    const stream = createReadStream(file)
    return file.endsWith('.gz') ? stream.pipe(createGunzip()) : stream
  }
  console.log(`Downloading ${RATINGS_URL}...`)
  const response = await fetch(RATINGS_URL)
  if (!response.ok || !response.body) throw new Error(`Ratings download failed: HTTP ${response.status}`)
  return Readable.fromWeb(response.body).pipe(createGunzip())
}

async function readImdbRatings(stream, wantedIds) {
  const ratings = new Map()
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity })
  for await (const line of lines) {
    const tab = line.indexOf('\t')
    const id = line.slice(0, tab)
    if (!wantedIds.has(id)) continue
    const [, rating, votes] = line.split('\t')
    const value = Number(rating)
    if (Number.isFinite(value)) ratings.set(id, { rating: value, votes: Number(votes) || 0 })
  }
  return ratings
}

async function syncImdb(options) {
  const mapping = await loadMapping(options.mappingFile)
  const mapped = saveImdbMapping(Array.isArray(mapping) ? mapping : [])
  console.log(`Mapped ${mapped.mapped}/${mapped.series} anime to an IMDb title.`)
  const wanted = listMappedImdbIds()
  const ratings = await readImdbRatings(await openRatingsStream(options.ratingsFile), wanted)
  const saved = saveImdbRatings(ratings)
  console.log(`Loaded ratings for ${ratings.size}/${wanted.size} IMDb titles; ${saved.rated} anime now have an IMDb rating.`)
  recordCrawlJob({ provider: 'imdb', query: 'imdb:fribb-mapping+ratings', status: 'completed', itemsFound: saved.rated, message: null })
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options.command || options.command === 'help') {
    printUsage()
    return
  }
  seedDatabase()
  if (options.command === 'imdb') await syncImdb(options)
  else if (options.command === 'traits') {
    const result = rebuildDerivedTraits()
    console.log(`Derived ${result.links} trait links from ${result.characters} character descriptions.`)
  } else throw new Error(`Unknown command: ${options.command}`)
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  db.close()
  if (process.connected) process.disconnect()
}
