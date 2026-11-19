// End-to-end checks in Chromium. Playwright is not a dependency of this project:
// the suite runs when it can be imported (installed locally, or a path given in
// PLAYWRIGHT_MODULE) and is skipped otherwise.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  const specifier = process.env.PLAYWRIGHT_MODULE;
  try {
    const module = await import(specifier ? pathToFileURL(specifier).href + "/index.mjs" : "playwright");
    return module.chromium ?? module.default?.chromium;
  } catch {
    return null;
  }
}

const chromium = await loadPlaywright();
const skip = chromium ? false : "Playwright is not installed (set PLAYWRIGHT_MODULE to its package directory)";

/** Serves the game, opens a page with `window.game` exposed and returns helpers. */
async function openGame(t, browser, viewport, touch = false) {
  const script = fileURLToPath(new URL("../scripts/serve.mjs", import.meta.url));
  const server = spawn(process.execPath, [script], { env: { ...process.env, PORT: "0" } });
  t.after(() => server.kill());
  const origin = String((await once(server.stdout, "data"))[0]).match(/http:\/\/localhost:\d+/)[0];
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  // Test hook only: expose the game object the page creates.
  await page.route("**/dist/main.js", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.game = game;` });
  });
  await page.goto(origin);
  const state = () => page.evaluate(() => ({ ...game.active, status: game.status, held: game.held, pieces: game.pieces }));
  return { page, errors, state };
}

test("Chromium: layout, keyboard, touch and game flow", { skip }, async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());

  for (const [width, height, touch] of [[1280, 800, false], [1366, 640, false], [390, 844, true], [320, 568, true]]) {
    await t.test(`${width}×${height}`, async (t) => {
      const { page, errors, state } = await openGame(t, browser, { width, height }, touch);
      const layout = await page.evaluate(() => {
        const box = (id) => document.getElementById(id).getBoundingClientRect();
        const ratio = (id) => {
          const canvas = document.getElementById(id);
          return canvas.width / canvas.height / (box(id).width / box(id).height);
        };
        const root = document.documentElement;
        return { scroll: [root.scrollWidth, root.scrollHeight], board: box("board"), hold: ratio("hold"), next: ratio("next") };
      });
      assert.ok(layout.scroll[0] <= width && layout.scroll[1] <= height, `no scrolling: ${layout.scroll}`);
      assert.ok(Math.abs(layout.board.height / layout.board.width - 2) < 0.02, "board is 10×20 cells");
      assert.ok(Math.abs(layout.hold - 1) < 0.02 && Math.abs(layout.next - 1) < 0.02, "previews are not stretched");
      assert.equal(await page.isVisible(".touch"), touch, "touch controls only where needed");

      if (touch) await page.tap("#play");
      else await page.click("#play");
      const start = await state();
      assert.equal(start.status, "playing");

      if (touch) {
        const tap = (action) => page.tap(`[data-action="${action}"]`);
        await tap("left");
        assert.equal((await state()).x, start.x - 1);
        await tap("cw");
        assert.equal((await state()).rotation, 1);
        await tap("hold");
        assert.equal((await state()).held, start.kind);
        await tap("drop");
        assert.equal((await state()).pieces, 1);
      } else {
        const press = (key) => page.keyboard.press(key);
        await press("ArrowLeft");
        assert.equal((await state()).x, start.x - 1);
        for (const [key, rotation] of [["ArrowUp", 1], ["KeyX", 2], ["KeyZ", 1], ["ControlLeft", 0]]) {
          await press(key);
          assert.equal((await state()).rotation, rotation, key);
        }
        const y = (await state()).y;
        await press("ArrowDown");
        assert.equal((await state()).y, y + 1);
        await press("KeyC");
        assert.equal((await state()).held, start.kind);
        // A clicked header button must not swallow Space.
        await page.click("#sound");
        await press("Space");
        assert.equal((await state()).pieces, 1, "Space hard-drops after clicking Sound");
        assert.equal(await page.getAttribute("#sound", "aria-pressed"), "true");
        await press("KeyP");
        assert.equal((await state()).status, "paused");
        await press("Escape");
        assert.equal((await state()).status, "playing");
        await page.evaluate(() => window.dispatchEvent(new Event("blur")));
        assert.equal((await state()).status, "paused", "losing focus pauses");
        await press("Enter");
      }

      // Score a line with the lock that tops out, then restart at once: no stale message.
      await page.evaluate(() => {
        const row = [0, 1, 2, 7, 8, 9].map((x) => [x, 19, "J"]);
        game.setUp({ clear: true, stack: [...row, [4, -2, "J"], [4, -1, "J"]], active: { kind: "I", rotation: 0, x: 3, y: 18 } });
      });
      await page.keyboard.press("Space");
      assert.equal((await state()).status, "over");
      await page.waitForSelector("#overlay:not([hidden])");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Space");
      assert.equal((await state()).status, "over", "gameplay keys are inert after game over");
      await page.keyboard.press("KeyR");
      await page.waitForSelector("#overlay", { state: "hidden" });
      assert.equal(await page.evaluate(() => game.score), 0);
      assert.equal(await page.locator("#toast.show").count(), 0, "the last game's message is gone");
      assert.deepEqual(errors, []);
    });
  }
});
