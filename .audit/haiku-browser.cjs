// Playwright CLI run-code snippet. Run from a temporary artifact directory
// after opening the isolated run's npm start URL. Does not change source files.
async (page) => {
  const mode = new URL(page.url()).searchParams.get('audit') ?? 'high';
  if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(mode)) throw new Error(`Unknown effort: ${mode}`);
  const errors = [], consoleErrors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.location().url?.endsWith('/favicon.ico')) {
      consoleErrors.push(message.text());
    }
  });
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });
  if (['low', 'medium'].includes(mode)) return await auditNewBrowser();
  const measure = () => page.evaluate(() => ({
    viewport: [innerWidth, innerHeight],
    documentWidth: document.documentElement.scrollWidth,
    canvases: [...document.querySelectorAll('canvas')].map(canvas => {
      const rect = canvas.getBoundingClientRect();
      return { id: canvas.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
    stats: Object.fromEntries(['score', 'lines', 'level'].map(id => [id, document.getElementById(id).textContent])),
    overlay: document.getElementById('overlay') ? { hidden: document.getElementById('overlay').hidden,
      display: getComputedStyle(document.getElementById('overlay')).display } : null,
  }));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const desktop = await measure();
  // Observe real keyboard handlers through the loaded module's prototype;
  // wrappers only log arguments/outcomes and forward to the original method.
  await page.evaluate(async mode => {
    const { Game } = await import(mode === 'high' ? '/game/game.js' : '/dist/game.js');
    window.__haikuKeys = [];
    const state = game => ({ ...(mode === 'xhigh' ? game.current : game.active), score: game.score,
      held: mode === 'xhigh' ? game.hold : mode === 'high' ? game.heldPiece : game.held,
      canHold: game.canHold });
    const names = mode === 'xhigh' ? ['move', 'rotate', 'hardDrop', 'holdPiece']
      : [mode === 'high' ? 'moveHorizontal' : 'move', 'rotate', 'setSoftDrop', 'hardDrop', 'hold'];
    for (const name of names) {
      const original = Game.prototype[name];
      Game.prototype[name] = function (...args) {
        window.__haikuGame = this;
        const before = state(this);
        const result = original.apply(this, args);
        window.__haikuKeys.push({ name: name === 'move' ? 'moveHorizontal' : name === 'holdPiece' ? 'hold' : name,
          args, before, after: state(this), result });
        return result;
      };
    }
    if (mode === 'xhigh') {
      const { Controller } = await import('/dist/input.js');
      for (const [name, on] of [['onKeyDown', true], ['onKeyUp', false]]) {
        const original = Controller.prototype[name];
        Controller.prototype[name] = function (...args) {
          const before = state(this.game);
          const result = original.apply(this, args);
          if (args[0].code === 'ArrowDown') window.__haikuKeys.push({
            name: 'setSoftDrop', args: [on], before, after: state(this.game), result });
          return result;
        };
      }
    }
  }, mode);
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft']) {
    await page.keyboard.press(key);
  }
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('c');
  await page.waitForTimeout(50);
  const controls = await page.evaluate(() => window.__haikuKeys);
  const afterControls = await measure();
  const rotations = controls.filter(c => c.name === 'rotate');
  if (JSON.stringify(rotations.map(c => c.args[0])) !== '[1,1,-1,-1]'
      || rotations.some(c => (mode === 'high' && !c.result)
        || c.after.rotation !== (c.before.rotation + c.args[0] + 4) % 4)) {
    throw new Error('Expected all four required rotation bindings to succeed');
  }
  const moves = controls.filter(c => c.name === 'moveHorizontal');
  if (moves.length !== 2 || moves[0].after.x !== moves[0].before.x - 1
      || moves[1].after.x !== moves[1].before.x + 1) throw new Error('Movement binding failed');
  const hard = controls.find(c => c.name === 'hardDrop');
  const held = controls.find(c => c.name === 'hold');
  const softOn = controls.find(c => c.name === 'setSoftDrop' && c.args[0]);
  const softOff = controls.find(c => c.name === 'setSoftDrop' && !c.args[0]);
  if (!hard || !held || held.after.held !== held.before.type || held.after.canHold
      || !softOn || !softOff || softOff.after.score <= softOn.before.score
      || Number(afterControls.stats.score) <= 0) throw new Error('Drop/hold binding failed');
  await page.screenshot({ path: `haiku-${mode}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(50);
  const mobile = await measure();
  await page.screenshot({ path: `haiku-${mode}-mobile.png` });
  const expected = {
    high: { desktop: 302, document: 758, x: 228, width: 302 },
    xhigh: { desktop: 304, document: 752, x: 224, width: 304 },
    max: { desktop: 300, document: 596, x: 18, width: 300 },
  }[mode];
  const desktopBoard = desktop.canvases.find(c => c.id === 'board');
  const phoneBoard = mobile.canvases.find(c => c.id === 'board');
  if (desktop.documentWidth !== 1280 || desktopBoard.width !== expected.desktop) {
    throw new Error('Desktop layout changed');
  }
  if (mobile.documentWidth !== expected.document || phoneBoard.x !== expected.x || phoneBoard.width !== expected.width) {
    throw new Error(`Documented phone layout changed; review: ${JSON.stringify(mobile)}`);
  }
  for (const observation of [desktop, mobile]) {
    if (observation.overlay && (!observation.overlay.hidden || observation.overlay.display !== 'none')) {
      throw new Error('Active overlay visible');
    }
  }
  if (errors.length || consoleErrors.length || badResponses.length) throw new Error(JSON.stringify({ errors, consoleErrors, badResponses }));
  const result = { mode, browser: page.context().browser().version(), url: page.url(),
    desktop, afterControls, mobile, controls, errors, consoleErrors, badResponses };
  await page.evaluate(result => { window.__tetrisAudit = result; }, result);
  console.log(JSON.stringify(result, null, 2));

  async function auditNewBrowser() {
    const check = (ok, message) => { if (!ok) throw new Error(message); };
    // Retain the delivered callback, but drive its scheduling explicitly for
    // reproducible frame-rate and keyboard fixtures. Rendering stays unchanged.
    await page.addInitScript(() => { window.requestAnimationFrame = cb => { window.__hFrame = cb; return 1; }; });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(async mode => {
      const { Game } = await import('/dist/game.js');
      const p = Game.prototype, move = p.move, update = p.update;
      p.move = function (...args) { window.__hGame = this; return move.apply(this, args); };
      p.update = function (...args) { window.__hGame = this; if (window.__hSimulate) return update.apply(this, args); };
      window.__hCapture = { Game, p, move, update };
    }, mode);
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(mode => {
      const low = mode === 'low', { Game, p, move, update } = window.__hCapture;
      p.move = move;
      const game = () => window.__hGame;
      const reset = () => {
        let i = 0; const seq = ['T', 'I', 'O', 'S', 'Z', 'J', 'L'];
        if (low) Object.assign(game(), new Game({ next: () => seq[i++ % seq.length] }));
        else { game().bag = { next: () => seq[i++ % seq.length] }; game().reset(); }
      };
      const state = () => { const g = game(), { rot, rotation, ...piece } = g.current;
        return { ...piece, rotation: low ? rot : rotation, score: g.score, held: low ? g.held : g.hold,
          canHold: g.canHold, over: low ? g.over : g.gameOver, occupied: g.board.flat().filter(Boolean).length };
      };
      const place = (type, x, y) => {
        const g = game(); g.current = { type, ...(low ? { rot: 0 } : { rotation: 0 }), x, y };
        Object.assign(g, { gravityTimer: 0, lockTimer: 0, lockResets: 0, lowestY: y,
          lastMoveWasRotation: false, lastActionWasRotation: false, lastKick: 0, lastKickIndex: 0 });
      };
      const refresh = [];
      for (const [level, duration] of [[1, 1100], [10, 600], [15, 100]]) for (const [hz, base] of [[60, 10000], [144, 20000]]) {
        window.__hSimulate = true; window.__hFrame(base); reset(); place('O', 4, low ? 0 : 1);
        game().lines = (level - 1) * 10; if (!low) game().level = level;
        for (let i = 1; i <= hz; i++) window.__hFrame(base + duration * i / hz);
        refresh.push({ level, hz, ...state() });
      }
      window.__hSimulate = false;
      window.__hState = state; window.__hReset = reset; window.__hPlace = place;
      window.__hStep = seconds => update.call(game(), seconds);
      window.__hDraw = () => window.__hFrame(performance.now());
      window.__hRefresh = refresh; window.__hKeys = [];
      for (const name of ['move', 'rotate', 'hardDrop', low ? 'hold' : 'holdPiece']) {
        const original = p[name]; p[name] = function (...args) {
          window.__hGame = this; const before = state(), result = original.apply(this, args);
          window.__hKeys.push({ name, args, before, after: state() }); return result;
        };
      }
    }, mode);
    const refresh = await page.evaluate(() => window.__hRefresh);
    for (let i = 0; i < refresh.length; i += 2) {
      const a = refresh[i], b = refresh[i + 1];
      check(a.y === b.y && a.score === b.score && a.occupied === 0 && b.occupied === 0, 'Actual 60/144 Hz callbacks differ');
      check(a.y === (mode === 'low' ? 0 : 1) + ({ 1: 1, 10: 9, 15: 14 })[a.level], 'Actual frame displacement changed');
    }
    const measure = () => page.evaluate(mode => {
      const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      const canvases = [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, ...box(c), native: [c.width, c.height] }));
      const c = canvases.find(c => c.id === (mode === 'low' ? 'game' : 'board')), s = c.width / 640;
      const board = mode === 'low' ? { x: c.x + 170 * s, y: c.y + 20 * s, width: 300 * s, height: 600 * s } : c;
      return { viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight, board, canvases,
        overlay: mode === 'low' ? null : getComputedStyle(document.getElementById('overlay')).display };
    }, mode);
    const views = {};
    for (const [view, width, height] of [['desktop', 1280, 800], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { window.__hReset(); window.__hPlace('T', 3, 5); window.__hKeys = []; window.__hDraw(); });
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft']) await page.keyboard.press(key);
      const softBefore = await page.evaluate(() => window.__hState());
      await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120);
      await page.evaluate(() => window.__hStep(0.100000001)); await page.keyboard.up('ArrowDown');
      const softAfter = await page.evaluate(() => window.__hState());
      await page.keyboard.press('Space'); await page.keyboard.press('c');
      await page.evaluate(() => window.__hDraw());
      const controls = await page.evaluate(() => window.__hKeys), layout = await measure();
      check(controls.length === 8, 'Required action count changed');
      check(controls[0].after.x === controls[0].before.x - 1 && controls[1].after.x === controls[1].before.x + 1, 'Movement bindings failed');
      for (let i = 0; i < 4; i++) { const a = controls[i + 2], d = i < 2 ? 1 : -1;
        check(a.args[0] === d && a.after.rotation === (a.before.rotation + d + 4) % 4, 'Rotation binding failed'); }
      check(softAfter.y - softBefore.y === 2 && softAfter.score - softBefore.score === 2, 'Soft movement/points failed');
      check(controls[6].after.occupied === 4 && controls[7].after.held === controls[7].before.type && !controls[7].after.canHold, 'Hard drop/hold failed');
      check(layout.overlay === null || layout.overlay === 'none', 'Active overlay visible');
      console.log(`${mode} ${view} layout ${JSON.stringify(layout)}`);
      // Measured geometry is asserted after visual inspection, with subpixel tolerance.
      if (mode === 'low') {
        const expected = view === 'desktop' ? [490, 100, 300, 600] : [103.59375, 239.1875, 182.8125, 365.625];
        check(layout.documentWidth === width, 'Low cabinet no longer fits');
        for (const [i, name] of ['x', 'y', 'width', 'height'].entries()) check(Math.abs(layout.board[name] - expected[i]) < 0.02, `Low ${view} ${name} changed`);
      } else {
        const expected = view === 'desktop' ? [1280, 488, 98, 314, 816] : [521, 43, 120, -131, 371];
        check(layout.documentWidth === expected[0] && layout.board.x === expected[1] && layout.board.y === expected[2]
          && layout.board.width === 304 && layout.board.height === 604 && layout.canvases[0].x === expected[3]
          && layout.canvases[2].x === expected[4], 'Medium phone sidebar/desktop geometry changed');
      }
      await page.screenshot({ path: `haiku-${mode}-${view}.png` });
      // Real R is exercised at each size after a deterministic blocked next spawn.
      await page.evaluate(mode => {
        window.__hReset(); window.__hPlace('O', 0, 20);
        const g = window.__hGame;
        for (let y = 0; y < 3; y++) for (let x = 3; x < 7; x++) g.board[y][x] = 'J';
        window.__hDraw();
      }, mode);
      await page.keyboard.press('Space'); await page.evaluate(() => window.__hDraw());
      const beforeRestart = await page.evaluate(() => window.__hState()); check(beforeRestart.over, 'Blocked spawn failed');
      if (mode === 'medium') check((await measure()).overlay === 'flex', 'Game-over overlay failed');
      await page.keyboard.press('r'); await page.evaluate(() => window.__hDraw());
      const afterRestart = await page.evaluate(() => window.__hState());
      check(!afterRestart.over && afterRestart.occupied === 0 && afterRestart.score === 0 && afterRestart.held === null && afterRestart.canHold, 'Real R restart failed');
      if (mode === 'medium') check((await measure()).overlay === 'none', 'Restart overlay failed');
      views[view] = { ...layout, controls, softBefore, softAfter, beforeRestart, afterRestart };
    }
    await page.evaluate(mode => { window.__hReset(); window.__hPlace('O', 4, mode === 'low' ? 0 : 1);
      for (let i = 0; i < 50; i++) window.__hStep(0.016); }, mode);
    const timerBefore = await page.evaluate(() => window.__hState());
    await page.keyboard.down('ArrowDown'); await page.evaluate(() => window.__hStep(0.001));
    const timerAfter = await page.evaluate(() => window.__hState()); await page.keyboard.up('ArrowDown');
    check(timerAfter.y - timerBefore.y === 16 && timerAfter.score === 16, 'Soft-transition finding changed');
    check(!errors.length && !consoleErrors.length && !badResponses.length, JSON.stringify({ errors, consoleErrors, badResponses }));
    let expectedHiddenLockError = null;
    if (mode === 'medium') {
      await page.evaluate(() => { window.__hReset(); const g = window.__hGame; g.board[2][0] = 'J'; g.board[3][2] = 'J'; });
      for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'z', 'ArrowLeft']) await page.keyboard.press(key);
      const pose = await page.evaluate(() => window.__hState());
      check(pose.rotation === 1 && pose.x === -1 && pose.y === -1, 'Public ceiling fixture changed');
      await page.keyboard.press('Space');
      check(errors.length === 1 && errors[0] === "Cannot set properties of undefined (setting '0')", 'Expected hidden-lock TypeError did not reproduce');
      expectedHiddenLockError = { pose, error: errors.pop() };
      await page.keyboard.press('r');
      check((await page.evaluate(() => window.__hState())).y === -1, 'R should be inert without game-over flag after this recorded failure');
      await page.evaluate(() => { window.__hReset(); window.__hDraw(); });
    }
    const result = { mode, browser: page.context().browser().version(), desktop: views.desktop, mobile: views.mobile,
      refresh, timerBefore, timerAfter, expectedHiddenLockError, errors, consoleErrors, badResponses };
    await page.evaluate(result => { window.__tetrisAudit = result; }, result);
    console.log(JSON.stringify(result, null, 2));
  }
}
