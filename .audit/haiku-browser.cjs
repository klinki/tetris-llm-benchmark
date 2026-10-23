// Playwright CLI run-code snippet. Run from a temporary artifact directory
// after opening the isolated run's npm start URL. Does not change source files.
async (page) => {
  const mode = new URL(page.url()).searchParams.get('audit') ?? 'high';
  if (!['high', 'xhigh', 'max'].includes(mode)) throw new Error(`Unknown effort: ${mode}`);
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
}
