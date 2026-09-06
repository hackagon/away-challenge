import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { ExtractedTable } from '../models/table.model';

/**
 * Extracts HTML `<table>` elements into normalised {@link ExtractedTable} data.
 *
 * Kept free of network/file concerns: it takes an HTML string and returns plain
 * data, so it is trivially unit-testable with inline HTML fixtures.
 *
 * The parser handles two pieces of real-world messiness that broke a naive
 * positional read of Wikipedia tables (see SOLUTION.md, "Assumptions"):
 *  - `rowspan` / `colspan` merged cells, which otherwise shift later columns and
 *    let e.g. a date leak into a numeric "height" column;
 *  - inline `<style>`/`<script>` nodes, whose text `.text()` would otherwise
 *    splice into the cell value.
 */
@Injectable()
export class TableParserService {
  /**
   * Parse every top-level table in the document into headers + rows.
   *
   * Prefers Wikipedia's `wikitable` class when present, otherwise falls back to
   * all `<table>` elements so the tool works on arbitrary pages.
   */
  parse(html: string): ExtractedTable[] {
    const $ = cheerio.load(html);

    const wikitables = $('table.wikitable');
    const tables = wikitables.length > 0 ? wikitables : $('table');

    const result: ExtractedTable[] = [];

    tables.each((_, tableEl) => {
      const $table = $(tableEl);

      // Skip tables nested inside another table cell to avoid double counting.
      if ($table.parents('table').length > 0) {
        return;
      }

      const trs = $table.find('tr').toArray() as Element[];

      // The header is the first row that is entirely <th> cells (if any).
      const headerIndex = trs.findIndex((tr) => {
        const $tr = $(tr);
        return $tr.find('th').length > 0 && $tr.find('td').length === 0;
      });

      const headers =
        headerIndex >= 0 ? this.expandRow($, trs[headerIndex]).map((c) => c.text) : [];

      const bodyRows = trs.filter((_tr, i) => i !== headerIndex);
      const rows = this.buildMatrix($, bodyRows);

      if (rows.length > 0) {
        result.push({ headers, rows });
      }
    });

    return result;
  }

  /**
   * Build a rectangular string matrix from body rows, expanding `rowspan` and
   * `colspan` so every logical column lines up across rows.
   *
   * Algorithm: walk cells left-to-right, skipping grid positions already claimed
   * by a span from an earlier cell, and paint each cell's text across all the
   * (col × row) positions it occupies.
   */
  private buildMatrix($: cheerio.CheerioAPI, rows: Element[]): string[][] {
    const matrix: string[][] = [];

    rows.forEach((tr, rowIdx) => {
      const target = (matrix[rowIdx] ??= []);
      let col = 0;

      for (const cell of this.expandRow($, tr)) {
        // Advance past columns already filled by a rowspan from above.
        while (target[col] !== undefined) {
          col++;
        }

        for (let c = 0; c < cell.colspan; c++) {
          for (let r = 0; r < cell.rowspan; r++) {
            (matrix[rowIdx + r] ??= [])[col + c] = cell.text;
          }
        }
        col += cell.colspan;
      }
    });

    // Normalise ragged rows: replace holes with '' so column indexes are stable.
    const width = Math.max(0, ...matrix.map((r) => r.length));
    return matrix.map((row) => {
      const filled = Array.from({ length: width }, (_, i) => row[i] ?? '');
      return filled;
    });
  }

  /** Read a row's cells with their span metadata (does not apply rowspan yet). */
  private expandRow(
    $: cheerio.CheerioAPI,
    tr: Element,
  ): { text: string; colspan: number; rowspan: number }[] {
    const cells: { text: string; colspan: number; rowspan: number }[] = [];
    $(tr)
      .find('th, td')
      .each((_, cell) => {
        cells.push({
          text: this.cellText($, cell),
          colspan: this.spanAttr($, cell, 'colspan'),
          rowspan: this.spanAttr($, cell, 'rowspan'),
        });
      });
    return cells;
  }

  private spanAttr($: cheerio.CheerioAPI, el: AnyNode, name: 'colspan' | 'rowspan'): number {
    const raw = parseInt($(el).attr(name) ?? '1', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }

  /** Collapse whitespace and trim a cell's text, ignoring style/script nodes. */
  private cellText($: cheerio.CheerioAPI, el: AnyNode): string {
    return $(el).clone().find('style, script').remove().end().text().replace(/\s+/g, ' ').trim();
  }
}
