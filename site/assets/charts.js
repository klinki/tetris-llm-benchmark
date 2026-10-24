// Charts for the results page: scatter plots, horizontal bar charts, model/harness/effort filters, and tooltips.
const data = JSON.parse(document.getElementById("results").textContent);
const SVG = "http://www.w3.org/2000/svg";
const EFFORT_ORDER = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
const NO_EFFORT = "not recorded";
const SHAPES = ["circle", "square", "diamond", "triangle", "triangle-down", "cross"];
const TOKEN_TYPES = [
  { key: "input", label: "Input", color: "var(--s1)" },
  { key: "cache_read", label: "Cache read", color: "var(--s2)" },
  { key: "cache_write", label: "Cache write", color: "var(--s3)" },
  { key: "output", label: "Output", color: "var(--s4)" },
];
const CRITERIA = data.criteria.map((criterion, index) => ({ ...criterion, color: `var(--s${index + 1})` }));

const runs = data.runs;
// A model is what the price list names (e.g. "Claude Haiku 5.5"); a model has a run per effort and harness.
const modelOf = (run) => run.price?.label ?? run.model;
// Runs arrive in quality order, so models are listed by their best run.
const models = [...new Set(runs.map(modelOf))];
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
const harnesses = [...new Set(runs.map((run) => run.harness_label))];
const efforts = [...new Set(runs.map((run) => run.effort ?? NO_EFFORT))];
// Shape follows the harness, fixed by first appearance so filtering never reassigns it.
const shapeOf = new Map(harnesses.map((harness, index) => [harness, SHAPES[index % SHAPES.length]]));

const state = {
  models: selectedModels(),
  harness: new Set(harnesses),
  effort: new Set(efforts),
  scale: { "quality-cost": "log", "quality-tokens": "log", "quality-time": "log" },
  pareto: { "quality-cost": false, "quality-tokens": false, "quality-time": false },
};

const isVisible = (run) =>
  state.models.has(modelOf(run)) && state.harness.has(run.harness_label) && state.effort.has(run.effort ?? NO_EFFORT);

// The model selection lives in the URL (#models=claude-haiku-5.5,gpt-6-luna) so a view can be shared.
function selectedModels() {
  const wanted = new URLSearchParams(location.hash.slice(1)).get("models");
  if (!wanted) return new Set(models);
  const slugs = new Set(wanted.split(","));
  const chosen = models.filter((model) => slugs.has(slug(model)));
  return new Set(chosen.length ? chosen : models);
}
function saveModels() {
  const all = state.models.size === models.length;
  const hash = all ? "" : `#models=${models.filter((model) => state.models.has(model)).map(slug).join(",")}`;
  history.replaceState(null, "", hash || location.pathname + location.search);
}

// ---------- formatting ----------
function formatTokens(value) {
  if (value >= 1e6) return `${trim((value / 1e6).toFixed(value >= 1e7 ? 1 : 2))}M`;
  if (value >= 1e3) return `${Math.round(value / 1e3)}K`;
  return String(value);
}
const trim = (text) => (text.includes(".") ? text.replace(/\.?0+$/, "") : text);
function formatMinutes(minutes) {
  const seconds = Math.round(minutes * 60);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  return m ? (s ? `${m}m ${s}s` : `${m}m`) : `${s}s`;
}
const formatInt = (value) => value.toLocaleString("en-US");
function formatCost(value) {
  if (value < 0.005) return "<$0.01";
  return `$${value.toFixed(2)}`;
}
// Axis ticks span cents to dollars, so keep the significant digits a tick needs.
const formatCostTick = (value) => `$${trim(value >= 1 ? value.toFixed(0) : value.toPrecision(1))}`;

// ---------- DOM helpers ----------
function svgEl(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
}
function htmlEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const runHref = (run) => `runs/${encodeURIComponent(run.id)}/`;

