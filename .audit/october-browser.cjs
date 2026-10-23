async (page) => {
  const errors = [];
  const badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const measure = () => page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyHeight: document.body.scrollHeight,
    scrollY,
    canvases: [...document.querySelectorAll('canvas')].map(canvas => {
      const rect = canvas.getBoundingClientRect();
      return { id: canvas.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
    stats: Object.fromEntries([...document.querySelectorAll('[id]')]
      .filter(el => /^(score|lines|level|stat-score|stat-lines|stat-level)$/.test(el.id))
      .map(el => [el.id, el.textContent])),
  }));
  const desktop = await measure();
  await page.screenshot({ path: `desktop-${new URL(page.url()).port}.png` });
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'x', 'z', 'ControlLeft', 'ArrowDown', 'Space', 'c']) {
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(100);
  const afterControls = await measure();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobile = await measure();
  await page.screenshot({ path: `mobile-${new URL(page.url()).port}.png` });
  await page.evaluate(result => { window.__tetrisAudit = result; }, {
    url: page.url(), desktop, afterControls, mobile, errors, badResponses,
  });
}
