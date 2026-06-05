export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const length2 = (v: Vec2): number => Math.hypot(v.x, v.y);
export const length3 = (v: Vec3): number => Math.hypot(v.x, v.y, v.z);

export const normalize2 = (v: Vec2): Vec2 => {
  const length = length2(v);
  return length > 0.0001 ? { x: v.x / length, y: v.y / length } : vec2();
};

export const normalize3 = (v: Vec3): Vec3 => {
  const length = length3(v);
  return length > 0.0001 ? { x: v.x / length, y: v.y / length, z: v.z / length } : vec3();
};

export const distance3 = (a: Vec3, b: Vec3): number => length3({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export const add3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const scale3 = (v: Vec3, amount: number): Vec3 => ({ x: v.x * amount, y: v.y * amount, z: v.z * amount });

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
