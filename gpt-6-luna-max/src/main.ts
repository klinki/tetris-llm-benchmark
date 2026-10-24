import { BOARD_HEIGHT, BOARD_WIDTH, getCells, pieceColor, TetrisGame, type Piece, type PieceType } from './game.js';

const CELL_SIZE = 30;
const DAS_MS = 160;
const ARR_MS = 30;

const boardCanvas = mustGet<HTMLCanvasElement>('game-board');
const boardContextCandidate = boardCanvas.getContext('2d');
if (!boardContextCandidate) throw new Error('Canvas is not supported in this browser.');
const boardContext: CanvasRenderingContext2D = boardContextCandidate;

const holdCanvas = mustGet<HTMLCanvasElement>('hold-preview');
const scoreElement = mustGet<HTMLElement>('score-value');
const levelElement = mustGet<HTMLElement>('level-value');
const linesElement = mustGet<HTMLElement>('lines-value');
const comboElement = mustGet<HTMLElement>('combo-value');
const b2bElement = mustGet<HTMLElement>('b2b-value');
const levelProgress = mustGet<HTMLElement>('level-progress');
const linesToLevel = mustGet<HTMLElement>('lines-to-level');
const queueElement = mustGet<HTMLElement>('next-queue');
const statusElement = mustGet<HTMLElement>('game-status');
const overlayElement = mustGet<HTMLElement>('board-overlay');
const finalScoreElement = mustGet<HTMLElement>('final-score');
const restartButton = mustGet<HTMLButtonElement>('restart-button');

const game = new TetrisGame();
const pressed = new Set<string>();
let activeHorizontal: -1 | 1 | 0 = 0;
let horizontalElapsed = 0;
let nextRepeatAt = DAS_MS;
let downHeld = false;
let previousTime = 0;
let previousViewKey = '';

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

function resizeBoardCanvas(): void {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = boardCanvas.clientWidth || CELL_SIZE * BOARD_WIDTH;
  const height = boardCanvas.clientHeight || CELL_SIZE * BOARD_HEIGHT;
  boardCanvas.width = Math.round(width * ratio);
  boardCanvas.height = Math.round(height * ratio);
  boardContext.setTransform(ratio * width / (CELL_SIZE * BOARD_WIDTH), 0, 0, ratio * height / (CELL_SIZE * BOARD_HEIGHT), 0, 0);
}

function setupPreviewCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function drawBlock(context: CanvasRenderingContext2D, x: number, y: number, size: number, type: PieceType, alpha = 1, inset = 1.5): void {
  const color = pieceColor(type);
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
  if (alpha > 0.35) {
    context.fillStyle = 'rgba(255,255,255,.24)';
    context.fillRect(x + inset + 2, y + inset + 2, size - inset * 2 - 4, 2);
    context.fillStyle = 'rgba(0,0,0,.15)';
    context.fillRect(x + inset + 2, y + size - inset - 4, size - inset * 2 - 4, 2);
  }
  context.globalAlpha = 1;
}

function paintBoard(): void {
  const context = boardContext;
  context.clearRect(0, 0, CELL_SIZE * BOARD_WIDTH, CELL_SIZE * BOARD_HEIGHT);
  context.fillStyle = '#111521';
  context.fillRect(0, 0, CELL_SIZE * BOARD_WIDTH, CELL_SIZE * BOARD_HEIGHT);

  context.strokeStyle = 'rgba(173, 181, 211, .075)';
  context.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    context.beginPath(); context.moveTo(x * CELL_SIZE + .5, 0); context.lineTo(x * CELL_SIZE + .5, CELL_SIZE * BOARD_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
    context.beginPath(); context.moveTo(0, y * CELL_SIZE + .5); context.lineTo(CELL_SIZE * BOARD_WIDTH, y * CELL_SIZE + .5); context.stroke();
  }

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const type = game.board[y][x];
      if (type) drawBlock(context, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, type, 1);
    }
  }

  if (!game.gameOver) {
    const ghostY = game.getGhostY();
    for (const [x, y] of getCells(game.current.type, game.current.rotation)) {
      const cellY = ghostY + y;
      if (cellY >= 0) drawBlock(context, (game.current.x + x) * CELL_SIZE, cellY * CELL_SIZE, CELL_SIZE, game.current.type, .22, 2);
    }
    drawPiece(context, game.current, 1);
  }

  context.strokeStyle = 'rgba(181, 164, 255, .3)';
  context.lineWidth = 1;
  context.strokeRect(.5, .5, CELL_SIZE * BOARD_WIDTH - 1, CELL_SIZE * BOARD_HEIGHT - 1);
}

function drawPiece(context: CanvasRenderingContext2D, piece: Piece, alpha: number): void {
  for (const [x, y] of getCells(piece.type, piece.rotation)) {
    const cellY = piece.y + y;
    if (cellY >= 0) drawBlock(context, (piece.x + x) * CELL_SIZE, cellY * CELL_SIZE, CELL_SIZE, piece.type, alpha);
  }
}

