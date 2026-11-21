#!/usr/bin/env node
/**
 * Sync lab content from the local Cisco lab repositories into Astro content.
 *
 * Reads:   ../cisco-enterprise-campus-mega-lab, ../enterprise-routing-labs,
 *          ../layer2-security-labs, ../network-services-labs, ../cisco-asa-firewall-labs
 * Writes:  src/content/labs/<slug>.md   (cleaned README body + frontmatter)
 *          src/assets/labs/<slug>.png   (topology screenshot)
 *
 * Run it whenever a lab README changes:  npm run sync:labs
 * The generated files are committed, so CI never needs the source repos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC_REPOS = path.resolve(process.env.LABS_ROOT || path.join(ROOT, '..'));
const OUT_MD = path.join(ROOT, 'src/content/labs');
const OUT_IMG = path.join(ROOT, 'src/assets/labs');
const GH = 'https://github.com/abdulwahabsaim';

/** Curated names and tags. README badges are inconsistent, so these are hand-checked. */
const CURATED = {
  'campus': {
    name: 'Enterprise campus network',
    tags: ['Multi-area OSPFv2', 'HSRPv2', 'EtherChannel', 'DHCP Snooping & DAI', 'WLC 3504', 'Dual-ISP failover'],
    featured: 1,
    image: 'mega lab.png',
    summary: 'A two-building campus of 15 Cisco devices: routed Layer 3 core, multi-area OSPFv2, HSRPv2 with preemption, EtherChannel, Layer 2 security, WLC wireless and dual-ISP failover.',
    acknowledgement: "The scenario is the CCNA Mega Lab by Jeremy McDowell (Jeremy's IT Lab). Every configuration, verification test, addressing plan and slide in this lab is my own work.",
    slides: 'slides',
  },
  'routing-01': { name: 'EIGRP autonomous system', tags: ['EIGRP', 'DUAL', 'Feasible successor'] },
  'routing-02': { name: 'Multi-area OSPF and ABR design', tags: ['OSPFv2', 'Multi-area', 'ABR', 'LSA types'], featured: 2 },
  'routing-03': { name: 'Full-mesh WAN with ECMP', tags: ['RIP', 'ECMP', 'Full mesh'] },
  'routing-04': { name: 'Multi-hop static routing', tags: ['Static routing', 'Next hop', 'Transit WAN'] },
  'routing-05': { name: 'HSRP gateway redundancy', tags: ['HSRPv2', 'Preemption', 'Virtual IP', 'Failover'], featured: 3 },
  'routing-06': { name: 'Inter-VLAN routing with SVIs', tags: ['SVI', 'Multilayer switch', '802.1Q'] },
  'routing-07': { name: 'Floating static WAN failover', tags: ['Floating static', 'Administrative distance', 'Dual ISP'] },
  'routing-08': { name: 'OSPF adjacency troubleshooting', tags: ['OSPFv2', 'Adjacency', 'LSDB'] },
  'routing-09': { name: 'IPv6 dual stack with SLAAC', tags: ['IPv6', 'SLAAC', 'Link-local'] },
  'routing-10': { name: 'Edge NAT with PAT overload', tags: ['NAT', 'PAT', 'RFC 1918'] },
  'routing-11': { name: 'QoS with MQC and DSCP', tags: ['MQC', 'LLQ', 'CBWFQ', 'DSCP'] },
  'routing-12': { name: 'GRE tunnel with OSPF overlay', tags: ['GRE', 'OSPFv2', 'Site-to-site'] },
  'routing-13': { name: 'EIGRP unequal-cost load balancing', tags: ['EIGRP', 'Variance', 'Feasibility condition'] },
  'security-01': { name: 'Standard and extended ACLs', tags: ['Standard ACL', 'Extended ACL', 'Telnet filtering'] },
  'security-02': { name: 'VLANs, 802.1Q trunks and VTP', tags: ['VLAN', '802.1Q', 'VTP'] },
  'security-03': { name: 'Port security and MAC limiting', tags: ['Port Security', 'Sticky MAC', 'Violation modes'] },
  'security-04': { name: 'STP root guard', tags: ['STP', 'Root guard', 'Root bridge'] },
  'security-05': { name: 'STP loop guard and BPDU filter', tags: ['STP', 'Loop guard', 'BPDU filter'] },
  'security-06': { name: 'EtherChannel with LACP and PAgP', tags: ['LACP', 'PAgP', 'Layer 3 EtherChannel'] },
  'security-07': { name: 'LLDP and access-port hardening', tags: ['LLDP', 'CDP', 'Edge hardening'] },
  'security-08': { name: 'SSHv2 and VTY access control', tags: ['SSHv2', 'RSA', 'VTY ACL'] },
  'security-09': { name: 'Voice VLANs for IP telephony', tags: ['Voice VLAN', '802.1Q', '802.1p'] },
  'security-10': { name: 'DHCP Snooping and Dynamic ARP Inspection', tags: ['DHCP Snooping', 'DAI', 'Trust boundary'], featured: 4 },
  'security-11': { name: 'STP and HSRP root alignment', tags: ['HSRPv2', 'PVST+', 'Root alignment'] },
  'security-12': { name: 'VTP modes and DTP hardening', tags: ['VTP', 'DTP', 'Nonegotiate'] },
  'security-13': { name: 'Service filtering with extended ACLs', tags: ['Extended ACL', 'Layer 4', 'DNS and HTTP'] },
  'services-01': { name: 'DHCP, DNS and HTTP services', tags: ['DHCP', 'DNS', 'HTTP'] },
  'services-02': { name: 'Centralized DHCP with relay', tags: ['DHCP relay', 'ip helper-address', 'Multi-scope'] },
  'services-03': { name: 'NTP hierarchy with MD5 authentication', tags: ['NTP', 'Stratum', 'MD5'] },
  'services-04': { name: 'Centralized Syslog', tags: ['Syslog', 'Severity levels', 'UDP 514'] },
  'services-05': { name: 'Cisco 3504 WLC and CAPWAP', tags: ['WLC 3504', 'CAPWAP', 'Lightweight APs', 'WPA2'], featured: 5 },
  'firewall-01': { name: 'ASA initialization, zones and routing', tags: ['ASA 5520', 'Security levels', 'OSPF and EIGRP'] },
  'firewall-02': { name: 'ASA ACLs, object groups and DMZ', tags: ['Object groups', 'Extended ACL', 'DMZ', '802.1Q'] },
  'firewall-03': { name: 'ASA NAT, PAT and DMZ publishing', tags: ['Static NAT', 'PAT', 'DMZ'] },
};

