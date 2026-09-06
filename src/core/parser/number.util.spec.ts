import { isNumericCell, parseNumericCell } from './number.util';

describe('parseNumericCell', () => {
  it('parses a plain integer', () => {
    expect(parseNumericCell('42')).toBe(42);
  });

  it('parses a decimal', () => {
    expect(parseNumericCell('1.85')).toBe(1.85);
  });

  it('strips a trailing unit', () => {
    expect(parseNumericCell('1.85 m')).toBe(1.85);
  });

  it('removes thousands separators', () => {
    expect(parseNumericCell('2,050')).toBe(2050);
  });

  it('drops footnote markers in brackets', () => {
    expect(parseNumericCell('1.97[1]')).toBe(1.97);
    expect(parseNumericCell('12[note 3]')).toBe(12);
  });

  it('drops dagger/asterisk footnotes', () => {
    expect(parseNumericCell('1.90†')).toBe(1.9);
    expect(parseNumericCell('5*')).toBe(5);
  });

  it('normalises a unicode minus sign', () => {
    expect(parseNumericCell('−3')).toBe(-3);
  });

  it('handles non-breaking spaces around units', () => {
    expect(parseNumericCell('2,050 kg')).toBe(2050);
  });

  it('returns null for non-numeric text', () => {
    expect(parseNumericCell('Berlin')).toBeNull();
  });

  it('returns null for empty / nullish input', () => {
    expect(parseNumericCell('')).toBeNull();
    expect(parseNumericCell(undefined)).toBeNull();
    expect(parseNumericCell(null)).toBeNull();
  });
});

describe('isNumericCell', () => {
  it('is true for numeric cells and false otherwise', () => {
    expect(isNumericCell('1.85 m')).toBe(true);
    expect(isNumericCell('n/a')).toBe(false);
  });
});
