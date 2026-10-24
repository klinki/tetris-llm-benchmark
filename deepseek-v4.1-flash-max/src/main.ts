import { Game, type GameState } from './game.js';
import { InputController } from './input.js';
import { Renderer } from './renderer.js';
import { LEVEL_LINES } from './scoring.js';

const BEST_SCORE_KEY = 'tetris.best-score';

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

const boardCanvas = getElement<HTMLCanvasElement>('board');
const holdCanvas = getElement<HTMLCanvasElement>('hold');
const nextCanvas = getElement<HTMLCanvasElement>('next');

const scoreElement = getElement<HTMLElement>('score');
const bestElement = getElement<HTMLElement>('best');
const levelElement = getElement<HTMLElement>('level');
const linesElement = getElement<HTMLElement>('lines');
const comboElement = getElement<HTMLElement>('combo');
const comboBadge = getElement<HTMLElement>('combo-badge');
const b2bBadge = getElement<HTMLElement>('b2b-badge');
const progressBar = getElement<HTMLElement>('level-progress-bar');
const progressFill = getElement<HTMLElement>('level-progress');

const gameoverOverlay = getElement<HTMLElement>('gameover-overlay');
const pauseOverlay = getElement<HTMLElement>('pause-overlay');
const finalScoreElement = getElement<HTMLElement>('final-score');
const restartButton = getElement<HTMLButtonElement>('restart-button');

const scoreFormatter = new Intl.NumberFormat('en-US');
const formatScore = (value: number): string => scoreFormatter.format(value);

let bestScore = 0;
try {
  const stored = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '', 10);
  if (Number.isFinite(stored) && stored > 0) bestScore = stored;
} catch {
  // Storage may be disabled; the game still works without a saved best score.
}

function persistBestScore(value: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }
}

const game = new Game();
const renderer = new Renderer(boardCanvas, holdCanvas, nextCanvas);

function restartGame(): void {
  game.reset();
  renderer.clearEffects();
  syncUi(true);
}

const input = new InputController(window, {
  move: (direction) => game.move(direction),
  rotate: (direction) => game.rotate(direction),
  softDrop: (active) => game.setSoftDrop(active),
  hardDrop: () => {
    if (game.state === 'gameover') {
      restartGame();
      input.releaseAll();
      return;
    }
    game.hardDrop();
  },
  hold: () => game.hold(),
  restart: () => {
    restartGame();
    input.releaseAll();
  },
  pause: () => game.togglePause(),
  canAutoRepeat: () => game.state === 'playing',
});

game.onEvent = (event) => {
  if (event.type === 'clear') {
    renderer.addClearEffect(event.rows, event.label, event.points);
  } else if (event.type === 'levelup') {
    renderer.addToast(`LEVEL ${event.level}`);
  }
};

restartButton.addEventListener('click', () => {
  restartGame();
  input.releaseAll();
  restartButton.blur();
});

interface HudSnapshot {
  score: string;
  best: string;
  level: number;
  lines: number;
  progress: number;
  combo: number;
  comboActive: boolean;
  b2b: boolean;
  state: GameState;
}

const hud: HudSnapshot = {
  score: '',
  best: '',
  level: -1,
  lines: -1,
  progress: -1,
  combo: -2,
  comboActive: false,
  b2b: false,
  state: 'playing',
};

function syncUi(force = false): void {
  const scoreText = formatScore(game.score);
  if (force || scoreText !== hud.score) {
    scoreElement.textContent = scoreText;
    hud.score = scoreText;
  }

  if (force || game.level !== hud.level) {
    levelElement.textContent = String(game.level);
    hud.level = game.level;
  }

  if (force || game.lines !== hud.lines) {
    linesElement.textContent = String(game.lines);
    hud.lines = game.lines;
  }

  const levelProgress = game.lines % LEVEL_LINES;
  const progress = (levelProgress / LEVEL_LINES) * 100;
  if (force || progress !== hud.progress) {
    progressFill.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(levelProgress));
    hud.progress = progress;
  }

  const comboActive = game.combo > 0;
  const comboValue = Math.max(0, game.combo);
  if (force || comboActive !== hud.comboActive) {
    comboBadge.classList.toggle('active', comboActive);
    hud.comboActive = comboActive;
  }
  if (force || comboValue !== hud.combo) {
    comboElement.textContent = String(comboValue);
    hud.combo = comboValue;
  }

  if (force || game.b2b !== hud.b2b) {
    b2bBadge.classList.toggle('active', game.b2b);
    hud.b2b = game.b2b;
  }

  if (game.state !== hud.state || force) {
    gameoverOverlay.classList.toggle('hidden', game.state !== 'gameover');
    pauseOverlay.classList.toggle('hidden', game.state !== 'paused');

    if (game.state === 'gameover') {
      finalScoreElement.textContent = formatScore(game.score);
      if (game.score > bestScore) {
        bestScore = game.score;
        persistBestScore(bestScore);
      }
    }
    hud.state = game.state;
  }

  const bestText = formatScore(Math.max(bestScore, game.score));
  if (force || bestText !== hud.best) {
    bestElement.textContent = bestText;
    hud.best = bestText;
  }
}

let lastFrameTime = performance.now();

function frame(now: number): void {
  const delta = Math.min(0.1, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  input.update(delta);
  game.update(delta);
  renderer.render(game, now);
  syncUi();

  requestAnimationFrame(frame);
}

syncUi(true);
requestAnimationFrame(frame);
