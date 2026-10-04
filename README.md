# Jam2D

A tiny, dependency-free pixel game engine for game jams.

- **Tiny:** about 7 kB gzipped, including a built-in pixel font, and no dependencies.
- **Pixel-perfect:** renders at a low resolution (160×144 by default) and scales up by whole pixels.
- **Fast:** a WebGL2 sprite batcher that draws a whole screen in a few draw calls.
- **Just enough:** scenes, animated sprites, text, tilemaps with collision, timers, keyboard input and a camera.

## Install

```bash
pnpm add jam2d
```

npm and yarn work too. Jam2D is written in TypeScript and ships its own types. Any bundler that handles image imports works, such as [Vite](https://vite.dev).

## Quick start

A sprite that walks around with the arrow keys:

```ts
import { Game, Label, Scene, Sheet, Sprite } from "jam2d";
import heroUrl from "./hero.png";

class Hero extends Sprite<"idle" | "walk"> {
  constructor() {
    super(
      Sheet.from(heroUrl, 8),
      {
        idle: { frames: [0, 1], frameMS: 400 },
        walk: { frames: [2, 3, 4, 5] },
      },
      "idle",
    );
  }

  update(deltaMS: number): void {
    const { input } = this.game;

    this.x += input.x * 0.05 * deltaMS;
    this.y += input.y * 0.05 * deltaMS;

    if (input.x !== 0) this.flip = input.x < 0;
    this.play(input.x || input.y ? "walk" : "idle");
  }
}

class Level extends Scene {
  init(): void {
    const hero = this.add(new Hero());
    hero.x = this.game.width / 2;
    hero.y = this.game.height / 2;

    this.add(new Label("arrows to move", { x: 4, y: 4 }));
  }
}

const game = new Game();
await game.init({ assets: [heroUrl] });
game.switch(new Level());
```

`hero.png` is a sprite sheet of 8×8 cells, numbered left to right, top to bottom.

## Core ideas

### Game

`Game` creates the canvas, loads your images and runs the game loop.

```ts
await game.init({
  width: 160,          // game resolution, in pixels
  height: 144,
  background: 0x49a269,
  assets: [heroUrl, tilesUrl],
});
```

Every image your game uses must be listed in `assets`, so it's ready before the first scene starts. `game.width`, `game.height` and `game.input` are available everywhere.

### Scene

A scene is one screen or level. Build it in `init()`, and clean up in `deinit()` if you need to. `game.switch(scene)` changes scenes between frames.

```ts
class Level extends Scene {
  init(): void {
    this.add(new Hero());
  }

  update(): void {
    const hero = this.all(Hero)[0];
    this.camera.x = hero.x - this.game.width / 2;
  }
}
```

- **`add(entity)`** puts an entity in the scene, and **`remove(entity)`** takes it out. A removed entity stops updating and drawing right away.
- **`all(Type)`** returns every entity of that class.
- **`camera`** scrolls the world. Each entity's `scroll` sets how much the camera moves it: 1 by default, 0 for a HUD, and something like 0.5 for a parallax background. Collision ignores `scroll`, so keep anything solid at 1.
- **`timers`** belong to the scene, and stop when you switch away.

### Entity

The base of everything in a scene: `Sprite`, `Label` and `Tilemap` all extend it. Every entity has:

- `x`, `y`, `layer`, `visible` and `scroll`
- `update(deltaMS)`, called every frame
- `init()` and `deinit()`, called when it's added to or removed from a scene
- `timers`, which stop when the entity is removed
- `this.scene` and `this.game`

**Draw order:** entities draw by `layer`, lowest first. Within a layer, they draw in the order they were added. Put a tilemap on a lower layer than your sprites to keep it behind them.

### Sprite

An animated image from a sprite sheet, positioned by its center.

- **`play(state)`** switches animation. Each state lists sheet cells and `frameMS`, how long each frame shows (default 100).
- **`flip`** mirrors it horizontally.
- **`body`** is its hitbox, a `Rect` relative to its center. By default it's the size of one cell.

### Label

Text in the built-in [monogram](https://datagoblin.itch.io/monogram) pixel font. Each character is 6×12 pixels, and `\n` starts a new line.

```ts
Label.defaultOptions.fill = 0xa2ffcb; // default color for every label

const score = this.add(new Label("score: 0", { x: 4, y: 4, scroll: 0 }));
score.text = "score: 10";
```

### Tilemap

A level drawn with ASCII art. `legend` maps characters to sheet cells, or to an animation like a sprite's, and `solid` lists the characters that block movement.

```ts
this.add(
  new Tilemap(
    Sheet.from(tilesUrl, 8),
    [
      "##########",
      "#........#",
      "#..^^.~~~#",
      "##########",
    ],
    {
      legend: { "#": 1, "^": 2, "~": { frames: [3, 4, 5], frameMS: 250 } },
      solid: "#",
    },
  ),
);
```

Animated tiles with the same character stay in sync.

Move sprites through it so walls stop them:

```ts
const level = this.scene.all(Tilemap)[0];

level.moveX(this, dx); // returns true if a wall stopped it
level.moveY(this, dy);

if (level.touches(this, "^")) this.die(); // any character works as a trigger
```

`at(x, y)` returns the character at a point. Move a tilemap with `x` and `y`; collision moves with it.

### Collision

`collide(solid, mover)` pushes `mover` out of `solid`, and returns which side of the mover hit: `"left"`, `"right"`, `"top"`, `"bottom"`, or `null`.

```ts
for (const crate of this.scene.all(Crate)) {
  if (collide(crate, this, level) === "bottom") this.grounded = true;
}
```

Pass the tilemap as the third argument so the push never goes into a wall.

### Input

Retro console-style controls (a d-pad plus A, B, Start and Select), read with `game.input`:

| Control | Keys |
| --- | --- |
| `left` `right` `up` `down` | arrow keys or WASD |
| `a` | Z or Space |
| `b` | X |
| `start` | Enter |
| `select` | Shift |

- **`held(control)`** is true while it's down.
- **`pressed(control)`** and **`released(control)`** are true on the frame it changes.
- **`x`** and **`y`** are -1, 0 or 1 for the direction keys.

### Timers

```ts
this.timers.after(1000, () => this.explode());
const stop = this.timers.every(250, () => (this.visible = !this.visible));
stop(); // cancels a timer
```

`timers.elapsed` is how long, in ms, an entity or scene has been running. To animate your own entities, `frameAt(animation, timers.elapsed)` returns the sheet cell to draw. To start an animation from its first frame, save `timers.elapsed` when it starts and pass `timers.elapsed - start` instead.

## Example

The repo includes a few small examples: a platformer, snake and falldown. To open them:

```bash
pnpm install
pnpm dev
```

## Browser support

Any browser with WebGL2, which covers all current desktop and mobile browsers.

## Credits

- [monogram](https://datagoblin.itch.io/monogram) by datagoblin - the built-in font (CC0).

## License

MIT
