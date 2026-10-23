import { TetrisEngine } from './engine.js';
import { InputController } from './input.js';
import { TetrisRenderer } from './renderer.js';

const HIGH_SCORE_STORAGE_KEY = 'tetris_js_guideline_high_score';

function loadHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function bootstrap(): void {
  let savedHighScore = loadHighScore();
  const engine = new TetrisEngine(Math.random, savedHighScore);
  const renderer = new TetrisRenderer();

  const syncRender = (): void => {
    const snapshot = engine.getSnapshot();
    if (snapshot.highScore > savedHighScore) {
      savedHighScore = snapshot.highScore;
      saveHighScore(savedHighScore);
    }
    renderer.render(snapshot);
  };

  const input = new InputController(engine, syncRender);

  const pauseBtn = document.getElementById('btn-pause') as HTMLButtonElement | null;
  const restartBtn = document.getElementById('btn-restart') as HTMLButtonElement | null;

  pauseBtn?.addEventListener('click', () => {
    pauseBtn.blur();
    input.resetHeldKeys();
    engine.togglePause();
    syncRender();
  });

  restartBtn?.addEventListener('click', () => {
    restartBtn.blur();
    input.resetHeldKeys();
    engine.reset();
    syncRender();
  });

  let lastFrameTime = performance.now();

  const loop = (now: number): void => {
    const dtMs = Math.min(100, Math.max(0, now - lastFrameTime));
    lastFrameTime = now;

    input.update(dtMs);
    engine.update(dtMs, input.isSoftDropping());
    syncRender();

    window.requestAnimationFrame(loop);
  };

  syncRender();
  window.requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
