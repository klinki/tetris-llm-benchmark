// Playwright CLI run-code snippet; use only an isolated run's npm start server.
async (page) => {
  const mode = new URL(page.url()).searchParams.get('audit');
  if (!['low', 'medium', 'high', 'xhigh'].includes(mode)) throw new Error(`Unknown effort: ${mode}`);
  const errors = [], consoleErrors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.location().url?.endsWith('/favicon.ico')) consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });
  const measure = () => page.evaluate(mode => {
    const canvas = document.getElementById('game'), r = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
    const dimensions = { low: [660, 180, 0], medium: [580, 140, 0], high: [600, 150, 0], xhigh: [664, 182, 16] }[mode];
    const scale = canvas.clientWidth / dimensions[0];
    const left = r.x + parseFloat(style.borderLeftWidth), top = r.y + parseFloat(style.borderTopWidth);
    return {
      viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth,
      canvas: { x: r.x, y: r.y, width: r.width, height: r.height, intrinsicWidth: canvas.width, intrinsicHeight: canvas.height },
      board: { x: left + dimensions[1] * scale, y: top + dimensions[2] * scale, width: 300 * scale, height: 600 * scale },
      holdLabelX: left + ({ low: 15, medium: 20, high: 20, xhigh: 16 }[mode]) * scale,
      nextLabelX: left + ({ low: 495, medium: 460, high: 470, xhigh: 498 }[mode]) * scale,
      legend: document.body.innerText.trim(), canvasLabel: canvas.getAttribute('aria-label'),
    };
  }, mode);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const desktop = await measure();
  await page.evaluate(async mode => {
    const { Game } = await import('/dist/game.js');
    const state = game => {
      const p = mode === 'medium' ? game.active : mode === 'xhigh' ? game.piece : game.current;
      return { type: p.type, rotation: mode === 'medium' ? p.rot : p.rotation, x: p.x, y: p.y,
        score: game.score, held: ['medium', 'high'].includes(mode) ? game.held : game.hold,
        canHold: mode === 'high' ? !game.holdUsed : game.canHold,
        soft: mode === 'low' ? game.softDropping : game.softDrop,
        occupied: ['low', 'medium'].includes(mode) ? game.board.flat().filter(Boolean).length
          : Array.from({ length: mode === 'xhigh' ? 40 : 22 }, (_, y) =>
            Array.from({ length: 10 }, (_, x) => game.board.get(x, y))).flat().filter(Boolean).length,
        over: ['low', 'medium'].includes(mode) ? game.gameOver : game.status.toLowerCase() === 'gameover' };
    };
    window.__sonnetState = state;
    window.__sonnetKeys = [];
    const update = Game.prototype.update;
    Game.prototype.update = function (dt) {
      window.__sonnetGame = this;
      window.__sonnetStep = dt => update.call(this, dt);
      if (!window.__sonnetFreeze) return update.call(this, dt);
    };
    const names = [mode === 'medium' || mode === 'high' ? 'moveLeft' : 'move',
      ...(['medium', 'high'].includes(mode) ? ['moveRight'] : []),
      'rotate', ...mode === 'medium' ? [] : ['setSoftDrop'], 'hardDrop', mode === 'medium' ? 'hold' : 'holdPiece', 'restart'];
    for (const name of names) {
      const original = Game.prototype[name];
      Game.prototype[name] = function (...args) {
        const before = state(this), result = original.apply(this, args);
        window.__sonnetKeys.push({ name, args, before, after: state(this), result });
        return result;
      };
    }
  }, mode);
  await page.waitForFunction(() => !!window.__sonnetGame);
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft']) await page.keyboard.press(key);
  await page.keyboard.down('ArrowDown');
  const softBefore = await page.evaluate(() => window.__sonnetState(window.__sonnetGame));
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowDown');
  const softAfter = await page.evaluate(() => window.__sonnetState(window.__sonnetGame));
  await page.keyboard.press('Space'); await page.keyboard.press('c');
  await page.waitForTimeout(30);
  const controls = await page.evaluate(() => window.__sonnetKeys);
  const rotations = controls.filter(c => c.name === 'rotate');
  const directions = rotations.map(c => mode === 'high' ? (c.args[0] ? 1 : -1) : c.args[0]);
  if (JSON.stringify(directions) !== '[1,1,-1,-1]' || rotations.some((c, i) => !c.result
      || c.after.rotation !== (c.before.rotation + directions[i] + 4) % 4)) throw new Error('Rotation binding failed');
  const moves = controls.filter(c => ['move', 'moveLeft', 'moveRight'].includes(c.name));
  if (moves.length !== 2 || moves[0].after.x !== moves[0].before.x - 1
      || moves[1].after.x !== moves[1].before.x + 1) throw new Error('Movement binding failed');
  const hard = controls.find(c => c.name === 'hardDrop'), held = controls.find(c => ['hold', 'holdPiece'].includes(c.name));
  if (!hard || !held || hard.after.score < hard.before.score || hard.after.occupied !== 4
      || held.after.held !== held.before.type || held.after.canHold
      || !softBefore.soft || softAfter.soft || softAfter.score <= softBefore.score) throw new Error('Drop/hold binding failed');
  await page.screenshot({ path: `sonnet-${mode}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(50);
  const mobile = await measure();
  await page.screenshot({ path: `sonnet-${mode}-mobile.png` });
  if (desktop.documentWidth !== 1280 || desktop.board.width < 290) throw new Error('Desktop layout changed');
  const expected = {
    low: { document: 527, canvasX: -137, canvasWidth: 664, boardX: 45, boardWidth: 300 },
    medium: { document: 485, canvasX: -95, canvasWidth: 580, boardX: 45, boardWidth: 300 },
    high: { document: 496, canvasX: -106, canvasWidth: 602, boardX: 45, boardWidth: 300 },
    xhigh: { document: 390, canvasX: 16, canvasWidth: 358, boardX: 114.12650602409639, boardWidth: 161.74698795180723 },
  }[mode];
  if (mobile.documentWidth !== expected.document || Math.abs(mobile.canvas.x - expected.canvasX) > 0.02
      || Math.abs(mobile.canvas.width - expected.canvasWidth) > 0.02
      || Math.abs(mobile.board.x - expected.boardX) > 0.02 || Math.abs(mobile.board.width - expected.boardWidth) > 0.02) {
    throw new Error(`Documented phone layout changed; review: ${JSON.stringify(mobile)}`);
  }
  if (mode !== 'xhigh' && (mobile.holdLabelX >= 0 || mobile.nextLabelX < 350)) throw new Error('Sidebar clipping result changed');

  // Confirm the timer discontinuity through the delivered ArrowDown handler.
  // Stop only the animation update while a deterministic sequence drives the
  // actual engine. Rendering and real DOM keyboard listeners remain installed.
  await page.evaluate(mode => {
    window.__sonnetFreeze = true;
    const g = window.__sonnetGame, rows = mode === 'xhigh' ? 40 : 22;
    if (mode === 'low') g.board.forEach(row => row.fill(null));
    else if (mode === 'medium') g.board.fill(null);
    else for (let y = 0; y < rows; y++) for (let x = 0; x < 10; x++) g.board.set(x, y, null);
    const p = { type: 'O', rotation: 0, x: 4, y: mode === 'low' ? 2 : mode === 'xhigh' ? 19 : 1 };
    if (mode === 'medium') g.active = { type: 'O', rot: 0, x: 3, y: 1 };
    else if (mode === 'xhigh') g.piece = p;
    else g.current = p;
    Object.assign(g, { gravityAcc: 0, gravityTimer: 0, lockTimer: 0, lockResets: 0,
      lowestY: p.y, score: 0, softDrop: false, softDropping: false });
    for (let i = 0; i < 50; i++) window.__sonnetStep(16);
  }, mode);
  const timerBefore = await page.evaluate(() => window.__sonnetState(window.__sonnetGame));
  await page.keyboard.down('ArrowDown');
  const timerAfter = await page.evaluate(() => {
    window.__sonnetStep(1); return window.__sonnetState(window.__sonnetGame);
  });
  await page.keyboard.up('ArrowDown');
  if (timerAfter.y - timerBefore.y !== 16 || timerAfter.score !== 16) throw new Error('Documented soft-drop result changed');

  // Force a blocked spawn through a public hard drop, then exercise real R.
  await page.evaluate(mode => {
    const g = window.__sonnetGame, rows = mode === 'xhigh' ? 40 : 22;
    for (let x = 0; x < 10; x++) {
      const y = mode === 'low' ? 1 : mode === 'xhigh' ? 18 : 0;
      if (mode === 'low') g.board[y][x] = 'J';
      else if (mode === 'medium') g.board[y * 10 + x] = 'J';
      else g.board.set(x, y, 'J');
    }
    // Keep the row incomplete so it cannot clear, while obstructing every spawn.
    const y = mode === 'low' ? 1 : mode === 'xhigh' ? 18 : 0;
    if (mode === 'low') g.board[y][0] = null;
    else if (mode === 'medium') g.board[y * 10] = null;
    else g.board.set(0, y, null);
    // I spawns one local row below its origin, so block that row as well.
    for (let x = 1; x < 10; x++) {
      if (mode === 'low') g.board[y + 1][x] = 'J';
      else if (mode === 'medium') g.board[(y + 1) * 10 + x] = 'J';
      else g.board.set(x, y + 1, 'J');
    }
    g.hardDrop();
  }, mode);
  const beforeRestart = await page.evaluate(() => window.__sonnetState(window.__sonnetGame));
  if (!beforeRestart.over) throw new Error('Game-over fixture failed');
  await page.keyboard.press('r');
  const afterRestart = await page.evaluate(() => window.__sonnetState(window.__sonnetGame));
  if (afterRestart.over || afterRestart.score !== 0 || afterRestart.held !== null || !afterRestart.canHold) throw new Error('R restart failed');
  if (errors.length || consoleErrors.length || badResponses.length) throw new Error(JSON.stringify({ errors, consoleErrors, badResponses }));
  const result = { mode, browser: page.context().browser().version(), desktop, mobile, controls,
    softBefore, softAfter, timerBefore, timerAfter, beforeRestart, afterRestart, errors, consoleErrors, badResponses };
  await page.evaluate(result => { window.__tetrisAudit = result; }, result);
  console.log(JSON.stringify(result, null, 2));
}
