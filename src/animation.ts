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

export function duration({ frames, frameMS = 100 }: Animation): number {
  return frames.length * frameMS;
}

export function finished(animation: Animation, elapsedMS: number): boolean {
  return animation.loop === false && elapsedMS >= duration(animation);
}
