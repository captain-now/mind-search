const { test, expect } = require('@playwright/test');
const { resolve } = require('node:path');

test.beforeEach(async ({ page }) => {
  await page.goto('file://' + resolve(__dirname, '../index.html'));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('journal survives reload and backup restore roundtrip', async ({ page }) => {
  const message = '자동 브라우저 테스트 마음 일지';
  await page.locator('#journalArea').fill(message);
  await page.locator('#save').click();
  await expect(page.locator('#entries')).toContainText(message);
  await page.reload();
  await expect(page.locator('#entries')).toContainText(message);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#backup').click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(download.suggestedFilename()).toMatch(/mind-search-backup-.*\.json/);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#entries')).not.toContainText(message);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#restoreFile').setInputFiles(backupPath);
  await expect(page.locator('#entries')).toContainText(message);
  await page.reload();
  await expect(page.locator('#entries')).toContainText(message);
});

test('timer starts and can be paused and reset', async ({ page }) => {
  await expect(page.locator('#clock')).toHaveText('30:00');
  await page.locator('#start').click();
  await expect(page.locator('#start')).toContainText('일시정지');
  await page.locator('#start').click();
  await expect(page.locator('#start')).toContainText('계속하기');
  await page.locator('#reset').click();
  await expect(page.locator('#clock')).toHaveText('30:00');
});
