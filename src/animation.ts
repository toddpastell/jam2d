export type Animation = {
  frames: number[];
  frameMS?: number;
};

export function frameAt(
  { frames, frameMS = 100 }: Animation,
  elapsedMS: number,
): number {
  return frames[Math.floor(elapsedMS / frameMS) % frames.length];
}
