// Playwright CLI run-code snippet; use only the isolated run's npm start server.
async (page) => {
  const errors = [], consoleErrors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.location().url?.endsWith('/favicon.ico')) consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) badResponses.push({ status: response.status(), url: response.url() });
  });
  const measure = () => page.evaluate(() => {
    const box = selector => {
      const el = document.querySelector(selector), r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return { viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth,
      board: box('#game-canvas'), frame: box('.board-frame'), hold: box('#hold'), next: box('#next'),
      holdCanvas: box('#hold-canvas'), nextCanvas: box('#next-canvas'),
      overlayDisplay: getComputedStyle(document.querySelector('#game-over')).display,
      overlayHidden: document.querySelector('#game-over').getAttribute('aria-hidden'),
      canvasLabel: document.querySelector('#game-canvas').getAttribute('aria-label'),
      legend: document.querySelector('.controls-list').innerText };
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.game?.activePiece);
  const desktop = await measure();
  await page.evaluate(() => {
    const g = window.game;
    window.__geminiState = () => ({ ...g.activePiece, score: g.score, held: g.holdPiece,
      canHold: g.canHold, occupied: g.board.flat().filter(Boolean).length, over: g.gameOver });
    window.__geminiStep = g.tick.bind(g);
    g.tick = () => {}; // Freeze animation only; actual handlers, engine and rendering remain installed.
    g.restart(['T', 'I', 'O', 'S', 'Z', 'J', 'L']);
    const original = g.handleKey.bind(g);
    window.__geminiKeys = [];
    g.handleKey = (...args) => {
      const before = window.__geminiState(), result = original(...args), after = window.__geminiState();
      window.__geminiKeys.push({ args, before, after, result }); return result;
    };
  });
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft']) await page.keyboard.press(key);
  const softBefore = await page.evaluate(() => window.__geminiState());
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown');
  const softAfter = await page.evaluate(() => window.__geminiState());
  await page.keyboard.press('Space'); await page.keyboard.press('c');
  const controls = await page.evaluate(() => window.__geminiKeys);
  if (controls.length !== 9 || controls.some(c => !c.result)) throw new Error('Required key did not succeed');
  if (controls[0].after.x !== controls[0].before.x - 1 || controls[1].after.x !== controls[1].before.x + 1) throw new Error('Movement binding failed');
  for (let i = 0; i < 4; i++) {
    const c = controls[i + 2], direction = i < 2 ? 1 : -1;
    if (c.after.rotation !== (c.before.rotation + direction + 4) % 4) throw new Error('Rotation binding failed');
  }
  if (softAfter.y !== softBefore.y + 1 || softAfter.score !== softBefore.score + 1
      || controls[7].after.occupied !== 4 || controls[8].after.held !== controls[8].before.type
      || controls[8].after.canHold) throw new Error('Drop/hold binding failed');
  await page.screenshot({ path: 'gemini-high-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(50);
  const mobile = await measure();
  await page.screenshot({ path: 'gemini-high-mobile.png' });
  if (desktop.documentWidth !== 1280 || desktop.board.width !== 300 || desktop.board.height !== 600
      || desktop.overlayDisplay !== 'none' || desktop.overlayHidden !== 'true') throw new Error('Desktop/overlay changed');
  if (mobile.documentWidth !== 543 || mobile.hold.x !== -153 || mobile.next.x !== 353
      || mobile.board.x !== 35 || mobile.board.width !== 300 || mobile.board.height !== 600
      || mobile.holdCanvas.x !== -128 || mobile.nextCanvas.x !== 388
      || mobile.overlayDisplay !== 'none') throw new Error(`Documented phone overflow changed: ${JSON.stringify(mobile)}`);

  await page.evaluate(() => {
    window.game.restart(['O', 'T', 'I']);
    for (let i = 0; i < 50; i++) window.__geminiStep(16);
  });
  const timerBefore = await page.evaluate(() => window.__geminiState());
  await page.keyboard.down('ArrowDown');
  const timerAfter = await page.evaluate(() => { window.__geminiStep(1); return window.__geminiState(); });
  await page.keyboard.up('ArrowDown');
  if (timerAfter.y - timerBefore.y !== 1 || timerAfter.score !== 1) throw new Error('Soft-drop transition changed');
  // Three actual repeated keydowns each award one point; no OS-repeat timing assumption.
  await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown'); await page.keyboard.down('ArrowDown');
  await page.keyboard.up('ArrowDown');
  const repeatAfter = await page.evaluate(() => window.__geminiState());
  if (repeatAfter.y - timerAfter.y !== 3 || repeatAfter.score - timerAfter.score !== 3) throw new Error('Repeated soft drop failed');
  await page.evaluate(() => {
    const g = window.game; g.restart(['O', 'T', 'I']);
    g.activePiece = { type: 'O', rotation: 0, x: -1, y: 18 };
    for (const y of [0, 1]) for (let x = 1; x < 10; x++) g.board[y][x] = 'J';
  });
  await page.keyboard.press('Space');
  const beforeRestart = await page.evaluate(() => window.__geminiState());
  const gameOverOverlay = await measure();
  if (!beforeRestart.over || gameOverOverlay.overlayDisplay !== 'flex' || gameOverOverlay.overlayHidden !== 'false') throw new Error('Game-over fixture/overlay failed');
  await page.keyboard.press('r');
  const afterRestart = await page.evaluate(() => window.__geminiState());
  const restartedOverlay = await measure();
  if (afterRestart.over || afterRestart.score !== 0 || afterRestart.held !== null || !afterRestart.canHold
      || afterRestart.occupied !== 0 || restartedOverlay.overlayDisplay !== 'none') throw new Error('R restart failed');
  if (errors.length || consoleErrors.length || badResponses.length) throw new Error(JSON.stringify({ errors, consoleErrors, badResponses }));
  const result = { mode: 'high', browser: page.context().browser().version(), desktop, mobile, controls,
    softBefore, softAfter, timerBefore, timerAfter, repeatAfter, beforeRestart, afterRestart, errors, consoleErrors, badResponses };
  await page.evaluate(result => { window.__tetrisAudit = result; }, result);
  console.log(JSON.stringify(result, null, 2));
}
