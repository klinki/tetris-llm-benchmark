/**
 * Keyboard input with guideline-style delayed auto shift (DAS):
 * the first move is immediate, holding a direction repeats after DAS
 * seconds, then every ARR seconds.
 */
export interface Actions {
  moveLeft(): void;
  moveRight(): void;
  rotateCW(): void;
  rotateCCW(): void;
  softDrop(on: boolean): void;
  hardDrop(): void;
  hold(): void;
  restart(): void;
}

const DAS = 0.17; // seconds before auto-repeat starts
const ARR = 0.05; // seconds between auto-repeats

export class Input {
  private leftHeld = false;
  private rightHeld = false;
  private active: "left" | "right" | null = null;
  private das = 0;
  private arr = 0;

  constructor(private readonly actions: Actions) {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  update(dt: number): void {
    if (!this.active) {
      this.das = 0;
      this.arr = 0;
      return;
    }
    this.das += dt;
    if (this.das < DAS) return;
    this.arr += dt;
    while (this.arr >= ARR) {
      this.arr -= ARR;
      if (this.active === "left") this.actions.moveLeft();
      else this.actions.moveRight();
    }
  }

  private press(dir: "left" | "right", move: () => void): void {
    move();
    this.active = dir;
    this.das = 0;
    this.arr = 0;
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (!e.repeat && !this.leftHeld) {
          this.leftHeld = true;
          this.press("left", () => this.actions.moveLeft());
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (!e.repeat && !this.rightHeld) {
          this.rightHeld = true;
          this.press("right", () => this.actions.moveRight());
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!e.repeat) this.actions.softDrop(true);
        break;
      case "ArrowUp":
      case "x":
      case "X":
        e.preventDefault();
        if (!e.repeat) this.actions.rotateCW();
        break;
      case "z":
      case "Z":
        e.preventDefault();
        if (!e.repeat) this.actions.rotateCCW();
        break;
      case " ":
        e.preventDefault();
        if (!e.repeat) this.actions.hardDrop();
        break;
      case "c":
      case "C":
        e.preventDefault();
        if (!e.repeat) this.actions.hold();
        break;
      case "r":
      case "R":
        if (!e.repeat) this.actions.restart();
        break;
      default:
        if (e.code === "ControlLeft" && !e.repeat) this.actions.rotateCCW();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowLeft":
        this.leftHeld = false;
        if (this.active === "left") this.active = this.rightHeld ? "right" : null;
        this.das = 0;
        this.arr = 0;
        break;
      case "ArrowRight":
        this.rightHeld = false;
        if (this.active === "right") this.active = this.leftHeld ? "left" : null;
        this.das = 0;
        this.arr = 0;
        break;
      case "ArrowDown":
        this.actions.softDrop(false);
        break;
    }
  }
}
