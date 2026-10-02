import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import test, { after } from 'node:test'

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'character-match-db-'))
process.env.SQLITE_PATH = resolve(temporaryDirectory, 'test.sqlite')

const { db, getAniListMetadataStatus, getMetadataFilterOptions, saveAniListCharacterMetadata, seedDatabase } = await import('./db.js')
seedDatabase()
const { matchFromDatabase } = await import('./match-service.js')

after(() => {
  db.close()
  rmSync(temporaryDirectory, { recursive: true, force: true })
})

test('seeds normalized context genre and archetype taxonomies', () => {
  const filters = getMetadataFilterOptions()

  assert.ok(filters.contextGenres.some(({ id }) => id === 'action-fantasy'))
  assert.ok(filters.archetypes.some(({ id }) => id === 'strategist'))
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
})