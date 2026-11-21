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

/** Read GitHub's own public contribution calendar, the same one shown on the profile page. */
async function githubCalendar(year) {
  const range = year ? `?from=${year}-01-01&to=${year}-12-31` : '';
  const res = await fetch(`https://github.com/users/${USER}/contributions${range}`, {
    headers: { 'User-Agent': 'portfolio-build' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`calendar → ${res.status}`);
  const html = await res.text();
  const total = Number((html.match(/([\d,]+)\s+contributions?\s+in (?:the last year|\d{4})/) || [])[1]?.replace(/,/g, ''));
  const counts = {};
  for (const [, id, text] of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</g)) {
    const n = text.match(/^(\d+) contribution/);
    counts[id] = n ? Number(n[1]) : 0;
  }
  const days = [];
  for (const [tag] of html.matchAll(/<td[^>]*data-date="[^"]+"[^>]*>/g)) {
    const date = tag.match(/data-date="([^"]+)"/)[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = tag.match(/id="([^"]+)"/)?.[1];
    days.push([date, counts[id] ?? 0, level]);
  }
  days.sort((a, b) => a[0].localeCompare(b[0]));
  if (!days.length || !Number.isFinite(total)) throw new Error('calendar markup changed');
  return { total, days };
}

try {
  let cal;
  try {
    cal = await githubCalendar();
  } catch (e) {
    // Fallback: third-party mirror of the same calendar (can lag GitHub by a day or two).
    console.warn(`github calendar: ${e.message}; using mirror`);
    const c = await getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
    cal = { total: c.total?.lastYear ?? 0, days: c.contributions.map((d) => [d.date, d.count, d.level]) };
  }
  let allTotal = null;
  try {
    const all = await getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=all`);
    allTotal = Object.values(all.total || {}).reduce((a, b) => a + b, 0);
  } catch {}
  const profile = await getJSON(`https://api.github.com/users/${USER}`);
  // One calendar per year since the account was created, newest first (like the profile's year tabs).
  const years = [];
  const first = new Date(profile.created_at).getUTCFullYear();
  for (let y = new Date().getUTCFullYear(); y >= first; y--) {
    try {
      const c = await githubCalendar(y);
      years.push({ year: y, total: c.total, days: c.days });
    } catch (e) {
      console.warn(`calendar ${y}: ${e.message}`);
    }
  }
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
    lastYearTotal: cal.total,
    allTimeTotal: allTotal,
    publicRepos: profile.public_repos,
    since: first,
    years,
    days: cal.days,
    repos,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log(`github: ${data.lastYearTotal} contributions last year, ${repos.length} repos`);
} catch (e) {
  if (fs.existsSync(OUT)) console.warn(`github sync failed (${e.message}); keeping snapshot`);
  else throw e;
}
