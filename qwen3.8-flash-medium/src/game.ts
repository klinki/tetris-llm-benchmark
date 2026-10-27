import {
  CLEAR_SCORES,
  COLS,
  COMBO_SCORE,
  HARD_DROP_SCORE,
  HIDDEN_ROWS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  MAX_LEVEL,
  MAX_LOCK_RESETS,
  NEXT_COUNT,
  ROWS,
  SOFT_DROP_INTERVAL_MS,
  SOFT_DROP_SCORE,
  gravityIntervalMs,
} from './constants.js'
import { cellsFor, kicksFor, spawnX, type PieceType } from './pieces.js'
import { SevenBag } from './bag.js'
import { Board } from './board.js'

/** The falling piece, positioned by its bounding box origin on the playfield. */
export interface ActivePiece {
  type: PieceType
  rot: number
  x: number
  y: number
}

/**
 * Guideline Tetris rules, independent of rendering and input:
 * 7-bag, SRS wall kicks, ghost piece, hold, next queue, lock delay,
 * Guideline scoring/gravity and top-out on a blocked spawn.
 */
export class Game {
  readonly board = new Board()
  piece: ActivePiece = { type: 'T', rot: 0, x: 0, y: 0 }
  holdType: PieceType | null = null
  canHold = true
  queue: PieceType[] = []
  score = 0
  lines = 0
  level = 1
  gameOver = false
  softDropping = false

  private readonly bag: SevenBag
  private gravityTimer = 0
  private lockTimer = 0
  private lockResets = 0
  private chain = 0
  private backToBack = false

  constructor(rng: () => number = Math.random) {
    this.bag = new SevenBag(rng)
    this.restart()
  }

  /** The pieces shown in the preview panel. */
  get preview(): PieceType[] {
    return this.queue.slice(0, NEXT_COUNT)
  }

  restart(): void {
    this.board.reset()
    this.holdType = null
    this.canHold = true
    this.score = 0
    this.lines = 0
    this.level = 1
    this.gameOver = false
    this.softDropping = false
    this.gravityTimer = 0
    this.lockTimer = 0
    this.lockResets = 0
    this.chain = 0
    this.backToBack = false
    this.bag.reset()
    this.queue = []
    this.ensureQueue()
    this.spawnNext()
  }

  /** Advance gravity, soft drop and lock delay by dt milliseconds. */
  update(dtMs: number): void {
    if (this.gameOver) return

    if (this.isGrounded()) {
      this.lockTimer += dtMs
      if (this.lockTimer >= LOCK_DELAY_MS) this.lockPiece()
      return
    }

    this.lockTimer = 0
    const interval = this.currentGravityInterval()
    this.gravityTimer += dtMs
    while (this.gravityTimer >= interval && !this.isGrounded()) {
      this.piece.y += 1
      this.gravityTimer -= interval
      this.lockResets = 0
      if (this.softDropping) this.score += SOFT_DROP_SCORE
    }
  }

  moveLeft(): boolean {
    return this.move(-1)
  }

  moveRight(): boolean {
    return this.move(1)
  }

  rotateCW(): boolean {
    return this.rotate(1)
  }

  rotateCCW(): boolean {
    return this.rotate(-1)
  }

  /** How many rows the current piece would fall on a hard drop. */
  ghostDistance(): number {
    let distance = 0
    while (!this.collides(this.piece.type, this.piece.rot, this.piece.x, this.piece.y + distance + 1)) {
      distance++
    }
    return distance
  }

  hardDrop(): void {
    if (this.gameOver) return
    const distance = this.ghostDistance()
    this.piece.y += distance
    this.score += distance * HARD_DROP_SCORE
    this.lockPiece()
  }

  /** Hold the current piece and bring in the held one (or the next in queue). */
  holdPiece(): void {
    if (this.gameOver || !this.canHold) return
    const current = this.piece.type
    let incoming: PieceType
    if (this.holdType === null) {
      this.ensureQueue()
      incoming = this.queue.shift() as PieceType
      this.holdType = current
    } else {
      incoming = this.holdType
      this.holdType = current
    }
    this.ensureQueue()
    this.spawnAt(incoming)
    this.canHold = false
  }

