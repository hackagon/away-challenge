import { Module } from '@nestjs/common';
import { ChartCommand } from './cli/chart.command';
import { ChartPipelineService } from './core/chart-pipeline.service';
import { PageFetcherService } from './core/fetcher/page-fetcher.service';
import { TableParserService } from './core/parser/table-parser.service';
import { NumericColumnSelectorService } from './core/parser/numeric-column-selector.service';
import { SvgChartRenderer } from './core/chart/svg-chart.renderer';
import { PngWriterService } from './core/chart/png-writer.service';

/**
 * Root module wiring the CLI command to the pipeline and its collaborators.
 * Nest's DI container manages construction, which keeps every unit testable in
 * isolation (each dependency can be swapped for a mock).
 */
@Module({
  providers: [
    ChartCommand,
    ChartPipelineService,
    PageFetcherService,
    TableParserService,
    NumericColumnSelectorService,
    SvgChartRenderer,
    PngWriterService,
  ],
})
export class AppModule {}
