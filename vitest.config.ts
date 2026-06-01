import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    include: ['test/spec/**/*.{js,ts}'],
    setupFiles: ['./test/spec_helpers.ts'],
  },
});