const REPOS = [
  { dir: 'cisco-enterprise-campus-mega-lab', slug: 'campus', category: 'Flagship', single: true },
  { dir: 'enterprise-routing-labs', slug: 'routing', category: 'Routing' },
  { dir: 'layer2-security-labs', slug: 'security', category: 'Layer 2 and security' },
  { dir: 'network-services-labs', slug: 'services', category: 'Network services' },
  { dir: 'cisco-asa-firewall-labs', slug: 'firewall', category: 'Firewalls', inProgress: true },
];

const DROP_SECTIONS = /table of contents|included artifacts|repository (artifacts|structure)|author & professional|visual architecture deck|^network topology/i;

const stripEmoji = (s) =>
  s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();

/** House style: no em/en dashes anywhere visible. */
const fixDashes = (s) =>
  s
    .replace(/\s*—\s*/g, ' - ')
    .replace(/(\d)\s*–\s*(\d)/g, '$1-$2')
    .replace(/\s*–\s*/g, ' - ')
    .replace(/➔/g, '→');

/** Claim policy: lab work stays lab work. */
const fixClaims = (s) =>
  s
    .replace(/\bproduction[- ](grade|ready|standard)\s+/gi, '')
    .replace(/\bcorporate\b/gi, 'enterprise')
    .replace(/\bCorporate\b/g, 'Enterprise');

