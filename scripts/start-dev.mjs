#!/usr/bin/env node
/**
 * Start Landing + Tutor on free ports.
 * Prefers 3010/5183 to avoid collisions with other AIra stacks on 3000/5173.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const isWin = process.platform === 'win32'
const npmCmd = isWin ? 'npm.cmd' : 'npm'

const children = []

function shutdown() {
  for (const child of children) {
    try {
      child.kill()
    } catch {
      /* ignore */
    }
  }
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = createServer()
    s.once('error', () => resolve(false))
    s.once('listening', () => s.close(() => resolve(true)))
    s.listen(port, '0.0.0.0')
  })
}

async function pickPort(preferred, fallbacks) {
  for (const p of [preferred, ...fallbacks]) {
    if (await portFree(p)) return p
  }
  throw new Error(`No free port among ${[preferred, ...fallbacks].join(', ')}`)
}

/** If a tutor is already healthy on a preferred port, reuse it instead of failing. */
async function pickTutorPort(preferred, fallbacks) {
  for (const p of [preferred, ...fallbacks]) {
    if (await portFree(p)) return { port: p, reuse: false }
    try {
      const res = await fetch(`http://127.0.0.1:${p}/health`, {
        signal: AbortSignal.timeout(800),
      })
      if (res.ok) return { port: p, reuse: true }
    } catch {
      /* try next */
    }
  }
  throw new Error(`No free/reusable tutor port among ${[preferred, ...fallbacks].join(', ')}`)
}

async function main() {
  const landingPort = await pickPort(3010, [3020, 3030, 3040, 3000])
  const { port: tutorPort, reuse: reuseTutor } = await pickTutorPort(5183, [
    5193, 5203, 5213, 5223, 5173,
  ])

  const tutorUrl = `http://127.0.0.1:${tutorPort}`
  const landingUrl = `http://localhost:${landingPort}`

  console.log('')
  console.log('AIra Frontend-Only Dev')
  console.log(`  Landing :${landingPort}`)
  console.log(`  Tutor   :${tutorPort}${reuseTutor ? ' (reusing existing)' : ''}`)
  console.log(`  OPEN → ${landingUrl}`)
  console.log('')

  const sharedEnv = {
    ...process.env,
    TUTOR_DEV_URL: tutorUrl,
    VITE_DEV_ORIGIN: landingUrl,
    VITE_HMR_CLIENT_PORT: String(landingPort),
    VITE_LANDING_ORIGIN: landingUrl,
    PORT: String(landingPort),
  }

  if (!reuseTutor) {
    const tutor = spawn(
      npmCmd,
      ['run', 'dev', '--', '--port', String(tutorPort), '--strictPort', '--host', '127.0.0.1'],
      {
        cwd: path.join(ROOT, 'apps', 'tutor'),
        env: sharedEnv,
        stdio: 'inherit',
        shell: isWin,
      },
    )
    children.push(tutor)
  }

  const landing = spawn(
    npmCmd,
    ['run', 'dev', '--', '--port', String(landingPort)],
    {
      cwd: path.join(ROOT, 'apps', 'landing'),
      env: sharedEnv,
      stdio: 'inherit',
      shell: isWin,
    },
  )
  children.push(landing)

  process.on('SIGINT', () => {
    shutdown()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    shutdown()
    process.exit(0)
  })

  // Keep running until both children exit
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          child.on('exit', () => resolve())
        }),
    ),
  )
  shutdown()
}

main().catch((err) => {
  console.error(err)
  shutdown()
  process.exit(1)
})
