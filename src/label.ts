import { Entity } from "./entity";
import monogramUrl from "./monogram.png";
import type { Renderer } from "./renderer";
import { Sheet } from "./sheet";

const FIRST_CHAR = 32;
const NEWLINE = 10;

export interface LabelOptions {
  x?: number;
  y?: number;
  fill?: number;
  layer?: number;
  scroll?: number;
}

export class Label extends Entity {
  static defaultOptions: LabelOptions = { fill: 0xffffff };

  text: string;
  fill: number;

  private readonly sheet = Sheet.from(monogramUrl, 6, 12);

  constructor(text: string, options: LabelOptions = {}) {
    super();

    const defaults = new.target.defaultOptions;

    this.text = text;
    this.fill = options.fill ?? defaults.fill ?? 0xffffff;
    this.x = options.x ?? defaults.x ?? this.x;
    this.y = options.y ?? defaults.y ?? this.y;
    this.layer = options.layer ?? defaults.layer ?? this.layer;
    this.scroll = options.scroll ?? defaults.scroll ?? this.scroll;
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    const { sheet, text } = this;
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
          sheet,
          code - FIRST_CHAR,
          this.x + column * sheet.cellWidth - cameraX,
          this.y + row * sheet.cellHeight - cameraY,
          false,
          this.fill,
        );
      }

      column++;
    }
  }
}
