#!/usr/bin/env python3
"""
triage.py - Zero-Latency Local System-1 Triage & Context Scoper
Workspace: Abdul Wahab Saim (CCNA 200-301 & Network Engineering Portfolio)

Features:
  - Zero-dependency: Pure Python 3 (standard library only, difflib, re, json, pathlib).
  - Sub-5ms execution on Intel Core i5 CPU without GPU, PyTorch, or ONNX overhead.
  - Scopes queries, CSS classes, HTML tags, or error logs to the exact file & line slice.
  - Formats ready-to-feed surgical prompt blocks for Antigravity or any LLM.

Usage:
  python3 scripts/triage.py "typewriter cursor blinking"
  python3 scripts/triage.py ".card-enterprise border glow"
  python3 scripts/triage.py "hsrp runbook slide drawer"
  python3 scripts/triage.py --inspect "src/css/modules/06-terminal.css"
"""

import sys
import os
import re
import argparse
from pathlib import Path
from difflib import SequenceMatcher

ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"
SECTIONS_DIR = SRC_DIR / "sections"
MODULES_DIR = SRC_DIR / "css" / "modules"
TOKENS_FILE = SRC_DIR / "css" / "tokens.css"

# Pre-indexed Component Knowledge Base
COMPONENT_REGISTRY = {
    # HTML Sections
    "00-header.html": {
        "path": SECTIONS_DIR / "00-header.html",
        "type": "html",
        "keywords": ["navbar", "nav", "header", "menu", "theme toggle", "cmd k", "command palette", "jump palette", "operator status", "mobile drawer", "brand", "logo"]
    },
    "01-hero.html": {
        "path": SECTIONS_DIR / "01-hero.html",
        "type": "html",
        "keywords": ["hero", "headline", "technical arsenal", "arsenal cards", "cli", "terminal", "console", "cisco cli", "typewriter", "cta", "resume download", "quick stats"]
    },
    "02-flagship.html": {
        "path": SECTIONS_DIR / "02-flagship.html",
        "type": "html",
        "keywords": ["flagship", "mega lab", "enterprise campus", "15-node", "topology viewer", "interactive topology", "bgp peering", "ospf area 0", "core distribution"]
    },
    "03-case-studies.html": {
        "path": SECTIONS_DIR / "03-case-studies.html",
        "type": "html",
        "keywords": ["case study", "case studies", "hsrp", "svi", "inter-vlan", "wan failover", "runbook", "sla", "root cause", "post-mortem", "packet tracer"]
    },
    "04-lab-directory.html": {
        "path": SECTIONS_DIR / "04-lab-directory.html",
        "type": "html",
        "keywords": ["lab directory", "directory", "search input", "protocol filters", "category pills", "ospf", "eigrp", "stp", "rstp", "acl", "nat", "vpn", "32 lab rows"]
    },
    "05-skills.html": {
        "path": SECTIONS_DIR / "05-skills.html",
        "type": "html",
        "keywords": ["skills", "skills matrix", "layer 2", "layer 3", "layer 4", "competencies", "routing", "switching", "network services", "wireshark", "automation"]
    },
    "06-credentials.html": {
        "path": SECTIONS_DIR / "06-credentials.html",
        "type": "html",
        "keywords": ["credentials", "certifications", "ccna", "csco15110282", "badge", "verification", "degree", "bscs", "cgpa", "3.58", "academics"]
    },
    "07-methodology.html": {
        "path": SECTIONS_DIR / "07-methodology.html",
        "type": "html",
        "keywords": ["methodology", "noc runbook", "6-stage", "deployment lifecycle", "troubleshooting workflow", "audit", "standard operating procedure", "sop"]
    },
    "08-contact.html": {
        "path": SECTIONS_DIR / "08-contact.html",
        "type": "html",
        "keywords": ["contact", "contact form", "email", "linkedin", "github profile", "pgp", "direct channels", "message", "inquiry"]
    },
    "09-footer-modals.html": {
        "path": SECTIONS_DIR / "09-footer-modals.html",
        "type": "html",
        "keywords": ["footer", "modals", "slide-over", "drawer", "modal backdrop", "copyright", "keyboard shortcuts modal", "topology modal"]
    },
    # Design Tokens
    "tokens.css": {
        "path": TOKENS_FILE,
        "type": "css_tokens",
        "keywords": ["tokens", "variables", "palette", "accent", "--bg", "--text", "--muted", "--card-border", "--font", "colors", "global styles"]
    },
    # CSS Modules
    "01-base.css": {
        "path": MODULES_DIR / "01-base.css",
        "type": "css",
        "keywords": ["reset", "typography baseline", "body", "html", "fonts", "section bands", "layout container", "global reset"]
    },
    "02-navbar.css": {
        "path": MODULES_DIR / "02-navbar.css",
        "type": "css",
        "keywords": ["navbar css", "nav styling", "nav-link", "sticky header", "blur header"]
    },
    "03-buttons.css": {
        "path": MODULES_DIR / "03-buttons.css",
        "type": "css",
        "keywords": ["button", "btn", "btn-primary", "btn-ghost", "hover state", "click ripple", "button padding", "cta button"]
    },
    "04-cards.css": {
        "path": MODULES_DIR / "04-cards.css",
        "type": "css",
        "keywords": ["card", "card-enterprise", "frosted acrylic", "glassmorphism", "card hover", "card border", "glow ring"]
    },
    "05-hero.css": {
        "path": MODULES_DIR / "05-hero.css",
        "type": "css",
        "keywords": ["hero css", "hero layout", "hero 50/50", "headline size", "candidate headline", "badge pill"]
    },
    "06-terminal.css": {
        "path": MODULES_DIR / "06-terminal.css",
        "type": "css",
        "keywords": ["terminal css", "cli shell", "typewriter", "cursor", "blinking cursor", "prompt green", "terminal header", "traffic dots"]
    },
    "07-flagship.css": {
        "path": MODULES_DIR / "07-flagship.css",
        "type": "css",
        "keywords": ["flagship css", "topology canvas", "slide deck", "mega lab layout"]
    },
    "08-case-studies.css": {
        "path": MODULES_DIR / "08-case-studies.css",
        "type": "css",
        "keywords": ["case studies css", "runbook drawer", "slide-over drawer", "sla badge", "case study card"]
    },
    "09-directory.css": {
        "path": MODULES_DIR / "09-directory.css",
        "type": "css",
        "keywords": ["directory css", "lab table", "protocol tag", "filter chips", "pagination", "search bar styling"]
    },
    "10-skills.css": {
        "path": MODULES_DIR / "10-skills.css",
        "type": "css",
        "keywords": ["skills css", "accordion", "proficiency bar", "skill tag"]
    },
    "11-theme.css": {
        "path": MODULES_DIR / "11-theme.css",
        "type": "css",
        "keywords": ["theme css", "dark mode", "light mode", "theme toggle animation", "contrast mode"]
    },
    "12-utilities.css": {
        "path": MODULES_DIR / "12-utilities.css",
        "type": "css",
        "keywords": ["utilities", "scrollbar", "tooltip", "back to top", "animations", "helpers"]
    }
}


