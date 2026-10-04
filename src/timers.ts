interface Timer {
  delay: number;
  remaining: number;
  repeat: boolean;
  done: boolean;
  callback: () => void;
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

      if (timer.remaining > 0) continue;

      if (timer.repeat) timer.remaining += timer.delay;
      else timer.done = true;

      timer.callback();
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
    callback: () => void,
  ): () => void {
    const timer = { delay, remaining: delay, repeat, done: false, callback };

    this.timers.push(timer);

    return () => {
      timer.done = true;
    };
  }
}
