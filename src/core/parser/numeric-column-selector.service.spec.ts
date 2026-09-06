import { NumericColumnSelectorService } from './numeric-column-selector.service';
import { ExtractedTable } from '../models/table.model';

describe('NumericColumnSelectorService', () => {
  let service: NumericColumnSelectorService;

  beforeEach(() => {
    service = new NumericColumnSelectorService();
  });

  it('picks the numeric column and ignores text columns', () => {
    const table: ExtractedTable = {
      headers: ['Athlete', 'Height', 'Year'],
      rows: [
        ['Jane Doe', '1.85 m', '1980'],
        ['Mary Roe', '1.90 m', '1982'],
        ['Ann Smith', '1.97 m', '1985'],
      ],
    };

    const series = service.select([table]);
    // "Height" and "Year" are both numeric with 3 points each; the tie is
    // broken by ratio (both 1.0), so the first numeric column ("Height") wins.
    expect(series.label).toBe('Height');
    expect(series.values).toEqual([1.85, 1.9, 1.97]);
  });

  it('prefers the column with the most numeric values across tables', () => {
    const small: ExtractedTable = {
      headers: ['V'],
      rows: [['1'], ['2']],
    };
    const large: ExtractedTable = {
      headers: ['W'],
      rows: [['10'], ['20'], ['30'], ['40']],
    };

    const series = service.select([small, large]);
    expect(series.label).toBe('W');
    expect(series.values).toEqual([10, 20, 30, 40]);
  });

  it('generates a fallback label when the header is missing', () => {
    const table: ExtractedTable = {
      headers: [],
      rows: [['5'], ['6'], ['7']],
    };

    const series = service.select([table]);
    expect(series.label).toBe('Column 1');
    expect(series.values).toEqual([5, 6, 7]);
  });

  it('throws when no sufficiently numeric column exists', () => {
    const table: ExtractedTable = {
      headers: ['City', 'Country'],
      rows: [
        ['Berlin', 'Germany'],
        ['Paris', 'France'],
      ],
    };

    expect(() => service.select([table])).toThrow(/No numeric column/);
  });
});
