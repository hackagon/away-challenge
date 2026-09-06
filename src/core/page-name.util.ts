/**
 * Derive a human title and a filesystem-safe slug from a Wikipedia URL, using
 * the last path segment (e.g. `.../wiki/Marathon_world_record_progression`).
 */

/** `.../wiki/Marathon_world_record_progression` -> `Marathon world record progression`. */
export function pageTitleFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop();
    if (!segment) {
      return 'chart';
    }
    return decodeURIComponent(segment).replace(/_/g, ' ').trim() || 'chart';
  } catch {
    return 'chart';
  }
}

/** Same source, sanitised for a filename: `Marathon_world_record_progression`. */
export function slugFromUrl(url: string): string {
  return (
    pageTitleFromUrl(url)
      .replace(/[^\w.-]+/g, '_') // non-word chars -> underscore
      .replace(/^_+|_+$/g, '') || 'chart'
  );
}
