import { getCollection, type CollectionEntry } from 'astro:content';

/** Site-wide lab order: flagship, then routing, Layer 2 and security, services, firewalls. */
export const CATEGORY_ORDER = ['campus', 'routing', 'security', 'services', 'firewall'] as const;

export type Lab = CollectionEntry<'labs'>;

export function sortLabs(labs: Lab[]): Lab[] {
  return [...labs].sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.data.categorySlug);
    const cb = CATEGORY_ORDER.indexOf(b.data.categorySlug);
    return ca === cb ? a.data.order - b.data.order : ca - cb;
  });
}

export async function getLabs(): Promise<Lab[]> {
  return sortLabs(await getCollection('labs'));
}
