import { SvgChartRenderer } from './svg-chart.renderer';

describe('SvgChartRenderer', () => {
  it('produces a well-formed SVG document', () => {
    const svg = SvgChartRenderer.render({ label: 'Height', values: [1, 2, 3] });
    expect(svg).toContain('<svg');
    expect(svg.trim().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 900 500"');
  });

  it('uses the series label as the default title', () => {
    const svg = SvgChartRenderer.render({ label: 'World Record (m)', values: [1, 2] });
    expect(svg).toContain('World Record (m)');
  });

  it('draws one point marker per value', () => {
    const svg = SvgChartRenderer.render({ label: 'V', values: [1, 2, 3, 4] });
    const circles = svg.match(/<circle /g) ?? [];
    expect(circles).toHaveLength(4);
  });

  it('escapes XML-significant characters in the title', () => {
    const svg = SvgChartRenderer.render({ label: 'A & B < C', values: [1, 2] });
    expect(svg).toContain('A &amp; B &lt; C');
  });

  it('handles a flat (constant) series without dividing by zero', () => {
    const svg = SvgChartRenderer.render({ label: 'Flat', values: [5, 5, 5] });
    expect(svg).not.toContain('NaN');
  });

  it('honours custom dimensions', () => {
    const svg = SvgChartRenderer.render(
      { label: 'V', values: [1, 2] },
      { width: 400, height: 300 },
    );
    expect(svg).toContain('viewBox="0 0 400 300"');
  });
});
