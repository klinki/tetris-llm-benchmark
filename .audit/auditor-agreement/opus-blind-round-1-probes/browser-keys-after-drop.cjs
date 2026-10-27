// Usage: NODE_PATH=... node probes/browser-keys-after-drop.cjs <url> <boardSel> <shot>
// Hard-drops the first piece, then exercises rotation/hold keys on the next one (for runs whose first piece is O).
const { chromium } = require('playwright');
const [url, sel, shot] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(url); await sleep(300);
  const cells = () => page.evaluate((s) => {
    const c = document.querySelector(s), cell = c.width / 10, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, o = [];
    for (let r = 0; r < 6; r++) for (let k = 0; k < 10; k++) { const i = ((Math.floor(r * cell + cell / 2)) * c.width + Math.floor(k * cell + cell / 2)) * 4; const m = Math.max(d[i], d[i + 1], d[i + 2]); if (m > 140 && m - Math.min(d[i], d[i + 1], d[i + 2]) > 60) o.push(k + ',' + r); }
    return o.join(' ');
  }, sel);
  await page.keyboard.press('Space'); await sleep(50);
  const seq = [['start', await cells()]];
  for (const k of ['ArrowUp', 'x', 'z', 'ControlLeft', 'ArrowLeft', 'ArrowRight']) { await page.keyboard.press(k); await sleep(30); seq.push([k, await cells()]); }
  await page.keyboard.press('c'); await sleep(50);
  seq.push(['c', await cells()]);
  await page.keyboard.press('c'); await sleep(50);
  seq.push(['c again (should be refused)', await cells()]);
  await page.screenshot({ path: shot });
  console.log(JSON.stringify(seq));
  await b.close();
})();
