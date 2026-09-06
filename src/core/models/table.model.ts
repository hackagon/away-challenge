/**
 * Domain models shared across the pipeline.
 *
 * These are intentionally plain data structures (no behaviour) so that every
 * stage of the pipeline can be unit-tested in isolation with simple fixtures.
 */

/**
 * A table extracted from an HTML page, normalised into headers + string rows.
 * Cells are kept as raw strings at this stage; numeric interpretation happens
 * later in the {@link NumericColumnSelectorService}.
 */
export interface ExtractedTable {
  /** Column header labels, in order. May be empty if the table had no header row. */
  headers: string[];
  /** Body rows; each row is an array of cell text aligned to `headers` by index. */
  rows: string[][];
}

/**
 * The numeric column chosen for plotting, together with the label used to title
 * the chart and the parsed values in row order.
 */
export interface NumericSeries {
  /** Human-readable column label (from the header, or a generated fallback). */
  label: string;
  /** Parsed numeric values in the order they appeared in the table. */
  values: number[];
}
