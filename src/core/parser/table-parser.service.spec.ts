import { TableParserService } from './table-parser.service';

describe('TableParserService', () => {
  it('extracts headers and rows from a wikitable', () => {
    const html = `
      <table class="wikitable">
        <tr><th>Height</th><th>Athlete</th></tr>
        <tr><td>1.85 m</td><td>Jane Doe</td></tr>
        <tr><td>1.90 m</td><td>Mary Roe</td></tr>
      </table>`;

    const [table] = TableParserService.parse(html);
    expect(table.headers).toEqual(['Height', 'Athlete']);
    expect(table.rows).toEqual([
      ['1.85 m', 'Jane Doe'],
      ['1.90 m', 'Mary Roe'],
    ]);
  });

  it('collapses whitespace inside cells', () => {
    const html = `<table><tr><td>  1.85\n   m </td></tr></table>`;
    const [table] = TableParserService.parse(html);
    expect(table.rows[0][0]).toBe('1.85 m');
  });

  it('returns an empty array when there are no tables', () => {
    expect(TableParserService.parse('<p>no tables here</p>')).toEqual([]);
  });

  it('parses multiple tables', () => {
    const html = `
      <table><tr><td>1</td></tr></table>
      <table><tr><td>2</td></tr></table>`;
    expect(TableParserService.parse(html)).toHaveLength(2);
  });

  it('strips inline <style>/<script> leaked into a cell', () => {
    const html = `
      <table><tr><td>1.482 m<style>.frac{font-size:80%}</style></td></tr></table>`;
    const [table] = TableParserService.parse(html);
    expect(table.rows[0][0]).toBe('1.482 m');
  });

  it('expands rowspan so later rows keep column alignment', () => {
    // Mark spans 2 rows, so the 2nd <tr> lists only Athlete. Without expansion
    // "Bob" would land in the Mark column; with it, both rows share "1.85".
    const html = `
      <table>
        <tr><th>Mark</th><th>Athlete</th></tr>
        <tr><td rowspan="2">1.85</td><td>Alice</td></tr>
        <tr><td>Bob</td></tr>
        <tr><td>1.90</td><td>Carol</td></tr>
      </table>`;
    const [table] = TableParserService.parse(html);
    expect(table.rows).toEqual([
      ['1.85', 'Alice'],
      ['1.85', 'Bob'],
      ['1.90', 'Carol'],
    ]);
  });

  it('expands colspan across columns', () => {
    const html = `
      <table>
        <tr><td colspan="2">wide</td><td>3</td></tr>
        <tr><td>a</td><td>b</td><td>c</td></tr>
      </table>`;
    const [table] = TableParserService.parse(html);
    expect(table.rows[0]).toEqual(['wide', 'wide', '3']);
    expect(table.rows[1]).toEqual(['a', 'b', 'c']);
  });
});
