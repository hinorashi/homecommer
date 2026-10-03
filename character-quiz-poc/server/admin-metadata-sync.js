import { randomUUID } from 'node:crypto'
import { findCharactersForMetadataSync } from './db.js'
import { syncAniListCharacterMetadataBatch } from './integrations/anilist.js'

let currentJob = null

function publicJob(job) {
  if (!job) return null
  return {
    id: job.id,
    status: job.status,
    total: job.total,
    completed: job.completed,
    synced: job.synced,
    cached: job.cached,
    unmatched: job.unmatched,
    errors: job.errors,
    currentCharacter: job.currentCharacter,
    force: job.force,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    results: job.results.slice(-100),
    percent: job.total ? Math.floor((job.completed / job.total) * 100) : 0,
  }
}

async function runJob(job, characters) {
  for (const character of characters) {
    job.currentCharacter = { id: character.id, name: character.name, series: character.series }
    try {
      const [result] = await syncAniListCharacterMetadataBatch([character], { force: job.force })
      const status = result?.status ?? 'error'
      if (status === 'synced') job.synced += 1
      else if (status === 'cached') job.cached += 1
      else if (status === 'not-matched') job.unmatched += 1
      else job.errors += 1

      job.results.push({
        id: character.id,
        name: character.name,
        series: character.series,
        status,
        reason: result?.reason ?? null,
        genres: result?.metadata?.genres ?? [],
      })
    } catch (error) {
      job.errors += 1
      job.results.push({
        id: character.id,
        name: character.name,
        series: character.series,
        status: 'error',
        reason: error.message,
        genres: [],
      })
    }
    job.completed += 1
  }

  job.status = 'completed'
  job.currentCharacter = null
  job.finishedAt = new Date().toISOString()
}

export function startFullMetadataSync({ force = false } = {}) {
  if (currentJob?.status === 'running') return publicJob(currentJob)

  const characters = findCharactersForMetadataSync({ limit: 100000 })
  const job = {
    id: randomUUID(),
    status: 'running',
    total: characters.length,
    completed: 0,
    synced: 0,
    cached: 0,
    unmatched: 0,
    errors: 0,
    currentCharacter: null,
    force: Boolean(force),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    results: [],
  }
  currentJob = job

  if (characters.length === 0) {
    job.status = 'completed'
    job.finishedAt = new Date().toISOString()
  } else {
    void runJob(job, characters)
  }

  return publicJob(job)
}

export function getMetadataSyncJob(jobId) {
  if (!currentJob || (jobId && currentJob.id !== jobId)) return null
  return publicJob(currentJob)
}