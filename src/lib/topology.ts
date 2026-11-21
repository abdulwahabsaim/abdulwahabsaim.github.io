/**
 * Topology renderer: turns a spec (src/data/topologies.ts) into an SVG string.
 *
 * One renderer, two outputs:
 *  - inline in pages (components/Topology.astro), themed live by the site's CSS variables
 *  - standalone files (pages/topology/[slug].svg.ts) for thumbnails, with a fixed light palette
 *
 * Layout runs a greedy collision-aware placement pass: node names, badges, link labels and
 * port pills each try several candidate positions and keep the one that overlaps least with
 * icons, other text, zone titles and other links. A spec's `lp` / `lt` are preferences.
 */
import type { Topology, LinkKind } from '../data/topologies';

export const W = 1000;
export const ICON = 72;

type Box = { x0: number; y0: number; x1: number; y1: number };
type Pos = { x: number; y: number };
type Side = 'below' | 'above' | 'right' | 'left';
type Node = Topology['nodes'][number];

const box = (cx: number, cy: number, w: number, h: number): Box => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });
const area = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

const pillW = (s: string) => s.length * 6.7 + 14;
const nameW = (s: string) => s.length * 8.8;
const subW = (s: string) => s.length * 7;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const KIND_LABEL: Record<LinkKind, string> = {
  normal: 'Link',
  active: 'Active forwarding path',
  backup: 'Standby path',
  serial: 'WAN serial',
  trunk: '802.1Q trunk',
  wireless: 'Wireless',
  tunnel: 'Logical tunnel',
  mesh: 'Uplink mesh',
};

