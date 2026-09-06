# Solution — Wikipedia Table Charter

A command-line program that takes a **URL** (e.g. a Wikipedia page) and produces
an **image file** (PNG): it scans the page for tables, detects a numeric column,
and plots those values as a line chart.

> Example: the sample page from the brief
> ([Women's high jump world record progression](https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression))
> yields a clean progression from 1.46 m to 2.10 m across 57 records.
> See [`docs/sample-output.png`](docs/sample-output.png).

---

## 1. How it works

The program is a small, single-responsibility **pipeline**. Each stage is an
independently testable unit; only the two edges (network, disk) perform I/O.

```
 URL ──▶ PageFetcher ──▶ TableParser ──▶ NumericColumnSelector ──▶ SvgChartRenderer ──▶ PngWriter ──▶ chart.png
        (fetch HTML)     (HTML→tables)   (pick numeric column)     (data→SVG, pure)     (SVG→PNG)
```

| Stage | File | Responsibility |
|-------|------|----------------|
| Fetch | `src/core/fetcher/page-fetcher.service.ts` | GET the page (Node global `fetch`) |
| Parse | `src/core/parser/table-parser.service.ts` | HTML → normalised tables (via `cheerio`) |
| Select | `src/core/parser/numeric-column-selector.service.ts` | Choose the best numeric column |
| Numbers | `src/core/parser/number.util.ts` | Turn a messy cell into a number (pure) |
| Render | `src/core/chart/svg-chart.renderer.ts` | Build a line-chart **SVG** (pure) |
| Rasterise | `src/core/chart/png-writer.service.ts` | SVG → PNG on disk (via `sharp`) |
| Orchestrate | `src/core/chart-pipeline.service.ts` | Wire the stages together |
| CLI | `src/cli/chart.command.ts` | Parse args, handle errors/exit codes |

### Why NestJS for a CLI?

NestJS gives dependency injection and a clear module boundary for free, via
[`nest-commander`](https://nest-commander.jaymcdoniel.dev/). DI is what keeps
every stage swappable and independently testable (each collaborator can be
mocked). It is deliberately booted as a *console application context* — there is
**no HTTP server**; the deliverable is a CLI, as the brief requires.

### How the numeric column is chosen

Without hard-coding column names, the selector:

1. Parses every cell of every column of every table into a number (or `null`).
2. Keeps columns where **≥ 60%** of cells are numeric and there are **≥ 2**
   points (enough to plot a line).
3. Picks the column with the **most numeric points**, breaking ties by the
   higher numeric ratio (the "cleaner" column).

This is a pragmatic heuristic that works well for record-progression / statistics
tables without any page-specific configuration.

### Handling real-world HTML messiness

Two issues surfaced on the actual sample page and are handled in the parser
(each covered by a unit test):

- **Merged cells (`rowspan`/`colspan`).** A naive positional read let a *date*
  (`31 August 1978`) slide into the numeric "Mark" column, producing false
  spikes. The parser expands spans into a rectangular matrix so every logical
  column stays aligned.
- **Inline `<style>`/`<script>` leakage.** Wikipedia injects a `<style>` block
  inside the first cell; `.text()` would splice the CSS into the value. The
  parser strips these nodes before reading text.

---

## 2. Assumptions

Documented deliberately, per the brief:

- **Input** is an HTTP(S) page that contains at least one HTML `<table>`. If the
  page uses `class="wikitable"` (Wikipedia), those tables are preferred;
  otherwise all `<table>` elements are considered.
- **A "numeric column"** is one where most cells parse to a finite number. Cells
  may include footnotes (`[1]`, `†`), units (`1.85 m`), thousands separators
  (`2,050`) and unicode minus signs — the parser extracts the leading numeric
  quantity from each.
- **The chart** is a line chart of the values in **row order** (an index-based
  X axis). Record-progression tables are already time-ordered, so this reads as
  a progression over time without needing to parse the date column.
- **Output** is a PNG. The path defaults to `output/chart.png` and is
  overridable with `-o`.
- If multiple numeric columns exist, the one with the most data points wins.

---

## 3. Testing — TDD & BDD

Run everything with `npm test` (30 tests).

**Unit tests (TDD)** drive the pure logic — the parts most likely to hide bugs:

- `number.util.spec.ts` — footnotes, units, separators, unicode minus, nulls.
- `numeric-column-selector.service.spec.ts` — column choice, ties, fallbacks,
  the "no numeric column" error.
- `table-parser.service.spec.ts` — headers/rows, whitespace, **rowspan/colspan
  expansion**, style stripping.
- `svg-chart.renderer.spec.ts` — well-formed SVG, titles, one marker per point,
  XML escaping, flat-series safety.

**BDD (`test/features/chart-generation.feature`)** describes behaviour in
Given/When/Then using [`jest-cucumber`](https://github.com/bencompton/jest-cucumber).
The steps exercise the **whole pipeline** with only the network faked — SVG
rendering and PNG rasterisation run for real, and the test asserts the output
file starts with the PNG magic number, so a green scenario proves a real image
was produced.

```
Feature: Chart a numeric column from a web page table
  Scenario: Plotting a record-progression table
    Given a page containing a table with a numeric "Height (m)" column
    When I run the chart pipeline for that page
    Then a PNG image file is produced
    And the chart is titled after the numeric column
    And the chart contains one point per row
```

---

## 4. Trade-offs & what I'd do next

Kept intentionally simple for the time box. With more time:

- **Chart type / X axis:** detect a date or label column and use it for the X
  axis and tooltips, instead of a positional index.
- **Column selection UX:** print the candidate columns and let the user pick one
  with a flag (`--column "Mark"`), rather than always auto-selecting.
- **Chart library:** swap the hand-rolled SVG for Vega-Lite or Chart.js for
  richer styling — isolated behind `SvgChartRenderer`, so nothing else changes.
- **Resilience:** retries/timeouts on fetch; polite rate limiting.
- **More BDD scenarios:** multi-table pages, pages with no tables, network
  failures.

### Why hand-rolled SVG instead of a chart library / node-canvas?

`node-canvas` needs native compilation (Cairo), which is fragile to install.
Building the chart as an SVG string is **pure and dependency-light** (great for
TDD), and `sharp` — which ships prebuilt binaries — rasterises it to PNG with no
native build step. This keeps setup to a single `npm install`.
