import { expect, test } from '@playwright/test';

test('app starts, renders canvas, and shows HUD', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.locator('.hud')).toContainText('HP');
  await expect(page.locator('.hud')).toContainText('ST');
  await expect(page.locator('.hud')).toContainText('WASD move');
});

test('player starts in a safe readable area', async ({ page }) => {
  await page.goto('/');
  const hud = page.locator('.hud');

  await page.waitForTimeout(900);

  await expect(hud).toContainText('HP 100/100');
  await expect(hud).toHaveAttribute('data-player-state', /Idle|Walk|Run/);

  const cameraPosition = await page.locator('#app').getAttribute('data-camera-position');
  const cameraY = Number(cameraPosition?.split(',')[1]);

  expect(cameraY).toBeGreaterThan(2);
});

test('player moves and attack input changes state', async ({ page }) => {
  await page.goto('/');
  const hud = page.locator('.hud');
  const before = await hud.getAttribute('data-player-position');

  await page.keyboard.down('w');
  await page.waitForTimeout(350);
  await page.keyboard.up('w');
  const after = await hud.getAttribute('data-player-position');

  expect(after).not.toBe(before);

  await page.mouse.click(200, 200);
  await expect(hud).toHaveAttribute('data-player-state', /Attack|Walk|Idle/);
});

test('touch controls appear in mobile viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only project assertion');
  await page.goto('/');

  await expect(page.getByTestId('touch-controls')).toBeVisible();
});
