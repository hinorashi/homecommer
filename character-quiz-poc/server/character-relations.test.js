import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanCharacterDescription, parseCharacterMentions } from './character-relations.js'

test('parseCharacterMentions extracts linked characters with keyword labels', () => {
  const raw = 'He lives with his adoptive sister [Mikasa Ackerman](https://anilist.co/character/40881) and his best friend [Armin Arlert](https://anilist.co/character/46494/Armin-Arlert).'
  const mentions = parseCharacterMentions(raw, 40882)
  assert.deepEqual(mentions.map(({ anilistId, name, label, spoiler }) => ({ anilistId, name, label, spoiler })), [
    { anilistId: 40881, name: 'Mikasa Ackerman', label: 'sister', spoiler: false },
    { anilistId: 46494, name: 'Armin Arlert', label: 'best-friend', spoiler: false },
  ])
  assert.match(mentions[0].context, /adoptive sister Mikasa Ackerman/)
})

test('parseCharacterMentions skips self links, flags spoilers and keeps unlabeled mentions', () => {
  const raw = 'She is the Servant of [Shirou](https://anilist.co/character/496). [Saber](https://anilist.co/character/497) appears.\n~!Later she fights [Gilgamesh](https://anilist.co/character/2514).!~'
  const mentions = parseCharacterMentions(raw, 497)
  assert.equal(mentions.length, 2)
  assert.equal(mentions[0].label, 'servant')
  assert.equal(mentions[1].anilistId, 2514)
  assert.equal(mentions[1].spoiler, true)
  assert.equal(mentions[1].label, null)
})

test('parseCharacterMentions prefers a non-spoiler mention when a character is linked twice', () => {
  const raw = '~!Her enemy [X](https://anilist.co/character/9).!~ She trains with her rival [X](https://anilist.co/character/9).'
  const [mention] = parseCharacterMentions(raw, 1)
  assert.equal(mention.spoiler, false)
  assert.equal(mention.label, 'rival')
  assert.match(mention.context, /trains with her rival/)
})

test('cleanCharacterDescription strips links and markup but keeps spoiler markers', () => {
  const cleaned = cleanCharacterDescription('__Height:__ 154 cm<br>Friend of [Rin](https://anilist.co/character/498) &amp; more ~!secret!~')
  assert.equal(cleaned, 'Height: 154 cm\nFriend of Rin & more ~!secret!~')
  assert.equal(cleanCharacterDescription(''), null)
})
