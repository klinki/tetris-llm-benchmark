// Chromium assertions for gpt-6.1-sol-{low,medium,high,xhigh}.
// Usage: node .audit/gpt61-sol-browser.cjs <base-url> <effort> [artifacts-dir]
// Uses the repository's Playwright library and an already-installed Chromium.
// The served dist/main.js only gains an appended `window.__game = game`
// accessor to its existing binding. requestAnimationFrame is captured so the
// unchanged frame callback can be driven with exact timestamps. Engine, input,
// drawing and frame bodies are never repaired or replaced.
const { chromium } = require('../node_modules/playwright');
const path = require('node:path');

const [base, mode, artifacts] = process.argv.slice(2);
if (!['low', 'medium', 'high', 'xhigh'].includes(mode)) throw Error('Unknown effort');
const check = (ok, message) => { if (!ok) throw Error(`${mode}: ${message}`); };
// Recorded geometry (CSS px): [board x, width, height] and document width.
const expected = {
  desktop: { low: [518.5, 243, 486], medium: [520, 240, 480], high: [537, 236, 472], xhigh: [521, 238, 476] },
  mobile: { low: [86, 223, 446], medium: [132, 237, 474], high: [24, 236, 472], xhigh: [24, 241, 482] },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const result = { mode, browser: browser.version(), views: {} };
  try {
    for (const [name, width, height] of [['desktop', 1280, 800], ['mobile', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [], badResponses = [], failedRequests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });
      page.on('requestfailed', r => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
      await page.addInitScript(() => { window.requestAnimationFrame = cb => { window.__frame = cb; return 1; }; });
      await page.route('**/dist/main.js', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: `${await response.text()}\nwindow.__game = game;\n` });
      });
      await page.goto(base, { waitUntil: 'networkidle' });
      if (mode !== 'low') await page.keyboard.press('Enter');
      // Adapter: field coordinates (visible rows 0-19), fixture placement and
      // exact-timestamp frames. Low stores two hidden rows above row 0.
      await page.evaluate(mode => {
        const g = window.__game, offset = mode === 'low' ? 2 : 20;
        let clock = performance.now();
        window.__v = {
          frame: ms => { clock += ms; window.__frame(clock); },
          clear: () => g.board.forEach(row => row.fill(null)),
          put: (x, y) => { g.board[y + offset][x] = 'J'; },
          count: () => g.board.flat().filter(Boolean).length,
          place: (kind, rotation, x, y) => {
            g.active = { kind, rotation, x, y: mode === 'low' ? y + 2 : y };
            Object.assign(g, mode === 'low' ? { gravityTimer: 0, lockTimer: 0, lockResets: 0, lastRotate: false }
              : mode === 'medium' ? { fallTime: 0, lockTime: 0, lockResets: 0, lastRotation: false }
              : mode === 'high' ? { fallTime: 0, lockTime: 0, lockResets: 0, lastRotation: null }
              : { gravityTime: 0, lockTime: 0, lockResets: 0, touchedGround: false, lastRotation: null });
            if (mode === 'xhigh') g.revision++;
          },
          state: () => ({
            active: g.active && { ...g.active, y: mode === 'low' ? g.active.y - 2 : g.active.y },
            score: g.score, lines: g.lines, level: g.level, held: g.held,
            canHold: mode === 'medium' ? !g.holdUsed : g.canHold,
            over: mode === 'high' ? g.status === 'over' : mode === 'xhigh' ? g.phase === 'over' : g.over,
            count: g.board.flat().filter(Boolean).length,
          }),
        };
      }, mode);
      const v = (expression, arg) => page.evaluate(expression, arg);
      check(!(await v(() => window.__v.state().over)), 'game starts');

      // Every required binding through real keyboard events.
      await v(() => { window.__v.clear(); window.__v.place('T', 0, 3, 5); window.__v.frame(1); });
      const controls = [];
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft', 'ArrowDown', 'Space', 'c']) {
        const before = await v(() => window.__v.state());
        await page.keyboard.press(key);
        const after = await v(() => window.__v.state());
        controls.push({ key, before, after });
      }
      check(controls[0].after.active.x === controls[0].before.active.x - 1, 'ArrowLeft');
      check(controls[1].after.active.x === controls[1].before.active.x + 1, 'ArrowRight');
      for (let i = 2; i < 6; i++) check(controls[i].after.active.rotation === (controls[i].before.active.rotation + (i < 4 ? 1 : 3)) % 4, `rotation ${controls[i].key}`);
      check(controls[6].after.active.y === controls[6].before.active.y + 1 && controls[6].after.score === controls[6].before.score + 1, 'ArrowDown');
      check(controls[7].after.count === 4 && controls[7].after.score > controls[7].before.score, 'Space hard drop');
      check(controls[8].after.held === controls[8].before.active.kind && !controls[8].after.canHold, 'C hold');

      // Normal gravity for 800 ms, then a real ArrowDown keydown and 1 ms frame.
      const transition = await (async () => {
        await v(() => { window.__v.clear(); window.__v.place('O', 0, 3, 0); for (let i = 0; i < 50; i++) window.__v.frame(16); });
        const before = await v(() => window.__v.state());
        await page.keyboard.down('ArrowDown');
        await v(() => window.__v.frame(1));
        const after = await v(() => window.__v.state());
        await page.keyboard.up('ArrowDown');
        return { rows: after.active.y - before.active.y, points: after.score - before.score };
      })();

      // Unchanged frame callback at 60/144 Hz over the same 1480.001 ms, level 2.
      const refresh = await v(mode => {
        const out = [];
        for (const hz of [60, 144]) {
          window.__v.clear(); window.__game.lines = 10; if (mode !== 'medium') window.__game.level = 2;
          window.__v.place('O', 0, 3, 0);
          let elapsed = 0;
          while (elapsed < 1480.001 - 1e-9) { const dt = Math.min(1000 / hz, 1480.001 - elapsed); window.__v.frame(dt); elapsed += dt; }
          out.push(window.__v.state().active.y);
        }
        window.__game.lines = 0; if (mode !== 'medium') window.__game.level = 1;
        return out;
      }, mode);
      check(refresh[0] === refresh[1], 'refresh-rate independent falling');

      // Blocked-spawn game over through real Space, inert controls, real R reset.
      await v(mode => {
        const w = window.__v; w.clear(); w.place('O', 0, 0, 18); window.__game.queue[0] = 'T';
        w.put(4, { low: -1, medium: 0, high: -1, xhigh: 0 }[mode]); w.frame(1);
      }, mode);
      await page.keyboard.press('Space');
      await v(() => window.__v.frame(16));
      const overState = await v(() => window.__v.state());
      check(overState.over, 'blocked spawn ends the game');
      const overlay = () => v(() => {
        const o = document.getElementById('overlay');
        return { display: getComputedStyle(o).display, text: o.innerText.replace(/\s+/g, ' ').trim() };
      });
      const overOverlay = await overlay();
      check(overOverlay.display !== 'none', 'game-over overlay shown');
      for (const key of ['ArrowLeft', 'ArrowUp', 'Space', 'c']) await page.keyboard.press(key);
      const inert = await v(() => window.__v.state());
      check(JSON.stringify(inert) === JSON.stringify(overState), 'game-over input is inert');
      await page.keyboard.press('r');
      await v(() => window.__v.frame(16));
      const restarted = await v(() => window.__v.state());
      check(!restarted.over && restarted.score === 0 && restarted.lines === 0 && restarted.held === null && restarted.count === 0, 'R restarts');
      const activeOverlay = await overlay();
      check(activeOverlay.display === 'none', 'overlay hidden in play');

      const layout = await v(() => {
        const box = e => { const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) }; };
        return {
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight,
          board: box(document.getElementById('board')),
          canvases: [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, ...box(c), backing: [c.width, c.height] })),
          touchControls: [...document.querySelectorAll('[data-action]')].filter(b => b.getBoundingClientRect().width > 0).map(b => b.dataset.action),
        };
      });
      check(layout.documentWidth === width, 'no horizontal overflow');
      const [bx, bw, bh] = expected[name][mode];
      check(Math.abs(layout.board.x - bx) < 0.6 && Math.abs(layout.board.width - bw) < 0.6 && Math.abs(layout.board.height - bh) < 0.6, `${name} board geometry ${JSON.stringify(layout.board)}`);
      check(layout.canvases.every(c => c.x >= 0 && c.x + c.width <= width + 0.01), 'every canvas within the viewport width');
      // The supplied Google-font stylesheet is external; no other failure is accepted.
      const external = u => /fonts\.(googleapis|gstatic)\.com/.test(u);
      check(errors.length === 0, 'application errors: ' + errors.join('; '));
      check(badResponses.filter(u => !external(u)).length === 0 && failedRequests.filter(u => !external(u)).length === 0, 'asset failures');
      // Mouse-click an always-visible header button mid-game, then press Space.
      // Low has no sound control; its pause button is clicked twice (pause, resume).
      const focusedSpace = [];
      const buttons = { low: [['#pause', '#pause']], medium: [['#sound']], high: [['#sound']], xhigh: [['#sound-button'], ['#help-button', '#got-it']] }[mode];
      for (const clicks of buttons) {
        await v(() => { window.__v.clear(); window.__v.place('T', 0, 3, 5); window.__v.frame(1); });
        for (const selector of clicks) await page.click(selector);
        await v(() => window.__v.frame(1));
        const before = await v(() => ({ count: window.__v.count(), focus: document.activeElement?.id || document.activeElement?.tagName, sound: document.querySelector('#sound,#sound-button')?.getAttribute('aria-pressed') ?? null }));
        await page.keyboard.press('Space');
        const after = await v(() => ({ count: window.__v.count(), dialog: Boolean(document.querySelector('dialog')?.open), focus: document.activeElement?.id || document.activeElement?.tagName, sound: document.querySelector('#sound,#sound-button')?.getAttribute('aria-pressed') ?? null }));
        if (after.dialog) await page.click('#got-it');
        focusedSpace.push({ clicks, before, after, hardDropped: after.count === 4 });
        if (mode === 'xhigh' && clicks[0] === '#sound-button') await page.click('#sound-button');
      }
      if (mode === 'xhigh') {
        check(focusedSpace.every(f => !f.hardDropped && f.before.focus === f.clicks.at(-1).slice(1).replace('got-it', 'help-button')), 'focused header button captures Space');
        check(focusedSpace[1].after.dialog, 'Space reopens How to play');
        check(focusedSpace[0].after.sound !== focusedSpace[0].before.sound, 'Space re-toggles the focused sound button');
      } else check(focusedSpace.every(f => f.hardDropped && f.after.sound === f.before.sound), 'Space only hard-drops after a header button click');
      // Preview cell aspect: CSS scale X / CSS scale Y of each hold/next canvas.
      // 1 means square cells; low/medium stretch their fixed backings.
      const previewAspect = Object.fromEntries(layout.canvases.filter(c => c.id !== 'board')
        .map(c => [c.id, +((c.width / c.backing[0]) / (c.height / c.backing[1])).toFixed(3)]));
      // Show a held piece in the retained screenshot (low/medium previews).
      if (mode === 'low' || mode === 'medium') {
        await v(() => { window.__v.clear(); window.__v.place('O', 0, 3, 5); window.__v.frame(1); });
        await page.keyboard.press('c');
        await v(() => window.__v.frame(1));
      }
      result.views[name] = { controls: controls.map(c => c.key), transition, refresh, overOverlay, activeOverlay, focusedSpace, layout, previewAspect, errors, badResponses, failedRequests };
      if (artifacts) await page.screenshot({ path: path.join(artifacts, `gpt61-sol-${mode}-${name}.png`), fullPage: true });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  // Recorded outcomes: low's soft-drop jump; high's single extra boundary row.
  const rows = { low: 17, medium: 1, high: 2, xhigh: 1 }[mode];
  for (const view of Object.values(result.views)) check(view.transition.rows === rows && view.transition.points === rows, 'soft-drop transition ' + JSON.stringify(view.transition));
  // Recorded preview finding: low and medium draw fixed backings into
  // differently proportioned CSS boxes; high/xhigh size backings to the box.
  const { desktop: d, mobile: m } = { desktop: result.views.desktop.previewAspect, mobile: result.views.mobile.previewAspect };
  const near = (value, target, tolerance = 0.02) => Math.abs(value - target) <= tolerance;
  if (mode === 'low') check(near(d.next, 1.44) && m.hold < 0.5 && m.next < 0.5, 'low preview distortion ' + JSON.stringify({ d, m }));
  else if (mode === 'medium') check(near(d.next, 1.186) && near(d.hold, 1.107) && near(m.hold, 0.802), 'medium preview distortion ' + JSON.stringify({ d, m }));
  else check([...Object.values(d), ...Object.values(m)].every(r => near(r, 1, 0.03)), 'square preview cells ' + JSON.stringify({ d, m }));
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
