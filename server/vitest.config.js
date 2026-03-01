import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: '.',
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [fileURLToPath(new URL('./src/test/setup.js', import.meta.url))]
  }
});
