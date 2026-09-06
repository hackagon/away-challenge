import { Module } from '@nestjs/common';
import { ChartCommand } from './cli/chart.command';
import { ChartPipelineService } from './core/chart-pipeline.service';
import { PageFetcherService } from './core/fetcher/page-fetcher.service';
import { TableParserService } from './core/parser/table-parser.service';
import { NumericColumnSelectorService } from './core/parser/numeric-column-selector.service';
import { SvgChartRenderer } from './core/chart/svg-chart.renderer';
import { PngWriterService } from './core/chart/png-writer.service';

/** Root module: DI wiring for the CLI command, pipeline and collaborators. */
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
