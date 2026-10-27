import { test } from 'node:test'
import assert from 'node:assert/strict'

import { Game } from '../dist/game.js'
import { SevenBag } from '../dist/bag.js'
import { Board } from '../dist/board.js'
import { COLS, ROWS, HIDDEN_ROWS } from '../dist/constants.js'
import { PIECE_TYPES, cellsFor, kicksFor } from '../dist/pieces.js'

function freshGame() {
  return new Game()
}

test('7-bag randomizer deals every tetromino once per bag', () => {
  const bag = new SevenBag()
  for (let cycle = 0; cycle < 20; cycle++) {
    const dealt = Array.from({ length: 7 }, () => bag.next())
    assert.deepEqual([...dealt].sort(), [...PIECE_TYPES].sort())
  }
})

test('every piece has four valid rotation states', () => {
  for (const type of PIECE_TYPES) {
    for (let rot = 0; rot < 4; rot++) {
      const cells = cellsFor(type, rot)
      assert.equal(cells.length, 4, `${type} state ${rot} should have 4 cells`)
      const unique = new Set(cells.map(([x, y]) => `${x},${y}`))
      assert.equal(unique.size, 4, `${type} state ${rot} cells must be distinct`)
      for (const [x, y] of cells) {
        assert.ok(x >= 0 && y >= 0, `${type} state ${rot} cells stay in the box`)
      }
    }
  }
})

test('SRS kick tables cover all eight JLSTZ/I transitions', () => {
  for (let from = 0; from < 4; from++) {
    for (const dir of [1, -1]) {
      const to = (from + dir + 4) % 4
      for (const type of ['I', 'J', 'T']) {
        assert.equal(kicksFor(type, from, to).length, 5)
      }
      assert.equal(kicksFor('O', from, to).length, 1)
    }
  }
})

test('gravity drops one row per Guideline interval at level 1', () => {
  const game = freshGame()
  const startY = game.piece.y
  game.update(999)
  assert.equal(game.piece.y, startY, 'must not drop before a full second')
  game.update(2)
  assert.equal(game.piece.y, startY + 1)
})

test('soft drop falls faster and scores one point per cell', () => {
  const game = freshGame()
  game.softDropping = true
  const startY = game.piece.y
  game.update(52)
  assert.equal(game.piece.y, startY + 1)
  assert.equal(game.score, 1)
})

test('pieces stop at walls and the floor', () => {
  const game = freshGame()
  game.piece = { type: 'O', rot: 0, x: 4, y: 0 }
  let moves = 0
  while (game.moveRight()) moves++
  assert.equal(moves, COLS - 2 - 4, 'O can only shift until its right edge hits the wall')
  assert.equal(game.moveRight(), false)
})

test('SRS kicks rotate the I piece off the left wall', () => {
  const game = freshGame()
  // Vertical I (state 1) hugs column 0 (box cell column 2 => x = -2).
  game.piece = { type: 'I', rot: 1, x: -2, y: 8 }
  assert.equal(game.rotateCW(), true, 'wall kick should allow rotation')
  assert.equal(game.piece.rot, 2)
  assert.ok(game.piece.x > -2, 'kick shifted the piece away from the wall')
})

test('hard drop locks the piece and scores 2 points per cell', () => {
  const game = freshGame()
  game.piece = { type: 'O', rot: 0, x: 4, y: 0 }
  const distance = game.ghostDistance()
  assert.equal(distance, ROWS - HIDDEN_ROWS)
  const before = game.score
  game.hardDrop()
  assert.equal(game.score - before, distance * 2)
  assert.ok(game.board.isFilled(ROWS - 1, 4))
  assert.ok(game.board.isFilled(ROWS - 2, 5))
  assert.equal(game.gameOver, false)
  assert.equal(game.piece.y, 0, 'a fresh piece spawned at the top')
})

test('single line clear scores 100 at level 1', () => {
  const game = freshGame()
  for (let col = 0; col < COLS; col++) {
    if (col !== 4 && col !== 5) game.board.set(ROWS - 1, col, 'Z')
  }
  game.piece = { type: 'O', rot: 0, x: 4, y: 0 }
  const distance = game.ghostDistance()
  game.hardDrop()
  assert.equal(game.lines, 1)
  assert.equal(game.score - distance * 2, 100)
  assert.ok(!game.board.isFilled(ROWS - 2, 4), 'the full row was cleared (O fell to the bottom row)')
  assert.ok(game.board.isFilled(ROWS - 1, 4), 'O remainder shifted down after the clear')
})

