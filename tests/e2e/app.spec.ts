import { expect, test } from '@playwright/test';
import path from 'node:path';

declare global {
  interface Window {
    __audioProbe: {
      oscillatorStarts: number;
      gainValues: number[];
      resumes: number;
    };
  }
}

test('app starts, renders canvas, and shows HUD', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.locator('.hud')).toContainText('HP');
  await expect(page.locator('.hud')).toContainText('ST');
  await expect(page.locator('.hud')).toContainText('WASD move');
  await expect(page.locator('.boss')).toBeHidden();
});

test('player starts in a safe readable area', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('KeyE');
  const hud = page.locator('.hud');

  await page.waitForTimeout(900);

  await expect(hud).toContainText('HP 100/100');
  await expect(hud).toHaveAttribute('data-player-state', /Idle|Walk|Run/);

  const cameraPosition = await page.locator('#app').getAttribute('data-camera-position');
  const cameraY = Number(cameraPosition?.split(',')[1]);

  expect(cameraY).toBeGreaterThan(2);
});

test('play view is visually readable and captured', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.keyboard.press('KeyE');
  await page.getByTestId('game-canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(900);

  await page.screenshot({ path: path.join('test-results', `play-view-${testInfo.project.name}.png`), fullPage: true });

  const samples = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="game-canvas"]');
    if (!canvas) throw new Error('Missing game canvas');

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 160;
    sampleCanvas.height = 90;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Missing 2D context');

    context.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
    let brightPixels = 0;
    let playerBluePixels = 0;
    let variedPixels = 0;
    let totalLuma = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luma = (red + green + blue) / 3;
      totalLuma += luma;
      if (luma > 18) brightPixels += 1;
      if (blue > red * 1.08 && blue >= green && blue > 22) playerBluePixels += 1;
      if (Math.max(red, green, blue) - Math.min(red, green, blue) > 8) variedPixels += 1;
    }

    return {
      averageLuma: totalLuma / (pixels.length / 4),
      brightRatio: brightPixels / (pixels.length / 4),
      playerBlueRatio: playerBluePixels / (pixels.length / 4),
      variedRatio: variedPixels / (pixels.length / 4),
    };
  });

  expect(samples.averageLuma).toBeGreaterThan(8);
  expect(samples.brightRatio).toBeGreaterThan(0.08);
  expect(samples.variedRatio).toBeGreaterThan(0.05);
  expect(samples.playerBlueRatio).toBeGreaterThan(0.001);
});

test('player moves and attack input changes state', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('KeyE');
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

test('mobile viewport disables iOS Safari double-tap zoom', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only project assertion');
  await page.goto('/');

  const viewport = page.locator('meta[name="viewport"]');
  await expect(viewport).toHaveAttribute('content', /user-scalable=no/);
  await expect(viewport).toHaveAttribute('content', /maximum-scale=1/);
  await expect(page.locator('html')).toHaveCSS('touch-action', 'manipulation');
});

test('ending staff roll is visible and continues to a readable hold', async ({ page }, testInfo) => {
  await page.goto('/?e2eFlow=ending');

  const roll = page.locator('.credits-roll');
  await expect(page.locator('.flow-overlay')).toHaveAttribute('data-flow-state', 'Ending');
  await expect(roll).toBeVisible();
  await expect(roll).toContainText('Created by unno');

  const before = await roll.evaluate((element) => element.getAnimations()[0]?.currentTime ?? 0);
  await page.waitForTimeout(1200);
  const after = await roll.evaluate((element) => element.getAnimations()[0]?.currentTime ?? 0);
  expect(Number(after)).toBeGreaterThan(Number(before));

  await page.screenshot({ path: path.join('test-results', `ending-roll-${testInfo.project.name}.png`), fullPage: true });
});

test('generated BGM starts audible oscillator layers after interaction', async ({ page }) => {
  await page.addInitScript(() => {
    const probe = {
      oscillatorStarts: 0,
      gainValues: [] as number[],
      resumes: 0,
    };
    class MockGain {
      private gainValue = 0;
      gain = {
        get value() {
          return this.owner.gainValue;
        },
        set value(value: number) {
          this.owner.gainValue = value;
          probe.gainValues.push(value);
        },
        owner: this,
        setValueAtTime(value: number) {
          this.owner.gainValue = value;
          probe.gainValues.push(value);
        },
        exponentialRampToValueAtTime(value: number) {
          this.owner.gainValue = value;
          probe.gainValues.push(value);
        },
      };
      connect() {}
      disconnect() {}
    }
    class MockOscillator {
      type = 'sine';
      frequency = {
        value: 0,
        setValueAtTime(value: number) {
          this.value = value;
        },
        exponentialRampToValueAtTime(value: number) {
          this.value = value;
        },
      };
      connect() {}
      start() {
        probe.oscillatorStarts += 1;
      }
      stop() {}
      disconnect() {}
    }
    class MockAudioContext {
      state = 'suspended';
      destination = {};
      currentTime = 0;
      createOscillator() {
        return new MockOscillator();
      }
      createGain() {
        return new MockGain();
      }
      resume() {
        this.state = 'running';
        probe.resumes += 1;
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, '__audioProbe', { value: probe });
    Object.defineProperty(window, 'AudioContext', { value: MockAudioContext });
  });

  await page.goto('/');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(200);

  const probe = await page.evaluate(() => window.__audioProbe);
  expect(probe.oscillatorStarts).toBeGreaterThanOrEqual(4);
  expect(Math.max(...probe.gainValues)).toBeGreaterThanOrEqual(0.2);
  expect(probe.resumes).toBeGreaterThanOrEqual(1);
});
