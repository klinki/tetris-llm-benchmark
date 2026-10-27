import { Game } from './game.js'
import { Input } from './input.js'
import { Renderer } from './renderer.js'

const canvas = document.getElementById('game')
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('missing <canvas id="game">')
}

const game = new Game()
const renderer = new Renderer(canvas)
const input = new Input(game)

// Cap the frame delta so a backgrounded tab does not fast-forward the game.
const MAX_FRAME_MS = 100

let last = performance.now()
function frame(now: number): void {
  const dt = Math.min(now - last, MAX_FRAME_MS)
  last = now
  input.update(dt)
  game.update(dt)
  renderer.draw(game)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
