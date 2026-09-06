import { pageTitleFromUrl, slugFromUrl } from './page-name.util';

describe('pageTitleFromUrl', () => {
  it('extracts a readable title from a Wikipedia URL', () => {
    expect(
      pageTitleFromUrl('https://en.wikipedia.org/wiki/Marathon_world_record_progression'),
    ).toBe('Marathon world record progression');
  });

  it('decodes percent-encoded characters', () => {
    expect(
      pageTitleFromUrl(
        'https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression',
      ),
    ).toBe("Women's high jump world record progression");
  });

  it('falls back to "chart" for an unusable URL', () => {
    expect(pageTitleFromUrl('not a url')).toBe('chart');
    expect(pageTitleFromUrl('https://en.wikipedia.org/')).toBe('chart');
  });
});

describe('slugFromUrl', () => {
  it('produces a filesystem-safe slug', () => {
    expect(slugFromUrl('https://en.wikipedia.org/wiki/Marathon_world_record_progression')).toBe(
      'Marathon_world_record_progression',
    );
  });

  it('replaces unsafe characters (e.g. apostrophes)', () => {
    expect(
      slugFromUrl('https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression'),
    ).toBe('Women_s_high_jump_world_record_progression');
  });
});
