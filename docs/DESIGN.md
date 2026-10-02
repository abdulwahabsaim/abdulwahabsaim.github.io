# DESIGN SYSTEM SPECIFICATION (DESIGN.md)
# Project: Abdul Wahab Saim — NOC & Network Engineering Portfolio
# Aesthetic: Dark-First Ink-Blue Engineering & High-Precision Telemetry

## 1. Core Brand Color Tokens (Referenced from `css/tokens.css`)
All portfolio styles must consume these CSS variables. Do not hardcode arbitrary hex colors.

| Token | Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--bg` | `#070B13` | Primary page ink (Deep Dark Blue-Black) |
| `--bg-2` | `#0A101C` | Alternating section bands / Header backgrounds |
| `--panel` | `#0E1524` | Default card and module panels |
| `--panel-2` | `#121B2E` | Raised / interactive / hover state panels |
| `--line` | `rgba(148,163,184,.14)` | Subtle structural divider / border |
| `--line-strong`| `rgba(148,163,184,.28)` | Focus borders and active states |
| `--text` | `#EAF0FA` | High-contrast primary headings and data points |
| `--text-2` | `#B4BFD3` | Body copy and descriptions (>= 7:1 contrast on `--bg`) |
| `--muted` | `#8593AB` | Secondary captions, timestamps, and metadata |
| `--accent` | `#4C8DFF` | Cisco Signal Blue (Primary action & focus) |
| `--accent-2` | `#22D3EE` | Cyan (Gradients and telemetry accents) |
| `--ok` | `#34D399` | Matrix Green (Verified protocols, UP interfaces, 100% tests) |
| `--warn` | `#F5B544` | Amber (Warning, transit, or failover states) |

---

## 2. Typography
* **Display / Headings**: `'Space Grotesk', system-ui, sans-serif` (Bold, clean, technical)
* **Body Copy**: `'Inter', -apple-system, sans-serif` (Crisp readability, 1.5–1.6 line height)
* **Code / CLI / Telemetry**: `'JetBrains Mono', monospace` (Subnetting, Cisco CLI, IP addresses)

---

## 3. Anti-"AI Slop" Directives (Zero Generic Templates)
1. **No Generic Purple "AI" Gradients**: All primary accents use Signal Blue (`#4C8DFF`) with subtle Cyan (`#22D3EE`) highlights.
2. **No Bloated Card Grids**: Use structured engineering cards with explicit badge tags (`OSPF`, `BGP`, `VLAN`, `HSRP`), clean 1px borders, and monospace telemetry badges.
3. **No Unstyled Default Inputs**: All search bars, CIDR inputs, and filter toggles must feature dark panel styling (`--panel`), mono font, and `--accent` focus rings.
4. **Touch Snap-Scroll Carousels**: Lab showcases must utilize native CSS snap scrolling (`scroll-snap-type: x mandatory` with smooth deceleration) for high mobile performance.
5. **60fps Micro-Interactions**: Micro-animations must use CSS transitions with `cubic-bezier(.16, 1, .3, 1)`. Avoid heavy JavaScript re-paints.

---

## 4. Key Interactive Components
* **NOC Telemetry Bar**: Real-time status indicators (System UP, Latency < 1ms, Packet Loss 0%).
* **Interactive Cisco IOS CLI**: Embedded simulated terminal for recruiters to test `show ip route` and `show run`.
* **CIDR Subnet Calculator**: Monospace utility allowing instant calculation of network/broadcast/usable IPs.
* **Network Topology Canvas**: High-contrast SVG/Canvas diagram visualizing multi-area OSPF and core enterprise routing.
