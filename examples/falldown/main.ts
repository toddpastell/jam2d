import {
  Entity,
  Game,
  Label,
  Rect,
  type Renderer,
  Scene,
  Sheet,
  Sprite,
} from "jam2d";
import mouseUrl from "../basic/mouse.png";
import worldUrl from "../basic/world.png";

const PALETTE = {
  darkest: 0x306141,
  dark: 0x49a269,
  light: 0x71e392,
  lightest: 0xa2ffcb,
} as const;

const CELL = 8;
const COLUMNS = 20;
const GAP = 2;
const SPACING = 32;
const ROWS = 6;

const RUN = 0.08;
const GRAVITY = 0.0006;
const MAX_FALL = 0.2;

class Row extends Entity {
  gap = 0;

  private readonly sheet = Sheet.from(worldUrl, CELL);

  get gapLeft(): number {
    return this.gap * CELL;
  }

  get gapRight(): number {
    return (this.gap + GAP) * CELL;
  }

  shuffle(): void {
    this.gap = Math.floor(Math.random() * (COLUMNS - GAP + 1));
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    for (let column = 0; column < COLUMNS; column++) {
      if (column >= this.gap && column < this.gap + GAP) continue;
      renderer.draw(this.sheet, 1, column * CELL - cameraX, this.y - cameraY);
    }
  }
}

class Player extends Sprite<"idle" | "walk"> {
  vy = 0;

  constructor() {
    super(
      Sheet.from(mouseUrl, CELL),
      {
        idle: { frames: [0, 1], frameMS: 400 },
        walk: { frames: [5, 6, 7, 8, 9] },
      },
      "idle",
    );

    // A little narrower than a cell, so the gaps are easier to drop through.
    this.body = new Rect(-3, -4, 6, 8);
  }

  get left(): number {
    return this.x + this.body.left;
  }

  get right(): number {
    return this.x + this.body.right;
  }

  get top(): number {
    return this.y + this.body.top;
  }

  get bottom(): number {
    return this.y + this.body.bottom;
  }

  fits(row: Row): boolean {
    return this.left >= row.gapLeft && this.right <= row.gapRight;
  }
}

class Falldown extends Scene {
  private readonly rows: Row[] = [];
  private points = 0;
  private started = false;
  private over = false;

  private player!: Player;
  private score!: Label;
  private hint!: Label;

  init(): void {
    for (let i = 0; i < ROWS; i++) {
      const row = this.add(new Row());
      row.y = 48 + i * SPACING;
      row.shuffle();
      this.rows.push(row);
    }

    this.player = this.add(new Player());
    this.player.layer = 1;
    this.player.x = this.game.width / 2;
    this.player.y = 20;

    this.score = this.add(new Label("score 0", { x: 4, y: 2, layer: 2 }));
    this.hint = this.add(
      new Label("arrows to start", { x: 35, y: 28, layer: 2 }),
    );
  }

  update(deltaMS: number): void {
    const { input, width, height } = this.game;
    const { player } = this;

    if (this.over) {
      if (input.pressed("start") || input.pressed("a")) {
        this.game.switch(new Falldown());
      }

      return;
    }

    if (!this.started) {
      if (input.x === 0) return;

      this.started = true;
      this.remove(this.hint);
    }

    // Run left and right, staying inside the gap while dropping through one.
    player.x += input.x * RUN * deltaMS;
    player.x = clamp(player.x, -player.body.left, width - player.body.right);

    for (const row of this.rows) {
      if (player.bottom > row.y + 1 && player.top < row.y + CELL) {
        player.x = clamp(
          player.x,
          row.gapLeft - player.body.left,
          row.gapRight - player.body.right,
        );
      }
    }

    // Fall.
    player.vy = Math.min(player.vy + GRAVITY * deltaMS, MAX_FALL);
    player.y += player.vy * deltaMS;

    // The rows rise, faster as the score goes up.
    const rise = Math.min(0.015 + this.points * 0.0005, 0.06) * deltaMS;

    for (const row of this.rows) {
      row.y -= rise;

      if (row.y + CELL < 0) {
        row.y += ROWS * SPACING;
        row.shuffle();
        this.points++;
        this.score.text = `score ${this.points}`;
      }
    }

    // Land on any row the player isn't lined up with a gap in.
    for (const row of this.rows) {
      const landing = player.bottom > row.y && player.y < row.y + CELL / 2;

      if (landing && !player.fits(row)) {
        player.y = row.y - player.body.bottom;
        player.vy = 0;
      }
    }

    player.y = Math.min(player.y, height - player.body.bottom);

    if (input.x !== 0) player.flip = input.x < 0;
    player.play(input.x ? "walk" : "idle");

    if (player.top < 0) this.lose();
  }

  private lose(): void {
    this.over = true;
    this.player.play("idle");
    for (const row of this.rows) row.visible = false;
    this.add(
      new Label("game over\npress start", { x: 47, y: 60, layer: 2 }),
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

Label.defaultOptions.fill = PALETTE.darkest;

const game = new Game();
await game.init({
  background: PALETTE.dark,
  assets: [mouseUrl, worldUrl],
});
game.switch(new Falldown());
