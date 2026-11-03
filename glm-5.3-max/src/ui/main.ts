import { Game, type LockInfo } from "../core/game.js";
import { InputController } from "./input.js";
import { Renderer } from "./renderer.js";

/** Clamp frame time (e.g. after a hidden tab) so gravity cannot jump. */
const MAX_FRAME_MS = 100;

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id} element`);
  return element as T;
}

function clearLabel(lock: LockInfo): string {
  const names = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS"];
  if (lock.lines === 0) {
    return lock.tspin === "full" ? "T-SPIN" : lock.tspin === "mini" ? "T-SPIN MINI" : "";
  }
  let label =
    lock.tspin === "none"
      ? names[lock.lines]
      : `${lock.tspin === "mini" ? "MINI T-SPIN" : "T-SPIN"} ${names[lock.lines]}`;
  if (lock.backToBack) label = `B2B ${label}`;
  if (lock.combo > 1) label += ` \u00b7 COMBO \u00d7${lock.combo - 1}`;
  if (lock.perfectClear) label += " \u00b7 PERFECT CLEAR";
  return label;
}

function main(): void {
  const game = new Game();
  const renderer = new Renderer({
    board: required<HTMLCanvasElement>("board"),
    hold: required<HTMLCanvasElement>("hold"),
    next: required<HTMLCanvasElement>("next"),
  });
  const input = new InputController(game);
  input.attach();

  const score = required<HTMLElement>("score");
  const level = required<HTMLElement>("level");
  const lines = required<HTMLElement>("lines");
  const message = required<HTMLElement>("message");
  const overlay = required<HTMLElement>("overlay");

  let last = performance.now();
  let shownLockVersion = -1;

  const frame = (now: number): void => {
    const dt = Math.min(now - last, MAX_FRAME_MS);
    last = now;

    input.update(dt);
    game.update(dt, input.softDrop);
    renderer.draw(game);

    score.textContent = String(game.score);
    level.textContent = String(game.level);
    lines.textContent = String(game.lines);
    overlay.hidden = !game.gameOver;
    if (game.lockVersion !== shownLockVersion) {
      shownLockVersion = game.lockVersion;
      message.textContent = game.lastLock ? clearLabel(game.lastLock) : "";
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
