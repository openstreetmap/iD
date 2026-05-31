import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    css: true,
    environment: 'jsdom',
    execArgv: [
        '--localstorage-file',
        path.resolve(os.tmpdir(), `vitest-${process.pid}.localstorage`),
    ],
    globals: true,
    include: ['test/spec/**/*.{js,ts}'],
    setupFiles: ['./test/spec_helpers.ts'],
  },
});
