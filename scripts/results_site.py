"""Render the static benchmark results site and build each playable game."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from typing import Any


SITE_MARKER = ".benchmark-site"
CONTROLS = [
    ("← →", "Move"),
    ("↑ / X", "Rotate clockwise"),
    ("Z / Ctrl", "Rotate counterclockwise"),
    ("↓", "Soft drop"),
    ("Space", "Hard drop"),
    ("C", "Hold"),
    ("R", "Restart after game over"),
]
SEVERITY_ICONS = {"critical": "✕", "major": "!", "minor": "–"}
# Root-relative asset URLs in a game's index.html break under the Pages project path.
ROOT_RELATIVE_ATTRIBUTE = re.compile(r"""(\s(?:src|href)=)(["'])/(?!/)([^"']*)\2""")
ROOT_RELATIVE_IMPORT = re.compile(r"""(?:\bfrom\s*|\bimport\s*\(?\s*)["']/(?!/)""")
SECTIONS = [
    ("quality-cost", "Quality vs cost"),
    ("quality-tokens", "Quality vs tokens"),
    ("quality-time", "Quality vs time"),
    ("cost", "Cost"),
    ("token-use", "Token use"),
    ("time-taken", "Time"),
    ("score-breakdown", "Score breakdown"),
    ("leaderboard", "Leaderboard"),
]


class SiteError(RuntimeError):
    pass


def esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def compact_tokens(value: int) -> str:
    if value >= 10_000_000:
        return f"{value / 1_000_000:.1f}M"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.2f}M"
    return f"{round(value / 1000)}K"


def format_cost(cost: dict[str, Any] | None, precise: bool = False) -> str:
    if cost is None:
        return "—"
    if precise:
        return f"${cost['total']:,.4f}"
    return "<$0.01" if cost["total"] < 0.005 else f"${cost['total']:,.2f}"


def short_duration(milliseconds: int) -> str:
    seconds = round(milliseconds / 1000)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m {seconds}s" if minutes else f"{seconds}s"


def repository_url(root: Path) -> str | None:
    if os.environ.get("GITHUB_REPOSITORY"):
        return f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/{os.environ['GITHUB_REPOSITORY']}"
    try:
        remote = subprocess.run(
            ["git", "remote", "get-url", "origin"], cwd=root, text=True, capture_output=True, check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    match = re.fullmatch(r"(?:git@github\.com:|https://github\.com/)([^/]+/[^/]+?)(?:\.git)?", remote)
    return f"https://github.com/{match.group(1)}" if match else None


def github_slug(heading: str) -> str:
    return re.sub(r"[^\w\- ]", "", heading.lower()).replace(" ", "-")


def inline_markdown(text: str, repo: str | None) -> str:
    """Render the code spans and links used in audit notes; everything else is escaped."""
    def link(match: re.Match[str]) -> str:
        label, target = match.group(1), html.unescape(match.group(2))
        if ":" not in target and repo:
            target = f"{repo}/blob/main/{target}"
        elif ":" not in target:
            return label
        return f'<a href="{esc(target)}">{label}</a>'

    rendered = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, esc(text))
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", rendered)


def page(title: str, description: str, prefix: str, body: str, scripts: str = "") -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<script>try{{const t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="{prefix}assets/site.css">
</head>
<body>
<header class="topbar">
  <a class="brand" href="{prefix}">tetris<span>bench</span></a>
  <nav class="topnav" aria-label="Charts">{''.join(f'<a href="{prefix}#{key}">{esc(label)}</a>' for key, label in SECTIONS)}</nav>
  <button class="theme-toggle" type="button" aria-label="Switch color theme"><span aria-hidden="true">◐</span></button>
</header>
{body}
<footer class="footer">Generated from <a href="{prefix}results.json">results.json</a>. Quality scores come from audited reviews; tokens and time from verified session records.</footer>
<script src="{prefix}assets/theme.js" defer></script>
{scripts}
</body>
</html>
"""


def leaderboard_table(runs: list[dict[str, Any]]) -> str:
    rows = []
    for run in runs:
        rank = run["rank"] if run["rank"] is not None else "—"
        quality = f"<strong>{esc(run['score_text'])}</strong>" if run["rank"] is not None else "Pending"
        effort = f"<code>{esc(run['effort'])}</code>" if run["effort"] else "—"
        rows.append(
            f'<tr data-run="{esc(run["id"])}">'
            f'<td class="num">{rank}</td>'
            f'<th scope="row"><a href="runs/{esc(run["id"])}/">{esc(run["label"])}</a></th>'
            f'<td><code>{esc(run["model"])}</code></td><td>{effort}</td><td>{esc(run["harness_label"])}</td>'
            f'<td class="num">{quality}</td><td class="num">{run["tokens"]["total"]:,}</td>'
            f'<td class="num">{esc(format_cost(run["cost"]))}</td>'
            f'<td class="num">{esc(short_duration(run["elapsed_ms"]))}</td>'
            f'<td>{esc(run.get("summary", "Not ranked yet"))}</td></tr>'
        )
    return f"""<div class="table-wrapper" tabindex="0" role="region" aria-labelledby="leaderboard-caption">
<table class="leaderboard">
<caption id="leaderboard-caption">All runs, ordered by quality score</caption>
<thead><tr><th scope="col" class="num">#</th><th scope="col">Run</th><th scope="col">Model</th><th scope="col">Effort</th><th scope="col">Harness</th><th scope="col" class="num">Quality</th><th scope="col" class="num">Tokens</th><th scope="col" class="num">Est. cost</th><th scope="col" class="num">Time</th><th scope="col">Main finding</th></tr></thead>
<tbody>{''.join(rows)}</tbody>
</table>
</div>"""


def chart_card(key: str, title: str, subtitle: str, controls: str = "") -> str:
    return f"""<section class="card" id="{key}" aria-labelledby="{key}-title">
  <div class="card-head">
    <div><h2 id="{key}-title">{esc(title)}</h2><p class="subtitle">{esc(subtitle)}</p></div>
    <div class="controls">{controls}</div>
  </div>
  <div class="legend" data-legend="{key}"></div>
  <div class="chart" data-chart="{key}"></div>
</section>"""


def scatter_controls(key: str) -> str:
    return (
        f'<label class="check"><input type="checkbox" data-pareto="{key}"> Pareto line</label>'
        f'<label class="check"><input type="checkbox" data-pareto-only="{key}"> Pareto only</label>'
        f'<div class="segmented" role="group" aria-label="X axis scale">'
        f'<button type="button" data-scale="{key}" data-value="linear" aria-pressed="false">Linear</button>'
        f'<button type="button" data-scale="{key}" data-value="log" aria-pressed="true">Log</button></div>'
    )


def index_page(results: dict[str, Any]) -> str:
    runs = results["runs"]
    scored = [run for run in runs if run["rank"] is not None]
    best = scored[0] if scored else None
    priced = [run for run in scored if run["cost"] is not None]
    cheapest = min(priced, key=lambda run: run["cost"]["total"]) if priced else None
    excluded = results.get("excluded", [])
    left_off = (
        f" {len(excluded)} more {'run is' if len(excluded) == 1 else 'runs are'} recorded in the "
        + (f"<a href=\"{esc(results['repository'])}#results\">repository</a>" if results.get("repository") else "repository")
        + " but not shown here: "
        + "; ".join(f"{esc(run['label'])}: {esc(run['reason'])}" for run in excluded) + "."
        if excluded else ""
    )
    intro = (
        f"<p class=\"lede\">{len(runs)} runs of models building the same browser Tetris game from one prompt. "
        "Each run is scored for quality by an audited review and measured for the tokens, estimated API cost, "
        "and time it took."
        + (f" Highest quality: <a href=\"runs/{esc(best['id'])}/\">{esc(best['label'])}</a> ({esc(best['score_text'])}). "
           f"Cheapest: <a href=\"runs/{esc(cheapest['id'])}/\">{esc(cheapest['label'])}</a> "
           f"({esc(format_cost(cheapest['cost']))})." if best and cheapest else "")
        + "</p>"
        + (f'<p class="muted small">{left_off.strip()}</p>' if left_off else "")
    )
    unpriced = [run["label"] for run in runs if run["cost"] is None]
    left_out = (
        f" {' and '.join(unpriced) if len(unpriced) < 3 else ', '.join(unpriced)} "
        f"{'has' if len(unpriced) == 1 else 'have'} no public price and {'is' if len(unpriced) == 1 else 'are'} left out."
        if unpriced else ""
    )
    cost_subtitle = (
        "Quality score against estimated API cost: recorded tokens at each model's public list price. "
        f"Up and to the left is better.{left_out}"
    )
    body = f"""<div class="layout">
<main id="main">
  <h1>Tetris LLM benchmark</h1>
  {intro}
  {chart_card("quality-cost", "Quality vs cost", cost_subtitle, scatter_controls("quality-cost"))}
  {chart_card("quality-tokens", "Quality vs tokens", "Quality score against the tested agent's total tokens. Up and to the left is better.", scatter_controls("quality-tokens"))}
  {chart_card("quality-time", "Quality vs time", "Quality score against wall-clock time to finish. Up and to the left is better.", scatter_controls("quality-time"))}
  {chart_card("cost", "Cost", f"Estimated API cost per run, split by token type.{left_out}")}
  {chart_card("token-use", "Token use", "Tested-agent tokens per run, split by type. Cached input dominates most runs.")}
  {chart_card("time-taken", "Time", "Wall-clock time from the benchmark prompt to the finished implementation.")}
  {chart_card("score-breakdown", "Score breakdown", "Each criterion's weighted contribution to the quality score out of 10.")}
  <section class="card" id="leaderboard" aria-labelledby="leaderboard-title">
    <div class="card-head"><div><h2 id="leaderboard-title">Leaderboard</h2><p class="subtitle">The same data as a table, following the model, harness and effort filters. Select a run for its details and a playable build.</p></div></div>
    {leaderboard_table(runs)}
  </section>
</main>
<aside class="filters" aria-label="Filters">
  <details class="filter-panel" open>
    <summary>Filters</summary>
    <div class="filter-body" data-filters></div>
  </details>
</aside>
</div>"""
    data = json.dumps(results, ensure_ascii=False).replace("</", "<\\/")
    scripts = f'<script type="application/json" id="results">{data}</script>\n<script type="module" src="assets/charts.js"></script>'
    return page("Tetris LLM benchmark", "Quality, token use and time of LLM agents building the same Tetris game.", "", body, scripts)


def stat_tile(label: str, value: str, note: str = "") -> str:
    note_html = f'<span class="tile-note">{esc(note)}</span>' if note else ""
    return f'<div class="tile"><span class="tile-label">{esc(label)}</span><span class="tile-value">{esc(value)}</span>{note_html}</div>'


def run_page(run: dict[str, Any], results: dict[str, Any], repo: str | None, game: dict[str, Any] | None) -> str:
    total_runs = len(results["runs"])
    effort = f"effort <code>{esc(run['effort'])}</code>" if run["effort"] else "effort not recorded"
    web = "web access open" if run["web"] == "open" else "web tools blocked"
    meta = f"<code>{esc(run['model'])}</code> · {effort} · {esc(run['harness_label'])} · {web}"
    if run.get("audited"):
        meta += f" · audited {esc(run['audited'])}"
    tiles = [
        stat_tile("Quality", f"{run['score_text']} / 10" if run["rank"] else "Pending",
                  f"Rank {run['rank']} of {total_runs}" if run["rank"] else "Not ranked yet"),
        stat_tile("Tokens", compact_tokens(run["tokens"]["total"]), f"{run['tokens']['total']:,} tested-agent"),
        stat_tile("Est. cost", format_cost(run["cost"]),
                  "At public API list price" if run["cost"] else "No public price for this model"),
        stat_tile("Time", short_duration(run["elapsed_ms"]), run["elapsed"]),
        stat_tile("Tool calls", f"{run['tool_calls']:,}" if run["tool_calls"] is not None else "—",
                  "Recorded by the harness" if run["tool_calls"] is not None else "Not recorded for this harness"),
    ]

    notes = []
    if run.get("known_browser_failure"):
        notes.append(
            '<div class="callout callout-critical"><strong>This build does not start in a browser.</strong> '
            f"{esc(run['known_browser_failure'])} It is shown exactly as delivered, so the game area stays empty. "
            "That failure is why it ranks last.</div>"
        )
    if run.get("known_build_failure"):
        notes.append(
            '<div class="callout callout-critical"><strong>This build does not compile.</strong> '
            f"{esc(run['known_build_failure'])} There is no playable game to show.</div>"
        )
    if run.get("external_actions"):
        notes.append(
            '<div class="callout callout-critical"><strong>This run acted outside the benchmark.</strong> '
            f"{esc(run['external_actions'])}</div>"
        )
    if run.get("known_test_failure"):
        notes.append(
            '<div class="callout"><strong>Its own tests fail.</strong> '
            f"{esc(run['known_test_failure'])} The game builds and is shown as delivered.</div>"
        )
    if run.get("missing_lockfile"):
        notes.append(
            '<div class="callout"><strong>No lockfile.</strong> This run was delivered without '
            "<code>package-lock.json</code>, so its dependencies were installed with <code>npm install</code> "
            "at build time rather than from pinned versions.</div>"
        )
    if run.get("comparison_note"):
        notes.append(f'<div class="callout"><strong>Comparison note.</strong> {esc(run["comparison_note"])}</div>')

    if run.get("known_build_failure"):
        play = '<p class="muted">The delivered code does not build, so there is no playable game.</p>'
    elif game is None:
        play = '<p class="muted">The playable build was not generated for this preview.</p>'
    else:
        rewrite = ""
        if game["rewritten"]:
            urls = ", ".join(f"<code>{esc(url)}</code>" for url in game["rewritten"])
            verb = "were" if len(game["rewritten"]) > 1 else "was"
            rewrite = (
                f'<p class="muted small">Deployment change: {urls} in <code>index.html</code> {verb} made relative '
                "so the game loads under this site's path. The game code is unchanged.</p>"
            )
        if game.get("web_root"):
            rewrite += (
                f'<p class="muted small">Deployment change: the run\'s own server publishes only '
                f"<code>{esc(game['web_root'])}/</code>, so the site serves that folder as the game.</p>"
            )
        for alias, source in game["aliases"].items():
            rewrite += (
                f'<p class="muted small">Deployment change: the run\'s own server maps <code>/{esc(alias)}</code> '
                f"to <code>{esc(source)}</code>, so the site serves a copy of that file at <code>{esc(alias)}</code>.</p>"
            )
        keys = "".join(f"<div><dt><kbd>{esc(key)}</kbd></dt><dd>{esc(action)}</dd></div>" for key, action in CONTROLS)
        play = f"""<div class="play-head">
  <button type="button" class="button" data-focus-game>Focus the game</button>
  <a class="button button-quiet" href="play/" target="_blank" rel="noopener">Open full page ↗</a>
</div>
<div class="play-frame"><iframe src="play/" title="Playable build of {esc(run['label'])}" loading="lazy"></iframe></div>
<dl class="keys">{keys}</dl>
{rewrite}"""

    scores = ""
    if run["rank"]:
        rows = []
        for criterion in results["criteria"]:
            value = run["scores"][criterion["key"]]
            rows.append(
                f'<div class="score-row"><span class="score-label">{esc(criterion["label"])} '
                f'<span class="muted">{criterion["weight"]}%</span></span>'
                f'<span class="meter" aria-hidden="true"><span style="--value:{value}"></span></span>'
                f'<span class="score-value">{value:.1f}</span></div>'
            )
        scores = f"""<section class="card" aria-labelledby="scores-title">
  <h2 id="scores-title">Scores</h2>
  <p class="subtitle">Weighted total <strong>{esc(run['score_text'])}</strong> out of 10. {esc(run['summary'])}.</p>
  <div class="scores">{''.join(rows)}</div>
</section>"""

    bugs = ""
    if run["rank"]:
        if run["bugs"]:
            items = "".join(
                f'<li class="bug"><span class="severity severity-{esc(bug["severity"])}">'
                f'<span aria-hidden="true">{SEVERITY_ICONS[bug["severity"]]}</span> {esc(bug["severity"].capitalize())}</span>'
                f'<div><strong>{esc(bug["title"])}</strong><p>{inline_markdown(bug["detail"], repo)}</p></div></li>'
                for bug in run["bugs"]
            )
        else:
            items = '<li class="bug"><div><strong>No confirmed bugs in the audited scope.</strong><p>This does not mean the implementation is proven correct.</p></div></li>'
        heading = f"{run['rank']}. {run['label']} — {run['score_text']}"
        audit = f' <a href="{esc(repo)}/blob/main/RANKING.md#{github_slug(heading)}">Full audit ↗</a>' if repo else ""
        bugs = f"""<section class="card" aria-labelledby="bugs-title">
  <h2 id="bugs-title">Confirmed bugs</h2>
  <p class="subtitle">Each bug lowers the correctness score: critical caps it at 4, major costs 1.5, minor 0.5.{audit}</p>
  <ul class="bugs">{items}</ul>
</section>"""

    tokens = run["tokens"]
    cost = run["cost"]
    price = run["price"]

    def price_cells(key: str) -> str:
        if cost is None:
            return ""
        rate = price["prices"][key]
        rate_text = "—" if rate is None else f"${rate:g}"
        return f'<td class="num">{rate_text}</td><td class="num">${cost["parts"][key]:,.4f}</td>'

    usage_rows = "".join(
        f'<tr><th scope="row">{label}</th><td class="num">{tokens[key]:,}</td>'
        f'<td class="num">{tokens[key] / tokens["total"]:.1%}</td>{price_cells(key)}</tr>'
        for key, label in [("input", "Input"), ("cache_read", "Cache read"), ("cache_write", "Cache write"), ("output", "Output")]
    )
    price_heads = '<th scope="col" class="num">Price / 1M</th><th scope="col" class="num">Cost</th>' if cost else ""
    price_total = f'<td></td><td class="num">{esc(format_cost(cost, precise=True))}</td>' if cost else ""
    evidence = {
        "recorded": "Reproduces the cost the harness itself recorded",
        "official": "Provider's official price page",
        "third-party": "Third-party price listing",
    }
    if cost:
        pricing_note = (
            f"<p class=\"small\">Priced as {esc(price['label'])}. {esc(price['note'])} "
            f"Source: <a href=\"{esc(price['source'])}\">{esc(evidence[price['evidence']])} ↗</a>.</p>"
        )
    else:
        pricing_note = f"<p class=\"small\">No cost estimate: {esc(price['unpriced'])}</p>"
    overhead = (
        "Harness requests such as title generation are recorded separately in the statistics."
        if run["overhead_verified"] else
        "Harness overhead for this run is not verified; unknown does not mean zero."
    )
    links = []
    if repo:
        links.append(f'<a href="{esc(repo)}/tree/main/{esc(run["project_dir"])}">Source code ↗</a>')
        links.append(f'<a href="{esc(repo)}/blob/main/{esc(run["project_dir"])}/STATISTICS.md">Session statistics ↗</a>')
    responses = f"{run['model_responses']:,}" if run["model_responses"] is not None else "not recorded"
    usage = f"""<section class="card" aria-labelledby="usage-title">
  <h2 id="usage-title">Usage and cost</h2>
  <p class="subtitle">Tested-agent tokens only. {esc(overhead)} Cost is an estimate at the model's public API list price.</p>
  <div class="table-wrapper" tabindex="0" role="region" aria-labelledby="usage-title">
  <table><thead><tr><th scope="col">Type</th><th scope="col" class="num">Tokens</th><th scope="col" class="num">Share</th>{price_heads}</tr></thead>
  <tbody>{usage_rows}<tr class="total"><th scope="row">Total</th><td class="num">{tokens['total']:,}</td><td class="num">100%</td>{price_total}</tr></tbody></table>
  </div>
  {pricing_note}
  <p class="small">Elapsed {esc(run['elapsed'])} · model responses {esc(responses)}</p>
  <p class="links">{' · '.join(links)}</p>
</section>"""

    body = f"""<main id="main" class="run-page">
  <a class="back" href="../../">← All runs</a>
  <h1>{esc(run['label'])}</h1>
  <p class="run-meta">{meta}</p>
  <div class="tiles">{''.join(tiles)}</div>
  {''.join(notes)}
  <section class="card" aria-labelledby="play-title">
    <h2 id="play-title">Play it</h2>
    <p class="subtitle">The implementation as the model delivered it, built with its own <code>npm run build</code>.</p>
    {play}
  </section>
  {scores}
  {bugs}
  {usage}
</main>"""
    description = f"{run['label']}: quality, bugs, token use and a playable build from the Tetris LLM benchmark."
    return page(f"{run['label']} · Tetris LLM benchmark", description, "../../", body,
                '<script src="../../assets/run.js" defer></script>')


def relativize_urls(index_html: str) -> tuple[str, list[str]]:
    rewritten: list[str] = []

    def relative(match: re.Match[str]) -> str:
        rewritten.append("/" + match.group(3))
        return f"{match.group(1)}{match.group(2)}./{match.group(3)}{match.group(2)}"

    return ROOT_RELATIVE_ATTRIBUTE.sub(relative, index_html), rewritten


def build_game(root: Path, run: dict[str, Any], destination: Path) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix=f"site-{run['id']}-") as temporary:
        work = Path(temporary) / run["project_dir"]
        shutil.copytree(
            root / run["project_dir"], work,
            ignore=shutil.ignore_patterns(".git", "node_modules", "dist", "STATISTICS.md"),
        )
        install = ["npm", "install" if run.get("missing_lockfile") else "ci", "--ignore-scripts", "--no-audit", "--no-fund"]
        for command in (install, ["npm", "run", "build"]):
            process = subprocess.run(command, cwd=work, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            if process.returncode:
                raise SiteError(f"{run['id']} failed {' '.join(command)}:\n{process.stdout}")
        # A run whose own server publishes one folder (e.g. its build output) is served from that folder.
        web_root = run.get("web_root")
        published = work / web_root if web_root else work
        if not published.is_dir():
            raise SiteError(f"{run['id']} web_root {web_root} does not exist after the build")
        shutil.copytree(published, destination, ignore=shutil.ignore_patterns("node_modules", ".git"))
    # Paths the run's own server maps to other files; a static host needs a copy at the requested path.
    aliases = run.get("static_aliases", {})
    for alias, source in aliases.items():
        target = destination / alias
        if target.exists() or not (destination / source).is_file():
            raise SiteError(f"{run['id']} static alias {alias} -> {source} is invalid")
        shutil.copyfile(destination / source, target)
    index = destination / "index.html"
    if not index.is_file():
        raise SiteError(f"{run['id']} has no index.html to play")
    text, rewritten = relativize_urls(index.read_text())
    index.write_text(text)
    for script in destination.rglob("*.js"):
        if ROOT_RELATIVE_IMPORT.search(script.read_text(errors="replace")):
            raise SiteError(f"{run['id']} imports a root-relative module in {script.relative_to(destination)}")
    return {"rewritten": rewritten, "aliases": aliases, "web_root": web_root}


def prepare_output(out: Path) -> None:
    if out.exists():
        if any(out.iterdir()) and not (out / SITE_MARKER).exists():
            raise SiteError(f"Refusing to replace {out}: it is not empty and was not created by the site builder")
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / SITE_MARKER).write_text("Generated by scripts/benchmark.py site\n")
    (out / ".nojekyll").write_text("")


def build(root: Path, results: dict[str, Any], out: Path, games: bool) -> None:
    prepare_output(out)
    shutil.copytree(root / "site" / "assets", out / "assets")
    repo = repository_url(root)
    results["repository"] = repo
    game_info: dict[str, dict[str, Any]] = {}
    if games:
        def build_one(run: dict[str, Any]) -> tuple[str, dict[str, Any] | None]:
            if run.get("known_build_failure"):
                return run["id"], None  # nothing playable to publish
            return run["id"], build_game(root, run, out / "runs" / run["id"] / "play")

        with ThreadPoolExecutor(max_workers=4) as pool:
            game_info = dict(pool.map(build_one, results["runs"]))
    for run in results["runs"]:
        run["game"] = game_info.get(run["id"])
    (out / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n")
    (out / "index.html").write_text(index_page(results))
    for run in results["runs"]:
        path = out / "runs" / run["id"] / "index.html"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(run_page(run, results, repo, run["game"]))
