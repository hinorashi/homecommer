import { traitCatalog } from './traitCatalog.js'

export function buildUserTraits(answers, questionSet) {
  const counts = new Map()

  questionSet.forEach((question, questionIndex) => {
    const answerIndex = answers[questionIndex]
    if (answerIndex === null || answerIndex === undefined) return

    ;(question.choiceTraits[answerIndex] ?? []).forEach((tagId) => {
      if (traitCatalog[tagId]?.type !== 'personality-behavior') return
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1)
    })
  })

  return [...counts.entries()].map(([tagId, count]) => ({
    tagId,
    label: traitCatalog[tagId].label,
    count,
  }))
}

export function matchCharacters(userTraits, characters, { includeProposed = false } = {}) {
  const userTraitIds = new Set(userTraits.map((trait) => trait.tagId))

  return characters
    .map((character) => {
      const candidateAssertions = character.assertions.filter((assertion) => (
        assertion.traitType === 'personality-behavior'
        && (assertion.reviewStatus === 'approved' || (includeProposed && assertion.reviewStatus === 'proposed'))
      ))
      const sharedTraits = candidateAssertions
        .filter((assertion) => userTraitIds.has(assertion.tagId))
        .map((assertion) => ({
          ...assertion,
          label: traitCatalog[assertion.tagId]?.label ?? assertion.tagId,
        }))

      return { character, sharedTraits }
    })
    .filter(({ sharedTraits }) => sharedTraits.length > 0)
    .sort((left, right) => right.sharedTraits.length - left.sharedTraits.length
      || left.character.name.localeCompare(right.character.name, 'vi'))
}