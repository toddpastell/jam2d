import { Entity } from "./entity";
import monogramUrl from "./monogram.png";
import type { Renderer } from "./renderer";
import { Sheet } from "./sheet";

const FIRST_CHAR = 32;
const NEWLINE = 10;

let monogram: Sheet | undefined;

export interface LabelOptions {
  x?: number;
  y?: number;
  tint?: number;
  layer?: number;
  scroll?: number;
  font?: Sheet;
}

export class Label extends Entity {
  static defaultOptions: LabelOptions = {};

  text: string;

  font: Sheet;

  constructor(text: string, options: LabelOptions = {}) {
    super();

    const defaults = new.target.defaultOptions;

    this.text = text;
    this.tint = options.tint ?? defaults.tint ?? this.tint;
    this.x = options.x ?? defaults.x ?? this.x;
    this.y = options.y ?? defaults.y ?? this.y;
    this.layer = options.layer ?? defaults.layer ?? this.layer;
    this.scroll = options.scroll ?? defaults.scroll ?? this.scroll;
    this.font =
      options.font ??
      defaults.font ??
      (monogram ??= Sheet.from(monogramUrl, 6, 12));
  }

  get width(): number {
    const { text } = this;
    let longest = 0;
    let column = 0;

    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === NEWLINE) column = 0;
      else longest = Math.max(longest, ++column);
    }

    return longest * this.font.cellWidth;
  }

  get height(): number {
    const { text } = this;
    let rows = 1;

    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === NEWLINE) rows++;
    }

    return rows * this.font.cellHeight;
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    const { font, text } = this;
    let column = 0;
    let row = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      if (code === NEWLINE) {
        column = 0;
        row++;
        continue;
      }

      if (code !== FIRST_CHAR) {
        renderer.draw(
          font,
          code - FIRST_CHAR,
          this.x + column * font.cellWidth - cameraX,
          this.y + row * font.cellHeight - cameraY,
          false,
          this.tint,
        );
      }

      column++;
    }
  }
}
