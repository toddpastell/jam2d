import type { Game } from "./game";
import type { Renderer } from "./renderer";
import type { Scene } from "./scene";
import { Timers } from "./timers";

export abstract class Entity {
  scene!: Scene;

  x = 0;
  y = 0;
  layer = 0;
  scroll = 1;
  visible = true;
  removed = false;

  readonly timers = new Timers();

  get game(): Game {
    return this.scene.game;
  }

  init(): void {}

  deinit(): void {}

  update(_deltaMS: number): void {}

  abstract draw(renderer: Renderer, cameraX: number, cameraY: number): void;
}