function symbol(shape, size, parent, className) {
  const r = size;
  const paths = {
    square: `M${-r * 0.9},${-r * 0.9}h${r * 1.8}v${r * 1.8}h${-r * 1.8}Z`,
    diamond: `M0,${-r * 1.25}L${r * 1.25},0L0,${r * 1.25}L${-r * 1.25},0Z`,
    triangle: `M0,${-r * 1.2}L${r * 1.15},${r * 0.85}L${-r * 1.15},${r * 0.85}Z`,
    "triangle-down": `M0,${r * 1.2}L${r * 1.15},${-r * 0.85}L${-r * 1.15},${-r * 0.85}Z`,
    cross: (() => {
      const a = r * 0.42;
      const b = r * 1.2;
      return `M${-a},${-b}h${2 * a}v${b - a}h${b - a}v${2 * a}h${a - b}v${b - a}h${-2 * a}v${a - b}h${a - b}v${-2 * a}h${b - a}Z`;
    })(),
  };
  if (shape === "circle") return svgEl("circle", { r, class: className }, parent);
  return svgEl("path", { d: paths[shape], class: className }, parent);
}

// ---------- tooltip ----------
const tooltip = htmlEl("div", "tooltip");
tooltip.hidden = true;
tooltip.setAttribute("aria-hidden", "true");
document.body.append(tooltip);

