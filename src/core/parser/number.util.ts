/**
 * Pure numeric-parsing helpers — the heart of numeric-column detection.
 *
 * Wikipedia cells are messy: footnotes (`[1]`, `†`), units (`1.85 m`),
 * separators (`2,050`), unicode minus, non-breaking spaces, and clock-style
 * durations (`2:55:18`) common in record-progression tables.
 */

/**
 * Parse the leading numeric quantity from a raw cell.
 * @returns the number, or `null` if the cell has no usable value.
 */
export function parseNumericCell(raw: string | undefined | null): number | null {
  if (raw == null) {
    return null;
  }

  const cleaned = raw
    .replace(/\[[^\]]*\]/g, '') // footnotes: [1], [note 2]
    .replace(/[†‡*]/g, '') // typographic markers: † ‡ *
    .replace(/−/g, '-') // unicode minus -> ASCII
    .replace(/[  ]/g, ' ') // non-breaking / thin spaces
    .replace(/(\d),(\d)/g, '$1$2') // thousands separators: 2,050 -> 2050
    .trim();

  // Durations (H:MM:SS or M:SS[.ss]) -> total seconds, so times compare/plot.
  const duration = parseDuration(cleaned);
  if (duration !== null) {
    return duration;
  }

  // First signed decimal token; tolerates leading labels / trailing units.
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Convert a clock-style duration to seconds: `H:MM:SS` or `M:SS`, with an
 * optional decimal fraction (e.g. `3:43.13`). @returns null if not a duration.
 */
function parseDuration(s: string): number | null {
  const m = s.match(/(?:^|\s)(\d{1,2}):([0-5]?\d)(?::([0-5]?\d))?(?:\.(\d+))?/);
  if (!m) {
    return null;
  }
  const first = Number(m[1]);
  const second = Number(m[2]);
  const third = m[3] !== undefined ? Number(m[3]) : null;
  const frac = m[4] !== undefined ? Number(`0.${m[4]}`) : 0;

  return third !== null
    ? first * 3600 + second * 60 + third + frac // H:MM:SS
    : first * 60 + second + frac; // M:SS
}

export function isNumericCell(raw: string | undefined | null): boolean {
  return parseNumericCell(raw) !== null;
}
