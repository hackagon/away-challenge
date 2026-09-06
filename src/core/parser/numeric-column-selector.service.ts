import { Injectable } from '@nestjs/common';
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
 * Chooses the best numeric column across all extracted tables to plot.
 *
 * "Best" = the column with the most parseable numeric values (ties broken by
 * the higher numeric ratio). This is a pragmatic heuristic that works well for
 * the record-progression style tables in the brief without hard-coding column
 * names — see SOLUTION.md, "How the numeric column is chosen".
 */
@Injectable()
export class NumericColumnSelectorService {
  /**
   * @throws Error when no column across any table is sufficiently numeric.
   */
  select(tables: ExtractedTable[]): NumericSeries {
    const candidates = tables.flatMap((table) => this.candidatesFor(table));

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

  /** Build one candidate per column of a single table. */
  private candidatesFor(table: ExtractedTable): ColumnCandidate[] {
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