function showTooltip({ title, subtitle, rows }, anchor) {
  tooltip.replaceChildren();
  tooltip.append(htmlEl("div", "tip-title", title));
  if (subtitle) tooltip.append(htmlEl("div", "tip-sub", subtitle));
  for (const row of rows) {
    const line = htmlEl("div", "tip-row");
    if (row.color) {
      const key = htmlEl("span", "tip-key");
      key.style.background = row.color;
      line.append(key);
    }
    line.append(htmlEl("strong", "", row.value), htmlEl("span", "", row.label));
    tooltip.append(line);
  }
  tooltip.hidden = false;
  const box = tooltip.getBoundingClientRect();
  let x = anchor.x + 14;
  let y = anchor.y + 14;
  if (x + box.width > innerWidth - 8) x = anchor.x - box.width - 14;
  if (y + box.height > innerHeight - 8) y = anchor.y - box.height - 14;
  tooltip.style.left = `${Math.max(8, x)}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}
const hideTooltip = () => (tooltip.hidden = true);
const pointerAnchor = (event) => ({ x: event.clientX, y: event.clientY });
function elementAnchor(node) {
  const box = node.getBoundingClientRect();
  return { x: box.right, y: box.top + box.height / 2 };
}

// ---------- scales ----------
function linearScale([d0, d1], [r0, r1]) {
  const scale = (value) => r0 + ((value - d0) / (d1 - d0 || 1)) * (r1 - r0);
  scale.ticks = (count = 6) => {
    const raw = (d1 - d0) / count;
    const power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? power * 10;
    const ticks = [];
    for (let value = Math.ceil(d0 / step) * step; value <= d1 + step * 1e-9; value += step) ticks.push(+value.toFixed(10));
    return ticks;
  };
  return scale;
}
function logScale([d0, d1], [r0, r1]) {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  const scale = (value) => r0 + ((Math.log10(value) - l0) / (l1 - l0 || 1)) * (r1 - r0);
  scale.ticks = () => {
    const ticks = [];
    for (let e = Math.floor(l0); e <= Math.ceil(l1); e++) {
      for (const m of [1, 2, 5]) {
        const value = m * 10 ** e;
        if (value >= d0 && value <= d1) ticks.push(value);
      }
    }
    return ticks;
  };
  return scale;
}

// ---------- shared chart frame ----------
function frame(container, height) {
  container.replaceChildren();
  const width = Math.max(280, container.clientWidth);
  // A group, not an image: the marks inside are focusable links to each run.
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, height, role: "group" }, container);
  return { svg, width, height };
}

function emptyMessage(svg, width, height, text) {
  svgEl("text", { x: width / 2, y: height / 2, "text-anchor": "middle", class: "empty" }, svg).textContent = text;
}

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// ---------- scatter ----------
function paretoFrontier(points) {
  const sorted = [...points].sort((a, b) => a.xValue - b.xValue || b.yValue - a.yValue);
  const frontier = [];
  let best = -Infinity;
  for (const point of sorted) {
    if (point.yValue > best) {
      frontier.push(point);
      best = point.yValue;
    }
  }
  return frontier;
}

function renderScatter(key, { xValue, xLabel, formatX, include = () => true }) {
  const container = document.querySelector(`[data-chart="${key}"]`);
  const narrow = container.clientWidth < 520;
  const { svg, width, height } = frame(container, narrow ? 340 : 420);
  svg.setAttribute("aria-label", `${xLabel} against quality score for each run`);
  const margin = { top: 12, right: narrow ? 16 : 24, bottom: 44, left: 44 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const visible = runs.filter((run) => isVisible(run) && run.rank !== null && include(run));
  if (!visible.length) return emptyMessage(svg, width, height, "No ranked runs match the filters.");

  const xs = visible.map(xValue);
  const ys = visible.map((run) => run.score);
  const logX = state.scale[key] === "log";
  const xDomain = logX
    ? [Math.min(...xs) / 1.35, Math.max(...xs) * 1.35]
    : [0, Math.max(...xs) * 1.08];
  const x = (logX ? logScale : linearScale)(xDomain, [0, plotW]);
  const yDomain = [Math.max(0, Math.floor(Math.min(...ys) - 0.5)), Math.min(10, Math.ceil(Math.max(...ys) + 0.3))];
  const y = linearScale(yDomain, [plotH, 0]);

  const plot = svgEl("g", { transform: `translate(${margin.left},${margin.top})` }, svg);
  const grid = svgEl("g", { class: "grid" }, plot);
  for (const tick of y.ticks(5).filter((t) => Number.isInteger(t) && t >= yDomain[0] && t <= yDomain[1])) {
    svgEl("line", { x1: 0, x2: plotW, y1: y(tick), y2: y(tick) }, grid);
    const label = svgEl("g", { class: "tick" }, plot);
    svgEl("text", { x: -8, y: y(tick) + 4, "text-anchor": "end" }, label).textContent = tick;
  }
  const xTicks = x.ticks(narrow ? 4 : 7);
  for (const tick of xTicks) {
    svgEl("line", { x1: x(tick), x2: x(tick), y1: 0, y2: plotH }, grid);
    const label = svgEl("g", { class: "tick" }, plot);
    svgEl("text", { x: x(tick), y: plotH + 18, "text-anchor": "middle" }, label).textContent = formatX(tick);
  }
  svgEl("line", { x1: 0, x2: plotW, y1: plotH, y2: plotH, class: "baseline" }, plot);
  svgEl("text", { x: plotW / 2, y: plotH + 38, "text-anchor": "middle", class: "axis-title" }, plot).textContent =
    `${xLabel}${logX ? " (log scale)" : ""}`;
  svgEl("text", { x: -plotH / 2, y: -32, transform: "rotate(-90)", "text-anchor": "middle", class: "axis-title" }, plot)
    .textContent = "Quality score";

  const points = visible.map((run) => ({ run, xValue: xValue(run), yValue: run.score, x: x(xValue(run)), y: y(run.score) }));

  // One line per model in one harness, through its effort levels. A run with a comparison note
  // (e.g. reference-assisted) is not comparable, so it stays a standalone point.
  const groups = new Map();
  for (const point of points.filter((p) => !p.run.comparison_note)) {
    const groupKey = `${point.run.model}|${point.run.harness_label}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), point]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => EFFORT_ORDER.indexOf(a.run.effort) - EFFORT_ORDER.indexOf(b.run.effort));
    svgEl("polyline", { class: "pt-line", points: group.map((p) => `${p.x},${p.y}`).join(" ") }, plot);
  }

  if (state.pareto[key]) {
    const frontier = paretoFrontier(points);
    svgEl("polyline", { class: "pareto", points: frontier.map((p) => `${p.x},${p.y}`).join(" ") }, plot);
  }

  const labels = svgEl("g", {}, plot);
  const marks = svgEl("g", {}, plot);
  for (const point of points) {
    const group = svgEl("g", { class: "pt", transform: `translate(${point.x},${point.y})`, "data-run": point.run.id }, marks);
    symbol(shapeOf.get(point.run.harness_label), 5, group, "pt-mark");
    svgEl("circle", { r: 10, class: "pt-focus-ring" }, group);
    const link = svgEl("a", { href: runHref(point.run), "aria-label": describeRun(point.run) }, group);
    svgEl("circle", { r: 13, class: "pt-hit" }, link);
    const tip = () => ({
      title: point.run.label,
      subtitle: `${point.run.model} · ${point.run.effort ?? NO_EFFORT} · ${point.run.harness_label}`,
      rows: [
        { value: point.run.score_text, label: "quality score" },
        { value: point.run.cost ? formatCost(point.run.cost.total) : "—", label: "estimated cost" },
        { value: formatTokens(point.run.tokens.total), label: "tokens" },
        { value: formatMinutes(point.run.elapsed_ms / 60000), label: "time" },
      ],
    });
    link.addEventListener("pointerenter", () => focusRun(svg, point.run.id));
    link.addEventListener("pointermove", (event) => showTooltip(tip(), pointerAnchor(event)));
    link.addEventListener("pointerleave", () => blurRun(svg));
    link.addEventListener("focus", () => {
      focusRun(svg, point.run.id);
      showTooltip(tip(), elementAnchor(link));
    });
    link.addEventListener("blur", () => blurRun(svg));
  }

  // Direct labels where they fit without colliding; the tooltip and table carry the rest.
  const placed = [];
  const pointBoxes = points.map((p) => ({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 }));
  for (const point of [...points].sort((a, b) => b.yValue - a.yValue)) {
    const text = svgEl("text", { class: "pt-label", "data-run": point.run.id }, labels);
    text.textContent = point.run.label;
    const { width: w, height: h } = text.getBBox();
    const candidates = [
      [point.x + 10, point.y + 4, "start"],
      [point.x - 10, point.y + 4, "end"],
      [point.x, point.y - 11, "middle"],
      [point.x, point.y + 19, "middle"],
    ];
    const fit = candidates.find(([lx, ly, anchor]) => {
      const left = anchor === "start" ? lx : anchor === "end" ? lx - w : lx - w / 2;
      const box = { x: left - 2, y: ly - h + 3, w: w + 4, h };
      if (box.x < -margin.left + 4 || box.x + box.w > plotW + margin.right || box.y < -margin.top || box.y + box.h > plotH) return false;
      if (placed.some((other) => overlaps(other, box)) || pointBoxes.some((other) => overlaps(other, box))) return false;
      placed.push(box);
      return true;
    });
    if (!fit) {
      text.remove();
      continue;
    }
    text.setAttribute("x", fit[0]);
    text.setAttribute("y", fit[1]);
    text.setAttribute("text-anchor", fit[2]);
  }
  renderShapeLegend(key, visible);
}

