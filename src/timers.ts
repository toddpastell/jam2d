import { type Ease, ease as eases } from "./ease";
import { lerp } from "./math";

export type TweenOptions = {
  ease?: keyof typeof eases | Ease;
  done?: () => void;
};

interface Tween {
  target: Record<string, number>;
  keys: string[];
  from: number[];
  to: number[];
  ease: Ease;
}

interface Timer {
  delay: number;
  remaining: number;
  repeat: boolean;
  done: boolean;
  callback?: () => void;
  tween?: Tween;
}

export class Timers {
  elapsed = 0;

  private readonly timers: Timer[] = [];

  after(delay: number, callback: () => void): () => void {
    return this.add(delay, false, callback);
  }

  every(delay: number, callback: () => void): () => void {
    return this.add(delay, true, callback);
  }

  tween<T extends object>(
    target: T,
    to: { [K in keyof T]?: number },
    ms: number,
    { ease = "linear", done }: TweenOptions = {},
  ): () => void {
    const values = target as Record<string, number>;
    const ends = to as Record<string, number>;
    const keys = Object.keys(ends);

    return this.add(Math.max(ms, 0), false, done, {
      target: values,
      keys,
      from: keys.map((key) => values[key]),
      to: keys.map((key) => ends[key]),
      ease: typeof ease === "string" ? eases[ease] : ease,
    });
  }

  clear(): void {
    for (const timer of this.timers) timer.done = true;
  }

  update(deltaMS: number): void {
    this.elapsed += deltaMS;

    const { timers } = this;
    const count = timers.length;

    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const timer = timers[i];
      if (timer.done) continue;

      timer.remaining -= deltaMS;

      if (timer.tween) step(timer.tween, 1 - timer.remaining / timer.delay);

      if (timer.remaining > 0) continue;

      if (timer.repeat) timer.remaining += timer.delay;
      else timer.done = true;

      timer.callback?.();
    }

    let kept = 0;

    for (let i = 0; i < timers.length; i++) {
      if (!timers[i].done) timers[kept++] = timers[i];
    }

    timers.length = kept;
  }

  private add(
    delay: number,
    repeat: boolean,
    callback?: () => void,
    tween?: Tween,
  ): () => void {
    const timer = {
      delay,
      remaining: delay,
      repeat,
      done: false,
      callback,
      tween,
    };

    this.timers.push(timer);

    return () => {
      timer.done = true;
    };
  }
}

// At the end it lands exactly on `to`, so grid moves don't drift.
function step({ target, keys, from, to, ease }: Tween, t: number): void {
  const eased = t < 1 ? ease(t) : 1;

  for (let i = 0; i < keys.length; i++) {
    target[keys[i]] = t < 1 ? lerp(from[i], to[i], eased) : to[i];
  }
}
