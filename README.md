# Abdul Wahab Saim — CCNA-certified Network & NOC Engineer Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-abdulwahabsaim.github.io-4C8DFF?style=flat-square&logo=github)](https://abdulwahabsaim.github.io)
[![CCNA](https://img.shields.io/badge/Cisco-CCNA_200--301-1BA0D7?style=flat-square&logo=cisco)](https://www.cisco.com/go/verifycertificate)
[![Location](https://img.shields.io/badge/Location-Goes,_Netherlands-22D3EE?style=flat-square)](https://maps.app.goo.gl/Goes)

---

## Overview

Enterprise network engineering portfolio showcasing **32 documented Cisco IOS labs** across routing, switching, Layer 2 security, and network services. Built to demonstrate hands-on CCNA-level competencies to hiring teams at NOC and junior network roles in the Netherlands.

**Live at → [abdulwahabsaim.github.io](https://abdulwahabsaim.github.io)**

---

## Lab Coverage

| Category | Labs |
|---|---|
| Routing (OSPF, EIGRP, RIP, GRE, NAT) | 13 labs |
| Layer 2 Security (STP, VLAN, ACL, DAI) | 13 labs |
| Network Services (DHCP, DNS, NTP, WLC) | 5 labs |
| Flagship Campus (15-node enterprise) | 1 mega-lab |

---

## Tech Stack

- **Pure static HTML/CSS/JS** — zero frameworks, zero npm, zero runtime dependencies
- **Modular build system** — `scripts/build.py` compiles `src/` → `index.html` + `css/portfolio.css` in < 15ms
- **Hosted on GitHub Pages** — zero-cost, zero-config deployment

---

## Project Structure

```
abdulwahabsaim.github.io/
│
├── index.html                  ← Compiled entry point (GitHub Pages)
├── favicon.svg / apple-touch-icon.png
├── robots.txt / sitemap.xml
├── .gitignore
│
├── css/
│   ├── portfolio.css           ← Compiled CSS bundle (build output)
│   └── tokens.css              ← Design tokens (build output)
│
├── js/
│   ├── portfolio.js            ← Main interaction engine (~3,000 lines)
│   └── projects-data.js        ← Lab data registry (32 labs)
│
├── assets/
│   ├── Abdul-Wahab-Saim-CV.pdf ← Resume
│   ├── portfolio-preview.jpg   ← OG/Twitter card image
│   └── labs/                   ← 32 × topology PNGs
│
├── src/                        ← Source of truth (edit here)
│   ├── layout/base.html        ← HTML shell & head
│   ├── sections/               ← 10 modular section components
│   └── css/
│       ├── tokens.css          ← Design token definitions
│       ├── modules/            ← 12 desktop CSS modules
│       └── mobile/             ← 10 dedicated mobile CSS modules
│
├── data/                       ← Source data
│   ├── portfolio.json
│   └── projects.json
│
├── scripts/                    ← Dev tooling
│   ├── build.py                ← Zero-dependency compiler
│   ├── verify_portfolio.py     ← Headless Chrome verification suite
│   ├── triage.py               ← CSS/HTML search & scope tool
│   └── build_projects_data.py  ← Lab data generator
│
└── docs/                       ← Internal documentation
    ├── DESIGN.md               ← Design system & token spec
    └── ARCHITECTURE.md         ← Modular architecture guide
```

---

## Local Development

```bash
# Build the site (< 15ms)
python3 scripts/build.py

# Watch for changes and auto-rebuild
python3 scripts/build.py --watch

# Run verification suite (HTML integrity + headless Chrome)
python3 scripts/verify_portfolio.py

# Search for a CSS class or HTML element across src/
python3 scripts/triage.py "mobile-floating-dock"
```

---

## Contact

| | |
|---|---|
| **Email** | abdulwahabsaim58.nl@gmail.com |
| **LinkedIn** | [linkedin.com/in/abdulwahabsaim](https://linkedin.com/in/abdulwahabsaim) |
| **GitHub** | [github.com/abdulwahabsaim](https://github.com/abdulwahabsaim) |
| **Location** | Goes, Zeeland, Netherlands 🇳🇱 |
| **CCNA** | CSCO15110282 — [Verify](https://www.cisco.com/go/verifycertificate) |

---

*Authorised to work in the Netherlands · Available immediately*
