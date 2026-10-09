export type Control =
  | "left"
  | "right"
  | "up"
  | "down"
  | "a"
  | "b"
  | "start"
  | "select"
  | "click";

const KEYS: Record<Control, string[]> = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  a: ["KeyZ", "Space"],
  b: ["KeyX"],
  start: ["Enter"],
  select: ["ShiftLeft", "ShiftRight"],
  // Not a real key code: pointer events set this bit.
  click: ["Click"],
};

const CONTROLS = Object.keys(KEYS) as Control[];

const BITS = Object.fromEntries(
  CONTROLS.map((control, i) => [control, 1 << i]),
) as Record<Control, number>;

const BY_CODE = new Map<string, number>(
  CONTROLS.flatMap((control) => KEYS[control]).map((code, i) => [code, 1 << i]),
);

const MASKS = CONTROLS.map((control) =>
  KEYS[control].reduce((mask, code) => mask | BY_CODE.get(code)!, 0),
);

const CLICK = BY_CODE.get("Click")!;

export class Input {
  readonly pointer = { x: 0, y: 0 };

  private canvas!: HTMLCanvasElement;
  private keys = 0;
  private current = 0;
  private previous = 0;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    canvas.style.touchAction = "none";

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointer);
    canvas.addEventListener("pointerup", this.onPointer);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  deinit(): void {
    const { canvas } = this;

    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointer);
    canvas.removeEventListener("pointerup", this.onPointer);
    canvas.removeEventListener("pointercancel", this.onPointerCancel);

    this.onBlur();
  }

  held(control: Control): boolean {
    return (this.current & BITS[control]) !== 0;
  }

  pressed(control: Control): boolean {
    return (this.current & ~this.previous & BITS[control]) !== 0;
  }

  released(control: Control): boolean {
    return (~this.current & this.previous & BITS[control]) !== 0;
  }

  get x(): number {
    return (this.held("right") ? 1 : 0) - (this.held("left") ? 1 : 0);
  }

  get y(): number {
    return (this.held("down") ? 1 : 0) - (this.held("up") ? 1 : 0);
  }

  poll(): void {
    let current = 0;

    for (let i = 0; i < MASKS.length; i++) {
      if (this.keys & MASKS[i]) current |= 1 << i;
    }

    this.previous = this.current;
    this.current = current;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.metaKey) return this.onBlur();
    if (event.ctrlKey || event.altKey || typing(event.target)) return;

    const bit = BY_CODE.get(event.code);
    if (!bit) return;

    event.preventDefault();

    this.keys |= bit;
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const bit = BY_CODE.get(event.code);
    if (!bit) return;

    this.keys &= ~bit;
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.canvas.setPointerCapture(event.pointerId);
    this.onPointer(event);
  };

  private onPointer = (event: PointerEvent): void => {
    const { canvas, pointer } = this;
    const rect = canvas.getBoundingClientRect();

    pointer.x = Math.floor(
      ((event.clientX - rect.left) * canvas.width) / rect.width,
    );
    pointer.y = Math.floor(
      ((event.clientY - rect.top) * canvas.height) / rect.height,
    );

    if (event.buttons & 1) this.keys |= CLICK;
    else this.keys &= ~CLICK;
  };

  private onPointerCancel = (): void => {
    this.keys &= ~CLICK;
  };

  private onBlur = (): void => {
    this.keys = 0;
    this.current = 0;
    this.previous = 0;
  };

  private onVisibilityChange = (): void => {
    if (!document.hidden) return;
    this.onBlur();
  };
}

function typing(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  );
}
