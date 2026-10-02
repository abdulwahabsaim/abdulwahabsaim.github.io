# Modular Component Architecture & Structural Design System
**Candidate**: Abdul Wahab Saim (CCNA 200-301 & Network Engineering Portfolio)  
**Workspace**: `/home/abdul-wahab/1. Saim/Academics/github/portfolio-redesign`

---

## 1. Overview & Core Philosophy

Instead of working inside a single monolith file (`index.html` with 1,700+ lines and `portfolio.css` with 2,200+ lines), the portfolio is split into **independent, single-purpose section components** and a **centralized design token foundation**.

- **Surgical Changes**: When editing a section (e.g., Hero, Case Studies, Lab Directory), edit only that component file (50–200 lines).
- **Universal Visual Hierarchy**: All components inherit tokens from the structural base design file (`src/css/tokens.css`).
- **Zero-Dependency Engine**: Built-in Python compiler (`scripts/build.py`) builds the entire site in **< 10ms** with zero npm/webpack dependencies.
- **GitHub Pages Ready**: Produces standalone, self-contained `index.html` and `css/portfolio.css`.

---

## 2. Directory Structure

```text
portfolio-redesign/
├── src/                                  # 🧩 SOURCE OF TRUTH (Edit here!)
│   ├── layout/
│   │   └── base.html                     # HTML skeleton (<head>, meta, <body> shell)
│   ├── sections/                         # 📑 Independent Section Components
│   │   ├── 00-header.html                # Navbar, operator status, ⌘K trigger, theme toggle
│   │   ├── 01-hero.html                  # 50/50 hero, headline, CTAs, Arsenal cards, Cisco CLI
│   │   ├── 02-flagship.html              # 15-node enterprise campus mega-lab showcase
│   │   ├── 03-case-studies.html          # HSRP, Inter-VLAN SVI, WAN failover runbooks
│   │   ├── 04-lab-directory.html         # Search input, category pills, protocol filter chips
│   │   ├── 05-skills.html                # Skills matrix, Layer 2–4 competencies
│   │   ├── 06-credentials.html           # Cisco CCNA CSCO15110282, badge, degree verification
│   │   ├── 07-methodology.html           # NOC runbook protocols, 6-stage lifecycle
│   │   ├── 08-contact.html               # Contact form, professional channels, PGP/socials
│   │   └── 09-footer-modals.html         # Footer, slide-over drawer, topology viewer modal
│   └── css/
│       ├── tokens.css                    # 🎨 STRUCTURAL BASE DESIGN FILE (Global variables)
│       └── modules/                      # 🎨 Modular CSS Files
│           ├── 01-base.css               # Reset, typography baseline, section bands
│           ├── 02-navbar.css             # Navigation bar, mobile drawer, active indicator
│           ├── 03-buttons.css            # Primary, ghost, interactive feedback
│           ├── 04-cards.css              # Frosted acrylic (.card-enterprise), glow rings
│           ├── 05-hero.css               # 50/50 hero layout, candidate headline, console switch
│           ├── 06-terminal.css           # Live Cisco IOS CLI shell, typewriter effect
│           ├── 07-flagship.css           # Topology canvas, presentation slide deck
│           ├── 08-case-studies.css       # Case study cards & slide-over runbook drawer
│           ├── 09-directory.css          # Lab directory table, protocol tags, filters
│           ├── 10-skills.css             # Skills accordion & proficiency bars
│           ├── 11-theme.css              # Light & dark theme high-contrast adjustments
│           └── 12-utilities.css          # Badges, tooltips, back-to-top, scrollbars
├── scripts/
│   ├── build.py                          # ⚡ Instant compiler (< 10ms) & watcher
│   ├── verify_portfolio.py               # 🧪 Headless Chrome DOM & asset verification suite
│   └── build_projects_data.py            # Lab directory JSON generator
├── css/                                  # 📦 Built production CSS
│   ├── tokens.css
│   └── portfolio.css
└── index.html                            # 📦 Built production HTML (Do not edit directly)
```

---

## 3. How to Make Changes

### A. Major Global Style Changes (Colors, Buttons, Typography, Cards)
Edit the **Structural Base Design File**:  
👉 [`src/css/tokens.css`](file:///home/abdul-wahab/1.%20Saim/Academics/github/portfolio-redesign/src/css/tokens.css)

All components share these CSS custom properties:
- **Palette**: `--bg`, `--bg-2`, `--panel`, `--text`, `--muted`, `--accent`, `--ok`, `--warn`.
- **Buttons**: `--btn-primary-bg`, `--btn-primary-hover`, `--btn-primary-text`, `--btn-radius`.
- **Cards & Boxes**: `--card-radius`, `--card-backdrop-blur`, `--card-border`, `--card-shadow`.
- **Hero Headline**: `--hero-name-size`, `--hero-name-weight`, `--hero-name-color`.

Modifying a variable in `tokens.css` updates the entire website instantly while preserving the dark-first engineering aesthetic.

### B. Section-Specific HTML Changes
Open the corresponding single component in `src/sections/`:
- **Change hero text, candidate name, or CLI commands**: [`src/sections/01-hero.html`](file:///home/abdul-wahab/1.%20Saim/Academics/github/portfolio-redesign/src/sections/01-hero.html)
- **Change navigation links or navbar buttons**: [`src/sections/00-header.html`](file:///home/abdul-wahab/1.%20Saim/Academics/github/portfolio-redesign/src/sections/00-header.html)
- **Update CCNA credential verification or dates**: [`src/sections/06-credentials.html`](file:///home/abdul-wahab/1.%20Saim/Academics/github/portfolio-redesign/src/sections/06-credentials.html)
- **Edit contact info or channels**: [`src/sections/08-contact.html`](file:///home/abdul-wahab/1.%20Saim/Academics/github/portfolio-redesign/src/sections/08-contact.html)

### C. Section-Specific CSS Changes
Open the corresponding CSS module in `src/css/modules/`:
- **Acrylic card glow or borders**: `04-cards.css`
- **CLI terminal colors or cursor**: `06-terminal.css`
- **Hero column alignment**: `05-hero.css`
- **Slide-over drawer**: `08-case-studies.css`

---

## 4. Compiling & Development Commands

1. **One-Time Build** (< 10ms):
   ```bash
   python3 scripts/build.py
   ```
2. **Auto-Rebuild on File Save** (Watcher mode):
   ```bash
   python3 scripts/build.py --watch
   ```
3. **Automated Verification Suite** (Compiles + Verifies Assets + DOM Hydration):
   ```bash
   python3 scripts/verify_portfolio.py
   ```
4. **Jev Autonomous Quality Gate**:
   ```bash
   python3 "/home/abdul-wahab/1. Saim/Academics/github/.agents/scripts/jev_engine.py" audit-portfolio "/home/abdul-wahab/1. Saim/Academics/github/portfolio-redesign"
   ```