function describeRun(run) {
  const quality = run.rank !== null ? `quality ${run.score_text}` : "not ranked yet";
  return `${run.label}: ${quality}, ${formatTokens(run.tokens.total)} tokens, ${formatMinutes(run.elapsed_ms / 60000)}`;
}

function focusRun(svg, id) {
  svg.classList.add("has-focus");
  for (const node of svg.querySelectorAll("[data-run]")) node.classList.toggle("is-focus", node.dataset.run === id);
}
function blurRun(svg) {
  svg.classList.remove("has-focus");
  for (const node of svg.querySelectorAll(".is-focus")) node.classList.remove("is-focus");
  hideTooltip();
}

function renderShapeLegend(key, visible) {
  const legend = document.querySelector(`[data-legend="${key}"]`);
  legend.replaceChildren();
  const present = harnesses.filter((harness) => visible.some((run) => run.harness_label === harness));
  if (present.length < 2) return;
  for (const harness of present) {
    const item = htmlEl("span", "legend-item");
    const icon = svgEl("svg", { width: 14, height: 14, viewBox: "-7 -7 14 14", "aria-hidden": "true" });
    symbol(shapeOf.get(harness), 4.5, icon, "pt-mark");
    item.append(icon, document.createTextNode(harness));
    legend.append(item);
  }
}

