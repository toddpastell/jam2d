import { load } from "./assets";
import type { Entity } from "./entity";
import { Input } from "./input";
import monogramUrl from "./monogram.png";
import { Renderer } from "./renderer";
import type { Scene } from "./scene";

export interface GameOptions {
  width?: number;
  height?: number;
  background?: number;
  assets?: string[];
}

function sortByLayer(entities: Entity[]): void {
  for (let i = 1; i < entities.length; i++) {
    const entity = entities[i];
    let j = i - 1;

    while (j >= 0 && entities[j].layer > entity.layer) {
      entities[j + 1] = entities[j];
      j--;
    }

    entities[j + 1] = entity;
  }
}

export class Game {
  readonly canvas = document.createElement("canvas");
  readonly input = new Input();

  background = 0x000000;

  private renderer!: Renderer;
  private current: Scene | null = null;
  private next: Scene | null = null;
  private last = 0;
  private handle = 0;

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  async init({
    width = 160,
    height = 144,
    background = 0x000000,
    assets = [],
  }: GameOptions = {}): Promise<void> {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.imageRendering = "pixelated";
    this.background = background;
    this.renderer = new Renderer(this.canvas);

    document.body.appendChild(this.canvas);

    await load([...assets, monogramUrl]);

    this.input.init();

    window.addEventListener("resize", this.onResize);
    this.onResize();

    this.last = performance.now();
    this.handle = requestAnimationFrame(this.frame);
  }

  deinit(): void {
    cancelAnimationFrame(this.handle);
    this.input.deinit();
    window.removeEventListener("resize", this.onResize);

    this.next = null;
    this.unload();
    this.canvas.remove();
  }

  switch(next: Scene): void {
    this.next = next;
  }

  private enter(): void {
    const next = this.next;
    if (!next) return;

    this.next = null;
    this.unload();

    this.current = next;
    next.game = this;
    next.init();
  }

  private unload(): void {
    const scene = this.current;
    if (!scene) return;

    for (const entity of scene.entities) entity.deinit();

    scene.deinit();
    scene.reset();
    this.current = null;
  }

  private frame = (time: number): void => {
    this.handle = requestAnimationFrame(this.frame);

    const deltaMS = Math.min(time - this.last, 100);
    this.last = time;

    this.enter();
    this.update(deltaMS);
    this.render();
  };

  private update(deltaMS: number): void {
    this.input.poll();

    const scene = this.current;
    if (!scene) return;

    const { entities } = scene;
    const count = entities.length;

    for (let i = 0; i < count; i++) {
      const entity = entities[i];
      if (entity.removed) continue;

      entity.timers.update(deltaMS);
      entity.update(deltaMS);
    }

    scene.timers.update(deltaMS);
    scene.update(deltaMS);
    scene.prune();
  }

  private render(): void {
    const { renderer } = this;

    renderer.begin(this.background);

    const scene = this.current;

    if (scene) {
      const { x, y } = scene.camera;

      sortByLayer(scene.entities);

      for (const entity of scene.entities) {
        if (!entity.visible) continue;

        entity.draw(
          renderer,
          Math.round(x * entity.scroll),
          Math.round(y * entity.scroll),
        );
      }
    }

    renderer.end();
  }

  private onResize = (): void => {
    const ratio = window.devicePixelRatio || 1;
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (window.innerWidth * ratio) / this.width,
          (window.innerHeight * ratio) / this.height,
        ),
      ),
    );

    this.canvas.style.width = `${(this.width * scale) / ratio}px`;
    this.canvas.style.height = `${(this.height * scale) / ratio}px`;
  };
}
