// Measures run-b sidebar message widths (bold 15px sans-serif, drawn at x = 460 in a 580 px canvas).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(process.argv[2]);
  const r = await p.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); c.font = 'bold 15px sans-serif';
    return ['Mini T-Spin Single', 'Mini T-Spin Double', 'T-Spin Double', 'T-Spin Triple', 'Tetris'].map((t) => [t, Math.round(c.measureText(t).width)]); });
  console.log(JSON.stringify({ availableWidth: 580 - 460, widths: r })); await b.close();
})();
