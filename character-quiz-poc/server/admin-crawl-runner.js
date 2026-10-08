import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'scripts')
const CRAWL_SCRIPT = path.join(scriptsDir, 'crawl-anilist.js')
const ENRICH_SCRIPT = path.join(scriptsDir, 'enrich-catalog.js')
const MAX_LOG_LINES = 500
const STOP_GRACE_MS = 30000

const OPTION_DEFS = {
  genre: { flag: '--genre', type: 'genres', label: 'Thể loại (để trống = tất cả)' },
  animeGenre: { flag: '--genre', type: 'genres', single: true, label: 'Chỉ anime thuộc thể loại (để trống = tất cả)' },
  popular: { flag: '--popular', type: 'boolean', label: 'Ưu tiên anime phổ biến (không chia theo thể loại)' },
  pages: { flag: '--pages', type: 'integer', min: 1, max: 500, label: 'Số trang mỗi thể loại (50 anime/trang)' },
  limit: { flag: '--limit', type: 'integer', min: 1, max: 100000, label: 'Giới hạn số mục' },
  maxPages: { flag: '--max-pages', type: 'integer', min: 0, max: 1000, label: 'Số trang nhân vật tối đa mỗi anime (0 = tất cả)' },
  batch: { flag: '--batch', type: 'integer', min: 1, max: 50, label: 'Kích thước lô' },
  force: { flag: '--force', type: 'boolean', label: 'Làm lại cả mục đã đồng bộ' },
}

export const CRAWL_COMMANDS = [
  { id: 'stats', script: CRAWL_SCRIPT, label: 'Thống kê database', description: 'In số lượng thể loại, anime, nhân vật… hiện có.', options: [] },
  { id: 'genres', script: CRAWL_SCRIPT, label: 'Đồng bộ thể loại', description: 'Lấy danh sách genre từ AniList.', options: [] },
  {
    id: 'anime', script: CRAWL_SCRIPT, label: 'Crawl anime',
    description: 'Lấy anime theo từng thể loại (hoặc theo độ phổ biến), kèm studio và tag.',
    options: ['genre', 'popular', 'pages'], defaults: { pages: 2 },
  },
  {
    id: 'characters', script: CRAWL_SCRIPT, label: 'Crawl nhân vật',
    description: 'Lấy nhân vật cho các anime đã có trong database, ưu tiên anime phổ biến.',
    options: ['animeGenre', 'limit', 'maxPages', 'force'], defaults: { limit: 50, maxPages: 1 },
  },
  {
    id: 'details', script: CRAWL_SCRIPT, label: 'Chi tiết nhân vật',
    description: 'Bổ sung mô tả, giới tính, tuổi, sinh nhật, quan hệ nhân vật.',
    options: ['limit', 'batch', 'force'], defaults: { limit: 200, batch: 25 },
  },
  {
    id: 'anime-relations', script: CRAWL_SCRIPT, label: 'Quan hệ anime',
    description: 'Prequel, sequel, spin-off… cho các anime trong database.',
    options: ['limit', 'force'], defaults: { limit: 200 },
  },
  {
    id: 'all', script: CRAWL_SCRIPT, label: 'Chạy tuần tự (thể loại → anime → nhân vật)',
    description: 'Gộp 3 bước genres, anime và characters.',
    options: ['genre', 'popular', 'pages', 'limit', 'maxPages', 'force'], defaults: { pages: 1, limit: 50, maxPages: 1 },
  },
  { id: 'imdb', script: ENRICH_SCRIPT, label: 'Đồng bộ điểm IMDb', description: 'Tải anime-lists + IMDb ratings (~vài chục MB) và gắn điểm cho anime.', options: [] },
  { id: 'traits', script: ENRICH_SCRIPT, label: 'Tính lại đặc điểm nhân vật', description: 'Suy ra trait (tsundere, kuudere…) từ mô tả nhân vật.', options: [] },
]

const commandsById = new Map(CRAWL_COMMANDS.map((command) => [command.id, command]))

export function listCrawlCommands() {
  return CRAWL_COMMANDS.map(({ id, label, description, options, defaults }) => ({
    id,
    label,
    description,
    defaults: defaults ?? {},
    options: options.map((key) => ({ key, ...OPTION_DEFS[key], flag: undefined })),
  }))
}

