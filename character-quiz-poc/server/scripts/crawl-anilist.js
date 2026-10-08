import process from 'node:process'
import { db, recordCrawlJob, seedDatabase } from '../db.js'
import {
  findAnimeForCharacterCrawl,
  findAnimeForRelationCrawl,
  findCharactersForDetailCrawl,
  getCrawlStats,
  listGenreLabels,
  saveAnimeCharacters,
  saveAnimeList,
  saveAnimeRelations,
  saveCharacterDetails,
  saveGenres,
} from '../crawl-store.js'
import {
  fetchAnimeCharactersBatch,
  fetchAnimeCharactersPage,
  fetchAnimeRelationsBatch,
  fetchCharacterDetailsBatch,
  fetchGenreCollection,
  fetchPopularAnimePage,
} from '../integrations/anilist-graphql.js'

const EXCLUDED_GENRES = new Set(['Hentai'])
let stopRequested = false

function printUsage() {
  console.log(`Usage: node server/scripts/crawl-anilist.js <command> [options]

Commands:
  genres        Sync the AniList genre collection into SQLite.
  anime         Crawl popular anime (POPULARITY_DESC) per genre into SQLite.
  characters    Crawl characters for anime already in SQLite, most popular anime first.
  details       Crawl character descriptions + bio and parse relation links (most favourited first).
  anime-relations  Crawl anime relations, tags and MAL id (prequel, sequel, spin-off, adaptation...).
  all           Run genres -> anime -> characters.
  stats         Print database counts.

Details options:
  --limit <n>        Max characters this run (default: all pending).
  --genre <name>     Only characters from anime with this genre.
  --force            Re-crawl characters that already have details.

Anime options:
  --genre <name>     Only this genre (repeatable). Default: every stored genre except Hentai.
  --popular          Crawl the overall popularity ranking instead of per-genre lists.
  --pages <n>        Pages of 50 anime per genre/list (default 2).

Character options:
  --limit <n>        Max anime to process this run (default: all pending).
  --genre <name>     Only anime with this genre.
  --max-pages <n>    Pages of 25 characters per anime; 0 = all (default 1, main roles first).
  --batch <n>        Anime per AniList request for the first page (default 25, max 50).
  --force            Re-crawl anime whose characters were already crawled.

Examples:
  npm run crawl:genres
  npm run crawl:anime -- --pages 4
  npm run crawl:anime -- --genre Romance --pages 10
  npm run crawl:characters -- --limit 500 --max-pages 2
  npm run crawl:all`)
}

