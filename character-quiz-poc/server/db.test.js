import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import test, { after } from 'node:test'

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'character-match-db-'))
process.env.SQLITE_PATH = resolve(temporaryDirectory, 'test.sqlite')

const { db, findCharactersForMetadataSync, getAniListMetadataStatus, getMetadataFilterOptions, saveAniListCharacterMetadata, seedDatabase } = await import('./db.js')
seedDatabase()
const { matchFromDatabase } = await import('./match-service.js')
const { searchCharacterCatalog } = await import('./catalog-service.js')

after(() => {
  db.close()
  rmSync(temporaryDirectory, { recursive: true, force: true })
})

test('seeds normalized context genre and archetype taxonomies', () => {
  const filters = getMetadataFilterOptions()
  const characterColumns = db.pragma('table_info(characters)').map(({ name }) => name)

  assert.ok(filters.contextGenres.some(({ id }) => id === 'action-fantasy'))
  assert.ok(filters.archetypes.some(({ id }) => id === 'strategist'))
  assert.equal(characterColumns.includes('genre'), false)
  assert.equal(characterColumns.includes('archetype'), false)
  assert.deepEqual(
    findCharactersForMetadataSync({ name: 'Kaguya', series: 'Love Is War' }).map(({ id }) => id),
    ['kaguya-shinomiya-ultra-romantic']
  )
  assert.equal(findCharactersForMetadataSync().length, 6)
  assert.equal(findCharactersForMetadataSync({ limit: 2 }).length, 2)
})

test('browses the full catalog without quiz traits and applies search, filters, and pagination', () => {
  const allCharacters = searchCharacterCatalog({ limit: 50 })
  assert.equal(allCharacters.total, 6)
  assert.equal(allCharacters.characters.length, 6)

  const searched = searchCharacterCatalog({ searchText: 'kaguya-sama: love is war' })
  assert.equal(searched.characters[0].id, 'kaguya-shinomiya-ultra-romantic')

  const filtered = searchCharacterCatalog({ contextGenre: 'psychological-school', archetype: 'strategist' })
  assert.deepEqual(filtered.characters.map(({ id }) => id), ['kaguya-shinomiya-ultra-romantic'])

  const page = searchCharacterCatalog({ limit: 2, offset: 2 })
  assert.equal(page.characters.length, 2)
  assert.equal(page.hasMore, true)
})

test('birthday catalog matches day/month, preserves pagination and excludes incomplete dates', () => {
  db.exec('SAVEPOINT birthday_test')
  try {
    const characters = searchCharacterCatalog({ limit: 50 }).characters
    db.prepare('UPDATE characters SET date_of_birth = NULL').run()
    const update = db.prepare('UPDATE characters SET date_of_birth = ? WHERE id = ?')
    update.run('??-10-09', characters[0].id)
    update.run('1990-10-09', characters[1].id)
    update.run('??-10-??', characters[2].id)
    update.run('??-??-09', characters[3].id)
    update.run('??-10-10', characters[4].id)
    update.run('??-02-29', characters[5].id)
    const result = searchCharacterCatalog({ birthday: 'today', birthdayDate: '2026-10-09', limit: 1 })
    assert.equal(result.total, 2)
    assert.equal(result.characters.length, 1)
    assert.equal(result.hasMore, true)
    assert.ok(result.characters[0].dateOfBirth.endsWith('10-09'))
    const next = searchCharacterCatalog({ birthday: 'today', birthdayDate: '2026-10-09', offset: 1, limit: 1 })
    assert.notEqual(result.characters[0].id, next.characters[0].id)
    assert.equal(next.hasMore, false)
    assert.equal(searchCharacterCatalog({ birthday: 'today', birthdayDate: '2024-02-29' }).total, 1)
    assert.equal(searchCharacterCatalog({ birthday: 'today', birthdayDate: '2026-10-11' }).total, 0)
    assert.equal(searchCharacterCatalog({ birthday: 'all' }).total, characters.length)
    assert.equal(searchCharacterCatalog({ birthday: 'today', birthdayDate: '2026-10-09', searchText: characters[0].name }).total, 1)
  } finally {
    db.exec('ROLLBACK TO birthday_test; RELEASE birthday_test')
  }
})

