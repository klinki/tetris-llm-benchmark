import { Game } from "./game.js";

/**
 * Keyboard controls with DAS/ARR handling for horizontal movement:
 * an initial delay before auto-repeat kicks in, then a fast repeat.
 */

const DAS_MS = 150; // delayed auto shift
const ARR_MS = 40;  // auto repeat rate

interface RepeatHandles {
  timeout?: number;
  interval?: number;
}

const GAME_KEYS = new Set([
  "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space",
  "KeyA", "KeyD", "KeyS", "KeyX", "KeyZ", "KeyC", "KeyR", "KeyP",
  "ControlLeft", "ControlRight", "Escape",
]);

export function attachInput(game: Game): void {
  const repeats = new Map<string, RepeatHandles>();

  function startRepeat(key: string, action: () => void): void {
    stopRepeat(key);
    action();
    const handles: RepeatHandles = {};
    handles.timeout = window.setTimeout(() => {
      handles.interval = window.setInterval(action, ARR_MS);
    }, DAS_MS);
    repeats.set(key, handles);
  }

  function stopRepeat(key: string): void {
    const handles = repeats.get(key);
    if (!handles) return;
    if (handles.timeout !== undefined) window.clearTimeout(handles.timeout);
    if (handles.interval !== undefined) window.clearInterval(handles.interval);
    repeats.delete(key);
  }

  function stopAll(): void {
    for (const key of [...repeats.keys()]) stopRepeat(key);
    game.softDropHeld = false;
  }

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) return; // we do our own auto-repeat
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        startRepeat("left", () => game.move(-1));
        break;
      case "ArrowRight":
      case "KeyD":
        startRepeat("right", () => game.move(1));
        break;
      case "ArrowDown":
      case "KeyS":
        game.softDropHeld = true;
        break;
      case "ArrowUp":
      case "KeyX":
        game.rotate(1);
        break;
      case "KeyZ":
      case "ControlLeft":
      case "ControlRight":
        game.rotate(-1);
        break;
      case "Space":
        game.hardDrop();
        break;
      case "KeyC":
        game.holdPiece();
        break;
      case "KeyR":
        if (game.gameOver) game.restart();
        break;
      case "KeyP":
      case "Escape":
        if (!game.gameOver) game.paused = !game.paused;
        break;
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        stopRepeat("left");
        break;
      case "ArrowRight":
      case "KeyD":
        stopRepeat("right");
        break;
      case "ArrowDown":
      case "KeyS":
        game.softDropHeld = false;
        break;
    }
  });

  window.addEventListener("blur", stopAll);
}
