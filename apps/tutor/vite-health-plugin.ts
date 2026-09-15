import type { Plugin } from 'vite'

/** Exposes GET /health for stack probes and landing middleware tutor checks. */
export function healthEndpointPlugin(): Plugin {
  return {
    name: 'aira-health-endpoint',
    configureServer(server) {
      server.middlewares.use('/health', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'HEAD') {
          res.end()
          return
        }
        res.end(JSON.stringify({ ok: true, service: 'tutor' }))
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/health', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'HEAD') {
          res.end()
          return
        }
        res.end(JSON.stringify({ ok: true, service: 'tutor' }))
      })
    },
  }
}