test('persists AniList series genres, aliases, image source, and sync idempotently', () => {
  const characterId = 'kaguya-shinomiya-ultra-romantic'
  const userTraits = [{ tagId: 'plans-alternatives', count: 1 }]
  const beforeSync = matchFromDatabase({ userTraits })
    .find(({ character }) => character.id === characterId)
  const metadata = {
    characterId,
    character: {
      id: 120649,
      name: 'Kaguya Shinomiya',
      nativeName: '四宮かぐや',
      aliases: ['Princess'],
      pageUrl: 'https://anilist.co/character/120649',
      role: 'MAIN',
    },
    series: {
      id: 125367,
      title: 'Kaguya-sama: Love Is War -Ultra Romantic-',
      titleEnglish: 'Kaguya-sama: Love Is War -Ultra Romantic-',
      titleRomaji: 'Kaguya-sama wa Kokurasetai: Ultra Romantic',
      titleNative: 'かぐや様は告らせたい-ウルトラロマンティック-',
      pageUrl: 'https://anilist.co/anime/125367',
      genres: ['Comedy', 'Psychological', 'Romance'],
    },
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b120649-test.png',
  }

  saveAniListCharacterMetadata(metadata)
  saveAniListCharacterMetadata(metadata)

  assert.equal(db.prepare('SELECT anilist_id FROM characters WHERE id = ?').get(characterId).anilist_id, 120649)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM character_series WHERE character_id = ?').get(characterId).count, 2)
  assert.equal(db.prepare(`
    SELECT COUNT(*) AS count FROM series_genres sg
    JOIN anime_series s ON s.series_id = sg.series_id
    WHERE s.anilist_id = 125367
  `).get().count, 3)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM character_aliases WHERE character_id = ?').get(characterId).count, 1)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM character_external_images WHERE character_id = ?').get(characterId).count, 1)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM character_external_ids WHERE character_id = ?').get(characterId).count, 1)
  assert.equal(db.prepare(`
    SELECT COUNT(*) AS count FROM series_external_ids e
    JOIN anime_series s ON s.series_id = e.series_id
    WHERE s.anilist_id = 125367
  `).get().count, 1)
  assert.equal(getAniListMetadataStatus(characterId).storagePermissionStatus, 'confirmed')
  assert.equal(getAniListMetadataStatus(characterId).reusePermissionStatus, 'unverified')

  const afterSync = matchFromDatabase({ userTraits })
  const syncedKaguya = afterSync.find(({ character }) => character.id === characterId)
  assert.deepEqual(syncedKaguya.character.animeGenres, ['Comedy', 'Psychological', 'Romance'])
  assert.equal(syncedKaguya.character.image.provider, 'AniList')
  assert.equal(syncedKaguya.character.image.reusePermissionStatus, 'unverified')
  assert.equal(syncedKaguya.weightedScore, beforeSync.weightedScore)

  const filtered = matchFromDatabase({
    userTraits,
    genreFilter: 'psychological-school',
    archetypeFilter: 'strategist',
  })
  assert.ok(filtered.some(({ character }) => character.id === characterId))
  assert.ok(filtered.every(({ character }) => character.contextGenres.some(({ id }) => id === 'psychological-school')))

  assert.ok(matchFromDatabase({ userTraits, searchText: 'kaguya-sama: love is war' })
    .some(({ character }) => character.id === characterId))
  assert.ok(matchFromDatabase({ userTraits, searchText: 'princess' })
    .some(({ character }) => character.id === characterId))
  assert.deepEqual(
    matchFromDatabase({ userTraits, animeGenreFilter: 'psychological' })
      .map(({ character }) => character.id),
    [characterId]
  )
  assert.deepEqual(matchFromDatabase({ userTraits, searchText: 'not in catalog' }), [])
})