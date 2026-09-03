import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    coverage: {
      include: ['src/domain/**/*.ts', 'server/**/*.ts'],
      exclude: ['server/index.ts', '**/*.test.ts'],
    },
  },
});

