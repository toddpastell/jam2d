import { Game, Label, Scene, Sheet, Sprite, Tilemap } from "jam2d";
import mouseUrl from "../basic/mouse.png";
import worldUrl from "../basic/world.png";

const PALETTE = {
  darkest: 0x306141,
  dark: 0x49a269,
  light: 0x71e392,
  lightest: 0xa2ffcb,
} as const;

const CELL = 8;

const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };

const LEVEL = [
  "====================",
  "====================",
  "####################",
  ...Array.from({ length: 14 }, () => "#..................#"),
  "####################",
];

class Segment extends Sprite<"head" | "body"> {
  constructor() {
    super(
      Sheet.from(worldUrl, CELL),
      { head: { frames: [1] }, body: { frames: [4] } },
      "head",
    );
  }
}

class Mouse extends Sprite<"idle"> {
  constructor() {
    super(
      Sheet.from(mouseUrl, CELL),
      { idle: { frames: [0, 1], frameMS: 400 } },
      "idle",
    );
  }
}

class Snake extends Scene {
  private readonly segments: Segment[] = [];
  private direction = RIGHT;
  private next = RIGHT;
  private points = 0;
  private started = false;
  private over = false;

  private level!: Tilemap;
  private mouse!: Mouse;
  private score!: Label;
  private hint!: Label;

  init(): void {
    this.level = this.add(
      new Tilemap(Sheet.from(worldUrl, CELL), LEVEL, {
        legend: { "#": 1, "=": 4 },
      }),
    );

    for (let column = 6; column >= 4; column--) {
      const segment = this.add(new Segment());
      segment.layer = 1;
      place(segment, column, 9);
      this.segments.push(segment);
      if (column < 6) segment.play("body");
    }

    this.mouse = this.add(new Mouse());
    this.mouse.layer = 1;
    this.moveMouse();

    this.score = this.add(new Label("score 0", { x: 4, y: 2, layer: 2 }));
    this.hint = this.add(
      new Label("arrows to start", { x: 35, y: 100, layer: 2 }),
    );
  }

  update(): void {
    const { input } = this.game;

    if (this.over) {
      if (input.pressed("start") || input.pressed("a")) {
        this.game.switch(new Snake());
      }

      return;
    }

    if (input.pressed("left") && this.direction.x === 0) this.next = LEFT;
    if (input.pressed("right") && this.direction.x === 0) this.next = RIGHT;
    if (input.pressed("up") && this.direction.y === 0) this.next = UP;
    if (input.pressed("down") && this.direction.y === 0) this.next = DOWN;

    if (!this.started && (input.x !== 0 || input.y !== 0)) {
      this.started = true;
      this.remove(this.hint);
      this.timers.after(this.delay(), this.step);
    }
  }

  private step = (): void => {
    this.direction = this.next;

    const head = this.segments[0];
    const column = columnOf(head) + this.direction.x;
    const row = rowOf(head) + this.direction.y;
    const eating = column === columnOf(this.mouse) && row === rowOf(this.mouse);

    if (this.level.at(column * CELL, row * CELL) === "#") return this.lose();
    if (this.hits(column, row, eating)) return this.lose();

    const segment = eating ? this.add(new Segment()) : this.segments.pop()!;
    segment.layer = 1;
    segment.play("head");
    head.play("body");
    place(segment, column, row);
    this.segments.unshift(segment);

    if (eating) {
      this.points++;
      this.score.text = `score ${this.points}`;
      this.moveMouse();
    }

    this.timers.after(this.delay(), this.step);
  };

  private hits(column: number, row: number, eating: boolean): boolean {
    const length = eating ? this.segments.length : this.segments.length - 1;

    for (let i = 0; i < length; i++) {
      const segment = this.segments[i];
      if (columnOf(segment) === column && rowOf(segment) === row) return true;
    }

    return false;
  }

  private moveMouse(): void {
    let column: number;
    let row: number;

    do {
      column = 1 + Math.floor(Math.random() * 18);
      row = 3 + Math.floor(Math.random() * 14);
    } while (this.hits(column, row, true));

    place(this.mouse, column, row);
  }

  private delay(): number {
    return Math.max(60, 150 - this.points * 5);
  }

  private lose(): void {
    this.over = true;
    this.add(
      new Label("game over\npress start", { x: 47, y: 60, layer: 2 }),
    );
  }
}

function place(sprite: Sprite, column: number, row: number): void {
  sprite.x = column * CELL + CELL / 2;
  sprite.y = row * CELL + CELL / 2;
}

function columnOf(sprite: Sprite): number {
  return (sprite.x - CELL / 2) / CELL;
}

function rowOf(sprite: Sprite): number {
  return (sprite.y - CELL / 2) / CELL;
}

Label.defaultOptions.fill = PALETTE.lightest;

const game = new Game();
await game.init({
  background: PALETTE.dark,
  assets: [mouseUrl, worldUrl],
});
game.switch(new Snake());
