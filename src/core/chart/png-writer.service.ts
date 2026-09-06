import { Injectable } from '@nestjs/common';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

/**
 * Rasterises an SVG string to a PNG file on disk.
 *
 * `sharp` ships prebuilt binaries, so there is no native compilation step
 * (unlike node-canvas). This is the only file-writing side effect in the
 * pipeline, isolated here so the rest stays pure and easy to test.
 */
@Injectable()
export class PngWriterService {
  /**
   * @param svg        SVG markup produced by {@link SvgChartRenderer}.
   * @param outputPath Destination path (relative paths resolve against cwd).
   * @returns the absolute path of the written PNG.
   */
  async write(svg: string, outputPath: string): Promise<string> {
    const absolute = resolve(outputPath);
    await mkdir(dirname(absolute), { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(absolute);
    return absolute;
  }
}
