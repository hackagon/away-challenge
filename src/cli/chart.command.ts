import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { ChartPipelineService } from '../core/chart-pipeline.service';

interface ChartCommandOptions {
  output: string;
}

const DEFAULT_OUTPUT = 'output/chart.png';

/**
 * `wiki-chart chart <url> [-o output.png]`
 *
 * The thin CLI layer: it validates input, delegates all real work to
 * {@link ChartPipelineService}, and turns success/failure into user-friendly
 * console output and exit codes.
 */
@Command({
  name: 'chart',
  arguments: '<url>',
  description: 'Fetch a Wikipedia page, detect a numeric table column and plot it to a PNG.',
})
export class ChartCommand extends CommandRunner {
  private readonly logger = new Logger(ChartCommand.name);

  constructor(private readonly pipeline: ChartPipelineService) {
    super();
  }

  async run(inputs: string[], options: ChartCommandOptions): Promise<void> {
    const [url] = inputs;
    const output = options.output ?? DEFAULT_OUTPUT;

    if (!this.isValidUrl(url)) {
      this.logger.error(`"${url}" is not a valid http(s) URL.`);
      process.exitCode = 1;
      return;
    }

    try {
      const result = await this.pipeline.generate(url, output);
      // Deliberately use console.log for the primary success line so it is easy
      // to consume in scripts, separate from the Nest logger diagnostics.
      console.log(
        `✔ Plotted "${result.label}" (${result.pointCount} points) → ${result.outputPath}`,
      );
    } catch (err) {
      this.logger.error((err as Error).message);
      process.exitCode = 1;
    }
  }

  @Option({
    flags: '-o, --output <path>',
    description: `Output PNG path (default: ${DEFAULT_OUTPUT})`,
  })
  parseOutput(value: string): string {
    return value;
  }

  private isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
