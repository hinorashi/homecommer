// AniList has no character-to-character relation field, but character descriptions
// link to other characters inline, e.g. "the Servant of [Shirou](https://anilist.co/character/496)".
// These helpers turn those links into relation edges with a best-effort label.

const CHARACTER_LINK = /\[([^\]]+)\]\(https?:\/\/anilist\.co\/character\/(\d+)[^)]*\)/g
const ANY_LINK = /\[([^\]]+)\]\([^)]*\)/g
const SPOILER_BLOCK = /~!([\s\S]*?)!~/g

const RELATION_KEYWORDS = [
  ['childhood friend', 'childhood-friend'],
  ['best friend', 'best-friend'],
  ['older sister', 'sister'], ['younger sister', 'sister'], ['big sister', 'sister'], ['little sister', 'sister'],
  ['older brother', 'brother'], ['younger brother', 'brother'], ['big brother', 'brother'], ['little brother', 'brother'],
  ['twin sister', 'twin'], ['twin brother', 'twin'],
  ['half-sister', 'sister'], ['half-brother', 'brother'], ['half sister', 'sister'], ['half brother', 'brother'],
  ['adoptive father', 'father'], ['adoptive mother', 'mother'], ['foster father', 'father'], ['foster mother', 'mother'],
  ['stepmother', 'mother'], ['stepfather', 'father'], ['step-mother', 'mother'], ['step-father', 'father'],
  ['grandfather', 'grandparent'], ['grandmother', 'grandparent'], ['grandpa', 'grandparent'], ['grandma', 'grandparent'],
  ['granddaughter', 'grandchild'], ['grandson', 'grandchild'],
  ['father', 'father'], ['dad', 'father'], ['mother', 'mother'], ['mom', 'mother'],
  ['born to', 'parent'], ['parent', 'parent'], ['summoned by', 'master'], ['contracted with', 'partner'],
  ['sister', 'sister'], ['brother', 'brother'], ['sibling', 'sibling'], ['twin', 'twin'],
  ['daughter', 'daughter'], ['son', 'son'],
  ['wife', 'spouse'], ['husband', 'spouse'], ['spouse', 'spouse'],
  ['fiancée', 'fiance'], ['fiancee', 'fiance'], ['fiancé', 'fiance'], ['fiance', 'fiance'],
  ['girlfriend', 'lover'], ['boyfriend', 'lover'], ['lover', 'lover'], ['crush', 'crush'],
  ['friend', 'friend'], ['rival', 'rival'], ['enemy', 'enemy'], ['nemesis', 'enemy'], ['archenemy', 'enemy'],
  ['servant', 'servant'], ['master', 'master'], ['familiar', 'servant'],
  ['teacher', 'teacher'], ['mentor', 'teacher'], ['sensei', 'teacher'], ['instructor', 'teacher'],
  ['student', 'student'], ['pupil', 'student'], ['disciple', 'student'], ['apprentice', 'student'],
  ['classmate', 'classmate'], ['senpai', 'senpai'], ['kouhai', 'kouhai'], ['roommate', 'roommate'],
  ['partner', 'partner'], ['teammate', 'teammate'], ['comrade', 'teammate'], ['ally', 'teammate'],
  ['captain', 'leader'], ['leader', 'leader'], ['boss', 'leader'], ['commander', 'leader'],
  ['subordinate', 'subordinate'], ['underling', 'subordinate'], ['superior', 'leader'],
  ['uncle', 'uncle-aunt'], ['aunt', 'uncle-aunt'], ['nephew', 'nephew-niece'], ['niece', 'nephew-niece'],
  ['cousin', 'cousin'], ['guardian', 'guardian'], ['bodyguard', 'bodyguard'],
  ['maid', 'servant'], ['butler', 'servant'], ['creator', 'creator'], ['clone', 'clone'],
  ['ancestor', 'ancestor'], ['descendant', 'descendant'], ['successor', 'successor'],
].map(([word, key]) => [new RegExp(`\\b${word.replace(/[-]/g, '[- ]?')}s?\\b`, 'gi'), key])

function stripMarkup(text) {
  return String(text ?? '')
    .replace(ANY_LINK, '$1')
    .replace(/~!|!~/g, '')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Plain-text description that keeps `~! !~` spoiler markers for the UI. */
export function cleanCharacterDescription(raw) {
  if (!raw) return null
  const text = String(raw)
    .replace(ANY_LINK, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text ? text.slice(0, 8000) : null
}

function sentenceAround(raw, start, end) {
  const before = raw.slice(0, start)
  let sentenceStart = 0
  for (const match of before.matchAll(/[.!?]\s|~!|!~|\n/g)) sentenceStart = match.index + match[0].length
  const after = /[.!?](?=\s|$)|~!|!~|\n/.exec(raw.slice(end))
  const sentenceEnd = !after ? raw.length : end + after.index + (/^[.!?]$/.test(after[0]) ? 1 : 0)
  return raw.slice(sentenceStart, sentenceEnd)
}

function detectLabel(sentence, name) {
  const position = sentence.indexOf(name)
  if (position < 0) return null
  const windowStart = Math.max(0, position - 70)
  const windowEnd = Math.min(sentence.length, position + name.length + 45)
  let best = null
  for (const [pattern, key] of RELATION_KEYWORDS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(sentence))) {
      const index = match.index
      if (index < windowStart || index > windowEnd) continue
      if (index >= position && index < position + name.length) continue
      const distance = index < position ? position - (index + match[0].length) : index - (position + name.length)
      if (!best || distance < best.distance) best = { key, distance }
    }
  }
  return best?.key ?? null
}

export function parseCharacterMentions(raw, selfAnilistId = null) {
  if (!raw) return []
  const text = String(raw)
  const spoilerRanges = []
  for (const match of text.matchAll(SPOILER_BLOCK)) spoilerRanges.push([match.index, match.index + match[0].length])
  const inSpoiler = (index) => spoilerRanges.some(([start, end]) => index >= start && index < end)

  const mentions = new Map()
  for (const match of text.matchAll(CHARACTER_LINK)) {
    const anilistId = Number(match[2])
    if (!anilistId || anilistId === Number(selfAnilistId)) continue
    const name = stripMarkup(match[1]).slice(0, 200)
    if (!name) continue
    const context = stripMarkup(sentenceAround(text, match.index, match.index + match[0].length)).slice(0, 320)
    const label = detectLabel(context, name)
    const spoiler = inSpoiler(match.index)
    const existing = mentions.get(anilistId)
    if (!existing) {
      mentions.set(anilistId, { anilistId, name, label, context, spoiler })
    } else {
      if (!existing.label && label) Object.assign(existing, { label, context })
      // A non-spoiler mention replaces a spoiler one entirely so no spoiler label/context leaks out.
      if (existing.spoiler && !spoiler) Object.assign(existing, { spoiler: false, label, context })
    }
  }
  return [...mentions.values()]
}
