import * as THREE from 'three';

type AtlasQuadrant = 'wall' | 'floor' | 'armor' | 'backdrop';
const TEXTURE_PATHS = {
  wall: '/assets/textures/hollow-keep-wall.png',
  floor: '/assets/textures/hollow-keep-floor.png',
  armor: '/assets/textures/hollow-keep-armor.png',
  backdrop: '/assets/textures/hollow-keep-backdrop.png',
} satisfies Record<AtlasQuadrant, string>;

export const texturePathFor = (quadrant: AtlasQuadrant): string => TEXTURE_PATHS[quadrant];

export const createAtlasTexture = (
  quadrant: AtlasQuadrant,
  repeat: [number, number] = [1, 1],
): THREE.Texture => {
  const texture = new THREE.TextureLoader().load(texturePathFor(quadrant));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  return texture;
};