def score_query_against_component(query: str, comp_name: str, comp_data: dict) -> float:
    """Computes a composite similarity score using keyword overlap, substring matching, and difflib."""
    query_lower = query.lower()
    terms = [t for t in re.split(r"[\s,\.\-_:/]+", query_lower) if len(t) > 2]
    score = 0.0

    # Direct filename match
    if comp_name.lower() in query_lower:
        score += 50.0

    # Keyword matching
    for kw in comp_data["keywords"]:
        kw_lower = kw.lower()
        if kw_lower in query_lower:
            score += 25.0
        else:
            for term in terms:
                if term in kw_lower:
                    score += 10.0
                else:
                    ratio = SequenceMatcher(None, term, kw_lower).ratio()
                    if ratio > 0.75:
                        score += ratio * 8.0

    return score


def search_content_matches(query: str):
    """Scans src/ files for exact keyword or selector occurrences."""
    matches = []
    # Extract likely selectors or tokens (e.g. .btn-primary, --bg, #hero, etc.)
    tokens = re.findall(r"[\.\#\-\_a-zA-Z0-9]{3,}", query)
    
    for comp_name, data in COMPONENT_REGISTRY.items():
        file_path = data["path"]
        if not file_path.exists():
            continue
        try:
            lines = file_path.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            continue

        for idx, line in enumerate(lines, 1):
            line_lower = line.lower()
            hit_count = 0
            for t in tokens:
                if t.lower() in line_lower:
                    hit_count += 1
            if hit_count > 0:
                matches.append({
                    "file": str(file_path.relative_to(ROOT_DIR)),
                    "comp_name": comp_name,
                    "line_num": idx,
                    "line": line.strip(),
                    "hits": hit_count
                })
    return matches


