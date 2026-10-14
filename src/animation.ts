export type Animation = {
  frames: number[];
  frameMS?: number;
  loop?: boolean;
};

export function frameAt(
  { frames, frameMS = 100, loop = true }: Animation,
  elapsedMS: number,
): number {
  const frame = Math.floor(elapsedMS / frameMS);

  return frames[
    loop ? frame % frames.length : Math.min(frame, frames.length - 1)
  ];
}

export function finished(
  { frames, frameMS = 100, loop = true }: Animation,
  elapsedMS: number,
): boolean {
  return !loop && elapsedMS >= frames.length * frameMS;
}
