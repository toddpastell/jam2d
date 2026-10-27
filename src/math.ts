export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Includes max, so randomInt(1, 6) rolls a die.
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Blends two 0xrrggbb colors, channel by channel.
export function mix(a: number, b: number, t: number): number {
  const r = Math.round(lerp(a >> 16, b >> 16, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const blue = Math.round(lerp(a & 255, b & 255, t));

  return (r << 16) | (g << 8) | blue;
}
