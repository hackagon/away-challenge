import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { ChartPipelineService } from '../core/chart-pipeline.service';
import { slugFromUrl } from '../core/page-name.util';

interface ChartCommandOptions {
  output?: string;
  column?: string;
}

/**
 * `chart <url> [-o output.png] [-c column]` — thin CLI layer: validate input,
 * delegate to {@link ChartPipelineService}, map success/failure to output and
 * exit codes.
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

    if (!this.isValidUrl(url)) {
      this.logger.error(`"${url}" is not a valid http(s) URL.`);
      process.exitCode = 1;
      return;
    }

    // Default the filename to the page name from the URL, e.g. output/Marathon_world_record_progression.png
    const output = options.output ?? `output/${slugFromUrl(url)}.png`;

    try {
      const result = await this.pipeline.generate(url, output, { column: options.column });
      // console.log (not the logger) keeps the result line clean for scripts.
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
    description: 'Output PNG path (default: output/<page-name>.png)',
  })
  parseOutput(value: string): string {
    return value;
  }

  @Option({
    flags: '-c, --column <name>',
    description: 'Plot this column instead of auto-detecting (matched by header, case-insensitive)',
  })
  parseColumn(value: string): string {
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
