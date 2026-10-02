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

  return [...counts.entries()]
    .map(([tagId, count]) => ({
      tagId,
      label: traitCatalog[tagId]?.label ?? tagId,
      description: traitCatalog[tagId]?.description ?? '',
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'vi'))
}

export function summarizeUserPersonality(userTraits) {
  if (!userTraits || userTraits.length === 0) {
    return {
      headline: 'Chưa có đủ dữ liệu để đánh giá tính cách.',
      highlights: [],
    }
  }

  const prominentTraits = userTraits.slice(0, 3)
  const traitNames = prominentTraits.map((t) => t.label).join(', ')

  return {
    headline: `Phong cách hành xử nổi bật: ${traitNames}.`,
    highlights: userTraits.map((trait) => ({
      ...trait,
      frequencyText: trait.count > 1 ? `Được thể hiện qua ${trait.count} tình huống` : 'Được thể hiện qua 1 tình huống',
    })),
  }
}

/**
 * Calculates IDF (Inverse Document Frequency) for each trait across the character database.
 * Higher IDF means the trait is rarer and more distinctive.
 * IDF(t) = ln(1 + N / (N_t + 0.5))
 */
export function calculateTraitIdf(characters) {
  const n = characters.length
  const traitDocFreq = new Map()

  characters.forEach((character) => {
    const uniqueTraits = new Set(
      character.assertions
        .filter((a) => a.traitType === 'personality-behavior')
        .map((a) => a.tagId)
    )
    uniqueTraits.forEach((tagId) => {
      traitDocFreq.set(tagId, (traitDocFreq.get(tagId) || 0) + 1)
    })
  })

  const idfMap = new Map()
  traitDocFreq.forEach((count, tagId) => {
    idfMap.set(tagId, Number(Math.log(1 + n / (count + 0.5)).toFixed(3)))
  })

  return idfMap
}

export const slotDefinitions = {
  best: {
    type: 'best',
    title: 'Tương đồng cao nhất',
    badge: 'Best Overall Match',
    description: 'Nhân vật có tổng điểm tương đồng phong cách ứng xử cao nhất.',
  },
  soulmate: {
    type: 'soulmate',
    title: 'Nét đồng điệu hiếm gặp',
    badge: 'Soulmate / Niche Match',
    description: 'Chia sẻ nét tính cách đặc thù, định danh cao nhất với bạn.',
  },
  wildcard: {
    type: 'wildcard',
    title: 'Gợi ý bất ngờ',
    badge: 'Wildcard Match',
    description: 'Đến từ thế giới quan hoặc góc nhìn khác biệt nhưng bất ngờ đồng điệu giá trị cốt lõi.',
  },
  standard: {
    type: 'standard',
    title: 'Phù hợp',
    badge: 'Relevant Match',
    description: 'Chia sẻ các nét tính cách tương đồng.',
  },
}

