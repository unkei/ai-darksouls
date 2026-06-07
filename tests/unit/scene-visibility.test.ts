import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createSceneLightingConfig } from '../../src/game/Scene';
import { texturePathFor } from '../../src/game/GeneratedTextures';
import { Dungeon } from '../../src/world/Dungeon';

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

  it('adds ruined castle exterior and overgrowth details around the boss approach', () => {
    const dungeon = new Dungeon();

    expect(dungeon.group.getObjectByName('exposed-courtyard-stone')).toBeTruthy();
    expect(dungeon.group.getObjectByName('broken-castle-parapet')).toBeTruthy();
    expect(dungeon.group.getObjectByName('courtyard-weeds')).toBeTruthy();
    expect(dungeon.group.getObjectByName('open-sky-gap')).toBeTruthy();
  });

  it('exposes larger playable bounds for an expanded keep', () => {
    const dungeon = new Dungeon();

    expect(dungeon.playableBounds.maxX - dungeon.playableBounds.minX).toBeGreaterThanOrEqual(24);
    expect(dungeon.playableBounds.maxZ - dungeon.playableBounds.minZ).toBeGreaterThanOrEqual(42);
    expect(dungeon.group.getObjectByName('upper-bailey-floor')).toBeTruthy();
  });

  it('fades only dungeon blockers between the camera and player', () => {
    const dungeon = new Dungeon();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1.5, -28);
    const target = new THREE.Vector3(0, 0.7, -22);

    dungeon.updateObstructionFading(camera, target);

    const faded = dungeon.obstructionMeshes.filter((mesh) => {
      const material = mesh.material;
      return material instanceof THREE.MeshStandardMaterial && material.opacity < 1;
    });

    expect(faded.length).toBeGreaterThan(0);
    expect(faded.length).toBeLessThan(dungeon.obstructionMeshes.length);
  });

  it('fades blockers that cover nearby camera sightlines around the player', () => {
    const dungeon = new Dungeon();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(-7.8, 1.6, -8);
    const target = new THREE.Vector3(-4.2, 0.7, -8);

    dungeon.updateObstructionFading(camera, target);

    expect(
      dungeon.obstructionMeshes.some((mesh) => mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.opacity < 1),
    ).toBe(true);
  });

  it('restores faded blockers after the camera sightline clears', () => {
    const dungeon = new Dungeon();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1.5, -28);
    const blockedTarget = new THREE.Vector3(0, 0.7, -22);

    dungeon.updateObstructionFading(camera, blockedTarget);
    expect(
      dungeon.obstructionMeshes.some((mesh) => mesh.material instanceof THREE.MeshStandardMaterial && mesh.material.opacity < 1),
    ).toBe(true);

    camera.position.set(0, 4, 2);
    const clearTarget = new THREE.Vector3(0, 0.7, 2.5);
    dungeon.updateObstructionFading(camera, clearTarget);

    for (const mesh of dungeon.obstructionMeshes) {
      expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
      const material = mesh.material as THREE.MeshStandardMaterial;
      expect(material.opacity).toBe(1);
      expect(material.depthWrite).toBe(true);
    }
  });
});
