import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Three services in motion' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByText('Scenario reset')).toBeVisible();
});

test('projects immediately, contains a transient failure, and converges', async ({ page }) => {
  await page.getByRole('button', { name: 'Long tail' }).click();
  const atlas = page.locator('.release-card').filter({ hasText: 'Atlas search relevance' });

  await page.getByRole('button', { name: 'Advance to deploying' }).click();

  await expect(atlas.getByText('projected', { exact: true })).toBeVisible();
  await expect(atlas.getByText('deploying', { exact: true })).toBeVisible();
  await expect(page.getByText('Transient failure contained')).toBeVisible({ timeout: 6_000 });
  await expect(page.getByText('Retry released')).toBeVisible({ timeout: 8_000 });
  await expect(atlas.getByText('server v5', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Server truth advanced')).toBeVisible();
});

test('turns the hero promise into a one-click deterministic failure transcript', async ({ page }) => {
  await page.getByRole('button', { name: 'Run the failure path' }).click();

  await expect(page.getByText('Transient failure contained')).toBeVisible({ timeout: 6_000 });
  await expect(page.getByText('Retry released')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText('Server truth advanced')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Run the failure path' })).toBeEnabled();
});

test('restores offline intent from IndexedDB after a reload', async ({ page }) => {
  const atlas = page.locator('.release-card').filter({ hasText: 'Atlas search relevance' });
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await page.getByRole('button', { name: /Increase Atlas search relevance/ }).click();

  await expect(atlas.getByText('projected', { exact: true })).toBeVisible();
  await expect(atlas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68');
  await page.reload();

  await expect(page.getByText('Durable outbox restored')).toBeVisible();
  await expect(page.getByText('Server truth advanced')).toBeVisible({ timeout: 5_000 });
});

test('makes concurrent optimistic writes converge through explicit conflicts', async ({ page }) => {
  await page.getByRole('button', { name: 'Contention' }).click();
  const atlas = page.locator('.release-card').filter({ hasText: 'Atlas search relevance' });
  const ledger = page.locator('.release-card').filter({ hasText: 'Ledger idempotency keys' });
  const prism = page.locator('.release-card').filter({ hasText: 'Prism telemetry envelope' });
  await atlas.getByRole('button', { name: 'Advance to deploying' }).click();
  await ledger.getByRole('button', { name: 'Advance to monitoring' }).click();
  await prism.getByRole('button', { name: 'Advance to verifying' }).click();

  await expect(page.getByText('Stale intent rolled back')).toHaveCount(2, { timeout: 6_000 });
  await expect(page.getByLabel('0 active mutations')).toBeVisible();
  await expect(
    atlas.getByText('server v5'),
  ).toBeVisible();
  await expect(
    ledger.getByText('server v8'),
  ).toBeVisible();
  await expect(
    prism.getByText('server v3'),
  ).toBeVisible();
});

test('propagates newer canonical truth to another tab', async ({ page, context }) => {
  const peer = await context.newPage();
  await peer.goto('/');
  await expect(peer.getByRole('heading', { name: 'Three services in motion' })).toBeVisible();

  await page.getByRole('button', { name: 'Advance to deploying' }).click();

  const peerAtlas = peer.locator('.release-card').filter({ hasText: 'Atlas search relevance' });
  await expect(peerAtlas.getByText('server v5')).toBeVisible({ timeout: 3_000 });
  await expect(peer.getByText('Cross-tab truth merged')).toBeVisible();
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('stays usable and overflow-free at a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Act now. Reconcile truth later.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter command deck' })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole('link', { name: 'Enter command deck' }).click();
  await expect(page.getByRole('heading', { name: 'Break the network. Keep the intent.' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