function paintPreview(canvas: HTMLCanvasElement, type: PieceType | null, compact = false): void {
  const context = setupPreviewCanvas(canvas);
  if (!context) return;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  context.clearRect(0, 0, width, height);
  if (!type) return;
  const cells = getCells(type, 0);
  const minX = Math.min(...cells.map(([x]) => x));
  const maxX = Math.max(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const maxY = Math.max(...cells.map(([, y]) => y));
  const size = Math.min(compact ? 17 : 20, (width - 24) / (maxX - minX + 1), (height - 12) / (maxY - minY + 1));
  const pieceWidth = (maxX - minX + 1) * size;
  const pieceHeight = (maxY - minY + 1) * size;
  const startX = (width - pieceWidth) / 2 - minX * size;
  const startY = (height - pieceHeight) / 2 - minY * size;
  for (const [x, y] of cells) drawBlock(context, startX + x * size, startY + y * size, size, type, .95, 1.25);
}

function paintQueue(): void {
  const next = game.nextQueue.slice(0, 5);
  const key = `${game.hold}|${next.join('')}`;
  if (key === previousViewKey) return;
  previousViewKey = key;
  queueElement.replaceChildren();
  for (const type of next) {
    const item = document.createElement('div');
    item.className = 'next-item';
    const canvas = document.createElement('canvas');
    canvas.width = 132;
    canvas.height = 58;
    canvas.setAttribute('aria-label', `${type} piece`);
    item.append(canvas);
    queueElement.append(item);
    paintPreview(canvas, type, true);
  }
  paintPreview(holdCanvas, game.hold);
}

function updateHud(): void {
  scoreElement.textContent = game.score.toLocaleString();
  levelElement.textContent = String(game.level);
  linesElement.textContent = String(game.lines);
  comboElement.textContent = game.combo >= 1 ? `${game.combo}×` : '—';
  b2bElement.hidden = !game.backToBack;
  const linesInLevel = game.lines % 10;
  levelProgress.style.width = `${linesInLevel * 10}%`;
  linesToLevel.textContent = String(linesInLevel === 0 ? 10 : 10 - linesInLevel);
  if (game.gameOver) {
    finalScoreElement.textContent = game.score.toLocaleString();
    overlayElement.hidden = false;
    statusElement.textContent = 'Game over · press R to restart';
  } else {
    overlayElement.hidden = true;
    const status = game.lastScoringEvent || (game.canHold ? 'Ready when you are' : 'Hold already used');
    statusElement.textContent = status;
  }
}

function render(): void {
  paintBoard();
  paintQueue();
  updateHud();
}

function keyDown(event: KeyboardEvent): void {
  const code = event.code;
  const supported = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyX', 'KeyZ', 'KeyC', 'KeyR', 'ControlLeft', 'ControlRight'];
  if (!supported.includes(code)) return;
  event.preventDefault();
  if (pressed.has(code)) return;
  pressed.add(code);

  if (game.gameOver) {
    if (code === 'KeyR') restart();
    return;
  }

  if (code === 'ArrowLeft' || code === 'ArrowRight') {
    activeHorizontal = code === 'ArrowLeft' ? -1 : 1;
    horizontalElapsed = 0;
    nextRepeatAt = DAS_MS;
    game.moveHorizontal(activeHorizontal);
  } else if (code === 'ArrowDown') {
    downHeld = true;
    game.softDropStep();
  } else if (code === 'ArrowUp' || code === 'KeyX') {
    game.rotate(1);
  } else if (code === 'KeyZ' || code === 'ControlLeft' || code === 'ControlRight') {
    game.rotate(-1);
  } else if (code === 'Space') {
    game.hardDrop();
  } else if (code === 'KeyC') {
    game.holdPiece();
  } else if (code === 'KeyR') {
    // Restart is intentionally available only after a top-out.
  }
  render();
}

function keyUp(event: KeyboardEvent): void {
  const code = event.code;
  pressed.delete(code);
  if (code === 'ArrowDown') downHeld = false;
  if (code === 'ArrowLeft' && activeHorizontal === -1) activateHeldDirection('ArrowRight', 1);
  if (code === 'ArrowRight' && activeHorizontal === 1) activateHeldDirection('ArrowLeft', -1);
}

function activateHeldDirection(code: 'ArrowLeft' | 'ArrowRight', direction: -1 | 1): void {
  if (!pressed.has(code)) {
    activeHorizontal = 0;
    horizontalElapsed = 0;
    return;
  }
  activeHorizontal = direction;
  horizontalElapsed = 0;
  nextRepeatAt = DAS_MS;
  game.moveHorizontal(direction);
}

function restart(): void {
  game.restart();
  pressed.clear();
  activeHorizontal = 0;
  downHeld = false;
  horizontalElapsed = 0;
  nextRepeatAt = DAS_MS;
  render();
}

function frame(time: number): void {
  const delta = previousTime === 0 ? 0 : Math.min(time - previousTime, 100);
  previousTime = time;
  if (!game.gameOver) {
    if (activeHorizontal !== 0) {
      horizontalElapsed += delta;
      while (horizontalElapsed >= nextRepeatAt) {
        game.moveHorizontal(activeHorizontal);
        nextRepeatAt += ARR_MS;
      }
    }
    game.tick(delta, downHeld);
  }
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', keyDown, { passive: false });
window.addEventListener('keyup', keyUp);
window.addEventListener('blur', () => {
  pressed.clear();
  activeHorizontal = 0;
  downHeld = false;
});
window.addEventListener('resize', () => { resizeBoardCanvas(); render(); });
restartButton.addEventListener('click', restart);

resizeBoardCanvas();
render();
requestAnimationFrame(frame);

