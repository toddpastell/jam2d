import { type Animation, frameAt } from "./animation";
import { Entity } from "./entity";
import { random } from "./math";
import type { Renderer } from "./renderer";
import type { Sheet } from "./sheet";

export interface ParticlesOptions {
  frames: number[];
  life: number;
  dx?: [number, number];
  dy?: [number, number];
  ddx?: number;
  ddy?: number;
  capacity?: number;
}

export class Particles extends Entity {
  readonly sheet: Sheet;
  readonly life: number;
  readonly capacity: number;

  dx: [number, number];
  dy: [number, number];
  ddx: number;
  ddy: number;

  private readonly animation: Animation;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly pdx: Float32Array;
  private readonly pdy: Float32Array;
  private readonly age: Float32Array;
  private alive = 0;

  get count(): number {
    return this.alive;
  }

  constructor(
    sheet: Sheet,
    {
      frames,
      life,
      dx = [0, 0],
      dy = [0, 0],
      ddx = 0,
      ddy = 0,
      capacity = 256,
    }: ParticlesOptions,
  ) {
    super();

    this.sheet = sheet;
    this.life = life;
    this.dx = dx;
    this.dy = dy;
    this.ddx = ddx;
    this.ddy = ddy;
    this.capacity = capacity;
    this.animation = { frames, frameMS: life / frames.length };
    this.px = new Float32Array(capacity);
    this.py = new Float32Array(capacity);
    this.pdx = new Float32Array(capacity);
    this.pdy = new Float32Array(capacity);
    this.age = new Float32Array(capacity);
  }

  emit(x: number, y: number, count = 1): void {
    const { dx, dy } = this;

    for (let n = 0; n < count && this.alive < this.capacity; n++) {
      const i = this.alive++;

      this.px[i] = x;
      this.py[i] = y;
      this.pdx[i] = random(dx[0], dx[1]);
      this.pdy[i] = random(dy[0], dy[1]);
      this.age[i] = 0;
    }
  }

  clear(): void {
    this.alive = 0;
  }

  update(deltaMS: number): void {
    const { px, py, pdx, pdy, age, life } = this;
    const ddx = this.ddx * deltaMS;
    const ddy = this.ddy * deltaMS;

    for (let i = 0; i < this.alive;) {
      age[i] += deltaMS;

      if (age[i] >= life) {
        const last = --this.alive;
        px[i] = px[last];
        py[i] = py[last];
        pdx[i] = pdx[last];
        pdy[i] = pdy[last];
        age[i] = age[last];
        continue;
      }

      pdx[i] += ddx;
      pdy[i] += ddy;
      px[i] += pdx[i] * deltaMS;
      py[i] += pdy[i] * deltaMS;
      i++;
    }
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    const { sheet, animation, px, py, age } = this;

    cameraX += sheet.cellWidth / 2;
    cameraY += sheet.cellHeight / 2;

    for (let i = 0; i < this.alive; i++) {
      renderer.draw(
        sheet,
        frameAt(animation, age[i]),
        px[i] - cameraX,
        py[i] - cameraY,
        false,
        this.tint,
      );
    }
  }
}
