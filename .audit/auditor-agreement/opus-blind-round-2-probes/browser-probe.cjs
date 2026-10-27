// Chromium check of one served build at desktop and phone sizes.
// Usage: NODE_PATH=<playwright node_modules> node browser-probe.cjs <url> <screenshotDir> <label>
const { chromium } = require('playwright');
const crypto = require('crypto');
const [url, shotDir, label] = process.argv.slice(2);

const sizes = [{ name: 'desktop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }];
const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyX', 'KeyZ', 'ControlLeft', 'ArrowDown', 'Space', 'KeyC'];

(async () => {
  const browser = await chromium.launch();
  const report = { url, label, runs: [] };
  try {
    for (const size of sizes) {
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
      const consoleErrors = [], pageErrors = [], failed = [], external = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', (e) => pageErrors.push(String(e)));
      page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
      page.on('request', (r) => { if (!r.url().startsWith(url.replace(/\/$/, ''))) external.push(r.url()); });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      const layout = await page.evaluate(() => {
        const vis = (el) => { const r = el.getBoundingClientRect(); return { id: el.id || el.className || el.tagName, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
        return {
          docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight,
          innerWidth: innerWidth, innerHeight: innerHeight,
          canvases: [...document.querySelectorAll('canvas')].map(vis),
          text: document.body.innerText.slice(0, 400),
        };
      });
      const hash = async () => page.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => c.toDataURL().length + ':' + c.toDataURL().slice(-40)).join('|'));
      const dom = async () => page.evaluate(() => ['#score', '#level', '#lines'].map((s) => document.querySelector(s)?.textContent ?? null).join('/'));
      await page.screenshot({ path: `${shotDir}/${label}-${size.name}-start.png` });
      const steps = [];
      for (const k of keys) {
        const before = await hash();
        if (k === 'ArrowDown') { await page.keyboard.down(k); await page.waitForTimeout(300); await page.keyboard.up(k); }
        else await page.keyboard.press(k);
        await page.waitForTimeout(120);
        steps.push({ key: k, canvasChanged: before !== (await hash()), dom: await dom() });
      }
      await page.screenshot({ path: `${shotDir}/${label}-${size.name}-after-keys.png` });
      const afterKeysScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
      let topOut = null;
      if (size.name === 'desktop') {
        for (let i = 0; i < 60; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(30); }
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${shotDir}/${label}-desktop-gameover.png` });
        const overDom = await dom();
        await page.keyboard.press('KeyR'); await page.waitForTimeout(400);
        await page.screenshot({ path: `${shotDir}/${label}-desktop-restarted.png` });
        topOut = { domAtOver: overDom, domAfterR: await dom() };
      }
      report.runs.push({ size: size.name, layout, steps, afterKeysScroll, topOut, consoleErrors, pageErrors, failed, external: [...new Set(external)] });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
