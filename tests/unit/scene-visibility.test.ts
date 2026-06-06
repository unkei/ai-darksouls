import { describe, expect, it } from 'vitest';
import { createSceneLightingConfig } from '../../src/game/Scene';
import { texturePathFor } from '../../src/game/GeneratedTextures';

describe('Scene visibility', () => {
  it('keeps the starting view bright enough to read surfaces', () => {
    const config = createSceneLightingConfig();

    expect(config.toneMappingExposure).toBeGreaterThanOrEqual(2.1);
    expect(config.fogDensity).toBeLessThanOrEqual(0.022);
    expect(config.hemisphereIntensity).toBeGreaterThanOrEqual(1.2);
    expect(config.ambientIntensity).toBeGreaterThanOrEqual(0.75);
    expect(config.torchIntensity).toBeGreaterThanOrEqual(2.4);
  });

  it('uses cropped generated texture files so wall and floor detail can repeat clearly', () => {
    expect(texturePathFor('wall')).toBe('/assets/textures/hollow-keep-wall.png');
    expect(texturePathFor('floor')).toBe('/assets/textures/hollow-keep-floor.png');
    expect(texturePathFor('armor')).toBe('/assets/textures/hollow-keep-armor.png');
    expect(texturePathFor('backdrop')).toBe('/assets/textures/hollow-keep-backdrop.png');
  });
});