export function buildCrawlArguments(commandId, rawOptions = {}) {
  const command = commandsById.get(commandId)
  if (!command) throw new Error(`Lệnh không hợp lệ: ${commandId}`)
  const args = [command.script, command.id]
  const options = rawOptions && typeof rawOptions === 'object' ? rawOptions : {}

  for (const key of command.options) {
    const definition = OPTION_DEFS[key]
    const value = options[key]
    if (value === undefined || value === null || value === '') continue
    if (definition.type === 'boolean') {
      if (value === true) args.push(definition.flag)
    } else if (definition.type === 'integer') {
      const number = Number(value)
      if (!Number.isInteger(number) || number < definition.min || number > definition.max) {
        throw new Error(`${key} phải là số nguyên từ ${definition.min} đến ${definition.max}.`)
      }
      args.push(definition.flag, String(number))
    } else if (definition.type === 'genres') {
      const genres = (Array.isArray(value) ? value : [value]).map((genre) => String(genre).trim()).filter(Boolean)
      if (genres.length > (definition.single ? 1 : 30)) throw new Error(definition.single ? 'Chỉ chọn một thể loại.' : 'Chọn tối đa 30 thể loại.')
      for (const genre of genres) {
        if (genre.length > 60 || genre.startsWith('-') || !/^[\p{L}\p{N} .'&-]+$/u.test(genre)) throw new Error(`Thể loại không hợp lệ: ${genre}`)
        args.push(definition.flag, genre)
      }
    }
  }
  return { command, args }
}

let currentJob = null
let child = null
let nextJobId = 1

function appendLog(job, chunk, stream) {
  const text = job.partial[stream] + chunk.toString('utf8')
  const lines = text.split(/\r?\n/)
  job.partial[stream] = lines.pop()
  for (const line of lines) pushLine(job, stream === 'stderr' ? `[err] ${line}` : line)
}

function pushLine(job, line) {
  job.log.push(line)
  job.lineCount += 1
  if (job.log.length > MAX_LOG_LINES) job.log.splice(0, job.log.length - MAX_LOG_LINES)
}

export function getCrawlJob() {
  if (!currentJob) return null
  const { id, command, label, args, status, startedAt, finishedAt, exitCode, lineCount, log } = currentJob
  return { id, command, label, args, status, startedAt, finishedAt, exitCode, lineCount, log: [...log] }
}

export function isCrawlRunning() {
  return currentJob?.status === 'running' || currentJob?.status === 'stopping'
}

export function startCrawlJob(commandId, options) {
  if (isCrawlRunning()) {
    const error = new Error('Đang có một lệnh crawl chạy. Hãy dừng hoặc đợi nó xong.')
    error.status = 409
    throw error
  }
  const { command, args } = buildCrawlArguments(commandId, options)
  const job = {
    id: String(nextJobId++),
    command: command.id,
    label: command.label,
    args: args.slice(1),
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    log: [],
    lineCount: 0,
    partial: { stdout: '', stderr: '' },
  }
  pushLine(job, `$ node ${path.basename(command.script)} ${args.slice(1).join(' ')}`)
  currentJob = job

  child = spawn(process.execPath, args, {
    cwd: path.dirname(path.dirname(scriptsDir)),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })
  const spawned = child
  spawned.stdout.on('data', (chunk) => appendLog(job, chunk, 'stdout'))
  spawned.stderr.on('data', (chunk) => appendLog(job, chunk, 'stderr'))
  spawned.on('error', (error) => {
    pushLine(job, `[err] ${error.message}`)
  })
  spawned.on('close', (code, signal) => {
    for (const stream of ['stdout', 'stderr']) {
      if (job.partial[stream]) appendLog(job, '\n', stream)
    }
    job.exitCode = code
    job.finishedAt = new Date().toISOString()
    if (job.status === 'stopping') job.status = 'stopped'
    else job.status = code === 0 ? 'completed' : 'failed'
    pushLine(job, `— Kết thúc (${job.status}, exit ${code ?? signal}) —`)
    clearTimeout(job.killTimer)
    delete job.killTimer
    if (child === spawned) child = null
  })
  return getCrawlJob()
}

export function stopCrawlJob() {
  if (!isCrawlRunning() || !child) return getCrawlJob()
  const job = currentJob
  if (job.status === 'stopping') {
    pushLine(job, 'Buộc dừng tiến trình…')
    child.kill()
    return getCrawlJob()
  }
  job.status = 'stopping'
  pushLine(job, 'Đã gửi yêu cầu dừng, đợi request hiện tại hoàn tất…')
  if (child.connected) child.send('stop')
  else child.kill()
  job.killTimer = setTimeout(() => child?.kill(), STOP_GRACE_MS)
  return getCrawlJob()
}

export function shutdownCrawlJob() {
  if (child) child.kill()
}
