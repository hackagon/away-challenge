import { defineFeature, loadFeature } from 'jest-cucumber';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Test } from '@nestjs/testing';
import { ChartPipelineService } from '../../src/core/chart-pipeline.service';
import { PageFetcherService } from '../../src/core/fetcher/page-fetcher.service';
import { PngWriterService } from '../../src/core/chart/png-writer.service';
import { PipelineResult } from '../../src/core/chart-pipeline.service';

const feature = loadFeature(join(__dirname, 'chart-generation.feature'));

/**
 * BDD suite: runs the whole pipeline with only the network faked. SVG + PNG
 * run for real, so a green scenario proves a real image file was written.
 */
defineFeature(feature, (test) => {
  let pipeline: ChartPipelineService;
  let fetcher: { fetchHtml: jest.Mock };
  let outputPath: string;
  let result: PipelineResult;
  let error: Error | undefined;

  const buildPipeline = async () => {
    fetcher = { fetchHtml: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChartPipelineService,
        PngWriterService,
        { provide: PageFetcherService, useValue: fetcher },
      ],
    }).compile();

    pipeline = moduleRef.get(ChartPipelineService);
  };

  beforeEach(async () => {
    error = undefined;
    outputPath = join(
      tmpdir(),
      `wiki-chart-test-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
    );
    await buildPipeline();
  });

  afterEach(async () => {
    await rm(outputPath, { force: true });
  });

  test('Plotting a record-progression table', ({ given, when, then, and }) => {
    given(/a page containing a table with a numeric "(.*)" column/, (columnName: string) => {
      fetcher.fetchHtml.mockResolvedValue(`
        <table class="wikitable">
          <tr><th>${columnName}</th><th>Athlete</th></tr>
          <tr><td>1.85 m</td><td>Jane Doe</td></tr>
          <tr><td>1.90 m</td><td>Mary Roe</td></tr>
          <tr><td>1.97 m</td><td>Ann Smith</td></tr>
        </table>`);
    });

    when('I run the chart pipeline for that page', async () => {
      result = await pipeline.generate('https://example.test/records', outputPath);
    });

    then('a PNG image file is produced', async () => {
      const buffer = await readFile(result.outputPath);
      // PNG magic number: 89 50 4E 47
      expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    });

    and('the chart is titled after the numeric column', () => {
      expect(result.label).toBe('Height (m)');
    });

    and('the chart contains one point per row', () => {
      expect(result.pointCount).toBe(3);
    });
  });

  test('A page with no numeric table', ({ given, when, then }) => {
    given('a page whose only table has no numeric columns', () => {
      fetcher.fetchHtml.mockResolvedValue(`
        <table class="wikitable">
          <tr><th>City</th><th>Country</th></tr>
          <tr><td>Berlin</td><td>Germany</td></tr>
          <tr><td>Paris</td><td>France</td></tr>
        </table>`);
    });

    when('I run the chart pipeline for that page', async () => {
      try {
        result = await pipeline.generate('https://example.test/cities', outputPath);
      } catch (err) {
        error = err as Error;
      }
    });

    then('the pipeline reports that no numeric column was found', () => {
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/No numeric column/);
    });
  });
});
