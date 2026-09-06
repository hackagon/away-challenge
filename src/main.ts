import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

/**
 * CLI entry point. `nest-commander`'s CommandFactory boots a lightweight Nest
 * application context (no HTTP server) and dispatches to the matching command.
 * We limit Nest's own log levels so the CLI output stays clean.
 */
async function bootstrap(): Promise<void> {
  await CommandFactory.run(AppModule, ['warn', 'error', 'log']);
}

void bootstrap();
