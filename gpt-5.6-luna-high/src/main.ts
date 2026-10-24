import { GameSnapshot, HIDDEN_ROWS, PieceType, TetrisGame, VISIBLE_HEIGHT, getCells } from './game.js';

const game = new TetrisGame();
const boardElement = document.querySelector<HTMLDivElement>('#game-board')!;
const holdElement = document.querySelector<HTMLDivElement>('#hold-board')!;
const nextElement = document.querySelector<HTMLDivElement>('#next-board')!;
const scoreElement = document.querySelector<HTMLElement>('#score')!;
const linesElement = document.querySelector<HTMLElement>('#lines')!;
const levelElement = document.querySelector<HTMLElement>('#level')!;
const messageElement = document.querySelector<HTMLDivElement>('#game-message')!;
const messageTitle = document.querySelector<HTMLElement>('#message-title')!;
const colorClass: Record<PieceType, string> = { I: 'cyan', J: 'blue', L: 'orange', O: 'yellow', S: 'green', T: 'purple', Z: 'red' };

function makeCell(className = ''): HTMLDivElement {
  const cell = document.createElement('div');
  cell.className = `cell ${className}`.trim();
  return cell;
}

function renderBoard(snapshot: GameSnapshot): void {
  const activeCells = new Map<string, PieceType>();
  const ghostCells = new Set<string>();
  if (snapshot.ghost) for (const [x, y] of getCells(snapshot.ghost.type, snapshot.ghost.rotation)) ghostCells.add(`${snapshot.ghost.x + x},${snapshot.ghost.y + y}`);
  if (snapshot.active) for (const [x, y] of getCells(snapshot.active.type, snapshot.active.rotation)) activeCells.set(`${snapshot.active.x + x},${snapshot.active.y + y}`, snapshot.active.type);
  const cells: HTMLDivElement[] = [];
  const visible = snapshot.board.slice(HIDDEN_ROWS);
  for (let row = 0; row < VISIBLE_HEIGHT; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      const key = `${column},${row + HIDDEN_ROWS}`;
      const type = activeCells.get(key) ?? visible[row][column];
      const className = type ? `${colorClass[type]} filled` : ghostCells.has(key) ? `ghost ${snapshot.ghost ? colorClass[snapshot.ghost.type] : ''}` : '';
      cells.push(makeCell(className));
    }
  }
  boardElement.replaceChildren(...cells);
}

function renderMiniPiece(element: HTMLDivElement, type: PieceType | null): void {
  const cells = Array.from({ length: 16 }, () => makeCell());
  if (type) for (const [x, y] of getCells(type, 0)) cells[y * 4 + x].className = `cell ${colorClass[type]} filled`;
  element.replaceChildren(...cells);
}

function renderNext(queue: PieceType[]): void {
  nextElement.replaceChildren();
  for (const type of queue.slice(0, 3)) {
    const row = document.createElement('div');
    row.className = 'next-row';
    const cells = Array.from({ length: 16 }, () => makeCell());
    for (const [x, y] of getCells(type, 0)) cells[y * 4 + x].className = `cell ${colorClass[type]} filled`;
    row.replaceChildren(...cells);
    nextElement.append(row);
  }
}

function render(): void {
  const snapshot = game.snapshot();
  renderBoard(snapshot);
  renderMiniPiece(holdElement, snapshot.hold);
  renderNext(snapshot.queue);
  scoreElement.textContent = snapshot.score.toLocaleString();
  linesElement.textContent = String(snapshot.lines);
  levelElement.textContent = String(snapshot.level);
  messageElement.hidden = !snapshot.gameOver && !snapshot.paused;
  messageTitle.textContent = snapshot.gameOver ? 'Game over' : 'Paused';
}

function act(action: () => void): void { action(); render(); }

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'z', 'x', 'c', 'control', 'r', 'p'].includes(key)) event.preventDefault();
  if (key === 'r') { game.restart(); render(); return; }
  if (key === 'p') { act(() => game.togglePause()); return; }
  if (key === 'arrowleft') act(() => game.moveLeft());
  else if (key === 'arrowright') act(() => game.moveRight());
  else if (key === 'arrowup' || key === 'x') act(() => game.rotate(true));
  else if (key === 'z' || key === 'control') act(() => game.rotate(false));
  else if (key === 'arrowdown') act(() => game.softDrop());
  else if (key === ' ') act(() => game.hardDrop());
  else if (key === 'c') act(() => game.holdPiece());
});

document.querySelector<HTMLButtonElement>('#restart-button')!.addEventListener('click', () => { game.restart(); render(); });

let previous = performance.now();
function frame(now: number): void {
  game.update(now - previous);
  previous = now;
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
