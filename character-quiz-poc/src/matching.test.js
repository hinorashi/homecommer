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