// Chromium checks for gpt-6.1-sol-max at 1280x800 and 390x844.
// Usage: node .audit/gpt61-sol-max-browser.cjs <base-url> <artifacts-dir>
// The served dist/main.js only gains an appended observation handle
// (window.__app: game, input, renderer and a setter for the frame clock).
// requestAnimationFrame is captured so the unchanged frame callback runs at
// exact timestamps; canvas roundRect/fill calls are recorded and forwarded.
// Engine, input, drawing and frame bodies are never repaired or replaced.
const { chromium } = require('../node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function runBrowser(base, artifacts) {
  const audit = await import(pathToFileURL(path.join(__dirname, 'gpt61-sol-max-audit.mjs')));
  const browser = await chromium.launch({ headless: true });
  const result = { browser: browser.version(), views: {} };
  const shutdown = async () => { await browser.close(); process.exit(130); };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
  try {
    for (const [name, width, height] of [['desktop', 1280, 800], ['mobile', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      try {
        const page = await context.newPage(), errors = [], assets = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('response', r => { if (r.status() >= 400) assets.push(`${r.status()} ${r.url()}`); });
        page.on('requestfailed', r => assets.push(r.url()));
        await page.addInitScript(() => {
          window.requestAnimationFrame = cb => { window.__frame = cb; return 1; };
          window.__draws = [];
          const proto = CanvasRenderingContext2D.prototype, roundRect = proto.roundRect, fill = proto.fill;
          proto.roundRect = function (x, y, w, h, r) { const m = this.getTransform(); this.__rect = { el: this.canvas, x: m.a * x + m.e, y: m.d * y + m.f, w: m.a * w, h: m.d * h }; return roundRect.call(this, x, y, w, h, r); };
          proto.fill = function (...args) { if (this.__rect) { __draws.push({ ...this.__rect, fill: String(this.fillStyle), alpha: this.globalAlpha }); this.__rect = null; } return fill.apply(this, args); };
        });
        await page.route(new URL('dist/main.js', base).href, async route => {
          const response = await route.fetch(), body = await response.text();
          assert.equal(body.split('let previous = performance.now();').length, 2);
          await route.fulfill({ response, body: `${body}\nwindow.__app = { game, input, renderer, resetClock(t) { previous = t; } };\n` });
        });
        await page.goto(base, { waitUntil: 'networkidle' });
        const ready = await page.evaluate(() => ({ status: __app.game.status, overlay: !document.getElementById('overlay').hidden }));
        await page.keyboard.press('Enter');
        // Enter starts; the overlay syncs in the next (captured) animation frame.
        const started = await page.evaluate(() => { __app.resetClock(1000); __frame(1000); return { status: __app.game.status, overlay: !document.getElementById('overlay').hidden, focus: document.activeElement.id }; });
        assert.deepEqual([ready, started], [{ status: 'ready', overlay: true }, { status: 'playing', overlay: false, focus: 'play-area' }]);

        // The same engine fixtures, on the served modules inside this page.
        const engine = await page.evaluate(async ({ factory, probe, oracle }) => {
          const game = await import('/dist/game.js'), pieces = await import('/dist/pieces.js');
          const a = (0, eval)(`(${factory})`)({ game, pieces });
          const e = (0, eval)(`(${probe})`)(a, { ...oracle, colors: pieces.COLORS });
          let time = 1000; __app.resetClock(time);
          const g = () => __app.game;
          const frame = dt => { time += dt; __frame(time); };
          const advance = ms => { while (ms > 1e-8) { const dt = Math.min(ms, 16); frame(dt); ms -= dt; } };
          const fresh = (t = 'T', r = 0, x = 3, y = 5) => {
            Object.assign(g(), a.make(42)); __app.input.clear(); a.clear(g()); a.place(g(), t, r, x, y);
            g().revision++; document.getElementById('play-area').focus(); frame(0);
          };
          const paint = () => { __draws.length = 0; __app.renderer.dirty = true; g().revision++; frame(0); };
          const state = () => ({ active: a.active(g()), count: a.count(g()), score: g().score, lines: g().lines, level: g().level, held: g().held, canHold: g().canHold, over: a.over(g()), status: g().status, pieces: g().pieces });
          window.__v = { a, g, frame, advance, fresh, paint, state };
          fresh(); return e;
        }, { factory: audit.createAdapter.toString(), probe: audit.runProbes.toString(), oracle: { reference: audit.reference, normalKicks: audit.normalKicks, iKicks: audit.iKicks } });
        audit.assertRecorded(engine);
        const v = (fn, arg) => page.evaluate(fn, arg), st = () => v(() => __v.state());

        // Every required binding through real keyboard events.
        const controls = [];
        for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft', 'ArrowDown', 'Space', 'c']) {
          const before = await st();
          if (key === 'ArrowDown') { await page.keyboard.down(key); await v(() => __v.frame(49)); await page.keyboard.up(key); } else await page.keyboard.press(key);
          controls.push({ key, before, after: await st() });
        }
        assert.equal(controls[0].after.active.x, controls[0].before.active.x - 1); assert.equal(controls[1].after.active.x, controls[1].before.active.x + 1);
        for (let i = 2; i < 6; i++) assert.equal(controls[i].after.active.rotation, (controls[i].before.active.rotation + (i < 4 ? 1 : 3)) % 4, controls[i].key);
        assert.deepEqual([controls[6].after.active.y - controls[6].before.active.y, controls[6].after.score - controls[6].before.score], [1, 1]);
        assert.equal(controls[7].after.count, 4); assert(controls[7].after.score > controls[7].before.score);
        assert.deepEqual([controls[8].after.held, controls[8].after.canHold], [controls[8].before.active.type, false]);

        // DAS 167/ARR 33, opposite-direction priority and release fallback; blur pause.
        await v(() => __v.fresh('O', 0, 3, 0));
        await page.keyboard.down('ArrowLeft'); const leftNow = (await st()).active.x; await v(() => __v.advance(400)); const leftWall = (await st()).active.x;
        await page.keyboard.down('ArrowRight'); const rightNow = (await st()).active.x; await v(() => __v.advance(400)); const rightWall = (await st()).active.x;
        await page.keyboard.up('ArrowRight'); const fallbackNow = (await st()).active.x; await v(() => __v.advance(400)); const fallbackWall = (await st()).active.x; await page.keyboard.up('ArrowLeft');
        const das = { leftNow, leftWall, rightNow, rightWall, fallbackNow, fallbackWall };
        assert.deepEqual(das, { leftNow: 2, leftWall: -1, rightNow: 0, rightWall: 7, fallbackNow: 6, fallbackWall: -1 });
        await v(() => __v.fresh('O', 0, 3, 0)); await page.keyboard.down('ArrowRight'); await page.keyboard.down('ArrowDown');
        const blur = await v(() => { window.dispatchEvent(new Event('blur')); const x = __v.state().active.x; __v.advance(300); return { status: __v.state().status, sameX: x === __v.state().active.x, soft: __app.input.softDropping, overlay: !document.getElementById('overlay').hidden }; });
        await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowDown'); await page.keyboard.press('p'); const resumed = (await st()).status;
        assert.deepEqual({ ...blur, resumed }, { status: 'paused', sameX: true, soft: false, overlay: true, resumed: 'playing' });

        // Held Space: native repeats are ignored, so one physical press drops one piece.
        await v(() => __v.fresh('T', 0, 3, 5)); const piecesBefore = (await st()).pieces;
        await page.keyboard.down('Space'); await v(() => __v.frame(16)); await page.keyboard.down('Space'); await v(() => __v.frame(16)); await page.keyboard.up('Space');
        const heldSpace = (await st()).pieces - piecesBefore; assert.equal(heldSpace, 1);

        // The unchanged RAF frame callback at 60 and 144 Hz: level 10 for 600 ms.
        const refresh = await v(() => { const out = []; for (const hz of [60, 144]) { __v.fresh('O', 0, 3, 0); __v.g().level = 10; let t = 0; while (t < 600 - 1e-8) { const d = Math.min(1000 / hz, 600 - t); __v.frame(d); t += d; } out.push(__v.state().active.y); } return out; });
        assert.deepEqual(refresh, [9, 9]);
        // Real soft entry after 800 ms of normal gravity; grounded soft drop; natural contact.
        await v(() => { __v.fresh('O', 0, 3, 0); __v.advance(800); }); await page.keyboard.down('ArrowDown'); await v(() => __v.frame(1));
        const soft = await v(() => ({ rows: __v.state().active.y, points: __v.state().score })); await page.keyboard.up('ArrowDown'); assert.deepEqual(soft, { rows: 1, points: 1 });
        await v(() => __v.fresh('O', 0, 3, 18)); await page.keyboard.down('ArrowDown'); await v(() => __v.advance(499)); const gs499 = (await st()).count;
        await v(() => __v.frame(1)); const gs500 = (await st()).count; await page.keyboard.up('ArrowDown'); assert.deepEqual([gs499, gs500], [0, 4]);
        const contact = await v(() => { __v.fresh('O', 0, 3, 17); __v.advance(990); __v.frame(16); __v.advance(483); const at1489 = __v.state().count; __v.advance(10); const at1499 = __v.state().count; __v.frame(1); return { at1489, at1499, at1500: __v.state().count }; });
        assert.deepEqual(contact, { at1489: 0, at1499: 0, at1500: 4 });

        // Recorded minor: fifteen real Up rotations, Right off the ledge, then contact welds at once.
        await v(() => { __v.fresh('O', 0, -1, 12); __v.a.put(__v.g(), 0, 14); });
        for (let i = 0; i < 15; i++) { await v(() => __v.frame(1)); await page.keyboard.press('ArrowUp'); }
        await v(() => __v.advance(490)); await page.keyboard.press('ArrowRight');
        const exhausted = await v(() => { let t = 0, land = null; while (__v.state().count === 1 && t < 9000) { __v.frame(1); t++; if (land === null && __v.state().active?.y === 18) land = t; } return { land, lock: t, contactToLock: t - land }; });
        assert.equal(exhausted.contactToLock, 1);

        // Perfect clear and downward spin observations through real keys.
        await v(() => { __v.fresh('I', 0, 3, 18); for (let x = 0; x < 10; x++) if (x < 3 || x > 6) __v.a.put(__v.g(), x, 19); }); await page.keyboard.press('Space');
        const pc = await st(); assert.deepEqual([pc.score, pc.count, pc.lines], [900, 0, 1]);
        const downSpins = {};
        for (const method of ['hard', 'soft', 'natural']) {
          await v(() => { __v.fresh('T', 0, 0, 3); for (const [x, y] of [[0, 17], [0, 19], [2, 19]]) __v.a.put(__v.g(), x, y); }); await page.keyboard.press('ArrowUp');
          if (method === 'soft') { await page.keyboard.down('ArrowDown'); await v(() => __v.advance(700)); await page.keyboard.up('ArrowDown'); }
          if (method === 'natural') await v(() => __v.advance(14000));
          const before = (await st()).score; await page.keyboard.press('Space'); downSpins[method] = (await st()).score - before;
        }
        assert.deepEqual(downSpins, { hard: 28, soft: 0, natural: 0 });
        const deepKicks = [];
        for (const fifth of [false, true]) {
          await v(fifth => { __v.fresh('T', 1, 3, 17); for (const [x, y] of fifth ? [[4, 15], [6, 15], [6, 17], [3, 18], [6, 18], [3, 16]] : [[3, 15], [3, 17], [5, 17], [3, 18], [6, 19]]) __v.a.put(__v.g(), x, y); }, fifth);
          await page.keyboard.press(fifth ? 'ArrowUp' : 'z'); await page.keyboard.press('Space'); deepKicks.push((await st()).score);
        }
        assert.deepEqual(deepKicks, [100, 400]);

        // Above-buffer partial lock and stored-buffer lock-out through real keys.
        await v(() => { __v.fresh(); const a = __v.a, g = __v.g(); a.clear(g); for (const [x, y] of [[5, 0], [3, 0], [6, 1]]) a.put(g, x, y); a.spawn(g, 'I'); a.incoming(g, 'T'); });
        await page.keyboard.press('ArrowUp'); await v(() => __v.advance(1000)); const bufferPose = (await st()).active; await page.keyboard.press('Space');
        const buffer = await v(() => ({ over: __v.state().over, count: __v.state().count, top: __v.a.get(__v.g(), 6, -3) }));
        assert.deepEqual(bufferPose, { type: 'I', rotation: 1, x: 4, y: -3 }); assert.deepEqual(buffer, { over: false, count: 7, top: 'I' });
        const hidden = [];
        for (const partial of [false, true]) {
          await v(partial => { __v.fresh(); const a = __v.a, g = __v.g(); a.clear(g); a.put(g, partial ? 8 : 0, partial ? 1 : 0); if (!partial) a.put(g, 5, 0); a.spawn(g, 'T'); a.incoming(g, 'I'); }, partial);
          for (let i = 0; i < (partial ? 4 : 3); i++) await page.keyboard.press(partial ? 'ArrowRight' : 'ArrowLeft');
          await page.keyboard.press('Space'); await v(() => __v.frame(16)); hidden.push((await st()).over);
        }
        assert.deepEqual(hidden, [true, false]);

        // Header controls keep Space for play: Pause twice, then How to play / Got it.
        await v(() => __v.fresh('T', 0, 3, 5)); await page.click('#pause-button'); const pausedByButton = (await st()).status; await page.click('#pause-button');
        let before = (await st()).pieces; await page.keyboard.press('Space');
        const pauseFocus = { paused: pausedByButton, focus: await v(() => document.activeElement.id), dropped: (await st()).pieces - before };
        await v(() => __v.fresh('T', 0, 3, 5)); await page.click('#help-button'); const helpPaused = (await st()).status; await page.click('#done-help');
        await page.waitForTimeout(100); // the dialog's close event (which refocuses the board) is a queued task
        const helpFocus = await v(() => document.activeElement.id); await page.keyboard.press('p'); before = (await st()).pieces; await page.keyboard.press('Space');
        const help = { paused: helpPaused, focus: helpFocus, dropped: (await st()).pieces - before };
        assert.deepEqual([pauseFocus, help], [{ paused: 'paused', focus: 'play-area', dropped: 1 }, { paused: 'paused', focus: 'play-area', dropped: 1 }]);

        // Top-out through real Space presses, then what each post-game key does.
        const topOut = async () => {
          await v(() => __v.fresh()); let drops = 0;
          while (!(await st()).over && drops < 100) { await page.keyboard.down('Space'); await v(() => __v.frame(16)); if ((await st()).over) break; await page.keyboard.up('Space'); drops++; }
          return drops;
        };
        const gameOver = {};
        gameOver.drops = await topOut();
        gameOver.afterTopOut = await v(() => ({ over: __v.state().over, overlay: !document.getElementById('overlay').hidden, focus: document.activeElement.id, text: document.getElementById('overlay-title').innerText.replace(/\s+/g, ' ') }));
        await page.keyboard.up('Space'); await v(() => __v.frame(16)); gameOver.afterReleasingFinalSpace = (await st()).status;
        const snap = await st(); for (const k of ['ArrowLeft', 'ArrowUp', 'c', 'ArrowDown']) await page.keyboard.press(k); await v(() => __v.frame(16));
        gameOver.otherKeysInert = JSON.stringify(await st()) === JSON.stringify(snap);
        await page.keyboard.press('Space'); await v(() => __v.frame(16));
        gameOver.freshSpace = await v(() => ({ status: __v.state().status, score: __v.state().score, overlay: !document.getElementById('overlay').hidden, focus: document.activeElement.id }));
        await topOut(); await page.keyboard.down('Space'); await v(() => __v.frame(16)); await page.keyboard.up('Space'); await v(() => __v.frame(16));
        gameOver.heldRepeatSpace = (await st()).status;
        await topOut(); await page.keyboard.up('Space'); await v(() => __v.frame(16)); await page.keyboard.press('r'); await v(() => __v.frame(16));
        const restarted = await st(); gameOver.r = { status: restarted.status, score: restarted.score, lines: restarted.lines, level: restarted.level, held: restarted.held, count: restarted.count, overlay: await v(() => !document.getElementById('overlay').hidden) };
        const opening = []; for (let i = 0; i < 7; i++) { opening.push((await st()).active.type); await v(() => __v.a.clear(__v.g())); await page.keyboard.press('Space'); }
        gameOver.rOpeningTypes = new Set(opening).size;
        assert.equal(gameOver.afterTopOut.over, true); assert.equal(gameOver.afterTopOut.overlay, true); assert.equal(gameOver.afterTopOut.focus, 'primary-button');
        assert.equal(gameOver.afterReleasingFinalSpace, 'over'); assert.equal(gameOver.otherKeysInert, true);
        // Recorded minor: Space on the auto-focused Play again button starts a new game.
        assert.deepEqual(gameOver.freshSpace, { status: 'playing', score: 0, overlay: false, focus: 'play-area' });
        assert.equal(gameOver.heldRepeatSpace, 'playing');
        assert.deepEqual(gameOver.r, { status: 'playing', score: 0, lines: 0, level: 1, held: null, count: 0, overlay: false }); assert.equal(gameOver.rOpeningTypes, 7);

        // Ghost drawing, preview cells and layout.
        await v(() => { __v.fresh('T', 0, 3, 5); const g = __v.g(); __v.a.put(g, 4, 16); g.held = 'I'; g.queue.splice(0, g.queue.length, 'I', 'O', 'T', 'S', 'L'); for (let x = 0; x < 10; x++) if (x !== 4) __v.a.put(g, x, 19, 'Z'); });
        const drawn = await v(() => {
          __v.paint();
          const canvases = [...document.querySelectorAll('canvas')], label = el => el.id || `next${[...document.querySelectorAll('.next-canvas')].indexOf(el) + 1}`;
          const board = document.getElementById('board'), scale = board.width / 300;
          const ghost = __draws.filter(d => d.el === board && /rgba\(.*0\.0\d+\)$/.test(d.fill)).map(d => [Math.floor(d.x / scale / 30), Math.floor(d.y / scale / 30)]);
          const previews = __draws.filter(d => d.el !== board).map(d => ({ canvas: label(d.el), x: d.x, y: d.y, w: d.w, h: d.h, cw: d.el.width, ch: d.el.height }));
          const rect = e => { const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2) }; };
          return {
            ghost: ghost.sort().map(String), previews,
            layout: {
              scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
              canvases: canvases.map(c => ({ id: label(c), ...rect(c), backing: [c.width, c.height] })),
              rails: [...document.querySelectorAll('.left-rail,.right-rail,.play-column,.touch-controls')].map(e => ({ cls: e.className, ...rect(e) })),
              touch: [...document.querySelectorAll('[data-action]')].filter(b => b.getBoundingClientRect().width > 0).map(b => b.dataset.action),
            },
          };
        });
        assert.deepEqual(drawn.ghost, ['3,15', '4,14', '4,15', '5,15']);
        assert.equal(drawn.previews.length, 24);
        for (const d of drawn.previews) { assert(Math.abs(d.w - d.h) < 0.01, 'square preview cell'); assert(d.x >= 0 && d.y >= 0 && d.x + d.w <= d.cw + 0.01 && d.y + d.h <= d.ch + 0.01, 'preview cell inside backing ' + JSON.stringify(d)); }
        const L = drawn.layout;
        assert.equal(L.scrollWidth, width, 'no horizontal overflow');
        for (const c of L.canvases) { assert(c.x >= 0 && c.x + c.width <= width + 0.01, 'canvas inside viewport ' + c.id); assert(Math.abs((c.width / c.backing[0]) / (c.height / c.backing[1]) - 1) < 0.02, 'proportional ' + c.id); }
        for (const r of L.rails) if (r.width > 0) assert(r.x >= 0 && r.x + r.width <= width + 0.01, 'panel inside viewport ' + r.cls);
        const board = L.canvases.find(c => c.id === 'board');
        assert(Math.abs(board.height / board.width - 2) < 0.01); if (name === 'desktop') assert(board.y + board.height <= height);
        assert.deepEqual(L.touch, name === 'mobile' ? ['hold', 'ccw', 'cw', 'drop', 'left', 'down', 'right'] : []);
        await page.screenshot({ path: path.join(artifacts, `gpt61-sol-max-${name}.png`), fullPage: true });
        assert.deepEqual(errors, []); assert.deepEqual(assets, []);
        result.views[name] = { ready, started, engine: { states: engine.states, rotations: engine.rotations.total, mismatches: engine.rotations.mismatches, bags: engine.bags }, controls: controls.map(c => c.key), das, blur, heldSpace, refresh, soft, contact, exhausted, pc: [pc.score, pc.count, pc.lines], downSpins, deepKicks, buffer, hidden, pauseFocus, help, gameOver, ghost: drawn.ghost, previewCells: drawn.previews.length, layout: L, errors, assets };
      } finally { await context.close(); }
    }
  } finally { await browser.close(); process.removeListener('SIGTERM', shutdown); process.removeListener('SIGINT', shutdown); }
  console.log(JSON.stringify(result)); return result;
}
if (require.main === module) runBrowser(...process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
module.exports = { runBrowser };
