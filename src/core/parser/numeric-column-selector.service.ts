import { ExtractedTable, NumericSeries } from '../models/table.model';
import { parseNumericCell } from './number.util';

/** Minimum share of a column's cells that must be numeric to consider it. */
const NUMERIC_RATIO_THRESHOLD = 0.6;
/** Minimum number of points needed to make a meaningful chart. */
const MIN_POINTS = 2;

interface ColumnCandidate {
  label: string;
  values: number[];
  /** Fraction of body rows that parsed to a number (0..1). */
  ratio: number;
}

/**
 * Picks a numeric column to plot. By default it auto-detects the column with
 * the most parseable values across all tables (ties broken by the higher
 * ratio). A caller may instead name a column to override the heuristic.
 * See SOLUTION.md for details.
 *
 * Pure and stateless, so it is a static utility class (no DI needed).
 */
export class NumericColumnSelectorService {
  /**
   * @param requestedColumn optional header to match (case-insensitive); when
   *   given, that column is used even if it is not the "most numeric".
   * @throws Error when no suitable numeric column is found.
   */
  static select(tables: ExtractedTable[], requestedColumn?: string): NumericSeries {
    const candidates = tables.flatMap((table) => this.candidatesFor(table));

    if (requestedColumn) {
      return this.selectByName(candidates, requestedColumn);
    }

    const viable = candidates.filter(
      (c) => c.values.length >= MIN_POINTS && c.ratio >= NUMERIC_RATIO_THRESHOLD,
    );

    if (viable.length === 0) {
      throw new Error(
        'No numeric column found. The page may not contain a table with a plottable numeric column.',
      );
    }

    // Most data points wins; break ties on the cleaner (more numeric) column.
    viable.sort((a, b) => b.values.length - a.values.length || b.ratio - a.ratio);

    const best = viable[0];
    return { label: best.label, values: best.values };
  }

  /**
   * Resolve an explicitly requested column. Matches the header case-insensitively
   * (exact first, then substring). The ratio threshold is waived — the caller
   * asked for this column — but it must still hold at least {@link MIN_POINTS}
   * numeric values to be plottable.
   */
  private static selectByName(candidates: ColumnCandidate[], requested: string): NumericSeries {
    const norm = requested.trim().toLowerCase();
    const exact = candidates.filter((c) => c.label.toLowerCase() === norm);
    const matched =
      exact.length > 0 ? exact : candidates.filter((c) => c.label.toLowerCase().includes(norm));

    const plottable = matched.filter((c) => c.values.length >= MIN_POINTS);
    if (plottable.length === 0) {
      const available = [
        ...new Set(candidates.filter((c) => c.values.length >= MIN_POINTS).map((c) => c.label)),
      ];
      throw new Error(
        `Column "${requested}" not found or not numeric. ` +
          `Available numeric columns: ${available.join(', ') || '(none)'}.`,
      );
    }

    plottable.sort((a, b) => b.values.length - a.values.length || b.ratio - a.ratio);
    return { label: plottable[0].label, values: plottable[0].values };
  }

  /** Build one candidate per column of a single table. */
  private static candidatesFor(table: ExtractedTable): ColumnCandidate[] {
    const columnCount = Math.max(0, ...table.rows.map((r) => r.length));
    const candidates: ColumnCandidate[] = [];

    for (let col = 0; col < columnCount; col++) {
      const values: number[] = [];
      let seen = 0;

      for (const row of table.rows) {
        if (col >= row.length) {
          continue;
        }
        seen++;
        const value = parseNumericCell(row[col]);
        if (value !== null) {
          values.push(value);
        }
      }

      const ratio = seen === 0 ? 0 : values.length / seen;
      candidates.push({
        label: table.headers[col]?.trim() || `Column ${col + 1}`,
        values,
        ratio,
      });
    }

    return candidates;
  }
}
