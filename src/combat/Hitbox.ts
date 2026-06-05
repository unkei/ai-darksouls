import { distance3, Vec3 } from '../core/Vector';

export type CircleHitbox = {
  center: Vec3;
  radius: number;
};

export const overlaps = (a: CircleHitbox, b: CircleHitbox): boolean => distance3(a.center, b.center) <= a.radius + b.radius;
