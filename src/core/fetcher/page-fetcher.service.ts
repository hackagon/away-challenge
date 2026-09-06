import { Injectable } from '@nestjs/common';

/**
 * Fetches raw HTML for a URL via the Node global `fetch` (Node 18+).
 * Isolated as a service so the network boundary can be mocked in tests.
 */
@Injectable()
export class PageFetcherService {
  /**
   * @throws Error on non-2xx responses or network failures.
   */
  async fetchHtml(url: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          // Wikipedia rejects requests without a descriptive User-Agent.
          'User-Agent': 'wiki-table-charter/1.0 (engineering-challenge)',
        },
      });
    } catch (err) {
      throw new Error(`Failed to fetch "${url}": ${(err as Error).message}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch "${url}": HTTP ${response.status} ${response.statusText}`);
    }

    return response.text();
  }
}
