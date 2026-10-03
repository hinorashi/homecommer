import process from 'node:process'
import { findCharactersForMetadataSync, seedDatabase, db } from '../db.js'
import { syncAniListCharacterMetadataBatch } from '../integrations/anilist.js'

function parseArguments(argumentsList) {
  const options = { name: '', series: '', limit: 100000, force: false }

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--name') options.name = argumentsList[++index] ?? ''
    else if (argument === '--series') options.series = argumentsList[++index] ?? ''
    else if (argument === '--limit') options.limit = Number(argumentsList[++index])
    else if (argument === '--force') options.force = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else throw new Error(`Unknown option: ${argument}`)
  }

  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100000) {
    throw new Error('--limit must be an integer from 1 to 100000.')
  }
  return options
}

function printUsage() {
  console.log(`Usage:
  npm run metadata:sync -- --name "Kaguya Shinomiya"
  npm run metadata:sync -- --series "Steins;Gate"
  npm run metadata:sync
  npm run metadata:sync -- --force

Without --name/--series, syncs every character currently stored in SQLite.
--limit narrows the run; --force refreshes metadata even when it is cached.`)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    printUsage()
    return
  }

  seedDatabase()
  const characters = findCharactersForMetadataSync(options)
  if (characters.length === 0) {
    throw new Error('No matching SQLite character profiles found.')
  }

  console.log(`Syncing ${characters.length} character(s) from AniList...`)
  let completed = 0
  let failures = 0
  for (const character of characters) {
    const [result] = await syncAniListCharacterMetadataBatch([character], { force: options.force })
    completed += 1
    if (!result?.stored) failures += 1
    const state = result?.status ?? 'failed'
    const detail = result?.metadata?.genres?.join(', ') || result?.reason || result?.error || 'no AniList genres'
    console.log(`[${completed}/${characters.length}] ${character.name} (${character.series}): ${state}; ${detail}`)
  }
  console.log(`Finished: ${completed} processed; ${failures} unmatched or failed.`)
}

try {
  await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  db.close()
}