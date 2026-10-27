import type { Game } from './game.js'

const DAS_DELAY_MS = 150
const AUTO_REPEAT_MS = 35

/**
 * Keyboard controls:
 * left/right move, up / x rotate CW, z / left Ctrl rotate CCW,
 * down soft drops, space hard drops, c holds, r restarts after game over.
 * Left/right use delayed auto shift for smooth sliding.
 */
export class Input {
  private leftHeld = false
  private rightHeld = false
  private dir = 0
  private dasTimer = 0

  constructor(private readonly game: Game, target: Window = window) {
    target.addEventListener('keydown', (e) => this.onKeyDown(e))
    target.addEventListener('keyup', (e) => this.onKeyUp(e))
    target.addEventListener('blur', () => this.releaseAll())
  }

  /** Advance the left/right auto-repeat. */
  update(dtMs: number): void {
    if (this.dir === 0 || this.game.gameOver) return
    this.dasTimer -= dtMs
    while (this.dasTimer <= 0) {
      this.dasTimer += AUTO_REPEAT_MS
      if (this.dir < 0) this.game.moveLeft()
      else this.game.moveRight()
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      e.preventDefault()
    }

    if (e.key === 'r' || e.key === 'R') {
      if (this.game.gameOver) this.game.restart()
      return
    }
    if (this.game.gameOver || e.repeat) return

    switch (true) {
      case e.key === 'ArrowLeft':
        this.leftHeld = true
        this.startRepeat(-1)
        this.game.moveLeft()
        break
      case e.key === 'ArrowRight':
        this.rightHeld = true
        this.startRepeat(1)
        this.game.moveRight()
        break
      case e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X':
        this.game.rotateCW()
        break
      case e.key === 'z' || e.key === 'Z' || e.code === 'ControlLeft':
        this.game.rotateCCW()
        break
      case e.key === 'ArrowDown':
        this.game.softDropping = true
        break
      case e.key === ' ':
        this.game.hardDrop()
        break
      case e.key === 'c' || e.key === 'C':
        this.game.holdPiece()
        break
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      this.game.softDropping = false
      return
    }
    if (e.key === 'ArrowLeft') this.leftHeld = false
    if (e.key === 'ArrowRight') this.rightHeld = false
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const remaining = this.leftHeld ? -1 : this.rightHeld ? 1 : 0
      if (remaining !== 0) this.startRepeat(remaining)
      else this.dir = 0
    }
  }

  private startRepeat(dir: number): void {
    this.dir = dir
    this.dasTimer = DAS_DELAY_MS
  }

  private releaseAll(): void {
    this.leftHeld = false
    this.rightHeld = false
    this.dir = 0
    this.game.softDropping = false
  }
}