const toGithubLink = (repo, folder) => (href) => {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const clean = href.replace(/^\.\//, '');
  const base = `${GH}/${repo}/blob/main/${folder ? folder + '/' : ''}`;
  return base + clean.split('/').map(encodeURIComponent).join('/');
};

function parseReadme(md, { repo, folder }) {
  md = md.replace(/\r\n/g, '\n');
  const titleLine = (md.match(/^#\s+(.+)$/m) || [])[1] || folder;
  const title = fixDashes(stripEmoji(titleLine));

  // Tagline: the bold paragraph in the centred header block.
  let summary = '';
  const tag = md.match(/<b>([\s\S]*?)<\/b>/);
  if (tag && md.indexOf(tag[0]) < md.search(/^##\s/m)) summary = tag[1];

  // Acknowledgement note (flagship credits Jeremy's IT Lab).
  let acknowledgement = '';
  const note = md.match(/> \[!NOTE\][\s\S]*?(?=\n\n(?!>)|\n---)/);
  if (note && /Jeremy/i.test(note[0])) {
    acknowledgement = note[0]
      .split('\n')
      .map((l) => l.replace(/^>\s?/, ''))
      .filter((l) => !/^\[!NOTE\]|^#{1,4}\s/.test(l.trim()))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Body: everything from the first "## " heading onwards.
  const first = md.search(/^##\s/m);
  let body = first >= 0 ? md.slice(first) : '';

  // Split into sections and drop the noise.
  const parts = body.split(/^(?=##\s)/m);
  body = parts
    .filter((p) => {
      const h = (p.match(/^##\s+(.+)$/m) || [])[1] || '';
      return !DROP_SECTIONS.test(stripEmoji(h));
    })
    .join('');

  if (!summary) {
    const para = body
      .split('\n\n')
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('#') && !p.startsWith('<') && !p.startsWith('|') && !p.startsWith('*') && !p.startsWith('>') && p.length > 80);
    summary = para || '';
  }

  body = body
    // html wrappers and images
    .replace(/<div[^>]*>|<\/div>|<p[^>]*>|<\/p>|<br\s*\/?>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<\/?(b|strong)>/gi, '**')
    // GitHub alert markers
    .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gim, '>')
    // horizontal rules between sections add nothing on the page
    .replace(/^---+\s*$/gm, '')
    // headings: strip emoji
    .replace(/^(#{2,6})\s+(.+)$/gm, (_, h, t) => `${h} ${stripEmoji(t)}`)
    // relative links to GitHub
    .replace(/\]\(([^)\s]+)\)/g, (_, href) => `](${toGithubLink(repo, folder)(href)})`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  body = fixClaims(fixDashes(body));
  summary = fixClaims(fixDashes(summary.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim()));
  acknowledgement = fixDashes(acknowledgement.replace(/\*\*/g, ''));
  return { title, summary, body, acknowledgement };
}

function platformOf(files) {
  if (files.some((f) => f.endsWith('.unl'))) return 'EVE-NG';
  if (files.some((f) => f.endsWith('.gns3'))) return 'GNS3';
  return 'Packet Tracer';
}

function yaml(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
}

fs.rmSync(OUT_MD, { recursive: true, force: true });
fs.mkdirSync(OUT_MD, { recursive: true });
fs.mkdirSync(OUT_IMG, { recursive: true });

let count = 0;
for (const repo of REPOS) {
  const repoPath = path.join(SRC_REPOS, repo.dir);
  if (!fs.existsSync(repoPath)) {
    console.warn(`skip: ${repoPath} not found`);
    continue;
  }
  const folders = repo.single
    ? ['']
    : fs
        .readdirSync(repoPath)
        .filter((d) => /^\d{2}-/.test(d) && fs.statSync(path.join(repoPath, d)).isDirectory())
        .sort();

  for (const folder of folders) {
    const abs = path.join(repoPath, folder);
    const readme = path.join(abs, 'README.md');
    if (!fs.existsSync(readme)) continue;
    const num = folder ? folder.slice(0, 2) : '00';
    const key = repo.single ? repo.slug : `${repo.slug}-${num}`;
    const slug = repo.single ? repo.slug : `${repo.slug}-${folder.slice(3)}`;
    const cur = CURATED[key];
    if (!cur) throw new Error(`No curated entry for ${key}`);

    const files = fs.readdirSync(abs);
    const parsed = parseReadme(fs.readFileSync(readme, 'utf8'), { repo: repo.dir, folder });

    const topo = [cur.image, 'topology.png'].filter(Boolean).map((f) => path.join(abs, f)).find(fs.existsSync);

    // Architecture deck slides (flagship only).
    let slides;
    if (cur.slides && fs.existsSync(path.join(abs, cur.slides))) {
      const dest = path.join(OUT_IMG, `${slug}-slides`);
      fs.rmSync(dest, { recursive: true, force: true });
      fs.mkdirSync(dest, { recursive: true });
      slides = fs
        .readdirSync(path.join(abs, cur.slides))
        .filter((f) => /^slide-\d+.*\.png$/.test(f) && !f.includes('thumb'))
        .sort()
        .map((f) => {
          fs.copyFileSync(path.join(abs, cur.slides, f), path.join(dest, f));
          return `../../assets/labs/${slug}-slides/${f}`;
        });
    }
    if (topo) fs.copyFileSync(topo, path.join(OUT_IMG, `${slug}.png`));

    const fm = {
      title: parsed.title,
      name: cur.name,
      category: repo.category,
      categorySlug: repo.slug,
      order: Number(num),
      summary: cur.summary || parsed.summary,
      tags: cur.tags,
      platform: platformOf(files),
      status: repo.inProgress ? 'in-progress' : 'complete',
      featured: cur.featured,
      repo: repo.dir,
      url: folder ? `${GH}/${repo.dir}/tree/main/${folder}` : `${GH}/${repo.dir}`,
      image: topo ? `../../assets/labs/${slug}.png` : undefined,
      acknowledgement: cur.acknowledgement || parsed.acknowledgement,
      slides,
    };
    fs.writeFileSync(path.join(OUT_MD, `${slug}.md`), `---\n${yaml(fm)}\n---\n\n${parsed.body}\n`);
    count++;
  }
}
console.log(`synced ${count} labs → ${path.relative(ROOT, OUT_MD)}`);
