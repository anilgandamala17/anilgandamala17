/**
 * FRONTEND-ONLY debug probe — tests why extracted Landing/Tutor fail to run.
 * Writes NDJSON to the Cursor debug log.
 */
import { createServer } from 'node:net'
import { existsSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONT = join(__dirname, '..')
const LOG = join(
  'C:\\Users\\anilg\\Downloads\\AIra---AI-tutor test\\AIra\\frontend-tutor',
  'debug-7b355f.log',
)

function log(hypothesisId, location, message, data = {}) {
  const line = JSON.stringify({
    sessionId: '7b355f',
    runId: 'pre-fix',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  })
  appendFileSync(LOG, line + '\n', 'utf8')
  console.log(`[${hypothesisId}] ${message}`, data)
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => s.close(() => resolve(true)))
    s.listen(port, '127.0.0.1')
  })
}

async function httpStatus(url, timeoutMs = 8000) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ac.signal })
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) }
  } finally {
    clearTimeout(t)
  }
}

async function main() {
  // #region agent log
  log('A', 'probe.mjs:ports', 'Checking default vs alternate ports', {
    ports: [3000, 3010, 5173, 5183],
  })
  // #endregion

  const free = {}
  for (const p of [3000, 3010, 5173, 5183]) {
    free[p] = await portFree(p)
  }
  // #region agent log
  log('A', 'probe.mjs:portFree', 'Port free map (true=available)', { free })
  // #endregion

  // #region agent log
  log('B', 'probe.mjs:paths', 'Checking extracted app paths exist', {
    landingPkg: existsSync(join(FRONT, 'apps/landing/package.json')),
    tutorPkg: existsSync(join(FRONT, 'apps/tutor/package.json')),
    landingNext: existsSync(join(FRONT, 'apps/landing/node_modules/next')),
    tutorVite: existsSync(join(FRONT, 'apps/tutor/node_modules/vite')),
    landingApiGone: !existsSync(join(FRONT, 'apps/landing/app/api')),
    tutorApiGone: !existsSync(join(FRONT, 'apps/tutor/api')),
  })
  // #endregion

  const endpoints = [
    ['C', 'http://127.0.0.1:3000/', 'original-or-default-landing'],
    ['C', 'http://127.0.0.1:3010/', 'extracted-landing-alt'],
    ['D', 'http://127.0.0.1:5173/health', 'default-tutor-health'],
    ['D', 'http://127.0.0.1:5183/health', 'extracted-tutor-health'],
    ['E', 'http://127.0.0.1:3010/student/mode-selection', 'landing-rewrite-to-tutor'],
    ['E', 'http://127.0.0.1:5183/student/mode-selection', 'tutor-direct-spa'],
  ]

  for (const [hyp, url, label] of endpoints) {
    const result = await httpStatus(url)
    // #region agent log
    log(hyp, 'probe.mjs:http', `HTTP probe ${label}`, { url, ...result })
    // #endregion
  }

  // #region agent log
  log('F', 'probe.mjs:done', 'Probe complete', { logPath: LOG })
  // #endregion
  console.log('PROBE_DONE')
}

main().catch((err) => {
  log('F', 'probe.mjs:crash', 'Probe crashed', { error: String(err) })
  process.exit(1)
})
