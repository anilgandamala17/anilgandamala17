/** Slug / key helpers for topic visual resolution. */

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function hashKey(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickVariant(
  variants: readonly string[],
  seedKey: string,
): string {
  if (!variants.length) return 'a';
  return variants[hashKey(seedKey) % variants.length];
}

export function combineHaystack(
  chapterName: string,
  topicName: string,
  subjectId: string,
): string {
  return `${subjectId} ${chapterName} ${topicName}`.toLowerCase();
}
