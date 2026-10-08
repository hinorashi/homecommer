import assert from 'node:assert/strict'
import test from 'node:test'
import { TRAIT_LEXICON, deriveTraits, getTrait, stripSpoilers } from './character-traits.js'

const ids = (description) => deriveTraits(description).map((item) => item.traitId)

test('stripSpoilers removes AniList spoiler blocks', () => {
  assert.equal(stripSpoilers('Visible. ~!She is a tsundere.!~ End.').includes('tsundere'), false)
})

test('deriveTraits matches keywords and keeps the evidence sentence', () => {
  const traits = deriveTraits('Kurisu is a genius neuroscientist. She is a tsundere.')
  const tsundere = traits.find((item) => item.traitId === 'tsundere')
  assert.ok(tsundere)
  assert.match(tsundere.evidence, /tsundere/)
})

test('deriveTraits ignores traits mentioned only inside spoilers', () => {
  assert.equal(ids('A quiet girl. ~!Later she turns out to be a tsundere.!~').includes('tsundere'), false)
})

test('deriveTraits does not treat "Dragon Ball" as the dragon species', () => {
  assert.equal(ids('Goku is the main character of Dragon Ball.').includes('dragon'), false)
  assert.ok(ids('Tohru is a dragon who works as a maid.').includes('dragon'))
})

test('deriveTraits handles empty input and every trait is resolvable', () => {
  assert.deepEqual(deriveTraits(null), [])
  assert.deepEqual(deriveTraits(''), [])
  for (const trait of TRAIT_LEXICON) assert.equal(getTrait(trait.id), trait)
})