function parseInteger(value, name, min, max) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`)
  }
  return number
}

function parseArguments(argv) {
  const [command, ...rest] = argv
  const options = { command, genres: [], popular: false, pages: 2, limit: 100000, maxPages: 1, batch: 25, force: false }
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]
    if (argument === '--genre') options.genres.push(rest[++index] ?? '')
    else if (argument === '--popular') options.popular = true
    else if (argument === '--pages') options.pages = parseInteger(rest[++index], '--pages', 1, 500)
    else if (argument === '--limit') options.limit = parseInteger(rest[++index], '--limit', 1, 100000)
    else if (argument === '--max-pages') options.maxPages = parseInteger(rest[++index], '--max-pages', 0, 1000)
    else if (argument === '--batch') options.batch = parseInteger(rest[++index], '--batch', 1, 50)
    else if (argument === '--force') options.force = true
    else if (argument === '--help' || argument === '-h') options.command = 'help'
    else throw new Error(`Unknown option: ${argument}`)
  }
  return options
}

async function crawlGenres() {
  const labels = await fetchGenreCollection()
  const count = saveGenres(labels)
  console.log(`Synced ${count} genres: ${labels.join(', ')}`)
  recordCrawlJob({ provider: 'anilist', query: 'genres', status: 'completed', itemsFound: count, message: null })
}

async function crawlAnime(options) {
  let lists
  if (options.popular) lists = [null]
  else if (options.genres.length) lists = options.genres
  else {
    lists = listGenreLabels().filter((label) => !EXCLUDED_GENRES.has(label))
    if (!lists.length) throw new Error('No genres in SQLite. Run "npm run crawl:genres" first.')
  }

  let total = 0
  for (const genre of lists) {
    const label = genre ?? 'overall popularity'
    for (let page = 1; page <= options.pages && !stopRequested; page += 1) {
      const { media, hasNextPage } = await fetchPopularAnimePage({ page, genre })
      const { created } = saveAnimeList(media)
      total += media.length
      console.log(`[anime] ${label} page ${page}/${options.pages}: ${media.length} anime (${created} new)`)
      if (!hasNextPage) break
    }
    if (stopRequested) break
  }
  recordCrawlJob({
    provider: 'anilist',
    query: `anime:${options.popular ? 'popular' : lists.join(',')}:pages=${options.pages}`,
    status: stopRequested ? 'interrupted' : 'completed',
    itemsFound: total,
    message: null,
  })
}

async function crawlCharacters(options) {
  const genre = options.genres[0] ?? ''
  const anime = findAnimeForCharacterCrawl({ limit: options.limit, force: options.force, genre })
  if (!anime.length) {
    console.log('No pending anime. Run "npm run crawl:anime" first, or use --force to re-crawl.')
    return
  }
  console.log(`Crawling characters for ${anime.length} anime (most popular first)...`)

  let processed = 0
  let totalCreated = 0
  let failures = 0
  for (let start = 0; start < anime.length && !stopRequested; start += options.batch) {
    const batch = anime.slice(start, start + options.batch)
    let results
    try {
      results = await fetchAnimeCharactersBatch(batch.map((item) => item.anilistId))
    } catch (error) {
      failures += batch.length
      console.error(`  Batch failed (${error.message}); skipping ${batch.length} anime.`)
      continue
    }
    const byId = new Map(results.map((result) => [result.animeId, result]))

    for (const item of batch) {
      if (stopRequested) break
      const result = byId.get(item.anilistId) ?? { edges: [], hasNextPage: false }
      let edges = result.edges
      let hasNextPage = result.hasNextPage
      let page = 1
      let created = saveAnimeCharacters(item, edges, { complete: false }).created

      try {
        while (hasNextPage && (options.maxPages === 0 || page < options.maxPages) && !stopRequested) {
          page += 1
          const next = await fetchAnimeCharactersPage(item.anilistId, page)
          created += saveAnimeCharacters(item, next.edges, { complete: false }).created
          edges = edges.concat(next.edges)
          hasNextPage = next.hasNextPage
        }
        if (!stopRequested) saveAnimeCharacters(item, [], { complete: true })
      } catch (error) {
        failures += 1
        console.error(`  ${item.title}: page ${page} failed (${error.message})`)
      }

      processed += 1
      totalCreated += created
      console.log(`[${processed}/${anime.length}] ${item.title}: ${edges.length} characters (${created} new)`)
    }
  }

  const stats = getCrawlStats()
  console.log(`Finished: ${processed} anime processed, ${totalCreated} new characters, ${failures} failures. Total characters: ${stats.characters}`)
  recordCrawlJob({
    provider: 'anilist',
    query: `characters:limit=${options.limit}:maxPages=${options.maxPages}${genre ? `:genre=${genre}` : ''}`,
    status: stopRequested ? 'interrupted' : 'completed',
    itemsFound: totalCreated,
    message: failures ? `${failures} failures` : null,
  })
}

async function crawlCharacterDetails(options) {
  const genre = options.genres[0] ?? ''
  const characters = findCharactersForDetailCrawl({ limit: options.limit, force: options.force, genre })
  if (!characters.length) {
    console.log('No pending characters. Use --force to re-crawl descriptions.')
    return
  }
  const batchSize = Math.max(options.batch, 50)
  console.log(`Crawling descriptions/relations for ${characters.length} characters (most favourited first, ${batchSize}/request)...`)

  let processed = 0
  let relations = 0
  let failures = 0
  for (let start = 0; start < characters.length && !stopRequested; start += batchSize) {
    const batch = characters.slice(start, start + batchSize)
    try {
      const nodes = await fetchCharacterDetailsBatch(batch.map((item) => item.anilistId))
      const result = saveCharacterDetails(nodes)
      processed += result.saved
      relations += result.relations
      console.log(`[details] ${Math.min(start + batchSize, characters.length)}/${characters.length}: ${result.saved} saved, ${result.relations} relations`)
    } catch (error) {
      failures += batch.length
      console.error(`  Batch failed (${error.message}); skipping ${batch.length} characters.`)
    }
  }
  console.log(`Finished: ${processed} characters, ${relations} relation links, ${failures} failures.`)
  recordCrawlJob({
    provider: 'anilist',
    query: `character-details:limit=${options.limit}${genre ? `:genre=${genre}` : ''}`,
    status: stopRequested ? 'interrupted' : 'completed',
    itemsFound: processed,
    message: failures ? `${failures} failures` : null,
  })
}

async function crawlAnimeRelations(options) {
  const anime = findAnimeForRelationCrawl({ limit: options.limit, force: options.force })
  if (!anime.length) {
    console.log('No pending anime. Use --force to re-crawl relations.')
    return
  }
  console.log(`Crawling relations (prequel/sequel/spin-off...) for ${anime.length} anime...`)
  let processed = 0
  let relations = 0
  let failures = 0
  for (let start = 0; start < anime.length && !stopRequested; start += 50) {
    const batch = anime.slice(start, start + 50)
    try {
      const result = saveAnimeRelations(await fetchAnimeRelationsBatch(batch.map((item) => item.anilistId)))
      processed += result.saved
      relations += result.relations
      console.log(`[relations] ${Math.min(start + 50, anime.length)}/${anime.length}: ${result.relations} links`)
    } catch (error) {
      failures += batch.length
      console.error(`  Batch failed (${error.message}); skipping ${batch.length} anime.`)
    }
  }
  console.log(`Finished: ${processed} anime, ${relations} relations, ${failures} failures.`)
  recordCrawlJob({
    provider: 'anilist',
    query: `anime-relations:limit=${options.limit}`,
    status: stopRequested ? 'interrupted' : 'completed',
    itemsFound: relations,
    message: failures ? `${failures} failures` : null,
  })
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options.command || options.command === 'help') {
    printUsage()
    return
  }

  seedDatabase()
  process.on('SIGINT', () => {
    if (stopRequested) process.exit(130)
    stopRequested = true
    console.log('\nStopping after the current request (press Ctrl+C again to force)...')
  })

  if (options.command === 'genres') await crawlGenres()
  else if (options.command === 'anime') await crawlAnime(options)
  else if (options.command === 'characters') await crawlCharacters(options)
  else if (options.command === 'details') await crawlCharacterDetails(options)
  else if (options.command === 'anime-relations') await crawlAnimeRelations(options)
  else if (options.command === 'all') {
    await crawlGenres()
    if (!stopRequested) await crawlAnime(options)
    if (!stopRequested) await crawlCharacters(options)
  } else if (options.command !== 'stats') throw new Error(`Unknown command: ${options.command}`)

  console.log('Database:', getCrawlStats())
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  db.close()
}
