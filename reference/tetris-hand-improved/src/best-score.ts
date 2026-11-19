/** The best score, kept in localStorage when the browser allows it. */
const KEY = "tetrisjs-best";

export function loadBestScore(): number {
  try {
    return Math.max(0, Number(localStorage.getItem(KEY)) || 0);
  } catch {
    return 0; // Storage can be unavailable, e.g. in some private windows.
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    /* Remembering the best score is optional. */
  }
}
