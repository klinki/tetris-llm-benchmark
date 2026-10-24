/** Keyboard controls, including our own delayed auto shift for smooth movement. */

import { ARR_MS, DAS_MS } from "../core/constants.js";
import type { Game } from "../core/game.js";

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "Space",
  "KeyX",
  "KeyZ",
  "KeyC",
  "KeyR",
  "ControlLeft",
  "ControlRight",
]);

type Direction = -1 | 0 | 1;

export class KeyboardController {
  private leftHeld = false;
  private rightHeld = false;
  private direction: Direction = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private readonly game: Game) {}

  attach(target: Window = window): () => void {
    const onKeyDown = (event: KeyboardEvent) => this.onKeyDown(event);
    const onKeyUp = (event: KeyboardEvent) => this.onKeyUp(event);
    const onBlur = () => this.releaseAll();

    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("keyup", onKeyUp);
    target.addEventListener("blur", onBlur);

    return () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
    };
  }

  update(dtMs: number): void {
    if (this.direction === 0 || this.game.status !== "playing") return;

    if (this.dasTimer < DAS_MS) {
      this.dasTimer += dtMs;
      if (this.dasTimer >= DAS_MS) {
        this.repeatMove();
        this.arrTimer = 0;
      }
      return;
    }

    this.arrTimer += dtMs;
    while (this.arrTimer >= ARR_MS) {
      this.arrTimer -= ARR_MS;
      this.repeatMove();
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const code = event.code;
    if (!GAME_KEYS.has(code)) return;

    const isControl = code === "ControlLeft" || code === "ControlRight";
    if ((event.ctrlKey || event.metaKey || event.altKey) && !isControl) return;

    event.preventDefault();
    if (event.repeat) return;

    if (this.game.status === "gameover") {
      if (code === "KeyR") {
        this.game.restart();
        this.resetRepeat();
      }
      return;
    }

    switch (code) {
      case "ArrowLeft":
        this.beginRepeat(-1);
        break;
      case "ArrowRight":
        this.beginRepeat(1);
        break;
      case "ArrowDown":
        this.game.setSoftDrop(true);
        break;
      case "ArrowUp":
      case "KeyX":
        this.game.rotateClockwise();
        break;
      case "KeyZ":
      case "ControlLeft":
      case "ControlRight":
        this.game.rotateCounterClockwise();
        break;
      case "Space":
        this.game.hardDrop();
        break;
      case "KeyC":
        this.game.holdPiece();
        break;
      default:
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowLeft":
        this.leftHeld = false;
        if (this.direction === -1) {
          this.direction = this.rightHeld ? 1 : 0;
          this.dasTimer = 0;
          this.arrTimer = 0;
        }
        break;
      case "ArrowRight":
        this.rightHeld = false;
        if (this.direction === 1) {
          this.direction = this.leftHeld ? -1 : 0;
          this.dasTimer = 0;
          this.arrTimer = 0;
        }
        break;
      case "ArrowDown":
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  }

  private beginRepeat(direction: -1 | 1): void {
    if (direction === -1) this.leftHeld = true;
    else this.rightHeld = true;

    this.direction = direction;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.repeatMove();
  }

  private repeatMove(): void {
    if (this.direction === -1) this.game.moveLeft();
    else if (this.direction === 1) this.game.moveRight();
  }

  private resetRepeat(): void {
    this.leftHeld = false;
    this.rightHeld = false;
    this.direction = 0;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.setSoftDrop(false);
  }

  private releaseAll(): void {
    this.resetRepeat();
  }
}
