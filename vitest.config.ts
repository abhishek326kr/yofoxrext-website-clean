import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/hooks': path.resolve(__dirname, './app/hooks'),
    },
  },
});
