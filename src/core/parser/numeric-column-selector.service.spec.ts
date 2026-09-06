import { NumericColumnSelectorService } from './numeric-column-selector.service';
import { ExtractedTable } from '../models/table.model';

describe('NumericColumnSelectorService', () => {
  it('picks the numeric column and ignores text columns', () => {
    const table: ExtractedTable = {
      headers: ['Athlete', 'Height', 'Year'],
      rows: [
        ['Jane Doe', '1.85 m', '1980'],
        ['Mary Roe', '1.90 m', '1982'],
        ['Ann Smith', '1.97 m', '1985'],
      ],
    };

    const series = NumericColumnSelectorService.select([table]);
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

    const series = NumericColumnSelectorService.select([small, large]);
    expect(series.label).toBe('W');
    expect(series.values).toEqual([10, 20, 30, 40]);
  });

  it('generates a fallback label when the header is missing', () => {
    const table: ExtractedTable = {
      headers: [],
      rows: [['5'], ['6'], ['7']],
    };

    const series = NumericColumnSelectorService.select([table]);
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

    expect(() => NumericColumnSelectorService.select([table])).toThrow(/No numeric column/);
  });

  describe('with an explicitly requested column', () => {
    const table: ExtractedTable = {
      headers: ['Year', 'Wins', 'Losses'],
      rows: [
        ['1990', '30', '20'],
        ['1991', '45', '10'],
        ['1992', '25', '30'],
      ],
    };

    it('uses the named column even when another has as many points', () => {
      const series = NumericColumnSelectorService.select([table], 'Wins');
      expect(series.label).toBe('Wins');
      expect(series.values).toEqual([30, 45, 25]);
    });

    it('matches the header case-insensitively', () => {
      expect(NumericColumnSelectorService.select([table], 'losses').label).toBe('Losses');
    });

    it('matches on a substring when there is no exact match', () => {
      expect(NumericColumnSelectorService.select([table], 'Loss').label).toBe('Losses');
    });

    it('throws with the list of available columns when not found', () => {
      expect(() => NumericColumnSelectorService.select([table], 'Points')).toThrow(
        /Available numeric columns: Year, Wins, Losses/,
      );
    });
  });
});