test('tetris clears four rows and scores 800', () => {
  const game = freshGame()
  for (let row = ROWS - 4; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col !== 4) game.board.set(row, col, 'S')
    }
  }
  // Vertical I landing in the column-4 gap.
  game.piece = { type: 'I', rot: 1, x: 2, y: 0 }
  game.hardDrop()
  assert.equal(game.lines, 4)
  assert.equal(game.level, 1)
  assert.ok(game.score >= 800, 'tetris base score plus hard drop points')
})

test('clearing ten lines raises the level', () => {
  const game = freshGame()
  for (let row = ROWS - 10; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col !== 4) game.board.set(row, col, 'S')
    }
  }
  // Each vertical I fills four rows of the column-4 gap; three drops clear all ten.
  for (let i = 0; i < 3; i++) {
    game.piece = { type: 'I', rot: 1, x: 2, y: 0 }
    game.hardDrop()
  }
  assert.equal(game.lines, 10)
  assert.equal(game.level, 2)
})

test('hold swaps pieces and is allowed once per piece', () => {
  const game = freshGame()
  const first = game.piece.type
  game.holdPiece()
  assert.equal(game.holdType, first)
  assert.equal(game.canHold, false)

  const heldAgain = game.piece.type
  game.holdPiece()
  assert.equal(game.piece.type, heldAgain, 'second hold before locking is ignored')

  game.hardDrop()
  assert.equal(game.canHold, true, 'hold re-enables after the piece locks')
})

test('lock delay holds a grounded piece briefly, then locks it', () => {
  const game = freshGame()
  game.piece = { type: 'O', rot: 0, x: 4, y: ROWS - 2 }
  const type = game.piece.type
  game.update(400)
  assert.equal(game.piece.type, type, 'not locked before 500 ms')
  game.update(150)
  assert.notEqual(game.board.cellAt(ROWS - 1, 4), null, 'piece is locked into the stack')
})

test('moving while grounded resets the lock delay, up to the cap', () => {
  const game = freshGame()
  game.piece = { type: 'O', rot: 0, x: 3, y: ROWS - 2 }
  game.update(450)
  assert.equal(game.moveRight(), true)
  game.update(450)
  assert.equal(game.piece.y, ROWS - 2, 'lock timer restarted after the move')
  game.update(100)
  assert.notEqual(game.board.cellAt(ROWS - 1, 4), null, 'locked once the delay ran out again')
})

test('top-out when the spawn position is blocked', () => {
  const game = freshGame()
  // Nearly fill the hidden spawn rows: full rows would clear, keep one gap cell.
  for (let row = 0; row < HIDDEN_ROWS; row++) {
    for (let col = 0; col < COLS - 1; col++) game.board.set(row, col, 'Z')
  }
  game.piece = { type: 'I', rot: 0, x: 3, y: 0 }
  game.hardDrop()
  assert.equal(game.gameOver, true, 'blocked spawn ends the game')
})

test('restart resets the whole game state', () => {
  const game = freshGame()
  game.piece = { type: 'O', rot: 0, x: 4, y: 0 }
  game.hardDrop()
  const piecesAfterOneDrop = game.piece
  game.restart()
  assert.equal(game.score, 0)
  assert.equal(game.lines, 0)
  assert.equal(game.level, 1)
  assert.equal(game.gameOver, false)
  assert.equal(game.holdType, null)
  assert.notEqual(game.piece, piecesAfterOneDrop)
})

test('board keeps relative order when clearing rows', () => {
  const board = new Board()
  board.set(ROWS - 1, 0, 'I')
  board.set(ROWS - 2, 1, 'J')
  for (let col = 0; col < COLS; col++) board.set(ROWS - 1, col, 'Z')
  const cleared = board.clearRows(board.fullRows())
  assert.equal(cleared, 1)
  assert.equal(board.cellAt(ROWS - 1, 1), 'J', 'the row above fell down by one')
  assert.equal(board.cellAt(ROWS - 1, 0), null)
})
