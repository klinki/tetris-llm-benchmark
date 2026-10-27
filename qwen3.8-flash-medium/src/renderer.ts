import { COLS, HIDDEN_ROWS, ROWS, VISIBLE_ROWS } from './constants.js'
import { COLORS, cellsFor, type PieceType } from './pieces.js'
import type { Game } from './game.js'

const CELL = 30
const MINI = 22

const BOARD_X = 170
const BOARD_Y = 20
const BOARD_W = COLS * CELL
const BOARD_H = VISIBLE_ROWS * CELL

const HOLD_X = 20
const HOLD_Y = 80
const PANEL_W = 120

const NEXT_X = BOARD_X + BOARD_W + 30
const NEXT_Y = 80
const NEXT_SLOT_H = 76

const STATS_X = 20
const STATS_Y = 240

export const WIDTH = NEXT_X + PANEL_W + 20
export const HEIGHT = BOARD_Y + BOARD_H + 20

const FONT = '600 14px "Menlo", "Consolas", monospace'

/** Canvas 2D renderer for the playfield, ghost piece, hold and next panels. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = WIDTH * scale
    canvas.height = HEIGHT * scale
    canvas.style.width = `${WIDTH}px`
    canvas.style.height = `${HEIGHT}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    this.ctx = ctx
  }

  draw(game: Game): void {
    const ctx = this.ctx
    ctx.fillStyle = '#0b0d12'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    this.drawPanel()
    this.drawLockedCells(game)
    this.drawGhost(game)
    this.drawCurrentPiece(game)
    this.drawHold(game)
    this.drawNext(game)
    this.drawStats(game)

    if (game.gameOver) this.drawGameOver()
  }

  private drawPanel(): void {
    const ctx = this.ctx
    ctx.fillStyle = '#10141c'
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(BOARD_X + c * CELL + 0.5, BOARD_Y)
      ctx.lineTo(BOARD_X + c * CELL + 0.5, BOARD_Y + BOARD_H)
    }
    for (let r = 1; r < VISIBLE_ROWS; r++) {
      ctx.moveTo(BOARD_X, BOARD_Y + r * CELL + 0.5)
      ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + r * CELL + 0.5)
    }
    ctx.stroke()
    ctx.strokeStyle = '#2a3040'
    ctx.strokeRect(BOARD_X + 0.5, BOARD_Y + 0.5, BOARD_W - 1, BOARD_H - 1)
  }

  private drawLockedCells(game: Game): void {
    for (let row = HIDDEN_ROWS; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type = game.board.cellAt(row, col)
        if (type) {
          this.block(BOARD_X + col * CELL, BOARD_Y + (row - HIDDEN_ROWS) * CELL, CELL, COLORS[type])
        }
      }
    }
  }

  private drawGhost(game: Game): void {
    const distance = game.ghostDistance()
    if (distance === 0 || game.gameOver) return
    const { type, rot, x, y } = game.piece
    for (const [cx, cy] of cellsFor(type, rot)) {
      const px = BOARD_X + (x + cx) * CELL
      const py = BOARD_Y + (y + cy + distance - HIDDEN_ROWS) * CELL
      if (y + cy + distance < HIDDEN_ROWS) continue
      const ctx = this.ctx
      ctx.globalAlpha = 0.18
      ctx.fillStyle = COLORS[type]
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = COLORS[type]
      ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3)
      ctx.globalAlpha = 1
    }
  }

  private drawCurrentPiece(game: Game): void {
    if (game.gameOver) return
    const { type, rot, x, y } = game.piece
    for (const [cx, cy] of cellsFor(type, rot)) {
      const row = y + cy
      if (row < HIDDEN_ROWS) continue
      this.block(BOARD_X + (x + cx) * CELL, BOARD_Y + (row - HIDDEN_ROWS) * CELL, CELL, COLORS[type])
    }
  }

  private drawHold(game: Game): void {
    this.label('HOLD', HOLD_X, HOLD_Y - 10)
    this.slot(HOLD_X, HOLD_Y)
    if (game.holdType !== null) {
      this.miniPiece(HOLD_X, HOLD_Y, game.holdType, game.canHold ? 1 : 0.3)
    }
  }

  private drawNext(game: Game): void {
    this.label('NEXT', NEXT_X, NEXT_Y - 10)
    game.preview.forEach((type, i) => {
      const y = NEXT_Y + i * NEXT_SLOT_H
      this.slot(NEXT_X, y)
      this.miniPiece(NEXT_X, y, type, 1)
    })
  }

  private drawStats(game: Game): void {
    const ctx = this.ctx
    ctx.font = FONT
    ctx.fillStyle = '#e6edf3'
    ctx.textBaseline = 'top'
    const stats = [
      `SCORE ${game.score}`,
      `LEVEL ${game.level}`,
      `LINES ${game.lines}`,
    ]
    stats.forEach((text, i) => {
      ctx.fillText(text, STATS_X, STATS_Y + i * 26, PANEL_W)
    })
  }

  private drawGameOver(): void {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H)
    ctx.fillStyle = '#ff5c5c'
    ctx.font = '700 26px "Menlo", "Consolas", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GAME OVER', BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 18)
    ctx.fillStyle = '#e6edf3'
    ctx.font = FONT
    ctx.fillText('press R to restart', BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 + 20)
    ctx.textAlign = 'left'
  }

  private label(text: string, x: number, y: number): void {
    const ctx = this.ctx
    ctx.font = FONT
    ctx.fillStyle = '#8b949e'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(text, x, y)
  }

  private slot(x: number, y: number): void {
    const ctx = this.ctx
    ctx.fillStyle = '#10141c'
    ctx.fillRect(x, y, PANEL_W, 72)
    ctx.strokeStyle = '#2a3040'
    ctx.strokeRect(x + 0.5, y + 0.5, PANEL_W - 1, 71)
  }

  /** Draw a piece scaled to fit a mini panel slot. */
  private miniPiece(x: number, y: number, type: PieceType, alpha: number): void {
    const cells = cellsFor(type, 0)
    let minX = 4
    let maxX = -1
    let minY = 4
    let maxY = -1
    for (const [cx, cy] of cells) {
      minX = Math.min(minX, cx)
      maxX = Math.max(maxX, cx)
      minY = Math.min(minY, cy)
      maxY = Math.max(maxY, cy)
    }
    const w = (maxX - minX + 1) * MINI
    const h = (maxY - minY + 1) * MINI
    const ox = x + (PANEL_W - w) / 2 - minX * MINI
    const oy = y + (72 - h) / 2 - minY * MINI
    const ctx = this.ctx
    ctx.globalAlpha = alpha
    for (const [cx, cy] of cells) {
      this.block(ox + cx * MINI, oy + cy * MINI, MINI, COLORS[type])
    }
    ctx.globalAlpha = 1
  }

  private block(x: number, y: number, size: number, color: string): void {
    const ctx = this.ctx
    ctx.fillStyle = color
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.fillRect(x + 1, y + 1, size - 2, 3)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3)
  }
}
