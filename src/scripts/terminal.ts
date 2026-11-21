/**
 * Portfolio shell: a small, honest command line over the portfolio's own data.
 * The portfolio is exposed as a tiny read-only filesystem (~/about.txt, ~/labs/routing/...),
 * plus shortcuts (skills, certs, contact, cv). All output is built as DOM nodes; user input is
 * never injected as HTML.
 */
import { toggleTheme, currentTheme } from './theme';
import { setSound, soundOn, tick, click } from './sound';
import { prefersReduced, scrollToTarget } from './core';
import { motion } from '../config/motion';

export interface TermData {
  profile: { name: string; role: string; email: string; github: string; linkedin: string; cv: string; location: string };
  facts: { label: string; value: string }[];
  toolbox: { title: string; items: string[] }[];
  labs: { id: string; name: string; category: string; categorySlug: string; tags: string[]; summary: string; status: string }[];
  categories: { slug: string; label: string }[];
  credentials: { id: string; title: string; issuer: string; code: string; date: string; verify?: string }[];
  training: { label: string; status: string }[];
  experience: { period: string; org: string; role: string; status: string }[];
}

type Part = string | { text: string; cls?: string; href?: string; run?: string; download?: boolean };
type Line = Part[];

const ROOT_FILES = ['about.txt', 'skills.txt', 'contact.txt', 'cv.pdf'];
const ROOT_DIRS = ['labs', 'certs', 'experience'];

