import { Game, type Status } from "./engine.js";
import { Renderer, drawPreview } from "./renderer.js";

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing element: ${id}`);
  return value as T;
}

const game = new Game();
const renderer = new Renderer(element<HTMLCanvasElement>("board"));
const ui = {
  score: element("score"),
  best: element("best"),
  level: element("level"),
  lines: element("lines"),
  time: element("time"),
  progress: element("progress"),
  remaining: element("remaining"),
  hold: element<HTMLCanvasElement>("hold"),
  holdHint: element("hold-hint"),
  next: Array.from({ length: 5 }, (_, i) =>
    element<HTMLCanvasElement>(`next-${i}`),
  ),
  overlay: element("overlay"),
  eyebrow: element("overlay-eyebrow"),
  title: element("overlay-title"),
  description: element("overlay-description"),
  play: element<HTMLButtonElement>("play"),
  pause: element<HTMLButtonElement>("pause"),
  sound: element<HTMLButtonElement>("sound"),
  hint: element("start-hint"),
  status: element("status-label"),
  dot: element("status-dot"),
  message: element("clear-message"),
  shell: element("board-shell"),
};
const number = new Intl.NumberFormat("en-US");
let best = 0;
try {
  best = Math.max(0, Number(localStorage.getItem("tetrisjs-best")) || 0);
} catch {
  /* Storage is optional. */
}
let soundEnabled = false;
let audio: AudioContext | null = null;
let previousStatus: Status | null = null;
let previewKey = "";
let previousClear = game.lastClear.id;
let messageUntil = 0;
let previousTime = performance.now();
let side: -1 | 0 | 1 = 0;
let repeatTime = 0;
const keys = new Set<string>();
const pointers = new Map<number, string>();
const actions = new Map([
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
  ["ArrowDown", "soft"],
  ["ArrowUp", "cw"],
  ["KeyX", "cw"],
  ["KeyZ", "ccw"],
  ["ControlLeft", "ccw"],
  ["Space", "drop"],
  ["KeyC", "hold"],
  ["KeyP", "pause"],
  ["Escape", "pause"],
  ["KeyR", "restart"],
  ["Enter", "enter"],
]);

function beep(frequency: number, duration = 0.05): void {
  if (!soundEnabled) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    /* Audio support is optional. */
  }
}

function resetInputs(): void {
  keys.clear();
  pointers.clear();
  side = 0;
  repeatTime = 0;
}
function startOrResume(): void {
  resetInputs();
  if (game.status === "over") {
    game.restart();
    messageUntil = 0;
  } else if (game.status === "ready") game.start();
  else if (game.status === "paused") game.pause();
  previousTime = performance.now();
  beep(440);
  render();
}
function togglePause(): void {
  game.pause();
  resetInputs();
  render();
}
function action(name: string): void {
  if (name === "enter") {
    startOrResume();
    return;
  }
  if (name === "pause") {
    togglePause();
    return;
  }
  if (name === "restart") {
    if (game.status === "over") startOrResume();
    return;
  }
  if (game.status !== "playing") return;
  if (name === "left" || name === "right") {
    side = name === "left" ? -1 : 1;
    repeatTime = 150;
    game.move(side);
  } else if (name === "cw" || name === "ccw") {
    if (game.rotate(name === "cw" ? 1 : -1)) beep(330);
  } else if (name === "soft") game.softDrop();
  else if (name === "drop") {
    game.hardDrop();
    beep(130, 0.1);
  } else if (name === "hold") {
    if (game.hold()) beep(270);
  }
  render();
}

function held(name: string): boolean {
  return (
    [...keys].some((code) => actions.get(code) === name) ||
    [...pointers.values()].includes(name)
  );
}
function releaseDirection(): void {
  const direction = held("left") ? -1 : held("right") ? 1 : 0;
  if (direction !== side) {
    side = direction;
    repeatTime = 150;
    if (side) game.move(side);
  }
}

document.addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.metaKey ||
    (event.ctrlKey && event.code !== "ControlLeft")
  )
    return;
  const name = actions.get(event.code);
  if (!name) return;
  // Preserve native button activation (Enter/Space) for keyboard navigation.
  if (
    (event.code === "Enter" || event.code === "Space") &&
    document.activeElement instanceof HTMLButtonElement
  )
    return;
  event.preventDefault();
  if (event.repeat || keys.has(event.code)) return;
  keys.add(event.code);
  action(name);
});
document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
  if (event.code === "ArrowLeft" || event.code === "ArrowRight")
    releaseDirection();
});
ui.play.addEventListener("click", () => {
  startOrResume();
  ui.play.blur();
});
ui.pause.addEventListener("click", () => {
  togglePause();
  ui.pause.blur();
});
ui.sound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  ui.sound.setAttribute("aria-pressed", String(soundEnabled));
  ui.sound.setAttribute(
    "aria-label",
    soundEnabled ? "Mute sound" : "Enable sound",
  );
  element<HTMLElement>("sound-waves").setAttribute(
    "d",
    soundEnabled
      ? "M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"
      : "m16 9 6 6m0-6-6 6",
  );
  beep(440);
  ui.sound.blur();
});
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-action]",
)) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    const name = button.dataset.action!;
    pointers.set(event.pointerId, name);
    action(name);
  });
  const release = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    releaseDirection();
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}
function autoPause(): void {
  resetInputs();
  if (game.status === "playing") {
    game.pause();
    render();
  }
}
window.addEventListener("blur", autoPause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoPause();
});
window.addEventListener("resize", () => {
  previewKey = "";
});

function text(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}
function render(): void {
  renderer.draw(game);
  text(ui.score, number.format(game.score));
  if (game.score > best) {
    best = game.score;
    try {
      localStorage.setItem("tetrisjs-best", String(best));
    } catch {
      /* Private browsing may deny writes. */
    }
  }
  text(ui.best, number.format(best));
  text(ui.level, String(game.level).padStart(2, "0"));
  text(ui.lines, number.format(game.lines));
  const seconds = Math.floor(game.elapsed / 1000);
  text(
    ui.time,
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
  );
  ui.progress.style.width = `${(game.lines % 10) * 10}%`;
  text(ui.remaining, String(10 - (game.lines % 10)));
  const key = `${game.held}/${game.canHold}/${game.queue.join("")}`;
  if (previewKey !== key) {
    previewKey = key;
    drawPreview(ui.hold, game.held, game.canHold);
    ui.hold.setAttribute(
      "aria-label",
      game.held
        ? `Held piece: ${game.held}${game.canHold ? "" : ", available after placing a piece"}`
        : "No held piece",
    );
    text(
      ui.holdHint,
      game.canHold ? "Save a piece for later" : "Place a piece to hold again",
    );
    ui.next.forEach((canvas, i) => {
      drawPreview(canvas, game.queue[i]!);
      canvas.setAttribute(
        "aria-label",
        `Next piece ${i + 1}: ${game.queue[i]}`,
      );
    });
  }
  if (game.lastClear.id !== previousClear) {
    previousClear = game.lastClear.id;
    if (game.lastClear.points > 0) {
      text(
        ui.message,
        `${game.lastClear.text} +${number.format(game.lastClear.points)}`,
      );
      messageUntil = performance.now() + 1700;
      if (game.lastClear.lines > 0) {
        ui.shell.classList.remove("cleared");
        void ui.shell.offsetWidth;
        ui.shell.classList.add("cleared");
        beep(660, 0.15);
      }
    }
  }
  ui.message.classList.toggle(
    "show",
    game.status === "playing" && performance.now() < messageUntil,
  );
  if (game.status === previousStatus) return;
  previousStatus = game.status;
  ui.overlay.hidden = game.status === "playing";
  ui.pause.disabled = game.status === "ready" || game.status === "over";
  ui.pause.setAttribute(
    "aria-label",
    game.status === "paused" ? "Resume game" : "Pause game",
  );
  text(
    ui.pause.querySelector("span")!,
    game.status === "paused" ? "RESUME" : "PAUSE",
  );
  const statuses: Record<Status, string> = {
    ready: "READY WHEN YOU ARE",
    playing: "IN THE FLOW",
    paused: "TAKE YOUR TIME",
    over: "NICE RUN",
  };
  text(ui.status, statuses[game.status]);
  ui.dot.style.background = game.status === "playing" ? "#a4e8b5" : "#87978b";
  if (game.status === "paused") {
    text(ui.eyebrow, "A MOMENT TO BREATHE");
    text(ui.title, "Take a little break.");
    text(ui.description, "Your next move can wait.");
    ui.play.innerHTML = 'Keep playing <span aria-hidden="true">↗</span>';
    ui.hint.innerHTML = "or press <kbd>P</kbd>";
  } else if (game.status === "over") {
    text(ui.eyebrow, "THERE’S ALWAYS ANOTHER ROUND");
    text(ui.title, "A good place to start.");
    text(
      ui.description,
      `${number.format(game.score)} points · ${game.lines} lines · Level ${game.level}`,
    );
    ui.play.innerHTML = 'Play again <span aria-hidden="true">↗</span>';
    ui.hint.innerHTML = "or press <kbd>R</kbd>";
  }
}

function frame(now: number): void {
  const delta = Math.min(Math.max(0, now - previousTime), 100);
  previousTime = now;
  if (game.status === "playing") {
    if (side) {
      repeatTime -= delta;
      while (repeatTime <= 0) {
        game.move(side);
        repeatTime += 45;
      }
    }
    game.update(delta, held("soft"));
  }
  render();
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
