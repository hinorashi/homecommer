const ENDPOINT = 'https://graphql.anilist.co'
const MIN_REQUEST_INTERVAL_MS = Number(process.env.ANILIST_MIN_INTERVAL_MS) || 2100
const MAX_ATTEMPTS = 6

let requestQueue = Promise.resolve()
let lastRequestAt = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function send(query, variables) {
  for (let attempt = 1; ; attempt += 1) {
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt))
    if (wait > 0) await sleep(wait)
    lastRequestAt = Date.now()

    let response
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(30000),
      })
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error
      await sleep(2000 * 2 ** attempt)
      continue
    }

    if (response.status === 429) {
      if (attempt >= MAX_ATTEMPTS) throw new Error('AniList rate limit exceeded repeatedly.')
      const retryAfter = Number(response.headers.get('retry-after'))
      const resetAt = Number(response.headers.get('x-ratelimit-reset')) * 1000
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Number.isFinite(resetAt) && resetAt > Date.now() ? resetAt - Date.now() : 60000
      console.warn(`  AniList rate limited; waiting ${Math.ceil(delay / 1000)}s...`)
      await sleep(delay + 1000)
      continue
    }
    if (response.status >= 500) {
      if (attempt >= MAX_ATTEMPTS) throw new Error(`AniList server error ${response.status}.`)
      await sleep(2000 * 2 ** attempt)
      continue
    }

    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.errors?.length) {
      const message = payload?.errors?.map((error) => error.message).join('; ') || `HTTP ${response.status}`
      throw new Error(`AniList query failed: ${message}`)
    }
    return payload.data
  }
}

export function anilistQuery(query, variables = {}) {
  const result = requestQueue.then(() => send(query, variables))
  requestQueue = result.catch(() => {})
  return result
}

export async function fetchGenreCollection() {
  const data = await anilistQuery('query { GenreCollection }')
  return data.GenreCollection ?? []
}

const MEDIA_FIELDS = `
  id
  title { romaji english native userPreferred }
  siteUrl
  genres
  popularity
  favourites
  format
  seasonYear
  isAdult
`

export async function fetchPopularAnimePage({ page = 1, perPage = 50, genre = null } = {}) {
  const data = await anilistQuery(`
    query ($page: Int, $perPage: Int, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(type: ANIME, sort: [POPULARITY_DESC], genre: $genre, isAdult: false) { ${MEDIA_FIELDS} }
      }
    }
  `, { page, perPage, genre })
  return { media: data.Page?.media ?? [], hasNextPage: Boolean(data.Page?.pageInfo?.hasNextPage) }
}

const CHARACTER_CONNECTION = `
  pageInfo { hasNextPage }
  edges {
    role
    node {
      id
      name { full native alternative }
      image { large medium }
      siteUrl
      favourites
    }
  }
`

export async function fetchAnimeCharactersBatch(animeIds, { perPage = 25 } = {}) {
  const data = await anilistQuery(`
    query ($ids: [Int], $perPage: Int, $charPerPage: Int) {
      Page(perPage: $perPage) {
        media(id_in: $ids, type: ANIME) {
          id
          characters(page: 1, perPage: $charPerPage, sort: [ROLE, RELEVANCE, ID]) { ${CHARACTER_CONNECTION} }
        }
      }
    }
  `, { ids: animeIds, perPage: Math.min(50, animeIds.length), charPerPage: perPage })
  return (data.Page?.media ?? []).map((media) => ({
    animeId: media.id,
    edges: media.characters?.edges ?? [],
    hasNextPage: Boolean(media.characters?.pageInfo?.hasNextPage),
  }))
}

export async function fetchAnimeCharactersPage(animeId, page, { perPage = 25 } = {}) {
  const data = await anilistQuery(`
    query ($id: Int, $page: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        characters(page: $page, perPage: $perPage, sort: [ROLE, RELEVANCE, ID]) { ${CHARACTER_CONNECTION} }
      }
    }
  `, { id: animeId, page, perPage })
  return {
    edges: data.Media?.characters?.edges ?? [],
    hasNextPage: Boolean(data.Media?.characters?.pageInfo?.hasNextPage),
  }
}
