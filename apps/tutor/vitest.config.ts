import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/features/curriculum/data/seniorStreams.ts',
        'src/features/dashboard/lib/dashboardMode.ts',
        'src/utils/diagramAssetUrl.ts',
        'src/utils/imageVision.ts',
        'src/lib/demoRoleElevation.ts',
        'src/features/competitive/lib/competitiveRoute.ts',
      ],
    },
  },
});
