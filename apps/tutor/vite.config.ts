import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { healthEndpointPlugin } from './vite-health-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * FRONTEND-ONLY extraction:
 * No /api proxy to landing backends (API routes removed).
 * Landing still rewrites /student/* → this Vite app in local monorepo.
 */
export default defineConfig({
  plugins: [react(), healthEndpointPlugin()],
  appType: 'spa',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth'],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    origin: process.env.VITE_DEV_ORIGIN || 'http://localhost:3010',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 3010),
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'tutor-assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['framer-motion'],
          'pdf-vendor': ['pdfjs-dist'],
        },
      },
    },
  },
})