def extract_context_slice(file_path: Path, center_line: int, radius: int = 15) -> str:
    """Extracts a localized slice around the target line number."""
    lines = file_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    total_lines = len(lines)
    start = max(1, center_line - radius)
    end = min(total_lines, center_line + radius)

    sliced = []
    for i in range(start, end + 1):
        prefix = " > " if i == center_line else "   "
        sliced.append(f"{prefix}{i:4d} | {lines[i - 1]}")
    return "\n".join(sliced), start, end


def triage(query: str, max_results: int = 3, slice_radius: int = 15):
    """Executes the triage routing and outputs surgical LLM prompt context."""
    # 1. Semantic/Keyword Scoring
    ranked_comps = []
    for comp_name, comp_data in COMPONENT_REGISTRY.items():
        s = score_query_against_component(query, comp_name, comp_data)
        ranked_comps.append((s, comp_name, comp_data))
    ranked_comps.sort(key=lambda x: x[0], reverse=True)

    # 2. In-file text/selector matching
    content_matches = search_content_matches(query)
    content_matches.sort(key=lambda x: x["hits"], reverse=True)

    top_candidate = ranked_comps[0] if ranked_comps else None
    
    # Priority: If an exact selector/line was hit, pick that file
    target_file = None
    target_line = None
    if content_matches:
        best_hit = content_matches[0]
        target_file = ROOT_DIR / best_hit["file"]
        target_line = best_hit["line_num"]
    elif top_candidate and top_candidate[0] > 0:
        target_file = top_candidate[2]["path"]
        target_line = 1

    return {
        "query": query,
        "ranked_components": [(c[1], round(c[0], 2)) for c in ranked_comps[:max_results] if c[0] > 0],
        "content_matches": content_matches[:5],
        "target_file": str(target_file.relative_to(ROOT_DIR)) if target_file else None,
        "target_line": target_line,
        "slice_radius": slice_radius
    }


def main():
    parser = argparse.ArgumentParser(description="Zero-latency local component triage & scoping engine.")
    parser.add_argument("query", nargs="*", help="Bug report, selector, or feature request")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--lines", type=int, default=15, help="Context radius around target line")
    parser.add_argument("--inspect", type=str, help="Directly slice a specific file path")
    args = parser.parse_args()

    query_str = " ".join(args.query).strip()

    if args.inspect:
        target = ROOT_DIR / args.inspect
        if not target.exists():
            print(f"Error: {target} not found")
            sys.exit(1)
        slice_text, start, end = extract_context_slice(target, 1, radius=args.lines)
        print(f"\n📂 File: {args.inspect} (Lines {start}-{end})\n")
        print(slice_text)
        return

    if not query_str:
        parser.print_help()
        sys.exit(0)

    res = triage(query_str, slice_radius=args.lines)

    if args.json:
        import json
        print(json.dumps(res, indent=2))
        return

    print("=" * 65)
    print(" 🎯 SYSTEM-1 TRIAGE & CONTEXT SCOPER")
    print("=" * 65)
    print(f" Query: \"{query_str}\"")
    
    if res["target_file"]:
        print(f"\n📍 Primary Target: {res['target_file']}")
        if res["target_line"]:
            target_path = ROOT_DIR / res["target_file"]
            slice_text, start, end = extract_context_slice(target_path, res["target_line"], radius=args.lines)
            print(f"📏 Focused Slice: Lines {start} - {end} (Center: Line {res['target_line']})")
            print("-" * 65)
            print(slice_text)
            print("-" * 65)

    if res["ranked_components"]:
        print("\n🔍 Ranked Component Matches:")
        for name, score in res["ranked_components"]:
            print(f"   • {name:<25} (Confidence Score: {score})")

    if res["content_matches"]:
        print("\n⚡ Key Code Lines Found:")
        for hit in res["content_matches"][:3]:
            print(f"   • {hit['file']}:{hit['line_num']} => {hit['line'][:60]}")

    print("\n" + "=" * 65)
    print(" 💡 COPY-PASTE READY SURGICAL PROMPT FOR LLM:")
    print("=" * 65)
    print(f"Target File: {res['target_file']}")
    if res['target_line']:
        print(f"Target Lines: {start}-{end}")
    print(f"Request: {query_str}")
    print("Instruction: Apply surgical edit to the targeted block above, then run python3 scripts/build.py.")
    print("=" * 65)


if __name__ == "__main__":
    main()
