import { Game, Label, Particles, Scene, Sheet, Sprite } from "jam2d";
import worldUrl from "../assets/world.png";
import cardsUrl from "./cards.png";

const PALETTE = {
  darkest: 0x306141,
  dark: 0x49a269,
  light: 0x71e392,
  lightest: 0xa2ffcb,
} as const;

const CARD_WIDTH = 16;
const CARD_HEIGHT = 24;
const COLUMNS = 4;
const PAIRS = 8;
const GAP_X = 8;
const GAP_Y = 6;
const TOP = 20;

// Cells in cards.png: the back, the card seen side-on, then one per face.
const BACK = 0;
const EDGE = 1;
const FIRST_FACE = 2;
const FLIP_MS = 60;

class Card extends Sprite<"back" | "show" | "hide"> {
  readonly face: number;

  constructor(face: number) {
    super(
      Sheet.from(cardsUrl, CARD_WIDTH, CARD_HEIGHT),
      {
        back: { frames: [BACK] },
        show: {
          frames: [EDGE, FIRST_FACE + face],
          frameMS: FLIP_MS,
          loop: false,
        },
        hide: { frames: [EDGE, BACK], frameMS: FLIP_MS, loop: false },
      },
      "back",
    );

    this.face = face;
  }

  get faceDown(): boolean {
    return this.state === "back" || (this.state === "hide" && this.done);
  }

  contains(x: number, y: number): boolean {
    const { body } = this;

    return (
      x >= this.x + body.left &&
      x < this.x + body.right &&
      y >= this.y + body.top &&
      y < this.y + body.bottom
    );
  }
}

class Memory extends Scene {
  private readonly picked: Card[] = [];
  private moves = 0;
  private matched = 0;
  private over = false;
  private label!: Label;
  private sparkles!: Particles;

  init(): void {
    const left =
      (this.game.width - COLUMNS * CARD_WIDTH - (COLUMNS - 1) * GAP_X) / 2;
    const faces = shuffle([...Array(PAIRS).keys(), ...Array(PAIRS).keys()]);

    faces.forEach((face, i) => {
      const card = this.add(new Card(face));
      const column = i % COLUMNS;
      const row = Math.floor(i / COLUMNS);

      card.x = left + column * (CARD_WIDTH + GAP_X) + CARD_WIDTH / 2;
      card.y = TOP + row * (CARD_HEIGHT + GAP_Y) + CARD_HEIGHT / 2;
    });

    this.sparkles = this.add(
      new Particles(Sheet.from(worldUrl, 8), {
        frames: [13, 14, 15, 16],
        life: 500,
        dx: [-0.03, 0.03],
        dy: [-0.05, -0.02],
        ddy: 0.0001,
      }),
    );
    this.sparkles.layer = 1;

    this.label = this.add(new Label("moves 0", { x: 4, y: 2, layer: 2 }));
  }

  update(): void {
    const { input } = this.game;

    if (this.over) {
      if (input.pressed("click") || input.pressed("start")) {
        this.game.switch(new Memory());
      }

      return;
    }

    if (this.picked.length === 2 || !input.pressed("click")) return;

    // The camera never moves, so screen and world positions are the same.
    const { x, y } = input.pointer;
    const card = this.all(Card).find(
      (card) => card.faceDown && card.contains(x, y),
    );
    if (!card) return;

    card.play("show");
    this.picked.push(card);

    if (this.picked.length === 2) this.check();
  }

  private check(): void {
    const [a, b] = this.picked;

    this.moves++;
    this.label.text = `moves ${this.moves}`;

    if (a.face !== b.face) {
      this.timers.after(800, () => {
        a.play("hide");
        b.play("hide");
        this.picked.length = 0;
      });
      return;
    }

    this.picked.length = 0;
    this.matched++;

    this.timers.after(200, () => {
      for (const card of [a, b]) {
        card.tint = PALETTE.light;
        this.sparkles.emit(card.x, card.y, 8);
      }
    });

    if (this.matched === PAIRS) this.timers.after(800, this.win);
  }

  private win = (): void => {
    this.over = true;

    for (const card of this.all(Card)) card.visible = false;
    this.label.visible = false;

    const { width, height } = this.game;
    const text = `you win!\n${this.moves} moves\n\nclick to play again`;
    const label = this.add(new Label(text, { layer: 2 }));
    label.x = (width - label.width) / 2;
    label.y = (height - label.height) / 2;
  };
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

Label.defaultOptions.tint = PALETTE.lightest;

const game = new Game();
await game.init({
  background: PALETTE.dark,
  assets: [cardsUrl, worldUrl],
});
game.switch(new Memory());