// ---------- horizontal bars ----------
function renderBars(key, { rows, segments, formatValue, formatAxis, axisMax, describe }) {
  const container = document.querySelector(`[data-chart="${key}"]`);
  const narrow = container.clientWidth < 520;
  const rowHeight = 30;
  const barHeight = 16;
  const margin = { top: 4, right: 64, bottom: 28, left: narrow ? 118 : 168 };
  const { svg, width } = frame(container, Math.max(80, rows.length * rowHeight + margin.top + margin.bottom));
  svg.setAttribute("aria-label", container.closest("section").querySelector("h2").textContent);
  if (!rows.length) return emptyMessage(svg, width, 80, "No runs match the filters.");
  const plotW = width - margin.left - margin.right;
  const plotH = rows.length * rowHeight;
  const max = axisMax ?? Math.max(...rows.map((row) => row.total));
  const x = linearScale([0, max], [0, plotW]);
  const plot = svgEl("g", { transform: `translate(${margin.left},${margin.top})` }, svg);

  const grid = svgEl("g", { class: "grid" }, plot);
  for (const tick of x.ticks(narrow ? 3 : 5)) {
    if (tick > max) continue;
    svgEl("line", { x1: x(tick), x2: x(tick), y1: 0, y2: plotH }, grid);
    const label = svgEl("g", { class: "tick" }, plot);
    svgEl("text", { x: x(tick), y: plotH + 18, "text-anchor": "middle" }, label).textContent = formatAxis(tick);
  }
  svgEl("line", { x1: 0, x2: 0, y1: 0, y2: plotH, class: "baseline" }, plot);

  rows.forEach((row, index) => {
    const top = index * rowHeight;
    const group = svgEl("g", { class: "bar-row", transform: `translate(0,${top})` }, plot);
    svgEl("rect", { class: "bar-row-hit", x: -margin.left, y: 0, width: width, height: rowHeight }, group);
    const barY = (rowHeight - barHeight) / 2;
    const parts = segments
      .map((segment) => ({ segment, value: segment.value(row.run) }))
      .filter((part) => part.value > 0);
    let start = 0;
    parts.forEach((part, partIndex) => {
      const x0 = x(start);
      const x1 = x(start + part.value);
      start += part.value;
      const last = partIndex === parts.length - 1;
      const w = Math.max(0, x1 - x0 - (last ? 0 : 2));
      if (w <= 0) return;
      const node = last ? svgEl("path", { d: roundedEnd(x0, barY, w, barHeight, 4) }, group) : svgEl("rect", { x: x0, y: barY, width: w, height: barHeight }, group);
      node.style.fill = part.segment.color;
    });
    const link = svgEl("a", { href: runHref(row.run), "aria-label": describe(row) }, group);
    const label = svgEl("text", { x: -10, y: rowHeight / 2 + 4, "text-anchor": "end", class: "bar-label" }, link);
    label.textContent = truncate(row.run.label, narrow ? 15 : 24);
    svgEl("text", { x: x(row.total) + 6, y: rowHeight / 2 + 4, class: "bar-value" }, group).textContent = formatValue(row.total);

    const tip = () => ({
      title: row.run.label,
      subtitle: `${formatValue(row.total)} total`,
      rows: segments.length > 1
        ? segments.map((segment) => ({ value: segment.format(segment.value(row.run)), label: segment.label, color: segment.color }))
        : [],
    });
    group.addEventListener("pointermove", (event) => showTooltip(tip(), pointerAnchor(event)));
    group.addEventListener("pointerleave", hideTooltip);
    link.addEventListener("focus", () => {
      group.classList.add("is-focus");
      showTooltip(tip(), elementAnchor(label));
    });
    link.addEventListener("blur", () => {
      group.classList.remove("is-focus");
      hideTooltip();
    });
  });
}

