import { type Animation, frameAt } from "./animation";
import { Entity } from "./entity";
import type { Renderer } from "./renderer";
import type { Sheet } from "./sheet";
import type { Sprite } from "./sprite";

export interface TilemapOptions {
  legend: Record<string, number | Animation>;
  solid?: string;
}

export class Tilemap extends Entity {
  readonly sheet: Sheet;
  readonly map: string[];
  readonly columns: number;
  readonly rows: number;

  private readonly solid: string;
  private readonly cells: Int16Array;
  private readonly tiles: Animation[];
  private readonly current: Int16Array;

  constructor(
    sheet: Sheet,
    map: string[],
    { legend, solid = "" }: TilemapOptions,
  ) {
    super();

    this.sheet = sheet;
    this.map = map;
    this.solid = solid;
    this.columns = map[0].length;
    this.rows = map.length;
    this.cells = new Int16Array(this.columns * this.rows).fill(-1);
    this.tiles = Object.values(legend).map((tile) =>
      typeof tile === "number" ? { frames: [tile] } : tile,
    );
    this.current = new Int16Array(this.tiles.length);

    const chars = Object.keys(legend);

    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        const id = chars.indexOf(map[row][column]);
        if (id >= 0) this.cells[row * this.columns + column] = id;
      }
    }
  }

  get width(): number {
    return this.columns * this.sheet.cellWidth;
  }

  get height(): number {
    return this.rows * this.sheet.cellHeight;
  }

  at(x: number, y: number): string | undefined {
    const column = Math.floor((x - this.x) / this.sheet.cellWidth);
    const row = Math.floor((y - this.y) / this.sheet.cellHeight);

    return this.map[row]?.[column];
  }

  touches(sprite: Sprite, chars: string): boolean {
    const { cellWidth, cellHeight } = this.sheet;
    const { body } = sprite;
    const x = sprite.x - this.x;
    const y = sprite.y - this.y;

    const left = Math.floor((x + body.left) / cellWidth);
    const right = Math.ceil((x + body.right) / cellWidth);
    const top = Math.floor((y + body.top) / cellHeight);
    const bottom = Math.ceil((y + body.bottom) / cellHeight);

    for (let row = top; row < bottom; row++) {
      for (let column = left; column < right; column++) {
        const char = this.map[row]?.[column];
        if (char !== undefined && chars.includes(char)) return true;
      }
    }

    return false;
  }

  move(sprite: Sprite, dx: number, dy: number): void {
    this.moveX(sprite, dx);
    this.moveY(sprite, dy);
  }

  moveX(sprite: Sprite, dx: number): boolean {
    const steps = Math.floor(Math.abs(dx) / this.sheet.cellWidth) + 1;

    for (let i = 0; i < steps; i++) {
      if (this.stepX(sprite, dx / steps)) return true;
    }

    return false;
  }

  moveY(sprite: Sprite, dy: number): boolean {
    const steps = Math.floor(Math.abs(dy) / this.sheet.cellHeight) + 1;

    for (let i = 0; i < steps; i++) {
      if (this.stepY(sprite, dy / steps)) return true;
    }

    return false;
  }

  draw(renderer: Renderer, cameraX: number, cameraY: number): void {
    const { sheet, cells, tiles, current, columns, rows } = this;

    cameraX -= this.x;
    cameraY -= this.y;

    const { cellWidth, cellHeight } = sheet;
    const { width, height } = this.game;

    const left = Math.max(0, Math.floor(cameraX / cellWidth));
    const right = Math.min(columns, Math.ceil((cameraX + width) / cellWidth));
    const top = Math.max(0, Math.floor(cameraY / cellHeight));
    const bottom = Math.min(rows, Math.ceil((cameraY + height) / cellHeight));

    const { elapsed } = this.timers;

    for (let id = 0; id < tiles.length; id++) {
      current[id] = frameAt(tiles[id], elapsed);
    }

    for (let row = top; row < bottom; row++) {
      for (let column = left; column < right; column++) {
        const id = cells[row * columns + column];
        if (id < 0) continue;

        renderer.draw(
          sheet,
          current[id],
          column * cellWidth - cameraX,
          row * cellHeight - cameraY,
        );
      }
    }
  }

  private stepX(sprite: Sprite, dx: number): boolean {
    const { cellWidth } = this.sheet;

    sprite.x += dx;

    if (dx === 0 || !this.touches(sprite, this.solid)) return false;

    const edge = sprite.x - this.x + (dx > 0 ? sprite.body.right : sprite.body.left);
    const snap = dx > 0 ? Math.floor : Math.ceil;

    sprite.x += snap(edge / cellWidth) * cellWidth - edge;
    return true;
  }

  private stepY(sprite: Sprite, dy: number): boolean {
    const { cellHeight } = this.sheet;

    sprite.y += dy;

    if (dy === 0 || !this.touches(sprite, this.solid)) return false;

    const edge = sprite.y - this.y + (dy > 0 ? sprite.body.bottom : sprite.body.top);
    const snap = dy > 0 ? Math.floor : Math.ceil;

    sprite.y += snap(edge / cellHeight) * cellHeight - edge;
    return true;
  }
}
