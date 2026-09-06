/**
 * Pure numeric-parsing helpers.
 *
 * Wikipedia table cells are messy: they contain footnote markers (`[1]`, `†`),
 * thousands separators, units (`1.85 m`, `2,050 kg`), ranges and non-breaking
 * spaces. This module isolates the "turn a cell into a number (or not)" logic
 * so it can be exhaustively unit-tested — it is the heart of numeric-column
 * detection.
 */

/**
 * Attempt to parse the leading numeric quantity out of a raw table cell.
 *
 * Strategy (deliberately conservative — see SOLUTION.md, "Assumptions"):
 *  - strip footnote markers like `[1]`, `[a]`, `†`, `‡`, `*`;
 *  - normalise unicode minus / non-breaking spaces;
 *  - remove thousands separators (commas);
 *  - extract the first number-looking token (optionally signed / decimal),
 *    which naturally drops trailing units such as ` m` or ` kg`.
 *
 * @returns the parsed number, or `null` when the cell has no usable value.
 */
export function parseNumericCell(raw: string | undefined | null): number | null {
  if (raw == null) {
    return null;
  }

  const cleaned = raw
    // Drop bracketed footnotes: [1], [a], [note 2]
    .replace(/\[[^\]]*\]/g, '')
    // Drop common footnote/typographic symbols
    .replace(/[†‡*]/g, '')
    // Normalise unicode minus and non-breaking / thin spaces
    .replace(/−/g, '-')
    .replace(/[   ]/g, ' ')
    // Remove thousands separators between digits: 2,050 -> 2050
    .replace(/(\d),(\d)/g, '$1$2')
    .trim();

  // Grab the first signed decimal number in the string. This tolerates leading
  // labels and trailing units, e.g. "approx. 1.85 m" -> 1.85.
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

/**
 * @returns true when the cell parses to a finite number.
 */
export function isNumericCell(raw: string | undefined | null): boolean {
  return parseNumericCell(raw) !== null;
}