export function layout(topo: Topology) {
  // Grow the canvas so names under the bottom row always fit (they never get pushed above).
  const H = Math.max(
    topo.h,
    ...topo.nodes.map((n) => n.y + ICON / 2 + 8 + (n.sub ? 38 : 20) + 14),
    ...(topo.notes ?? []).map((n) => n.y + (n.lines.length - 1) * 20 + 18),
  );
  const byId = Object.fromEntries(topo.nodes.map((n) => [n.id, n]));

  // Fixed obstacles.
  const solid: Box[] = [];
  for (const n of topo.nodes) solid.push(box(n.x, n.y, ICON + 6, ICON + 6));
  for (const n of topo.notes ?? []) {
    const w = Math.max(...n.lines.map((l) => l.length)) * 7.6;
    solid.push({ x0: n.x - 4, y0: n.y - 15, x1: n.x + w, y1: n.y + (n.lines.length - 1) * 20 + 6 });
  }
  const edges: Box[] = [
    { x0: -400, y0: -400, x1: W + 400, y1: 4 },
    { x0: -400, y0: H - 2, x1: W + 400, y1: H + 400 },
    { x0: -400, y0: -400, x1: 4, y1: H + 400 },
    { x0: W - 4, y0: -400, x1: W + 400, y1: H + 400 },
  ];

  // Link geometry and sampled "ink" so text avoids sitting on lines.
  const geo = topo.links.map((l, idx) => {
    const a = byId[l.a];
    const b = byId[l.b];
    if (!a || !b) throw new Error(`Topology link ${l.a} -> ${l.b}: unknown node`);
    const kind: LinkKind = l.kind ?? 'normal';
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cx = (a.x + b.x) / 2 + nx * (l.bend ?? 0);
    const cy = (a.y + b.y) / 2 + ny * (l.bend ?? 0);
    const at = (t: number): Pos => ({
      x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cx + t ** 2 * b.x,
      y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cy + t ** 2 * b.y,
    });
    const d = l.bend ? `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
    const ink: Box[] = [];
    const steps = Math.ceil(len / 10);
    for (let k = 1; k < steps; k++) {
      const pt = at(k / steps);
      if (Math.hypot(pt.x - a.x, pt.y - a.y) < ICON / 2 || Math.hypot(pt.x - b.x, pt.y - b.y) < ICON / 2) continue;
      ink.push(box(pt.x, pt.y, 6, 6));
    }
    return { ...l, idx, kind, len, nx, ny, ux: dx / len, uy: dy / len, at, d, ink };
  });
  // Mesh links are not avoided: dense meshes would push every label off its natural spot.
  const allInk = geo.filter((g) => g.kind !== 'mesh').flatMap((g) => g.ink.map((b) => ({ b, idx: g.idx })));

  const placed: Box[] = [];
  const cost = (b: Box, own = -1, inkW = 0.35) => {
    let c = 0;
    for (const o of solid) c += area(b, o) * 3;
    for (const o of placed) c += area(b, o) * 4;
    for (const o of edges) c += area(b, o) * 6;
    for (const { b: o, idx } of allInk) if (idx !== own) c += area(b, o) * inkW;
    return c;
  };
  function best<T extends { b: Box; pen: number }>(cands: T[], own = -1, inkW = 0.35): T {
    let pick = cands[0];
    let score = Infinity;
    for (const c of cands) {
      const s = cost(c.b, own, inkW) + c.pen;
      if (s < score) {
        score = s;
        pick = c;
      }
    }
    placed.push(pick.b);
    return pick;
  }

  // Badges are reserved first (above the icon, or below when the name is forced above).
  const badgeY = (n: Node) => n.y - ICON / 2 - 32;
  for (const n of topo.nodes) if (n.badge) solid.push(box(n.x, badgeY(n) + 11, pillW(n.badge) + 6, 24));

  // 1. Node names and details.
  const PAD = 5;
  const nameBox = (n: Node, side: Side) => {
    const g = ICON / 2;
    const w = Math.max(nameW(n.label), n.sub ? subW(n.sub) : 0);
    const h = n.sub ? 38 : 20;
    const ax = side === 'right' ? n.x + g + 12 : side === 'left' ? n.x - g - 12 : n.x;
    const top = side === 'below' ? n.y + g + 8 : side === 'above' ? n.y - g - 8 - h : n.y - h / 2 + 2;
    const x0 = side === 'right' ? ax : side === 'left' ? ax - w : ax - w / 2;
    return { b: { x0: x0 - PAD, y0: top - PAD, x1: x0 + w + PAD, y1: top + h + PAD }, ax, top, side };
  };
  const labels = new Map<string, { ax: number; top: number; side: Side }>();
  for (const n of topo.nodes) {
    // House rule: a device's name sits directly under it. Above is only a fallback when the
    // space below is physically blocked; names never go to the side.
    const forced = topo.strictLabels && (n.lp === 'below' || n.lp === 'above') ? [n.lp] : null;
    const sides: Side[] = forced ?? (n.badge ? ['below'] : ['below', 'above']);
    const pen = (sd: Side) => (sd === 'below' ? 0 : 900);
    const pick = best(sides.map((sd) => ({ ...nameBox(n, sd), pen: pen(sd) })), -1, 0.6);
    labels.set(n.id, { ax: pick.ax, top: pick.top, side: pick.side });
  }

  // Zone titles go in whichever corner of their zone is clearest of links and icons.
  type Corner = 'tl' | 'tr' | 'bl' | 'br';
  const zoneLabels = (topo.zones ?? []).map((z) => {
    const w = z.label.length * 7.8 + 8;
    const c = (k: Corner) => {
      const right = k[1] === 'r';
      const bottom = k[0] === 'b';
      const x = right ? z.x + z.w - 18 : z.x + 18;
      const y = bottom ? z.y + z.h - 16 : z.y + 28;
      const x0 = right ? x - w : x - 4;
      return { b: { x0, y0: y - 16, x1: x0 + w + 4, y1: y + 6 }, x, y, anchor: right ? 'end' : 'start', pen: { tl: 0, tr: 300, bl: 400, br: 500 }[k] };
    };
    const pick = best((['tl', 'tr', 'bl', 'br'] as Corner[]).map(c), -1, 6);
    return { x: pick.x, y: pick.y, anchor: pick.anchor };
  });

  // 2. Link labels (dark pills).
  const T_LABEL = [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73];
  const linkPos = new Map<number, Pos>();
  for (const g of geo) {
    if (!g.label) continue;
    const w = pillW(g.label);
    const ts = g.lt !== undefined ? [g.lt] : T_LABEL;
    const cands = ts.flatMap((t) =>
      [0, 16, -16, 26, -26].map((o) => {
        const p0 = g.at(t);
        const p = { x: p0.x + g.nx * o, y: p0.y + g.ny * o };
        return { b: box(p.x, p.y, w + 8, 26), p, pen: Math.abs(t - 0.5) * 60 + Math.abs(o) * 4 };
      }),
    );
    linkPos.set(g.idx, best(cands, g.idx).p);
  }

  // 3. Port pills, as close to their device as space allows.
  const portPos = new Map<string, Pos>();
  for (const g of geo) {
    for (const end of ['a', 'b'] as const) {
      const text = end === 'a' ? g.ap : g.bp;
      if (!text) continue;
      const w = pillW(text);
      const start = ICON / 2 + 10 + (w / 2) * Math.abs(g.ux) + 10 * Math.abs(g.uy);
      const cands: { b: Box; p: Pos; pen: number }[] = [];
      // Slide outward from the device in 12px steps until the pill finds clear space.
      for (let k = 0; k < 14; k++) {
        const tt = Math.min(0.62, (start + k * 12) / g.len);
        const t = end === 'a' ? tt : 1 - tt;
        for (const o of [0, 16, -16, 25, -25, 42, -42, 60, -60]) {
          const p0 = g.at(t);
          const p = { x: p0.x + g.nx * o, y: p0.y + g.ny * o };
          cands.push({ b: box(p.x, p.y, w + 8, 24), p, pen: k * 12 + Math.abs(o) * 5 });
        }
      }
      portPos.set(`${g.idx}${end}`, best(cands, g.idx).p);
    }
  }

  // Serial "zig" only where it fits cleanly; the legend still marks the link as serial.
  const links = geo.map((g) => {
    let zig: string | undefined;
    if (g.kind === 'serial') {
      for (const t of [0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75]) {
        const m = g.at(t);
        if (cost(box(m.x, m.y, 28, 22), g.idx, 0) > 0) continue;
        const { ux, uy, nx, ny } = g;
        zig = `M${m.x - ux * 12},${m.y - uy * 12} L${m.x - ux * 3 + nx * 9},${m.y - uy * 3 + ny * 9} L${m.x + ux * 3 - nx * 9},${m.y + uy * 3 - ny * 9} L${m.x + ux * 12},${m.y + uy * 12}`;
        break;
      }
    }
    return { ...g, mid: linkPos.get(g.idx), pa: portPos.get(`${g.idx}a`), pb: portPos.get(`${g.idx}b`), zig };
  });

  return { H, links, labels, badgeY, zoneLabels };
}

/** Theme-aware stylesheet. Inline SVGs inherit the page's tokens; standalone files get `vars` prepended. */
const CSS = `
.topo{--topo-bg:var(--topo-surface,var(--surface));font-family:var(--font-sans);overflow:visible}
.topo .t-zone rect{stroke:var(--line-2);stroke-width:1.2;stroke-dasharray:6 6}
.topo .t-zone--neutral rect{fill:rgb(var(--text-rgb)/.03)}
.topo .t-zone--accent rect{fill:rgb(var(--accent-rgb)/.07);stroke:rgb(var(--accent-rgb)/.45)}
.topo .t-zone-label,.topo .t-note{font-family:var(--font-mono);font-size:13px;fill:var(--text-2);white-space:pre}
.topo .t-zone--accent .t-zone-label{fill:var(--accent-text)}
.topo .t-note{font-size:12.5px}
.topo .t-line{fill:none;stroke:var(--text-3);stroke-width:2.2;stroke-linecap:round}
.topo .t-link--active .t-line{stroke:var(--accent);stroke-width:3.2}
.topo .t-flow{fill:none;stroke:#fff4ec;stroke-width:1.6;stroke-linecap:round;stroke-dasharray:1.5 26;animation:topo-flow 1.4s linear infinite}
.topo .t-link--backup .t-line{stroke-dasharray:7 7}
.topo .t-link--serial .t-line,.topo .t-zig{stroke:var(--text-2);stroke-width:2.4;fill:none;stroke-linejoin:round}
.topo .t-link--trunk .t-line{stroke:var(--text-2);stroke-width:4}
.topo .t-link--wireless .t-line{stroke-dasharray:1 8;stroke-width:3}
.topo .t-link--mesh .t-line{stroke:var(--text-3);stroke-width:1.2;opacity:.55}
.topo .t-link--tunnel .t-line{stroke:rgb(var(--accent-rgb)/.75);stroke-width:1.6;stroke-dasharray:5 6}
@keyframes topo-flow{to{stroke-dashoffset:-27.5}}
.topo .t-pill rect{fill:var(--topo-bg);stroke:var(--line-2)}
.topo .t-pill text,.topo .t-badge text{font-family:var(--font-mono);font-size:11px;fill:var(--text-2);text-anchor:middle;white-space:pre}
.topo .t-pill--label rect{stroke:none;fill:var(--text)}
.topo .t-pill--label text{fill:var(--bg);font-weight:600}
.topo .t-pill--tunnel rect{fill:var(--accent)}
.topo .t-pill--tunnel text{fill:var(--accent-ink)}
.topo .t-badge rect{fill:var(--topo-bg);stroke:var(--line-2)}
.topo .t-node--emph .t-badge rect{fill:var(--accent);stroke:none}
.topo .t-node--emph .t-badge text{fill:var(--accent-ink);font-weight:600}
.topo .t-halo{fill:rgb(var(--accent-rgb)/.1);stroke:rgb(var(--accent-rgb)/.55);stroke-width:1.5}
.topo .t-name,.topo .t-sub{text-anchor:middle;paint-order:stroke;stroke:var(--topo-bg);stroke-width:5px;stroke-linejoin:round}
.topo .t-right{text-anchor:start}.topo .t-left{text-anchor:end}
.topo .t-name{font-size:15px;font-weight:600;fill:var(--text)}
.topo .t-sub{font-family:var(--font-mono);font-size:11.5px;fill:var(--text-2);white-space:pre}
.topo .t-legend{font-size:12px;fill:var(--text-2)}
@media (prefers-reduced-motion:reduce){.topo .t-flow{animation:none}}
`;

/** Light palette for standalone files (thumbnails sit on white paper). */
const STANDALONE_VARS = `.topo{--topo-surface:#ffffff;--surface:#ffffff;--bg:#f3f3f4;--text:#111113;--text-rgb:17 17 19;--text-2:#4f4f57;--text-3:#7a7a83;--line-2:rgb(17 17 19/.16);--accent:#ff6a1f;--accent-rgb:255 106 31;--accent-text:#c2410c;--accent-ink:#111113;--font-sans:'Geist Variable',ui-sans-serif,system-ui,sans-serif;--font-mono:'Geist Mono Variable',ui-monospace,Menlo,monospace}`;

export function renderSvg(
  topo: Topology,
  opts: { title: string; icons: Record<string, string>; standalone?: boolean; className?: string; legend?: boolean },
) {
  const { H, links, labels, badgeY, zoneLabels } = layout(topo);
  const legend = opts.legend === false ? [] : (topo.legend ?? []);
  const VH = H + (legend.length ? 46 : 0);
  const out: string[] = [];
  const cls = ['topo', opts.className].filter(Boolean).join(' ');
  const xmlns = opts.standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  out.push(`<svg class="${cls}" viewBox="0 0 ${W} ${VH}" role="img" aria-label="${esc(`Network topology: ${opts.title}`)}"${xmlns}>`);
  out.push(`<title>${esc(`Network topology: ${opts.title}`)}</title>`);
  out.push(`<style>${opts.standalone ? STANDALONE_VARS : ''}${CSS}</style>`);
  if (opts.standalone) out.push(`<rect width="${W}" height="${VH}" fill="#ffffff"/>`);

  (topo.zones ?? []).forEach((z, i) => {
    const zl = zoneLabels[i];
    out.push(
      `<g class="t-zone t-zone--${z.tone ?? 'neutral'}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="22"/><text x="${zl.x}" y="${zl.y}" text-anchor="${zl.anchor}" class="t-zone-label">${esc(z.label)}</text></g>`,
    );
  });
  for (const n of topo.notes ?? [])
    out.push(
      `<text x="${n.x}" y="${n.y}" class="t-note">${n.lines.map((l, i) => `<tspan x="${n.x}" dy="${i ? 20 : 0}">${esc(l)}</tspan>`).join('')}</text>`,
    );
  for (const l of links)
    out.push(
      `<g class="t-link t-link--${l.kind}"><path d="${l.d}" class="t-line"/>${l.kind === 'active' ? `<path d="${l.d}" class="t-flow"/>` : ''}${l.zig ? `<path d="${l.zig}" class="t-zig"/>` : ''}</g>`,
    );

  const pill = (p: Pos, text: string, cls: string, h = 20) =>
    `<g class="${cls}"><rect x="${(p.x - pillW(text) / 2).toFixed(1)}" y="${(p.y - h / 2).toFixed(1)}" width="${pillW(text).toFixed(1)}" height="${h}" rx="${h / 2}"/><text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}">${esc(text)}</text></g>`;
  for (const l of links) {
    if (l.label && l.mid) out.push(pill(l.mid, l.label, `t-pill t-pill--label t-pill--${l.kind}`, 22));
    if (l.ap && l.pa) out.push(pill(l.pa, l.ap, 't-pill'));
    if (l.bp && l.pb) out.push(pill(l.pb, l.bp, 't-pill'));
  }

  for (const n of topo.nodes) {
    const L = labels.get(n.id)!;
    const side = L.side === 'right' ? ' t-right' : L.side === 'left' ? ' t-left' : '';
    const parts: string[] = [];
    if (n.emph) parts.push(`<circle cx="${n.x}" cy="${n.y}" r="${ICON * 0.68}" class="t-halo"/>`);
    if (opts.icons[n.icon]) parts.push(`<image href="${opts.icons[n.icon]}" x="${n.x - ICON / 2}" y="${n.y - ICON / 2}" width="${ICON}" height="${ICON}"/>`);
    if (n.badge) {
      const y = badgeY(n);
      parts.push(
        `<g class="t-badge"><rect x="${n.x - pillW(n.badge) / 2}" y="${y}" width="${pillW(n.badge)}" height="22" rx="11"/><text x="${n.x}" y="${y + 15}">${esc(n.badge)}</text></g>`,
      );
    }
    parts.push(`<text x="${L.ax}" y="${L.top + 15}" class="t-name${side}">${esc(n.label)}</text>`);
    if (n.sub) parts.push(`<text x="${L.ax}" y="${L.top + 33}" class="t-sub${side}">${esc(n.sub)}</text>`);
    out.push(`<g class="t-node${n.emph ? ' t-node--emph' : ''}">${parts.join('')}</g>`);
  }

  if (legend.length) {
    out.push(`<g transform="translate(28 ${H + 28})">`);
    const step = Math.min(200, (W - 56) / legend.length);
    legend.forEach((k, i) =>
      out.push(
        `<g transform="translate(${i * step} 0)" class="t-link t-link--${k}"><path d="M0,-4 L34,-4" class="t-line"/><text x="44" y="0" class="t-legend">${KIND_LABEL[k]}</text></g>`,
      ),
    );
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('');
}
