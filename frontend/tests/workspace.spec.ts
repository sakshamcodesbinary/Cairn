import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/prove', '/registry', '/admin', '/docs'];

test('overview, theme persistence, navigation and wallet absence', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Access is personal');
  await expect(page.locator('.summit-image')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to night mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No Midnight wallet detected');
  await page.getByRole('button', { name: 'Dismiss wallet error' }).click();
  await page.getByRole('link', { name: 'Use your invitation' }).click();
  await expect(page).toHaveURL(/\/prove$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your invitation');
  await expect(page.getByRole('button', { name: 'Connect wallet to continue' })).toBeVisible();
});

test('active addresses are network scoped and invalid input is rejected', async ({ page }) => {
  await page.goto('/registry');
  await page.getByRole('button', { name: 'Set address', exact: true }).click();
  await page.getByLabel('Contract address', { exact: true }).first().fill('not-an-address');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('64-character');
  await page.getByLabel('Contract address', { exact: true }).first().fill('ab'.repeat(32));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy active gate address' })).toBeVisible();
  await page.getByLabel('Active network').selectOption('preprod');
  await expect(page.getByText('No deployment selected')).toBeVisible();
  await page.getByLabel('Active network').selectOption('preview');
  await expect(page.getByRole('button', { name: 'Copy active gate address' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByText('No deployment selected')).toBeVisible();
});

test('secure generation and backup gate deployment without faking a wallet', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Deploy gate', exact: true })).toBeDisabled();
  await page.getByLabel(/^Gate name/).fill('Field circle');
  await page.getByRole('button', { name: 'Generate secure credentials' }).click();
  const input = page.getByLabel('Invitation secret', { exact: true });
  await expect(input).toHaveAttribute('type', 'password');
  expect(await input.inputValue()).toMatch(/^[a-f0-9]{64}$/);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private admin backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('cairn-admin-backup.json');
  await page.getByLabel('I saved this unencrypted backup securely. Cairn cannot recover it.').check();
  await expect(page.getByRole('button', { name: 'Deploy gate', exact: true })).toBeDisabled();
  await page.getByLabel('Active network').selectOption('preprod');
  await expect(input).toHaveValue('');
});

test('unknown paths have a useful 404', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This path ends here.');
  await page.getByRole('link', { name: 'Return to overview' }).click();
  await expect(page).toHaveURL('/');
});

for (const width of [375, 768, 1440]) {
  test(`all routes fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
    if (width < 901) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Overview', exact: true }).click();
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
    }
  });
}
for (const theme of ['day', 'night']) {
  test(`core pages meet automated accessibility checks in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('cairn:theme:v1', value), theme);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(scan.violations, `${route}: ${JSON.stringify(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))}`).toEqual([]);
    }
  });
}

test('reduced-motion users can navigate without forced animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.getByRole('link', { name: 'Understand the privacy boundary' }).click();
  await expect(page).toHaveURL('/docs#privacy');
  await expect(page.getByRole('heading', { name: 'The privacy boundary.' })).toBeVisible();
});
