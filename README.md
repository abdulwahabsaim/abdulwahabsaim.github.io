# abdulwahabsaim.github.io

Portfolio of **Abdul Wahab Saim**, CCNA-certified junior network engineer in the Netherlands.
32 documented Cisco labs plus Cisco ASA firewall labs in progress, each with its own page.

Live: https://abdulwahabsaim.github.io

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | [Astro 7](https://astro.build) | Ships plain HTML, CSS and a little JS. Generates one page per lab from Markdown. |
| Styling | Plain CSS with design tokens | Every colour, radius, spacing and easing lives in `src/styles/tokens.css`. |
| Motion | GSAP + ScrollTrigger, Lenis | Scroll-driven tunnel, sticky stack, process wave and timeline. Lenis smooths desktop wheel scrolling only. |
| Fonts | Geist and Geist Mono (self-hosted via Fontsource) | No third-party font requests. |
| Icons | Phosphor and Simple Icons via `astro-icon` | Inlined SVG at build time. |
| Hosting | GitHub Pages via GitHub Actions | Rebuilds on push and once a day to refresh the GitHub heatmap. |

Node 22.23.4 or newer is required (`.nvmrc` pins 26).

## Commands

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run sync:labs
```

```bash
npm run sync:github
```

- `dev` starts the site at http://localhost:4321.
- `build` writes the static site to `dist/`.
- `sync:labs` regenerates `src/content/labs/` and the topology images from the five lab repositories next to this folder. Run it after changing a lab README.
- `sync:github` refreshes the contribution heatmap snapshot in `src/data/github.json`. CI runs it before every build.

## Where to change things

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Short version:

- Copy, facts, credentials, experience, toolbox: `src/data/site.ts`
- Colours, fonts, radii, spacing: `src/styles/tokens.css`
- Motion numbers (tunnel depth, dot radius, scroll smoothing, sound volume): `src/config/motion.ts`
- Lab names and tags: the `CURATED` map in `scripts/sync-labs.mjs`, then `npm run sync:labs`
- CV: replace `public/Abdul-Wahab-Saim-CV.pdf`

## Deploying

The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup in the GitHub repository: **Settings, Pages, Build and deployment, Source: GitHub Actions**.
