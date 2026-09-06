import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

/**
 * CLI entry point: CommandFactory boots a Nest context (no HTTP server) and
 * dispatches to the matching command.
 */
async function bootstrap(): Promise<void> {
  await CommandFactory.run(AppModule, ['warn', 'error', 'log']);
}

void bootstrap();
