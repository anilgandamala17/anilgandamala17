import path from 'path'
import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TUTOR_DEV =
  process.env.TUTOR_DEV_URL || 'http://127.0.0.1:5183'

/** Enable tutor proxy only during local development (never in production builds). */
const enableTutorProxy = process.env.NODE_ENV === 'development'

/**
 * Proxy tutor SPA + Vite HMR through landing in local dev.
 * FRONTEND-ONLY: /api/* backend routes were removed from this extraction.
 * Do NOT rewrite /images or /assets — those belong to the landing public folder.
 * Tutor static media lives under /tutor-media/*.
 */
const tutorDevRewrites = [
  // Vite / HMR
  { source: '/@vite/:path*', destination: `${TUTOR_DEV}/@vite/:path*` },
  { source: '/@react-refresh', destination: `${TUTOR_DEV}/@react-refresh` },
  { source: '/@fs/:path*', destination: `${TUTOR_DEV}/@fs/:path*` },
  { source: '/@id/:path*', destination: `${TUTOR_DEV}/@id/:path*` },
  { source: '/src/:path*', destination: `${TUTOR_DEV}/src/:path*` },
  { source: '/node_modules/:path*', destination: `${TUTOR_DEV}/node_modules/:path*` },
  { source: '/theme-boot.js', destination: `${TUTOR_DEV}/theme-boot.js` },
  // Tutor-only static namespace (must not collide with landing /images, /brand, etc.)
  { source: '/tutor-media/:path*', destination: `${TUTOR_DEV}/tutor-media/:path*` },
  { source: '/tutor-assets/:path*', destination: `${TUTOR_DEV}/tutor-assets/:path*` },
  { source: '/curriculum/:path*', destination: `${TUTOR_DEV}/curriculum/:path*` },
  // App routes
  { source: '/student', destination: `${TUTOR_DEV}/student` },
  { source: '/student/:path*', destination: `${TUTOR_DEV}/student/:path*` },
  { source: '/teacher', destination: `${TUTOR_DEV}/teacher` },
  { source: '/teacher/:path*', destination: `${TUTOR_DEV}/teacher/:path*` },
  { source: '/admin', destination: `${TUTOR_DEV}/admin` },
  { source: '/admin/:path*', destination: `${TUTOR_DEV}/admin/:path*` },
  { source: '/dev/:path*', destination: `${TUTOR_DEV}/dev/:path*` },
]

const nextConfig = {
  // FRONTEND-ONLY: firebase-admin removed from this extraction.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Parent ~/package-lock.json confuses Next workspace-root inference (do not use turbopack.root — breaks Tailwind CSS resolve).
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: [
    '127.0.0.1:3000',
    'localhost:3000',
    '127.0.0.1:3010',
    'localhost:3010',
    '127.0.0.1:3020',
    'localhost:3020',
    '127.0.0.1:5173',
    'localhost:5173',
    '127.0.0.1:5183',
    'localhost:5183',
    '127.0.0.1:5193',
    'localhost:5193',
    '127.0.0.1:4173',
    'localhost:4173',
  ],
  async rewrites() {
    if (enableTutorProxy) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[next.config] Tutor proxy enabled → ${TUTOR_DEV} (${tutorDevRewrites.length} rewrite rules)`,
        )
      }
      return { beforeFiles: tutorDevRewrites }
    }
    return []
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
}

export default nextConfig
