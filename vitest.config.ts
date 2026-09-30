import { defineConfig } from 'vitest/config';

// Offline by default: no wallet, secrets, env-file loading, node or proof server.
// Network tests require an explicit opt-in via npm run test:integration.
const integration = process.env['CAIRN_INTEGRATION'] === '1';
export default defineConfig({
  test: {
    environment: 'node',
    include: integration ? ['src/test/*.integration.test.ts'] : ['src/test/*.unit.test.ts'],
    testTimeout: integration ? 10 * 60_000 : 10_000,
    hookTimeout: integration ? 90 * 60_000 : 10_000,
    fileParallelism: !integration,
    sequence: { concurrent: false },
  },
});
