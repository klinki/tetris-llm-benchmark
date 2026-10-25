// Keyboard controls:
// left/right - move, up/x - rotate CW, z/left ctrl - rotate CCW,
// down - soft drop, space - hard drop, c - hold, r - restart after game over.
import { Game } from './game.js';

const DAS = 0.167; // delayed auto shift: wait before horizontal repeat
const ARR = 0.033; // auto repeat rate between shifts

export class Input {
  private leftHeld = false;
  private rightHeld = false;
  private dir: -1 | 0 | 1 = 0;
  private dasTimer = 0;
  private arrTimer = 0;

  constructor(private game: Game) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private startDir(dir: -1 | 1): void {
    this.dir = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.game.move(dir);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const game = this.game;
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        this.leftHeld = true;
        if (!e.repeat) this.startDir(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.rightHeld = true;
        if (!e.repeat) this.startDir(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        game.softDropping = true;
        break;
      case 'ArrowUp':
      case 'KeyX':
        e.preventDefault();
        if (!e.repeat) game.rotate(1);
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        e.preventDefault();
        if (!e.repeat) game.rotate(-1);
        break;
      case 'Space':
        e.preventDefault();
        if (!e.repeat) game.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
        e.preventDefault();
        if (!e.repeat) game.hold();
        break;
      case 'KeyR':
        if (!e.repeat && game.state === 'over') game.restart();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowLeft') this.leftHeld = false;
    if (e.code === 'ArrowRight') this.rightHeld = false;
    if (e.code === 'ArrowDown') this.game.softDropping = false;
    // Switch to the still-held direction, if any.
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      if (this.leftHeld) this.startDir(-1);
      else if (this.rightHeld) this.startDir(1);
      else this.dir = 0;
    }
  }

  // Called once per frame; handles held-key horizontal auto-repeat.
  update(dt: number): void {
    if (this.dir === 0) return;
    this.dasTimer += dt;
    if (this.dasTimer < DAS) return;
    this.arrTimer += dt;
    while (this.arrTimer >= ARR) {
      this.arrTimer -= ARR;
      if (!this.game.move(this.dir)) this.arrTimer = 0;
    }
  }
}
