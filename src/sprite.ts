import { type Animation, frameAt } from "./animation";
import { Entity } from "./entity";
import { Rect } from "./rect";
import type { Renderer } from "./renderer";
import type { Sheet } from "./sheet";

export abstract class Sprite<State extends string = string> extends Entity {
  protected readonly sheet: Sheet;
  protected readonly animations: Record<State, Animation>;

  state: State;
  flip = false;
  body: Rect;

  private started = 0;

  constructor(
    sheet: Sheet,
    animations: Record<State, Animation>,
    initialState: State,
  ) {
    super();

    this.sheet = sheet;
    this.animations = animations;
    this.state = initialState;
    this.body = new Rect(
      -sheet.cellWidth / 2,
      -sheet.cellHeight / 2,
      sheet.cellWidth,
      sheet.cellHeight,
    );
  }

  play(state: State) {
    if (state === this.state) return;

    this.state = state;
    this.started = this.timers.elapsed;
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    const { cellWidth, cellHeight } = this.sheet;

    renderer.draw(
      this.sheet,
      frameAt(
        this.animations[this.state],
        this.timers.elapsed - this.started,
      ),
      this.x - cellWidth / 2 - cameraX,
      this.y - cellHeight / 2 - cameraY,
      this.flip,
    );
  }
}
