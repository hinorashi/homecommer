import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { buildCrawlArguments, listCrawlCommands } from './admin-crawl-runner.js'

test('lists whitelisted crawl commands with option schema', () => {
  const ids = listCrawlCommands().map((command) => command.id)
  assert.deepEqual(ids, ['stats', 'genres', 'anime', 'characters', 'details', 'anime-relations', 'all', 'imdb', 'traits'])
  const anime = listCrawlCommands().find((command) => command.id === 'anime')
  assert.ok(anime.options.every((option) => option.flag === undefined))
})

test('builds argv for allowed options only', () => {
  const { args } = buildCrawlArguments('anime', { genre: ['Action', 'Slice of Life'], pages: 3, popular: false, limit: 9, force: true })
  assert.equal(path.basename(args[0]), 'crawl-anilist.js')
  assert.deepEqual(args.slice(1), ['anime', '--genre', 'Action', '--genre', 'Slice of Life', '--pages', '3'])

  const characters = buildCrawlArguments('characters', { animeGenre: ['Drama'], limit: '20', maxPages: 0, force: true })
  assert.deepEqual(characters.args.slice(1), ['characters', '--genre', 'Drama', '--limit', '20', '--max-pages', '0', '--force'])

  assert.equal(path.basename(buildCrawlArguments('traits').args[0]), 'enrich-catalog.js')
})

test('rejects unknown commands and invalid values', () => {
  assert.throws(() => buildCrawlArguments('rm -rf'), /không hợp lệ/)
  assert.throws(() => buildCrawlArguments('anime', { pages: 9999 }), /pages/)
  assert.throws(() => buildCrawlArguments('anime', { pages: 1.5 }), /pages/)
  assert.throws(() => buildCrawlArguments('anime', { genre: ['--force'] }), /Thể loại/)
  assert.throws(() => buildCrawlArguments('characters', { animeGenre: ['Action', 'Drama'] }), /một thể loại/)
})
