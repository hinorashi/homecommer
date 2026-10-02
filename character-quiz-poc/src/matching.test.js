import assert from 'node:assert/strict'
import test from 'node:test'
import { characterProfiles } from './characterProfiles.js'
import { matchCharacters } from './matching.js'

test('matches one shared proposed behavior trait in preview mode and keeps its source', () => {
  const userTraits = [{ tagId: 'acts-under-uncertainty', label: 'Hành động khi chưa chắc chắn', count: 1 }]
  const matches = matchCharacters(userTraits, characterProfiles, { includeProposed: true })

  assert.equal(matches[0].character.name, 'Edward Elric')
  assert.equal(matches[0].sharedTraits[0].url, 'https://www.hagaren-movie.net/character/')
  assert.equal(matches[0].sharedTraits[0].releaseMilestone, 'Feature film (2011)')
  assert.equal(matches[0].sharedTraits[0].reviewStatus, 'proposed')
})

test('does not match unreviewed traits outside explicit preview mode', () => {
  const userTraits = [{ tagId: 'communicates-directly' }]

  assert.deepEqual(matchCharacters(userTraits, characterProfiles), [])
})

test('does not infer a negative match from an absent trait', () => {
  const userTraits = [{ tagId: 'offers-peer-support' }]

  assert.deepEqual(matchCharacters(userTraits, characterProfiles, { includeProposed: true }), [])
})

test('matches planning tags to the official Kaguya profile', () => {
  const userTraits = [{ tagId: 'plans-alternatives' }]
  const matches = matchCharacters(userTraits, characterProfiles, { includeProposed: true })

  assert.equal(matches[0].character.name, 'Kaguya Shinomiya')
  assert.equal(matches[0].sharedTraits[0].sourceType, 'official-anime-character-profile')
})

test('preserves the trait source milestone separately from the latest anime cutoff', () => {
  const kaguya = characterProfiles.find((character) => character.name === 'Kaguya Shinomiya')
  const assertion = kaguya.assertions[0]

  assert.equal(assertion.releaseMilestone, 'TV anime season 3 (2022)')
  assert.match(kaguya.releaseMilestone, /Otona e no Kaidan/)
  assert.equal(kaguya.latestReleaseVerified, true)
  assert.equal(kaguya.traitCutoffAligned, false)
})

test('provides user personality evaluation summary and descriptions', () => {
  const userTraits = [
    { tagId: 'communicates-directly', label: 'Trao đổi thẳng thắn', description: 'Thẳng thắn vào vấn đề.', count: 3 },
    { tagId: 'acts-under-uncertainty', label: 'Hành động khi chưa chắc chắn', description: 'Dám hành động.', count: 1 },
  ]
  const matches = matchCharacters(userTraits, characterProfiles, { includeProposed: true })

  assert.ok(matches.length > 0)
  assert.ok(matches[0].character.imageUrl)
  assert.ok(matches[0].allTraits.length >= matches[0].sharedTraits.length)
  assert.equal(matches[0].allTraits.some((t) => t.isShared), true)
})

test('applies IDF weighting and assigns diversity archetype slots', () => {
  const userTraits = [
    { tagId: 'communicates-directly', label: 'Trao đổi thẳng thắn', count: 2 },
    { tagId: 'plans-alternatives', label: 'Chuẩn bị nhiều phương án', count: 1 },
    { tagId: 'leads-group', label: 'Dẫn dắt nhóm', count: 1 },
  ]

  const matches = matchCharacters(userTraits, characterProfiles, { includeProposed: true })
  assert.ok(matches.length >= 2)
  assert.equal(matches[0].slot.type, 'best')
  assert.ok(matches[0].weightedScore > 0)

  // Verify diversity slots exist
  const slotTypes = matches.map((m) => m.slot.type)
  assert.ok(slotTypes.includes('best'))
})

test('a rare shared behavior trait can outrank a common shared trait', () => {
  const userTraits = [
    { tagId: 'communicates-directly', label: 'Trao đổi thẳng thắn', count: 1 },
    { tagId: 'plans-confrontational-action', label: 'Lập kế hoạch đối đầu', count: 1 },
  ]

  const matches = matchCharacters(userTraits, characterProfiles, { includeProposed: true })
  assert.equal(matches[0].character.name, 'Shinsuke Takasugi')
  assert.ok(matches[0].sharedTraits[0].idf > matches.find((match) => match.character.name === 'Kaguya Shinomiya').sharedTraits[0].idf)
})

test('filters matching characters by genre and archetype', () => {
  const userTraits = [
    { tagId: 'communicates-directly', label: 'Trao đổi thẳng thắn', count: 1 },
    { tagId: 'plans-alternatives', label: 'Chuẩn bị nhiều phương án', count: 1 },
    { tagId: 'leads-group', label: 'Dẫn dắt nhóm', count: 1 },
  ]

  const actionMatches = matchCharacters(userTraits, characterProfiles, {
    includeProposed: true,
    genreFilter: 'action-historical',
  })
  assert.equal(actionMatches.length, 1)
  assert.equal(actionMatches[0].character.name, 'Shinsuke Takasugi')

  const strategistMatches = matchCharacters(userTraits, characterProfiles, {
    includeProposed: true,
    archetypeFilter: 'strategist',
  })
  assert.equal(strategistMatches.length, 1)
  assert.equal(strategistMatches[0].character.name, 'Kaguya Shinomiya')
})