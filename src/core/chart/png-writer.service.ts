import { Injectable } from '@nestjs/common';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

/**
 * Rasterises an SVG string to a PNG file — the pipeline's only file write.
 * Uses `sharp` (prebuilt binaries, no native build step, unlike node-canvas).
 */
@Injectable()
export class PngWriterService {
  /** @returns the absolute path of the written PNG (dirs created as needed). */
  async write(svg: string, outputPath: string): Promise<string> {
    const absolute = resolve(outputPath);
    await mkdir(dirname(absolute), { recursive: true });
    await sharp(Buffer.from(svg)).png().toFile(absolute);
    return absolute;
  }
}
