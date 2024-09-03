import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    include: ['test/spec/**/*'],
    setupFiles: ['./test/spec_helpers.mts'],
  },
});
