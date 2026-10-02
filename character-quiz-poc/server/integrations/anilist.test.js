import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesAniListSeries, selectExactAnimeSeries, selectExactCharacter } from './anilist.js'

test('selects the exact AniList character instead of a partial-name result', () => {
  const results = [
    { id: 9001, name: { english: 'Riko Made in Abyss' } },
    { id: 122443, name: { english: 'Riko' } },
  ]

  assert.equal(selectExactCharacter(results, 'riko').id, 122443)
})

test('does not choose a near-match when AniList has no exact character name', () => {
  const results = [{ id: 9001, name: { english: 'Riko Made in Abyss' } }]

  assert.equal(selectExactCharacter(results, 'Riko'), null)
})

test('requires the AniList profile to include the expected series', () => {
  const media = [
    { type: 'ANIME', title: { english: 'Love Live! Sunshine!!', romaji: 'Love Live! Sunshine!!' } },
    { type: 'MANGA', title: { english: 'Made in Abyss' } },
  ]

  assert.equal(matchesAniListSeries(media, 'Love Live! Sunshine!!'), true)
  assert.equal(matchesAniListSeries(media, 'Made in Abyss'), false)
  assert.equal(selectExactAnimeSeries(media, 'Made in Abyss'), null)
})