export function mountTerminal(el: HTMLElement, data: TermData) {
  const out = el.querySelector<HTMLElement>('[data-term-out]')!;
  const input = el.querySelector<HTMLInputElement>('[data-term-input]')!;
  const promptEl = el.querySelector<HTMLElement>('[data-term-prompt]')!;
  const screen = el.querySelector<HTMLElement>('[data-term-screen]')!;
  const hint = el.querySelector<HTMLElement>('[data-term-hint]')!;

  let cwd: string[] = []; // [] = ~, ['labs'], ['labs','routing'], ['certs'], ['experience']
  const history: string[] = [];
  let hIndex = -1;
  const labShort = (id: string, cat: string) => id.replace(new RegExp(`^${cat}-`), '');

  // ---------- rendering ----------
  const path = () => '~' + (cwd.length ? '/' + cwd.join('/') : '');
  const setPrompt = () => (promptEl.textContent = `visitor@saim:${path()}$`);

  function render(line: Line, cls = '') {
    const row = document.createElement('div');
    row.className = `term-line ${cls}`.trim();
    for (const p of line) {
      if (typeof p === 'string') {
        row.append(document.createTextNode(p));
        continue;
      }
      let node: HTMLElement;
      if (p.href) {
        const a = document.createElement('a');
        a.href = p.href;
        if (/^https?:/.test(p.href)) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        if (p.download) a.setAttribute('download', '');
        node = a;
      } else if (p.run) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.run = p.run;
        node = b;
      } else node = document.createElement('span');
      node.textContent = p.text;
      if (p.cls) node.className = p.cls;
      if (p.run) node.classList.add('t-run');
      if (p.href) node.classList.add('t-link');
      row.append(node);
    }
    out.append(row);
    return row;
  }

  async function print(lines: (Line | { line: Line; cls?: string })[]) {
    const fast = prefersReduced() || lines.length > 40;
    for (const l of lines) {
      const row = 'line' in l ? render(l.line, l.cls) : render(l);
      if (!fast) {
        row.classList.add('is-in');
        await new Promise((r) => setTimeout(r, motion.terminal.lineDelay));
      }
      scrollDown();
    }
  }
  const scrollDown = () => (screen.scrollTop = screen.scrollHeight);
  const kv = (k: string, v: Part | Part[], width = 14): Line => [{ text: k.padEnd(width), cls: 't-key' }, ...(Array.isArray(v) ? v : [v])];
  const muted = (t: string): Line => [{ text: t, cls: 't-muted' }];
  const err = (t: string) => ({ line: [{ text: t, cls: 't-err' }] as Line, cls: '' });

  // ---------- filesystem ----------
  function ls(args: string[]): Line[] {
    const target = resolve(args[0]);
    if (!target) return [[{ text: `ls: ${args[0]}: no such file or directory`, cls: 't-err' }]];
    if (target.length === 0) {
      return [
        [
          ...ROOT_DIRS.flatMap((d) => [{ text: d + '/', cls: 't-dir', run: `cd ${d}` } as Part, '  ']),
          ...ROOT_FILES.flatMap((f) => [{ text: f, cls: 't-file', run: f === 'cv.pdf' ? 'cv' : `cat ${f}` } as Part, '  ']),
        ],
      ];
    }
    if (target[0] === 'labs' && target.length === 1) {
      return data.categories.map((c) => {
        const n = data.labs.filter((l) => l.categorySlug === c.slug).length;
        return [{ text: `${c.slug}/`, cls: 't-dir', run: `cd labs/${c.slug}` }, { text: `  ${n} labs  ${c.label}`, cls: 't-muted' }];
      }).concat([[{ text: 'campus', cls: 't-file', run: 'open campus' }, { text: '  flagship: enterprise campus network', cls: 't-muted' }]]);
    }
    if (target[0] === 'labs' && target.length === 2) {
      return data.labs
        .filter((l) => l.categorySlug === target[1])
        .map((l) => [{ text: labShort(l.id, l.categorySlug), cls: 't-file', run: `cat ${labShort(l.id, l.categorySlug)}` }, { text: `  ${l.name}`, cls: 't-muted' }]);
    }
    if (target[0] === 'certs') return data.credentials.map((c) => [{ text: `${c.id}.txt`, cls: 't-file', run: `cat ${c.id}.txt` }, { text: `  ${c.title}`, cls: 't-muted' }]);
    if (target[0] === 'experience') return experience();
    return [];
  }

  /** Resolve a path relative to cwd. Returns null when it does not exist. */
  function resolve(arg?: string): string[] | null {
    if (!arg || arg === '.') return [...cwd];
    let parts = arg.startsWith('~') ? [] : [...cwd];
    for (const seg of arg.replace(/^~\/?/, '').split('/').filter(Boolean)) {
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    if (parts.length === 0) return parts;
    if (!ROOT_DIRS.includes(parts[0])) return null;
    if (parts[0] === 'labs' && parts.length === 2 && !data.categories.some((c) => c.slug === parts[1])) return null;
    if (parts.length > (parts[0] === 'labs' ? 2 : 1)) return null;
    return parts;
  }

  function findLab(q: string) {
    const s = q.toLowerCase().replace(/\.(txt|md)$/, '');
    return (
      data.labs.find((l) => l.id === s || labShort(l.id, l.categorySlug) === s) ??
      data.labs.find((l) => l.id.includes(s) || l.name.toLowerCase().includes(s)) ??
      data.labs.find((l) => l.tags.some((t) => t.toLowerCase() === s))
    );
  }

  function cat(arg?: string): (Line | { line: Line; cls?: string })[] {
    if (!arg) return [err('cat: missing file. Try: cat about.txt')];
    const f = arg.replace(/^~\//, '').replace(/^\.\//, '');
    if (f === 'about.txt') return about();
    if (f === 'skills.txt') return skills();
    if (f === 'contact.txt') return contact();
    if (f === 'cv.pdf') return [muted('cv.pdf is a binary file. Run "cv" to download it.')];
    const cert = data.credentials.find((c) => f === `${c.id}.txt` || f === `certs/${c.id}.txt` || f === c.id);
    if (cert) return certLines([cert]);
    const lab = findLab(f.split('/').pop()!);
    if (lab) {
      return [
        [{ text: lab.name, cls: 't-strong' }, { text: `  ${lab.category}`, cls: 't-muted' }],
        [{ text: lab.summary }],
        kv('tags', lab.tags.join(', ')),
        kv('status', lab.status === 'complete' ? 'configured and verified' : 'in progress'),
        [{ text: 'open ' + labShort(lab.id, lab.categorySlug), cls: 't-accent', run: `open ${labShort(lab.id, lab.categorySlug)}` }, { text: '  to read the full lab', cls: 't-muted' }],
      ];
    }
    return [err(`cat: ${arg}: no such file`)];
  }

  // ---------- content ----------
  const about = (): Line[] => [
    [{ text: data.profile.name, cls: 't-strong' }, { text: `  ${data.profile.role}`, cls: 't-accent' }],
    ...data.facts.map((f) => kv(f.label.toLowerCase(), f.value)),
    kv('labs', `${data.labs.filter((l) => l.status === 'complete').length} documented Cisco labs, ${data.labs.filter((l) => l.status !== 'complete').length} ASA labs in progress`),
    muted('Next: skills, ls labs, certs, contact'),
  ];
  const skills = (): Line[] =>
    data.toolbox.flatMap((g) => [[{ text: g.title, cls: 't-strong' }] as Line, [{ text: '  ' + g.items.join('  ·  '), cls: 't-muted' }] as Line]);
  const contact = (): Line[] => [
    kv('email', [{ text: data.profile.email, href: `mailto:${data.profile.email}` }, '  ', { text: '[copy]', cls: 't-accent', run: 'email' }]),
    kv('linkedin', { text: data.profile.linkedin.replace(/^https?:\/\//, ''), href: data.profile.linkedin }),
    kv('github', { text: data.profile.github.replace(/^https?:\/\//, ''), href: data.profile.github }),
    kv('location', data.profile.location),
  ];
  const certLines = (list = data.credentials): Line[] =>
    list.flatMap((c) => [
      [{ text: c.title, cls: 't-strong' }] as Line,
      [{ text: `  ${c.issuer}  ${c.code}  ${c.date}  `, cls: 't-muted' }, ...(c.verify ? [{ text: 'verify', href: c.verify } as Part] : [])] as Line,
    ]);
  const experience = (): Line[] =>
    data.experience.map((e) => [
      { text: e.period.padEnd(16), cls: 't-key' },
      { text: e.role, cls: e.status === 'next' ? 't-muted' : 't-strong' },
      { text: `  ${e.org}${e.status === 'next' ? '  (unlocking)' : ''}`, cls: 't-muted' },
    ]);

  const HELP: [string, string][] = [
    ['about', 'who I am, in one screen'],
    ['skills', 'what I work with'],
    ['ls labs', 'browse the labs by category'],
    ['open <lab>', 'jump to a lab page, e.g. open hsrp'],
    ['certs', 'certifications, with verify links'],
    ['experience', 'timeline, oldest first'],
    ['contact', 'email, LinkedIn, GitHub'],
    ['cv', 'download my CV (PDF)'],
    ['theme', 'switch light or dark'],
    ['clear', 'clear the screen'],
  ];

  // ---------- commands ----------
  const COMMANDS: Record<string, (args: string[]) => Promise<void> | void> = {
    help: () =>
      print([
        muted('Commands (click one, or type it). Tab completes, arrows recall history.'),
        ...HELP.map(([c, d]) => [{ text: c.padEnd(14), cls: 't-accent', run: c.replace(' <lab>', ' hsrp') } as Part, { text: d, cls: 't-muted' } as Part]),
        muted('Also: ls, cd, cat, pwd, history, email, github, linkedin, sound, date, sudo hire'),
      ]),
    about: () => print(about()),
    whoami: () => print(about()),
    skills: () => print(skills()),
    contact: () => print(contact()),
    certs: () => print([...certLines(), ...data.training.map((t) => [{ text: t.label, cls: 't-strong' }, { text: `  ${t.status}`, cls: 't-muted' }] as Line)]),
    experience: () => print(experience()),
    labs: (a) => COMMANDS.ls([a[0] ? `labs/${a[0]}` : 'labs']),
    projects: () => COMMANDS.ls(['labs']),
    ls: (a) => print(ls(a)),
    dir: (a) => print(ls(a)),
    pwd: () => print([[path().replace('~', '/home/visitor')]]),
    cd: (a) => {
      const t = resolve(a[0] ?? '~');
      if (!t) return print([err(`cd: ${a[0]}: no such directory`)]);
      cwd = t;
      setPrompt();
    },
    cat: (a) => print(cat(a[0])),
    open: (a) => {
      const q = a.join(' ').trim();
      if (!q) return print([err('open: what should I open? Try: open hsrp, open cv, open github')]);
      if (['cv', 'cv.pdf', 'resume'].includes(q)) return COMMANDS.cv([]);
      if (q === 'github') return COMMANDS.github([]);
      if (q === 'linkedin') return COMMANDS.linkedin([]);
      const lab = q === 'campus' ? data.labs.find((l) => l.id === 'campus') : findLab(q);
      if (!lab) return print([err(`open: no lab matches "${q}". Try: ls labs`)]);
      print([[{ text: `Opening ${lab.name}...`, cls: 't-accent' }]]);
      setTimeout(() => (location.href = `/labs/${lab.id}/`), 350);
    },
    cv: () => {
      const a = document.createElement('a');
      a.href = data.profile.cv;
      a.download = '';
      a.click();
      print([[{ text: 'Downloading ', cls: 't-muted' }, { text: 'Abdul-Wahab-Saim-CV.pdf', href: data.profile.cv, download: true }]]);
    },
    resume: () => COMMANDS.cv([]),
    email: async () => {
      try {
        await navigator.clipboard.writeText(data.profile.email);
        print([[{ text: 'Copied ', cls: 't-muted' }, { text: data.profile.email, cls: 't-accent' }, { text: ' to your clipboard.', cls: 't-muted' }]]);
      } catch {
        print([[{ text: data.profile.email, href: `mailto:${data.profile.email}` }]]);
      }
    },
    github: () => {
      window.open(data.profile.github, '_blank', 'noopener');
      print([[{ text: 'Opened ', cls: 't-muted' }, { text: data.profile.github.replace(/^https?:\/\//, ''), href: data.profile.github }]]);
    },
    linkedin: () => {
      window.open(data.profile.linkedin, '_blank', 'noopener');
      print([[{ text: 'Opened ', cls: 't-muted' }, { text: data.profile.linkedin.replace(/^https?:\/\//, ''), href: data.profile.linkedin }]]);
    },
    theme: (a) => {
      const want = a[0];
      if (want && want !== 'light' && want !== 'dark') return print([err('theme: use "theme", "theme light" or "theme dark"')]);
      if (!want || want !== currentTheme()) {
        const r = input.getBoundingClientRect();
        toggleTheme(r.left + 20, r.top + 10);
      }
      print([muted(`Theme: ${want ?? (currentTheme() === 'dark' ? 'light' : 'dark')}`)]);
    },
    sound: (a) => {
      const on = a[0] ? a[0] === 'on' : !soundOn();
      setSound(on);
      print([muted(`Sound effects ${on ? 'on' : 'off'}.`)]);
    },
    history: () => print(history.map((h, i) => [{ text: String(i + 1).padStart(3) + '  ', cls: 't-muted' }, { text: h, run: h }])),
    date: () => print([[new Date().toString().replace(/ \(.*\)$/, '')]]),
    echo: (a) => print([[a.join(' ')]]),
    clear: () => {
      out.replaceChildren();
    },
    sudo: (a) => {
      if (a.join(' ') === 'hire' || a.join(' ') === 'hire saim') {
        return print([
          [{ text: '[sudo] permission granted.', cls: 't-ok' }],
          kv('candidate', data.profile.name),
          kv('role', 'Junior network or NOC engineer'),
          kv('available', 'full-time, from now'),
          kv('next step', [{ text: data.profile.email, href: `mailto:${data.profile.email}?subject=Interview%20invitation` }, '  or  ', { text: 'cv', cls: 't-accent', run: 'cv' }]),
        ]);
      }
      return print([err('sudo: nice try. Only "sudo hire" is allowed here.')]);
    },
    exit: () => {
      input.blur();
      print([muted('Session stays open. Scroll on to see the rest of the portfolio.')]);
    },
  };
  COMMANDS.hire = () => COMMANDS.sudo(['hire']);

  const NAMES = Object.keys(COMMANDS);

  function distance(a: string, b: string) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  async function run(raw: string, echo = true) {
    const line = raw.trim();
    if (echo) render([{ text: `visitor@saim:${path()}$ `, cls: 't-prompt' }, { text: line, cls: 't-cmd' }], 'is-cmd');
    scrollDown();
    if (!line) return;
    if (history[history.length - 1] !== line) history.push(line);
    hIndex = -1;
    const [name, ...args] = line.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    if (cmd) {
      click();
      await cmd(args);
    } else {
      // A bare file or lab name works like cat / open.
      if (ROOT_FILES.includes(name)) return void (await print(cat(name)));
      const near = NAMES.map((n) => [n, distance(name.toLowerCase(), n)] as const).sort((x, y) => x[1] - y[1])[0];
      await print([
        {
          line: [
            { text: `command not found: ${name}`, cls: 't-err' },
            ...(near && near[1] <= 2 ? [{ text: '  did you mean ', cls: 't-muted' } as Part, { text: near[0], cls: 't-accent', run: near[0] } as Part, { text: '?', cls: 't-muted' } as Part] : []),
            ...(near && near[1] <= 2 ? [] : [{ text: '  type ', cls: 't-muted' } as Part, { text: 'help', cls: 't-accent', run: 'help' } as Part]),
          ],
        },
      ]);
    }
    scrollDown();
  }

  // ---------- completion ----------
  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    let pool: string[];
    const last = parts[parts.length - 1];
    if (parts.length === 1) pool = NAMES;
    else if (['cd', 'ls'].includes(parts[0])) pool = [...ROOT_DIRS, ...ROOT_DIRS.map((d) => `~/${d}`), ...data.categories.map((c) => `labs/${c.slug}`), '..'].concat(cwd[0] === 'labs' && cwd.length === 1 ? data.categories.map((c) => c.slug) : []);
    else if (parts[0] === 'cat') pool = [...ROOT_FILES, ...data.credentials.map((c) => `${c.id}.txt`), ...data.labs.map((l) => labShort(l.id, l.categorySlug))];
    else if (parts[0] === 'open') pool = ['cv', 'github', 'linkedin', 'campus', ...data.labs.map((l) => labShort(l.id, l.categorySlug))];
    else if (parts[0] === 'theme') pool = ['light', 'dark'];
    else if (parts[0] === 'sound') pool = ['on', 'off'];
    else return;
    const matches = pool.filter((p) => p.startsWith(last));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + (parts.length === 1 ? ' ' : '');
      tick();
    } else if (matches.length > 1) {
      // Extend to the common prefix, then list the options.
      let pre = matches[0];
      for (const m of matches) while (!m.startsWith(pre)) pre = pre.slice(0, -1);
      if (pre.length > last.length) {
        parts[parts.length - 1] = pre;
        input.value = parts.join(' ');
      } else {
        render([{ text: `visitor@saim:${path()}$ `, cls: 't-prompt' }, { text: v, cls: 't-cmd' }], 'is-cmd');
        render(matches.slice(0, 24).map((m) => ({ text: m + '  ', cls: 't-muted' })));
        scrollDown();
      }
    }
  }

  // ---------- input ----------
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      hint.hidden = true;
      run(v);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      if (!history.length) return;
      e.preventDefault();
      hIndex = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === 'ArrowDown') {
      if (hIndex < 0) return;
      e.preventDefault();
      hIndex = hIndex >= history.length - 1 ? -1 : hIndex + 1;
      input.value = hIndex < 0 ? '' : history[hIndex];
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear([]);
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      render([{ text: `visitor@saim:${path()}$ `, cls: 't-prompt' }, { text: input.value + '^C', cls: 't-cmd' }], 'is-cmd');
      input.value = '';
    }
  });

  // Clicking a command in the output or a chip runs it.
  el.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-run]');
    if (t) {
      e.preventDefault();
      run(t.dataset.run!);
      // Phones: don't pop the keyboard after a tap.
      if (window.matchMedia('(hover: hover)').matches) input.focus({ preventScroll: true });
      return;
    }
    // Clicking the screen focuses the prompt (unless the visitor is selecting text or following a link).
    if (!(e.target as HTMLElement).closest('a') && !window.getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  // ---------- boot ----------
  setPrompt();
  let booted = false;
  /**
   * A link like /?run=ls%20labs#terminal (used by the GitHub profile README) opens the shell and runs
   * that command. Only read-only commands are allowed: nothing that downloads, opens windows, changes
   * settings, or prints link-supplied text (no echo), so a crafted link can't make the site say anything.
   */
  function linkedCommand(): string | null {
    const raw = new URLSearchParams(location.search).get('run');
    if (!raw) return null;
    const v = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (v.length > 40 || !/^[a-z0-9 ._/-]+$/.test(v)) return null;
    const SAFE = ['help', 'about', 'whoami', 'skills', 'contact', 'certs', 'experience', 'labs', 'projects', 'ls', 'cat', 'pwd', 'date', 'hire', 'sudo'];
    const [name, ...args] = v.split(' ');
    if (!SAFE.includes(name)) return null;
    if (name === 'sudo' && args.join(' ') !== 'hire') return null;
    return v;
  }

  async function boot() {
    if (booted) return;
    booted = true;
    await print([
      [{ text: 'saim-shell 1.0', cls: 't-strong' }, { text: '  a command line for this portfolio', cls: 't-muted' }],
      muted('Type help, or click a command below.'),
    ]);
    const linked = linkedCommand();
    const cmd = linked ?? 'whoami';
    if (prefersReduced()) return run(cmd);
    // Type the first command like a person would.
    for (const ch of cmd) {
      input.value += ch;
      await new Promise((r) => setTimeout(r, motion.terminal.typeDelay));
    }
    await new Promise((r) => setTimeout(r, motion.terminal.afterType));
    input.value = '';
    await run(cmd);
  }
  // Arriving from a command link: start right away instead of waiting for the terminal to scroll into view
  // (on short screens the hash lands on the heading and the terminal would stay below the fold).
  if (linkedCommand()) {
    setTimeout(() => {
      scrollToTarget(el);
      boot();
    }, 350);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        boot();
      }
    },
    { threshold: 0.35 },
  );
  io.observe(el);
}
