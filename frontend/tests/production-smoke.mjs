import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Run after npm run build and npm run preview (port 4173). No wallet is mocked.
const base = process.env.CAIRN_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  const wasmRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('.wasm')) wasmRequests.push(request.url()); });
  await page.goto(base);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(wasmRequests.length, 0, 'Overview must not eagerly load ledger WASM');
  assert.equal(await page.locator('.summit-image').evaluate(image => image.complete && image.naturalWidth > 0), true);
  await page.screenshot({ path: fileURLToPath(new URL('../../docs/screenshots/cairn-review-desktop.png', import.meta.url)), fullPage: true });
  await page.getByRole('button', { name: 'Switch to night mode' }).click();
  await page.screenshot({ path: fileURLToPath(new URL('../../docs/screenshots/cairn-review-night.png', import.meta.url)), fullPage: true });
  for (const route of ['/admin', '/prove', '/registry', '/docs']) {
    await page.goto(base + route);
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.ok(!await page.getByText('The trail needs a refresh.').count(), `Failed production route ${route}`);
  }
  for (const circuit of ['prove_access', 'update_gate', 'set_gate_open']) {
    for (const asset of [`keys/${circuit}.prover`, `keys/${circuit}.verifier`, `zkir/${circuit}.bzkir`]) {
      const response = await page.request.get(`${base}/managed/${asset}`);
      assert.ok(response.ok(), `Missing ${asset}`);
      assert.ok(!response.headers()['content-type']?.includes('text/html'), `SPA fallback returned for ${asset}`);
      assert.ok((await response.body()).length > 100, `Empty ${asset}`);
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: fileURLToPath(new URL('../../docs/screenshots/cairn-review-mobile.png', import.meta.url)), fullPage: true });
  assert.deepEqual(errors, [], 'Production pages raised uncaught errors');
  console.log('Production smoke passed: 5 routes, lazy WASM, 9 proving assets, mobile overflow, 0 uncaught errors.');
} finally { await browser.close(); }
