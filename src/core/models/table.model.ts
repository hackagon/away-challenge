/** Plain data models shared across the pipeline stages. */

/** A table normalised into headers + raw string rows (numbers parsed later). */
export interface ExtractedTable {
  /** Column header labels, in order. May be empty if the table had no header row. */
  headers: string[];
  /** Body rows; each row is an array of cell text aligned to `headers` by index. */
  rows: string[][];
}

/** The chosen numeric column: its label plus parsed values in row order. */
export interface NumericSeries {
  /** Human-readable column label (from the header, or a generated fallback). */
  label: string;
  /** Parsed numeric values in the order they appeared in the table. */
  values: number[];
}
