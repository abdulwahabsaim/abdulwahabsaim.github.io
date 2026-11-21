#!/usr/bin/env node
/**
 * Snapshot public GitHub activity into src/data/github.json at build time.
 * Falls back to the last committed snapshot when offline, so builds never fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/github.json');
const USER = 'abdulwahabsaim';
const REPOS = [
  'cisco-enterprise-campus-mega-lab',
  'enterprise-routing-labs',
  'layer2-security-labs',
  'network-services-labs',
  'cisco-asa-firewall-labs',
];

async function getJSON(url) {
  const headers = { 'User-Agent': 'portfolio-build', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN && url.includes('api.github.com')) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function commitCount(repo) {
  // Count via the Link header of a 1-per-page listing.
  const headers = { 'User-Agent': 'portfolio-build' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${USER}/${repo}/commits?per_page=1`, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const link = res.headers.get('link') || '';
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  return m ? Number(m[1]) : 1;
}

try {
  const contrib = await getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
  const all = await getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=all`);
  const allTotal = Object.values(all.total || {}).reduce((a, b) => a + b, 0);
  const repos = [];
  for (const name of REPOS) {
    try {
      const r = await getJSON(`https://api.github.com/repos/${USER}/${name}`);
      repos.push({
        name: r.name,
        description: r.description || '',
        url: r.html_url,
        pushedAt: r.pushed_at,
        stars: r.stargazers_count,
        commits: await commitCount(name),
      });
    } catch (e) {
      console.warn(`repo ${name}: ${e.message}`);
    }
  }
  const data = {
    user: USER,
    fetchedAt: new Date().toISOString(),
    lastYearTotal: contrib.total?.lastYear ?? 0,
    allTimeTotal: allTotal,
    days: contrib.contributions.map((d) => [d.date, d.count, d.level]),
    repos,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log(`github: ${data.lastYearTotal} contributions last year, ${repos.length} repos`);
} catch (e) {
  if (fs.existsSync(OUT)) console.warn(`github sync failed (${e.message}); keeping snapshot`);
  else throw e;
}
