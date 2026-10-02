import Anilist from 'anilist-node'
import { getAniListMetadataStatus, saveAniListCharacterMetadata } from '../db.js'

const client = new Anilist(undefined, { timeout: 12000 })
const MIN_REQUEST_INTERVAL_MS = 2100
let requestQueue = Promise.resolve()
let lastRequestAt = 0

function rateLimited(request) {
  const result = requestQueue.then(async () => {
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt))
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    lastRequestAt = Date.now()
    return request()
  })
  requestQueue = result.catch(() => {})
  return result
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function selectExactCharacter(results, expectedName) {
  const normalizedName = normalizeName(expectedName)
  return (results ?? []).find((character) =>
    normalizeName(character.name?.english) === normalizedName
  ) ?? null
}

export function matchesAniListSeries(mediaNodes, expectedSeries) {
  const normalizedSeries = normalizeName(expectedSeries)
  if (!normalizedSeries) return true

  return Boolean(selectExactAnimeSeries(mediaNodes, expectedSeries))
}

export function selectExactAnimeSeries(mediaNodes, expectedSeries) {
  const normalizedSeries = normalizeName(expectedSeries)
  if (!normalizedSeries) return null

  return (mediaNodes ?? []).find((media) => media.type === 'ANIME'
    && ['english', 'romaji', 'native', 'userPreferred'].some((key) =>
      normalizeName(media.title?.[key]) === normalizedSeries
    )) ?? null
}

function matchesCharacterName(character, expectedName) {
  const normalizedName = normalizeName(expectedName)
  const names = [
    character.name?.english,
    character.name?.native,
    ...(character.name?.alternative ?? []),
  ]
  return names.some((name) => normalizeName(name) === normalizedName)
}

export async function searchAniListCharacters(search) {
  const query = String(search ?? '').trim().slice(0, 100)
  if (query.length < 2) throw new Error('Search query must contain at least 2 characters.')

  const result = await rateLimited(() => client.searchEntry.character(query, 1, 10))
  return (result.characters ?? []).map((character) => ({
    id: character.id,
    name: character.name?.english ?? '',
    pageUrl: `https://anilist.co/character/${character.id}`,
  }))
}

function storedImage(status) {
  return status?.imageUrl ? {
    url: status.imageUrl,
    provider: 'AniList',
    pageUrl: status.pageUrl,
    storagePermissionStatus: status.storagePermissionStatus,
    reusePermissionStatus: status.reusePermissionStatus,
  } : null
}

export async function syncAniListCharacterMetadata({ characterId, anilistId, name, series }) {
  const query = String(name ?? '').trim().slice(0, 100)
  const existing = getAniListMetadataStatus(characterId)
  if (!existing) throw new Error('Character not found in SQLite.')
  const syncedAt = Date.parse(existing.syncedAt ?? '')
  if (existing.imageUrl && Number.isFinite(syncedAt) && Date.now() - syncedAt < 30 * 24 * 60 * 60 * 1000) {
    return {
      characterId,
      image: storedImage(existing),
      stored: true,
      cached: true,
      metadata: { series: existing.seriesTitle, genres: JSON.parse(existing.genresJson ?? '[]'), syncedAt: existing.syncedAt },
    }
  }

  let aniListCharacterId = Number(anilistId)

  if (!Number.isInteger(aniListCharacterId) || aniListCharacterId < 1) {
    if (query.length < 2) return null
    const result = await rateLimited(() => client.searchEntry.character(query, 1, 10))
    const exactMatch = selectExactCharacter(result.characters, query)
    if (!exactMatch) return null
    aniListCharacterId = exactMatch.id
  }

  const profile = await rateLimited(() => client.people.character(aniListCharacterId))
  if (!matchesCharacterName(profile, query)) return { characterId: String(characterId), image: null, stored: false }
  const relatedSeries = selectExactAnimeSeries(profile.media, series)
  if (!relatedSeries) return { characterId: String(characterId), image: null, stored: false, reason: 'series-mismatch' }

  const media = await rateLimited(() => client.media.anime(relatedSeries.id))
  const pageUrl = `https://anilist.co/character/${profile.id}`
  const status = saveAniListCharacterMetadata({
    characterId,
    character: {
      id: profile.id,
      name: profile.name?.english || profile.name?.userPreferred || query,
      nativeName: profile.name?.native,
      aliases: profile.name?.alternative ?? [],
      pageUrl,
      role: null,
    },
    series: {
      id: media.id,
      title: media.title?.userPreferred || media.title?.english || media.title?.romaji || query,
      titleEnglish: media.title?.english,
      titleRomaji: media.title?.romaji,
      titleNative: media.title?.native,
      pageUrl: media.siteUrl || `https://anilist.co/anime/${media.id}`,
      genres: media.genres ?? [],
    },
    imageUrl: profile.image?.large || profile.image?.medium || null,
  })

  return {
    characterId: String(characterId),
    image: storedImage(status),
    stored: true,
    cached: false,
    metadata: {
      series: media.title?.userPreferred || media.title?.english || media.title?.romaji,
      genres: media.genres ?? [],
      source: media.siteUrl || `https://anilist.co/anime/${media.id}`,
      syncedAt: status.syncedAt,
    },
  }
}

export async function syncAniListCharacterMetadataBatch(characters) {
  const candidates = Array.isArray(characters) ? characters.slice(0, 3) : []
  const results = []

  for (const candidate of candidates) {
    const id = String(candidate?.id ?? '').slice(0, 120)
    const name = String(candidate?.name ?? '').trim().slice(0, 100)
    const series = String(candidate?.series ?? '').trim().slice(0, 120)
    try {
      const result = await syncAniListCharacterMetadata({
        characterId: id,
        anilistId: candidate?.anilistId,
        name,
        series,
      })
      results.push({ id, ...result })
    } catch {
      results.push({ id, image: null, stored: false })
    }
  }

  return results
}