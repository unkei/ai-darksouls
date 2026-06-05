import * as THREE from 'three';

const ATLAS_URL = '/assets/textures/hollow-keep-generated-atlas.png';
type AtlasQuadrant = 'wall' | 'floor' | 'armor' | 'backdrop';

export const createAtlasTexture = (
  quadrant: AtlasQuadrant,
  repeat: [number, number] = [1, 1],
): THREE.Texture => {
  const texture = new THREE.TextureLoader().load(ATLAS_URL);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0] * 0.5, repeat[1] * 0.5);
  const offsets = {
    wall: [0, 0.5],
    floor: [0.5, 0.5],
    armor: [0, 0],
    backdrop: [0.5, 0],
  } satisfies Record<AtlasQuadrant, [number, number]>;
  texture.offset.set(offsets[quadrant][0], offsets[quadrant][1]);
  return texture;
};
