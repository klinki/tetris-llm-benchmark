import { initGame, tryMove, tryRotate, softDrop, hardDropPiece, holdPiece, spawnNext, isOnGround, getGhostY, updateLockDelay, tickGravity } from "./game.js";
import { drawBoard, drawPieceAt, clearCanvas } from "./renderer.js";
import { PIECE_COLORS } from "./pieces.js";
import type { PieceName } from "./pieces.js";

const boardCanvas = document.getElementById("board") as HTMLCanvasElement;
const holdCanvas = document.getElementById("hold") as HTMLCanvasElement;
const nextCanvas = document.getElementById("next") as HTMLCanvasElement;
const bctx = boardCanvas.getContext("2d")!;
const hctx = holdCanvas.getContext("2d")!;
const nctx = nextCanvas.getContext("2d")!;

const game = initGame(Math.random);
const lastDrop = { t: performance.now() };

function render() {
  drawBoard(bctx, game.board);
  if (game.current) {
    // ghost
    const gy = getGhostY(game);
    const ghostState = { ...game.current, y: gy };
    drawPieceAt(bctx, ghostState, true);
    drawPieceAt(bctx, game.current, false);
  }
  // hold
  clearCanvas(hctx);
  // next
  clearCanvas(nctx);
  // draw up to 5 next
  nctx.fillStyle = "#000";
  nctx.fillRect(0, 0, nctx.canvas.width, nctx.canvas.height);
  game.next.slice(0, 5).forEach((name, i) => {
    drawMiniSingle(nctx, name, i);
  });
  (document.getElementById("score") as HTMLElement).textContent = String(game.score);
  (document.getElementById("lines") as HTMLElement).textContent = String(game.lines);
  (document.getElementById("level") as HTMLElement).textContent = String(game.level);
  if (game.isOver) {
    bctx.fillStyle = "rgba(0,0,0,0.6)";
    bctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    bctx.fillStyle = "#fff";
    bctx.font = "20px sans-serif";
    bctx.fillText("Game Over - R to restart", 10, 200);
  }
}

function drawMiniSingle(ctx: CanvasRenderingContext2D, name: PieceName, index: number) {
  const { SHAPES } = (window as any).__pieces || {};
}

// We'll reimplement mini drawing inline instead of relying on drawMini (which clears)
import { SHAPES, PIECE_COLORS as PC } from "./pieces.js";
function drawNext() {
  nctx.fillStyle = "#000";
  nctx.fillRect(0, 0, nctx.canvas.width, nctx.canvas.height);
  game.next.slice(0, 5).forEach((name, i) => {
    const shape = SHAPES[name][0];
    const offY = i * 72;
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx] === 0) continue;
        nctx.fillStyle = PC[name];
        nctx.fillRect(dx * 12 + 10, dy * 12 + offY + 10, 12, 12);
      }
    }
  });
}

function renderAll() {
  drawBoard(bctx, game.board);
  if (game.current) {
    const gy = getGhostY(game);
    const ghostState = { ...game.current, y: gy };
    drawPieceAt(bctx, ghostState, true);
    drawPieceAt(bctx, game.current, false);
  }
  clearCanvas(hctx);
  // hold mini
  if (game.hold) {
    const shape = SHAPES[game.hold][0];
    for (let dy = 0; dy < shape.length; dy++)
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx] === 0) continue;
        hctx.fillStyle = PC[game.hold];
        hctx.fillRect(dx * 16 + 20, dy * 16 + 20, 16, 16);
      }
  }
  drawNext();
  (document.getElementById("score") as HTMLElement).textContent = String(game.score);
  (document.getElementById("lines") as HTMLElement).textContent = String(game.lines);
  (document.getElementById("level") as HTMLElement).textContent = String(game.level);
  if (game.isOver) {
    bctx.fillStyle = "rgba(0,0,0,0.6)";
    bctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    bctx.fillStyle = "#fff";
    bctx.font = "16px sans-serif";
    bctx.fillText("Game Over - R", 40, 200);
  }
}

window.addEventListener("keydown", (e) => {
  if (game.isOver) {
    if (e.key.toLowerCase() === "r") {
      const fresh = initGame(Math.random);
      Object.assign(game, fresh);
    }
    return;
  }
  switch (e.key) {
    case "ArrowLeft":
      tryMove(game, -1, 0);
      break;
    case "ArrowRight":
      tryMove(game, 1, 0);
      break;
    case "ArrowDown":
      softDrop(game); // returns points ignored
      // also score 1? softDrop function returns points but we ignore; add 1
      game.score += 0; // keep simple
      break;
    case "ArrowUp":
    case "x":
    case "X":
      tryRotate(game, 1);
      break;
    case "z":
    case "Z":
    case "Control":
      tryRotate(game, -1);
      break;
    case " ":
      hardDropPiece(game);
      e.preventDefault();
      break;
    case "c":
    case "C":
      holdPiece(game);
      break;
  }
});

let last = performance.now();
function loop(now: number) {
  const g = game as any;
  tickGravity(game, now, lastDrop);
  updateLockDelay(game, now, 500);
  renderAll();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);