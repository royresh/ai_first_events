import { defineConfig } from 'vitest/config';

// Integration tests share one real database (aifirst_test), so test files run one at a time.
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    globalSetup: ['test/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
