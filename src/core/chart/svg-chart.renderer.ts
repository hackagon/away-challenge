import { Injectable } from '@nestjs/common';
import { NumericSeries } from '../models/table.model';

export interface ChartOptions {
  width: number;
  height: number;
  title: string;
}

const DEFAULTS: ChartOptions = { width: 900, height: 500, title: 'Numeric column' };

/**
 * Renders a {@link NumericSeries} into a standalone SVG line chart string.
 *
 * This is a pure, dependency-free function (no canvas, no DOM): given the same
 * input it always returns the same SVG markup, which makes it fast and reliable
 * to unit-test. Rasterisation to PNG is a separate concern
 * ({@link PngWriterService}).
 */
@Injectable()
export class SvgChartRenderer {
  render(series: NumericSeries, options: Partial<ChartOptions> = {}): string {
    const opts = {
      ...DEFAULTS,
      ...options,
      title: options.title ?? series.label ?? DEFAULTS.title,
    };
    const { width, height } = opts;

    const margin = { top: 60, right: 30, bottom: 50, left: 70 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    const values = series.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Pad a flat series so a single horizontal line is still visible.
    const range = max - min || Math.abs(max) || 1;

    const x = (i: number): number =>
      margin.left + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
    const y = (v: number): number => margin.top + plotH - ((v - min) / range) * plotH;

    const linePath = values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
      .join(' ');

    const points = values
      .map(
        (v, i) => `<circle cx="${x(i).toFixed(2)}" cy="${y(v).toFixed(2)}" r="3" fill="#2563eb" />`,
      )
      .join('');

    const yTicks = this.buildYAxis(min, max, margin.left, plotW, y);
    const xLabel = `${values.length} points`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, Helvetica, sans-serif">
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <text x="${width / 2}" y="32" text-anchor="middle" font-size="20" font-weight="bold" fill="#111827">${this.escape(
    opts.title,
  )}</text>
  ${yTicks}
  <path d="${linePath}" fill="none" stroke="#2563eb" stroke-width="2" />
  ${points}
  <text x="${margin.left + plotW / 2}" y="${height - 12}" text-anchor="middle" font-size="13" fill="#6b7280">${xLabel}</text>
</svg>`;
  }

  /** Build horizontal grid lines + y-axis value labels. */
  private buildYAxis(
    min: number,
    max: number,
    left: number,
    plotW: number,
    y: (v: number) => number,
  ): string {
    const ticks = 5;
    const parts: string[] = [];
    for (let t = 0; t <= ticks; t++) {
      const value = min + ((max - min) * t) / ticks;
      const yy = y(value).toFixed(2);
      parts.push(
        `<line x1="${left}" y1="${yy}" x2="${left + plotW}" y2="${yy}" stroke="#e5e7eb" stroke-width="1" />`,
        `<text x="${left - 10}" y="${yy}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="#6b7280">${this.formatTick(
          value,
        )}</text>`,
      );
    }
    return parts.join('');
  }

  private formatTick(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  /** Escape the few characters that would break XML text content. */
  private escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
