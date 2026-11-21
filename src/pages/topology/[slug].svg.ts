/**
 * Standalone topology SVGs (light palette, icons embedded as data URIs) for thumbnails:
 * the hero tunnel, the lab-row hover preview and the folder papers. Built at build time.
 */
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { topologies } from '../../data/topologies';
import { renderSvg } from '../../lib/topology';
import { getLabs } from '../../lib/labs';

export async function getStaticPaths() {
  const labs = await getLabs();
  return Object.keys(topologies).map((slug) => ({
    params: { slug },
    props: { title: labs.find((l) => l.id === slug)?.data.name ?? slug },
  }));
}

const ICON_DIR = path.resolve('src/assets/topology-icons');
const cache = new Map<string, string>();
async function icon(name: string) {
  if (!cache.has(name)) {
    const buf = await sharp(path.join(ICON_DIR, `${name}.png`)).resize(120).webp({ quality: 88 }).toBuffer();
    cache.set(name, `data:image/webp;base64,${buf.toString('base64')}`);
  }
  return cache.get(name)!;
}

export const GET: APIRoute = async ({ params, props }) => {
  const topo = topologies[params.slug!];
  const icons: Record<string, string> = {};
  for (const n of new Set(topo.nodes.map((x) => x.icon))) icons[n] = await icon(n);
  await fs.access(ICON_DIR);
  const svg = renderSvg(topo, { title: props.title as string, icons, standalone: true, legend: false });
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
