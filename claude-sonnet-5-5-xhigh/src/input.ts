import { ARR_MS, DAS_MS } from "./constants.js";
import type { Game } from "./game.js";

export type Action =
  | "left"
  | "right"
  | "softDrop"
  | "hardDrop"
  | "rotateClockwise"
  | "rotateCounterClockwise"
  | "hold"
  | "restart"
  | "pause";

/** Keyboard bindings by `KeyboardEvent.code`. */
export const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "softDrop",
  ArrowUp: "rotateClockwise",
  KeyX: "rotateClockwise",
  KeyZ: "rotateCounterClockwise",
  ControlLeft: "rotateCounterClockwise",
  Space: "hardDrop",
  KeyC: "hold",
  KeyR: "restart",
  KeyP: "pause",
  Escape: "pause",
};

/** Translates pressed and released actions into game calls, including auto-repeat for left/right. */
export class InputController {
  /** Horizontal actions currently held, oldest first. The most recent one wins. */
  private heldDirections: ("left" | "right")[] = [];
  private repeatTimer = 0;
  private repeatDelay = DAS_MS;

  constructor(private readonly game: Game) {}

  press(action: Action): void {
    switch (action) {
      case "left":
      case "right":
        this.heldDirections = this.heldDirections.filter((held) => held !== action);
        this.heldDirections.push(action);
        this.repeatTimer = 0;
        this.repeatDelay = DAS_MS;
        this.game.move(action === "left" ? -1 : 1);
        break;
      case "softDrop":
        this.game.setSoftDrop(true);
        break;
      case "hardDrop":
        this.game.hardDrop();
        break;
      case "rotateClockwise":
        this.game.rotate(1);
        break;
      case "rotateCounterClockwise":
        this.game.rotate(-1);
        break;
      case "hold":
        this.game.holdPiece();
        break;
      case "restart":
        this.game.restart();
        break;
      case "pause":
        this.game.togglePause();
        break;
    }
  }

  release(action: Action): void {
    if (action === "left" || action === "right") {
      this.heldDirections = this.heldDirections.filter((held) => held !== action);
      this.repeatTimer = 0;
      this.repeatDelay = DAS_MS;
    } else if (action === "softDrop") {
      this.game.setSoftDrop(false);
    }
  }

  /** Forgets all held keys, e.g. when the window loses focus and key-up events are missed. */
  releaseAll(): void {
    this.release("left");
    this.release("right");
    this.release("softDrop");
  }

  /** Repeats the held direction: after DAS_MS, then once every ARR_MS. */
  update(dt: number): void {
    const direction = this.heldDirections.at(-1);
    if (!direction) return;

    this.repeatTimer += dt;
    while (this.repeatTimer >= this.repeatDelay) {
      this.repeatTimer -= this.repeatDelay;
      this.repeatDelay = ARR_MS;
      this.game.move(direction === "left" ? -1 : 1);
    }
  }
}
