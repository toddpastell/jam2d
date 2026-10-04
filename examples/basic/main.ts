import { collide, Game, Label, Scene, Sheet, Sprite, Tilemap } from "jam2d";
import mouseUrl from "./mouse.png";
import worldUrl from "./world.png";

const PALETTE = {
  darkest: 0x306141,
  dark: 0x49a269,
  light: 0x71e392,
  lightest: 0xa2ffcb,
} as const;

const SPEED = 0.05;
const GRAVITY = 0.0006;
const JUMP = 0.2;
const MAX_FALL = 0.25;

const LEVEL = [
  "################################",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#.....##..............##.......#",
  "#.....##.......#......##.......#",
  "#..............#...............#",
  "#..............#.........#.....#",
  "#........................#.....#",
  "#..............................#",
  "#..............................#",
  "#.....####.....................#",
  "#..............................#",
  "#..........####.........####...#",
  "#..............................#",
  "#..............................#",
  "#.......##.............#.......#",
  "#......................#.......#",
  "#...().............()..........#",
  "#..(==)#~~~~~~~~#.(==).........#",
  "#======#wwwwwwww#==============#",
  "################################",
];

const HILLS = [
  ".............()...........",
  "..()........(==)..........",
  ".(==)..()..(====)..()..().",
  "(====)(==)(======)(==)(==)",
];

class Player extends Sprite<"idle" | "walk"> {
  vy = 0;
  grounded = false;

  constructor() {
    super(
      Sheet.from(mouseUrl, 8),
      {
        idle: { frames: [0, 1], frameMS: 400 },
        walk: { frames: [5, 6, 7, 8, 9] },
      },
      "idle",
    );
  }

  update(deltaMS: number): void {
    const { input } = this.game;
    const level = this.scene.all(Tilemap)[0];

    if (this.grounded && input.pressed("a")) this.vy = -JUMP;
    this.vy = Math.min(this.vy + GRAVITY * deltaMS, MAX_FALL);

    level.moveX(this, input.x * SPEED * deltaMS);

    this.grounded = false;

    if (level.moveY(this, this.vy * deltaMS)) {
      this.grounded = this.vy > 0;
      this.vy = 0;
    }

    for (const statue of this.scene.all(Statue)) {
      const side = collide(statue, this, level);

      if (side === "bottom") this.grounded = true;
      if (side === "bottom" || side === "top") this.vy = 0;
    }

    if (input.x !== 0) this.flip = input.x < 0;

    this.play(input.x ? "walk" : "idle");
  }
}

class Statue extends Sprite<"idle"> {
  constructor() {
    super(Sheet.from(mouseUrl, 8), { idle: { frames: [0] } }, "idle");
  }
}

class Example extends Scene {
  init(): void {
    const { width, height } = this.game;

    this.add(
      new Tilemap(Sheet.from(worldUrl, 8), LEVEL, {
        legend: {
          "#": 1,
          "(": 2,
          ")": 3,
          "=": 4,
          "~": { frames: [5, 6, 7, 8], frameMS: 250 },
          w: 9,
        },
        solid: "#=",
      }),
    );

    // Added after the level, so all(Tilemap)[0] is still the level.
    const hills = this.add(
      new Tilemap(Sheet.from(worldUrl, 8), HILLS, {
        legend: { "(": 10, ")": 11, "=": 12 },
      }),
    );
    hills.y = 112;
    hills.scroll = 0.5;
    hills.layer = -1;

    const statue = this.add(new Statue());
    statue.x = width / 2 - 24;
    statue.y = height / 2;
    statue.layer = 1;

    const player = this.add(new Player());
    player.x = width / 2;
    player.y = height / 2;
    player.layer = 1;

    const label = this.add(
      new Label("hello, mouse!", { x: 12, y: 8, layer: 2, scroll: 0 }),
    );

    const stop = label.timers.every(250, () => {
      label.visible = !label.visible;
    });

    label.timers.after(3000, () => {
      stop();
      label.visible = true;
      label.text = "go explore!";
    });
  }

  update(): void {
    const { width, height } = this.game;
    const player = this.all(Player)[0];
    const level = this.all(Tilemap)[0];

    this.camera.x = Math.max(
      0,
      Math.min(player.x - width / 2, level.width - width),
    );
    this.camera.y = Math.max(
      0,
      Math.min(player.y - height / 2, level.height - height),
    );
  }
}

Label.defaultOptions.fill = PALETTE.lightest;

const game = new Game();
await game.init({
  background: PALETTE.dark,
  assets: [mouseUrl, worldUrl],
});
game.switch(new Example());