  private currentGravityInterval(): number {
    const gravity = gravityIntervalMs(this.level)
    return this.softDropping ? Math.min(gravity, SOFT_DROP_INTERVAL_MS) : gravity
  }

  private move(dx: number): boolean {
    if (this.gameOver || this.collides(this.piece.type, this.piece.rot, this.piece.x + dx, this.piece.y)) {
      return false
    }
    this.piece.x += dx
    this.afterSuccessfulShift()
    return true
  }

  private rotate(dir: 1 | -1): boolean {
    if (this.gameOver) return false
    const { type, rot, x, y } = this.piece
    const to = (rot + dir + 4) % 4
    for (const [kx, ky] of kicksFor(type, rot, to)) {
      if (!this.collides(type, to, x + kx, y + ky)) {
        this.piece.rot = to
        this.piece.x += kx
        this.piece.y += ky
        this.afterSuccessfulShift()
        return true
      }
    }
    return false
  }

  /** Guideline move-reset lock delay: moving while grounded restarts the timer, up to a cap. */
  private afterSuccessfulShift(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0
      this.lockResets += 1
    }
  }

  private isGrounded(): boolean {
    return this.collides(this.piece.type, this.piece.rot, this.piece.x, this.piece.y + 1)
  }

  private collides(type: PieceType, rot: number, x: number, y: number): boolean {
    for (const [cx, cy] of cellsFor(type, rot)) {
      const col = x + cx
      const row = y + cy
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true
      if (this.board.isFilled(row, col)) return true
    }
    return false
  }

  private lockPiece(): void {
    const cells = cellsFor(this.piece.type, this.piece.rot)
    for (const [cx, cy] of cells) {
      this.board.set(this.piece.y + cy, this.piece.x + cx, this.piece.type)
    }

    const full = this.board.fullRows()
    if (full.length > 0) {
      const cleared = this.board.clearRows(full)
      this.score += this.clearScore(cleared)
      this.chain += 1
      if (this.chain > 1) {
        this.score += COMBO_SCORE * (this.chain - 1) * this.level
      }
      this.lines += cleared
      this.level = Math.min(MAX_LEVEL, 1 + Math.floor(this.lines / LINES_PER_LEVEL))
    } else {
      this.chain = 0
    }

    // Lockout: the piece froze entirely above the visible playfield.
    const allHidden = cells.every(([, cy]) => this.piece.y + cy < HIDDEN_ROWS)
    if (allHidden) {
      this.gameOver = true
      return
    }

    this.spawnNext()
  }

  private clearScore(cleared: number): number {
    let score = CLEAR_SCORES[cleared] * this.level
    if (cleared === 4) {
      if (this.backToBack) score = Math.floor(score * 1.5)
      this.backToBack = true
    } else {
      this.backToBack = false
    }
    return score
  }

  private spawnNext(): void {
    this.ensureQueue()
    const type = this.queue.shift() as PieceType
    this.ensureQueue()
    this.canHold = true
    this.spawnAt(type)
  }

  /** Place a piece at its Guideline spawn position; a blocked spawn tops out the game. */
  private spawnAt(type: PieceType): void {
    this.piece = { type, rot: 0, x: spawnX(type, COLS), y: 0 }
    this.gravityTimer = 0
    this.lockTimer = 0
    this.lockResets = 0
    if (this.isGroundedBlocked()) {
      this.gameOver = true
    }
  }

  private isGroundedBlocked(): boolean {
    return this.collides(this.piece.type, this.piece.rot, this.piece.x, this.piece.y)
  }

  private ensureQueue(): void {
    while (this.queue.length < NEXT_COUNT + 1) {
      this.queue.push(this.bag.next())
    }
  }
}
