// The Quick start from the README: a sprite that walks around with the arrow keys.
import { Game, Label, Scene, Sheet, Sprite } from "jam2d";
import heroUrl from "../assets/mouse.png";

class Hero extends Sprite<"idle" | "walk"> {
  constructor() {
    super(
      Sheet.from(heroUrl, 8),
      {
        idle: { frames: [0, 1], frameMS: 400 },
        walk: { frames: [5, 6, 7, 8, 9] },
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
