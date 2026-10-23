// Keyboard input goes to whichever document has focus, so the game needs focus to play.
const frame = document.querySelector(".play-frame iframe");

document.querySelector("[data-focus-game]")?.addEventListener("click", () => {
  frame.focus();
  try {
    frame.contentWindow.focus();
    frame.contentDocument?.querySelector("canvas")?.focus();
  } catch {
    // Focusing the frame element is enough when its document cannot be reached.
  }
});
