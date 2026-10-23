// Load the built site under the GitHub Pages project path and check every page and game in Chromium.
// Usage: node scripts/check-site.mjs [site-dir]
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright";

const siteDir = resolve(process.argv[2] ?? "_site");
const prefix = "/tetris-llm-benchmark/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// Serve like GitHub Pages: only under the project prefix, directories resolve to index.html.
const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (!url.pathname.startsWith(prefix)) return response.writeHead(404).end();
  let path = normalize(join(siteDir, decodeURIComponent(url.pathname.slice(prefix.length))));
  if (!path.startsWith(siteDir)) return response.writeHead(403).end();
  if (existsSync(path) && statSync(path).isDirectory()) {
    if (!url.pathname.endsWith("/")) return response.writeHead(301, { location: `${url.pathname}/` }).end();
    path = join(path, "index.html");
  }
  if (!existsSync(path)) return response.writeHead(404).end();
  response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
  createReadStream(path).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

const results = JSON.parse(readFileSync(join(siteDir, "results.json"), "utf8"));
const browser = await chromium.launch();
const failures = [];

async function visit(path, { play = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const problems = [];
  // A run page embeds its game; the game is checked on its own, so only the top document counts here.
  const own = (frame) => frame === page.mainFrame();
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.location().url.includes("/play/")) {
      problems.push(`console error: ${message.text()}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(origin) && own(response.frame())) {
      problems.push(`HTTP ${response.status()}: ${response.url().slice(origin.length)}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (own(request.frame())) problems.push(`request failed: ${request.url()}`);
  });
  await page.goto(`${origin}${prefix}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(play ? 1200 : 400);
  let drawn = true;
  if (play) {
    await page.mouse.click(640, 400);
    for (const key of ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Space"]) await page.keyboard.press(key);
    await page.waitForTimeout(400);
    // A working game paints a canvas or builds a board out of elements.
    drawn = await page.evaluate(() => {
      const painted = [...document.querySelectorAll("canvas")].some((canvas) => {
        if (!canvas.width || !canvas.height) return false;
        const context = canvas.getContext("2d");
        if (!context) return true;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < pixels.length; i += 4 * 97) if (pixels[i]) return true;
        return false;
      });
      return painted || document.querySelectorAll("body *").length > 40;
    });
    if (!drawn) problems.push("nothing was drawn");
  } else {
    const charts = await page.locator("[data-chart] svg").count();
    if (path === "" && charts < 5) problems.push(`expected 5 charts, found ${charts}`);
  }
  await page.close();
  return problems;
}

function report(label, problems, expectedFailure) {
  if (expectedFailure) {
    console.log(`${problems.length ? "ok  " : "WARN"} ${label}: ${problems.length ? "fails as documented" : "loads, but is documented as broken"}`);
    return;
  }
  console.log(`${problems.length ? "FAIL" : "ok  "} ${label}`);
  for (const problem of problems) console.log(`       ${problem}`);
  if (problems.length) failures.push(label);
}

report("index", await visit(""));
for (const run of results.runs) {
  report(`runs/${run.id}`, await visit(`runs/${run.id}/`));
  if (run.game) report(`runs/${run.id}/play`, await visit(`runs/${run.id}/play/`, { play: true }), Boolean(run.known_browser_failure));
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\n${failures.length} page(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
