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
  await expect(page.locator('#clock')).not.toHaveText('30:00', { timeout: 5000 });
  await page.locator('#start').click();
  await expect(page.locator('#start')).toContainText('계속하기');
  await page.locator('#reset').click();
  await expect(page.locator('#clock')).toHaveText('30:00');
});

test('cancelled restore preserves existing journal', async ({ page }) => {
  const original = '기존 기록은 유지되어야 합니다';
  await page.locator('#journalArea').fill(original);
  await page.locator('#save').click();
  const backup = {
    format: 'mind-search-backup',
    version: 1,
    data: {
      sessions: [],
      entries: [{ time: new Date().toISOString(), text: '덮어쓸 기록' }],
      tasks: {},
    },
  };
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#restoreFile').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator('#entries')).toContainText(original);
  await expect(page.locator('#entries')).not.toContainText('덮어쓸 기록');
  await page.reload();
  await expect(page.locator('#entries')).toContainText(original);
});

test('invalid backup cannot overwrite existing journal', async ({ page }) => {
  const original = '안전하게 남는 일지';
  await page.locator('#journalArea').fill(original);
  await page.locator('#save').click();
  await page.locator('#restoreFile').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"mind-search-backup","version":99,"data":{}}'),
  });
  await expect(page.locator('#entries')).toContainText(original);
  await page.reload();
  await expect(page.locator('#entries')).toContainText(original);
});

test('TXT export downloads saved journal', async ({ page }) => {
  const message = 'TXT 내보내기 확인';
  await page.locator('#journalArea').fill(message);
  await page.locator('#save').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mind-search-journal.txt');
  const fs = require('node:fs');
  expect(fs.readFileSync(await download.path(), 'utf8')).toContain(message);
});

test('timer catches up after background and records completed session', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-08T09:00:00') });
  await page.locator('#start').click();
  await page.clock.fastForward('30:00');
  await expect(page.locator('#sessions')).toHaveText('1회');
  await expect(page.locator('#clock')).toHaveText('00:00');
  await page.reload();
  await expect(page.locator('#sessions')).toHaveText('1회');
});
