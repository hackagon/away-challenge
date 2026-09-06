/**
 * Pure numeric-parsing helpers — the heart of numeric-column detection.
 *
 * Wikipedia cells are messy: footnotes (`[1]`, `†`), units (`1.85 m`),
 * separators (`2,050`), unicode minus and non-breaking spaces.
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

  // First signed decimal token; tolerates leading labels / trailing units.
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function isNumericCell(raw: string | undefined | null): boolean {
  return parseNumericCell(raw) !== null;
}