function roundedEnd(x, y, w, h, radius) {
  const r = Math.min(radius, w, h / 2);
  return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - r)}Z`;
}
const truncate = (text, length) => (text.length > length ? `${text.slice(0, length - 1)}…` : text);

function renderSegmentLegend(key, segments) {
  const legend = document.querySelector(`[data-legend="${key}"]`);
  legend.replaceChildren();
  if (segments.length < 2) return;
  for (const segment of segments) {
    const item = htmlEl("span", "legend-item");
    const swatch = svgEl("svg", { width: 12, height: 12, "aria-hidden": "true" });
    svgEl("rect", { width: 12, height: 12, rx: 3 }, swatch).style.fill = segment.color;
    item.append(swatch, document.createTextNode(segment.label));
    legend.append(item);
  }
}

// ---------- page ----------
function renderAll() {
  hideTooltip();
  renderScatter("quality-cost", {
    xValue: (run) => run.cost.total,
    xLabel: "Estimated API cost",
    formatX: formatCostTick,
    include: (run) => run.cost !== null,
  });
  renderScatter("quality-tokens", { xValue: (run) => run.tokens.total, xLabel: "Tokens", formatX: formatTokens });
  renderScatter("quality-time", {
    xValue: (run) => run.elapsed_ms / 60000,
    xLabel: "Time to finish",
    formatX: formatMinutes,
  });

  const visible = runs.filter(isVisible);
  const costSegments = TOKEN_TYPES.filter((type) => visible.some((run) => run.cost?.parts[type.key] > 0)).map((type) => ({
    ...type,
    value: (run) => run.cost.parts[type.key],
    format: (value) => `$${value.toFixed(4)}`,
  }));
  renderSegmentLegend("cost", costSegments);
  renderBars("cost", {
    rows: visible.filter((run) => run.cost).map((run) => ({ run, total: run.cost.total })).sort((a, b) => a.total - b.total),
    segments: costSegments,
    formatValue: formatCost,
    formatAxis: (value) => `$${trim(value.toFixed(2))}`,
    describe: (row) => `${row.run.label}: estimated ${formatCost(row.total)}`,
  });

  const tokenSegments = TOKEN_TYPES.filter((type) => visible.some((run) => run.tokens[type.key] > 0)).map((type) => ({
    ...type,
    value: (run) => run.tokens[type.key],
    format: (value) => formatInt(value),
  }));
  renderSegmentLegend("token-use", tokenSegments);
  renderBars("token-use", {
    rows: visible.map((run) => ({ run, total: run.tokens.total })).sort((a, b) => a.total - b.total),
    segments: tokenSegments,
    formatValue: formatTokens,
    formatAxis: formatTokens,
    describe: (row) => `${row.run.label}: ${formatInt(row.total)} tokens`,
  });

  renderBars("time-taken", {
    rows: visible.map((run) => ({ run, total: run.elapsed_ms / 60000 })).sort((a, b) => a.total - b.total),
    segments: [{ label: "Time", color: "var(--s1)", value: (run) => run.elapsed_ms / 60000, format: formatMinutes }],
    formatValue: formatMinutes,
    formatAxis: (value) => `${value}m`,
    describe: (row) => `${row.run.label}: ${formatMinutes(row.total)}`,
  });

  const criterionSegments = CRITERIA.map((criterion) => ({
    label: `${criterion.label} (${criterion.weight}%)`,
    color: criterion.color,
    value: (run) => (run.scores[criterion.key] * criterion.weight) / 100,
    format: (value) => value.toFixed(2),
  }));
  renderSegmentLegend("score-breakdown", criterionSegments);
  renderBars("score-breakdown", {
    rows: visible.filter((run) => run.rank !== null).map((run) => ({ run, total: run.score })),
    segments: criterionSegments,
    formatValue: (value) => value.toFixed(2),
    formatAxis: (value) => String(value),
    axisMax: 10,
    describe: (row) => `${row.run.label}: quality ${row.run.score_text}`,
  });

  for (const row of document.querySelectorAll(".leaderboard tbody tr")) {
    row.hidden = !isVisible(runs.find((run) => run.id === row.dataset.run));
  }
}

// ---------- filters ----------
function chipGroup(title, values, selected, labelOf = (value) => value) {
  const group = htmlEl("div", "filter-group");
  group.append(htmlEl("h3", "", title));
  const chips = htmlEl("div", "chips");
  for (const value of values) {
    const label = htmlEl("label", "chip");
    const input = Object.assign(document.createElement("input"), { type: "checkbox", checked: true });
    const text = htmlEl("span", "", labelOf(value));
    input.addEventListener("change", () => {
      if (input.checked) selected.add(value);
      else selected.delete(value);
      renderAll();
    });
    label.append(input, text);
    chips.append(label);
  }
  group.append(chips);
  return group;
}

function buildFilters() {
  const body = document.querySelector("[data-filters]");
  body.append(chipGroup("Harness", harnesses, state.harness));
  body.append(chipGroup("Effort", efforts, state.effort));

  const group = htmlEl("div", "filter-group");
  const heading = htmlEl("h3", "", "Models");
  const actions = htmlEl("div", "filter-actions");
  const showAll = htmlEl("button", "link-button", "All");
  const showNone = htmlEl("button", "link-button", "None");
  showAll.type = showNone.type = "button";
  actions.append(showAll, showNone);
  group.append(heading, actions);
  const list = htmlEl("ul", "run-list");
  const inputs = new Map();
  const select = (chosen) => {
    state.models = new Set(chosen);
    for (const [model, box] of inputs) box.checked = state.models.has(model);
    saveModels();
    renderAll();
  };
  for (const model of models) {
    const count = runs.filter((run) => modelOf(run) === model).length;
    const item = htmlEl("li");
    const label = htmlEl("label");
    const input = Object.assign(document.createElement("input"), { type: "checkbox", checked: state.models.has(model) });
    inputs.set(model, input);
    input.addEventListener("change", () => {
      if (input.checked) state.models.add(model);
      else state.models.delete(model);
      saveModels();
      renderAll();
    });
    label.append(input, htmlEl("span", "run-name", model), htmlEl("span", "run-count", String(count)));
    const only = htmlEl("button", "only", "only");
    only.type = "button";
    only.setAttribute("aria-label", `Show only ${model}`);
    only.addEventListener("click", () => select([model]));
    item.append(label, only);
    list.append(item);
  }
  showAll.addEventListener("click", () => select(models));
  showNone.addEventListener("click", () => select([]));
  group.append(list);
  body.prepend(group);

  const panel = document.querySelector(".filter-panel");
  if (matchMedia("(max-width: 900px)").matches) panel.open = false;
}

function bindScatterControls() {
  for (const box of document.querySelectorAll("[data-pareto]")) {
    box.addEventListener("change", () => {
      state.pareto[box.dataset.pareto] = box.checked;
      renderAll();
    });
  }
  for (const button of document.querySelectorAll("[data-scale]")) {
    button.addEventListener("click", () => {
      const key = button.dataset.scale;
      state.scale[key] = button.dataset.value;
      for (const sibling of document.querySelectorAll(`[data-scale="${key}"]`)) {
        sibling.setAttribute("aria-pressed", String(sibling === button));
      }
      renderAll();
    });
  }
}

buildFilters();
bindScatterControls();
renderAll();

// Following a link to another model selection on this page changes only the hash.
addEventListener("hashchange", () => {
  state.models = selectedModels();
  for (const item of document.querySelectorAll(".run-list li")) {
    item.querySelector("input").checked = state.models.has(item.querySelector(".run-name").textContent);
  }
  renderAll();
});

let lastWidth = 0;
new ResizeObserver(([entry]) => {
  const width = Math.round(entry.contentRect.width);
  if (width !== lastWidth) {
    lastWidth = width;
    renderAll();
  }
}).observe(document.querySelector("main"));
