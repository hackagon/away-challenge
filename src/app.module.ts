import { Module } from '@nestjs/common';
import { ChartCommand } from './cli/chart/chart.command';
import { ChartPipelineService } from './core/chart-pipeline.service';
import { PageFetcherService } from './core/fetcher/page-fetcher.service';
import { PngWriterService } from './core/chart/png-writer.service';

/**
 * Root module: DI wiring for the CLI command and the async/IO services.
 * The pure parsing/rendering helpers are static classes, so they need no
 * provider registration.
 */
@Module({
  providers: [ChartCommand, ChartPipelineService, PageFetcherService, PngWriterService],
})
export class AppModule {}