export function matchCharacters(
  userTraits,
  characters,
  {
    includeProposed = false,
    genreFilter = 'all',
    archetypeFilter = 'all',
  } = {}
) {
  const userTraitMap = new Map(userTraits.map((t) => [t.tagId, t]))
  const idfMap = calculateTraitIdf(characters)

  // 1. Calculate similarity for all eligible characters
  const rawMatches = characters
    .map((character) => {
      const candidateAssertions = character.assertions.filter(
        (assertion) =>
          assertion.traitType === 'personality-behavior' &&
          (assertion.reviewStatus === 'approved' ||
            (includeProposed &&
              (assertion.reviewStatus === 'proposed' ||
                assertion.reviewStatus === 'web-sourced')))
      )

      const sharedTraits = candidateAssertions
        .filter((assertion) => userTraitMap.has(assertion.tagId))
        .map((assertion) => {
          const userTrait = userTraitMap.get(assertion.tagId)
          const idf = idfMap.get(assertion.tagId) || 0.5
          const traitWeight = Number(((userTrait ? userTrait.count : 1) * idf).toFixed(2))

          return {
            ...assertion,
            label: traitCatalog[assertion.tagId]?.label ?? assertion.tagId,
            description: traitCatalog[assertion.tagId]?.description ?? assertion.editorialInterpretation,
            idf,
            traitWeight,
          }
        })
        .sort((a, b) => b.traitWeight - a.traitWeight)

      const allTraits = candidateAssertions.map((assertion) => ({
        ...assertion,
        label: traitCatalog[assertion.tagId]?.label ?? assertion.tagId,
        isShared: userTraitMap.has(assertion.tagId),
      }))

      // Weighted score = sum of IDF weights
      const weightedScore = Number(
        sharedTraits.reduce((acc, t) => acc + t.traitWeight, 0).toFixed(2)
      )

      // Max rarity amongst shared traits
      const maxRarity = sharedTraits.length > 0 ? Math.max(...sharedTraits.map((t) => t.idf)) : 0

      return {
        character,
        sharedTraits,
        allTraits,
        matchScore: sharedTraits.length,
        weightedScore,
        maxRarity,
      }
    })
    .filter(({ sharedTraits }) => sharedTraits.length > 0)

  // 2. Apply contextual filters if specified
  const filteredMatches = rawMatches.filter(({ character }) => {
    const matchGenre = genreFilter === 'all' || character.genre === genreFilter
    const matchArchetype = archetypeFilter === 'all' || character.archetype === archetypeFilter
    return matchGenre && matchArchetype
  })

  if (filteredMatches.length === 0) return []

  // 3. Diversity & Archetype Slots Allocation (when no restrictive filter overrides)
  // Sort by weighted similarity score descending
  const sortedByScore = [...filteredMatches].sort(
    (a, b) =>
      b.weightedScore - a.weightedScore ||
      b.matchScore - a.matchScore ||
      a.character.name.localeCompare(b.character.name, 'vi')
  )

  const selectedMatches = []
  const usedIds = new Set()

  // Slot 1: Best Overall Match
  const slot1 = sortedByScore[0]
  if (slot1) {
    selectedMatches.push({
      ...slot1,
      slot: slotDefinitions.best,
    })
    usedIds.add(slot1.character.id)
  }

  // Slot 2: Soulmate / Niche Match (highest single trait rarity among remaining candidates)
  const remainingForSlot2 = sortedByScore.filter((m) => !usedIds.has(m.character.id))
  if (remainingForSlot2.length > 0) {
    // Sort by maxRarity descending
    const slot2Candidate = [...remainingForSlot2].sort(
      (a, b) => b.maxRarity - a.maxRarity || b.weightedScore - a.weightedScore
    )[0]

    selectedMatches.push({
      ...slot2Candidate,
      slot: slotDefinitions.soulmate,
    })
    usedIds.add(slot2Candidate.character.id)
  }

  // Slot 3: Wildcard Match (prefer candidate from different genre or archetype than slot 1)
  const remainingForSlot3 = sortedByScore.filter((m) => !usedIds.has(m.character.id))
  if (remainingForSlot3.length > 0) {
    const slot1Genre = slot1?.character.genre
    const wildcardCandidate =
      remainingForSlot3.find((m) => m.character.genre !== slot1Genre) ||
      remainingForSlot3[0]

    selectedMatches.push({
      ...wildcardCandidate,
      slot:
        wildcardCandidate.character.genre !== slot1Genre
          ? slotDefinitions.wildcard
          : slotDefinitions.standard,
    })
    usedIds.add(wildcardCandidate.character.id)
  }

  // Any subsequent matches retain standard slot definition
  remainingForSlot3
    .filter((m) => !usedIds.has(m.character.id))
    .forEach((m) => {
      selectedMatches.push({
        ...m,
        slot: slotDefinitions.standard,
      })
    })

  return selectedMatches
}