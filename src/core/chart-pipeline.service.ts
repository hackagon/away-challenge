import { Injectable, Logger } from '@nestjs/common';
import { PageFetcherService } from './fetcher/page-fetcher.service';
import { TableParserService } from './parser/table-parser.service';
import { NumericColumnSelectorService } from './parser/numeric-column-selector.service';
import { SvgChartRenderer } from './chart/svg-chart.renderer';
import { PngWriterService } from './chart/png-writer.service';
import { pageTitleFromUrl } from './page-name.util';

export interface PipelineResult {
  outputPath: string;
  label: string;
  pointCount: number;
}

export interface GenerateOptions {
  /** Override the auto-detected column, matched by header (case-insensitive). */
  column?: string;
}

/**
 * Orchestrates the flow: fetch HTML → parse tables → select numeric column →
 * render SVG → write PNG. Each step is a single-responsibility collaborator;
 * covered end-to-end by the BDD feature.
 */
@Injectable()
export class ChartPipelineService {
  private readonly logger = new Logger(ChartPipelineService.name);

  constructor(
    private readonly fetcher: PageFetcherService,
    private readonly pngWriter: PngWriterService,
  ) {}

  async generate(
    url: string,
    outputPath: string,
    options: GenerateOptions = {},
  ): Promise<PipelineResult> {
    this.logger.log(`Fetching ${url}`);
    const html = await this.fetcher.fetchHtml(url);

    const tables = TableParserService.parse(html);
    this.logger.log(`Found ${tables.length} table(s)`);
    if (tables.length === 0) {
      throw new Error('No tables found on the page.');
    }

    const series = NumericColumnSelectorService.select(tables, options.column);
    this.logger.log(`Selected column "${series.label}" with ${series.values.length} value(s)`);

    // Title the chart after the page (from the URL) plus the plotted column.
    const pageTitle = pageTitleFromUrl(url);
    const title = pageTitle === 'chart' ? series.label : `${pageTitle} — ${series.label}`;

    const svg = SvgChartRenderer.render(series, { title });
    const absolutePath = await this.pngWriter.write(svg, outputPath);
    this.logger.log(`Wrote chart to ${absolutePath}`);

    return { outputPath: absolutePath, label: series.label, pointCount: series.values.length };
  }
}
