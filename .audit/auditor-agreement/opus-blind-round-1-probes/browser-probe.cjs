// Usage: NODE_PATH=<playwright node_modules> node probes/browser-probe.cjs <run> <url> <shotdir>
const { chromium } = require('playwright');
const [run, url, shotDir] = process.argv.slice(2);
const SEL = {
  'run-a': { board: '#board', hold: '#hold', next: '#next', score: '#score', overlay: '#overlay' },
  'run-b': { board: '#board', hold: '#hold', next: '#next', score: '#score', overlay: '#overlay' },
  'run-c': { board: '#game-canvas', hold: '#hold-canvas', next: '#next-canvas', score: '#score', overlay: '#game-over' },
}[run];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const result = { run, chromium: browser.version() };
  try {
    for (const [label, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: 'load' });
      await sleep(400);
      const R = {};

      const topCells = () => page.evaluate((sel) => {
        const c = document.querySelector(sel);
        const ctx2 = c.getContext('2d');
        const cell = c.width / 10;
        const img = ctx2.getImageData(0, 0, c.width, c.height).data;
        const out = [];
        for (let row = 0; row < 20; row++) for (let col = 0; col < 10; col++) {
          const px = Math.floor(col * cell + cell / 2), py = Math.floor(row * cell + cell / 2);
          const i = (py * c.width + px) * 4;
          const [r, g, b] = [img[i], img[i + 1], img[i + 2]];
          if (Math.max(r, g, b) > 140 && Math.max(r, g, b) - Math.min(r, g, b) > 60) out.push([col, row]);
        }
        return out;
      }, SEL.board);
      const score = () => page.$eval(SEL.score, (e) => e.textContent.trim());
      const nonEmpty = (sel) => page.evaluate((s) => {
        const c = document.querySelector(s); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]); if (m > 140 && m - Math.min(d[i], d[i + 1], d[i + 2]) > 60) n++; } return n;
      }, sel);
      const fmt = (cells) => cells.filter(([, r]) => r < 6).map((p) => p.join(',')).join(' ');

      if (label === 'desktop') {
        const seq = [];
        seq.push(['start', fmt(await topCells())]);
        for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft']) {
          await page.keyboard.press(k); await sleep(30);
          seq.push([k, fmt(await topCells())]);
        }
        const s0 = await score();
        await page.keyboard.down('ArrowDown'); await sleep(20); await page.keyboard.up('ArrowDown'); await sleep(20);
        const s1 = await score();
        await page.keyboard.press('Space'); await sleep(50);
        const s2 = await score();
        const holdBefore = await nonEmpty(SEL.hold);
        await page.keyboard.press('c'); await sleep(50);
        const holdAfter = await nonEmpty(SEL.hold);
        R.keys = { seq, scoreStart: s0, afterSoftDrop: s1, afterHardDrop: s2, holdPixelsBefore: holdBefore, holdPixelsAfter: holdAfter };

        // Synthetic auto-repeat keydowns (as the OS sends while a key is held)
        await page.reload({ waitUntil: 'load' }); await sleep(300);
        const before = await score();
        const lockedBefore = (await topCells()).filter(([, r]) => r >= 6).length;
        await page.keyboard.press('Space'); await sleep(30);
        const afterOne = await score();
        await page.evaluate(() => {
          for (let i = 0; i < 3; i++) document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', repeat: true, bubbles: true, cancelable: true }));
        });
        await sleep(50);
        const afterRepeats = await score();
        R.spaceAutoRepeat = { before, afterOnePress: afterOne, afterThreeRepeatEvents: afterRepeats };

        // Top out by repeated hard drops, then R
        await page.reload({ waitUntil: 'load' }); await sleep(300);
        let drops = 0;
        for (; drops < 60; drops++) {
          const vis = await page.$eval(SEL.overlay, (e) => getComputedStyle(e).display !== 'none' && !e.hidden && !e.classList.contains('hidden'));
          if (vis) break;
          await page.keyboard.press('Space'); await sleep(15);
        }
        R.gameOver = { drops, overlayText: (await page.$eval(SEL.overlay, (e) => e.innerText.replace(/\s+/g, ' ').trim())), score: await score() };
        await page.screenshot({ path: `${shotDir}/${run}-gameover.png` });
        await page.keyboard.press('r'); await sleep(100);
        R.afterR = { score: await score(), overlayVisible: await page.$eval(SEL.overlay, (e) => getComputedStyle(e).display !== 'none' && !e.hidden && !e.classList.contains('hidden')) };
        // R during play
        await page.keyboard.press('Space'); await sleep(30);
        const midScore = await score();
        await page.keyboard.press('r'); await sleep(50);
        R.rDuringPlay = { before: midScore, after: await score() };
        await page.reload({ waitUntil: 'load' }); await sleep(300);
      }

      // Layout
      R.layout = await page.evaluate((sel) => {
        const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), visible: getComputedStyle(e).display !== 'none' && r.width > 0 }; };
        return {
          docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight, vw: innerWidth, vh: innerHeight,
          board: rect(sel.board), hold: rect(sel.hold), next: rect(sel.next), score: rect(sel.score),
          touchButtons: document.querySelectorAll('button[data-action]').length,
        };
      }, SEL);
      await page.screenshot({ path: `${shotDir}/${run}-${label}.png` });
      await page.screenshot({ path: `${shotDir}/${run}-${label}-full.png`, fullPage: true });
      R.errors = errors;
      result[label] = R;
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(result, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
