#!/usr/bin/env python3
"""
build.py - High-Speed Zero-Dependency Modular Portfolio Compiler
Workspace: Abdul Wahab Saim (CCNA 200-301 & Network Engineering Portfolio)

Compiles:
  src/sections/*.html + src/layout/base.html  -->  index.html
  src/css/tokens.css + src/css/modules/*.css  -->  css/portfolio.css

Usage:
  python3 scripts/build.py          # One-time build (< 25ms)
  python3 scripts/build.py --watch  # Continuous auto-rebuild on file save
"""

import sys
import os
import time
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"
SECTIONS_DIR = SRC_DIR / "sections"
LAYOUT_DIR = SRC_DIR / "layout"
CSS_SRC_DIR = SRC_DIR / "css"

OUTPUT_HTML = ROOT_DIR / "index.html"
OUTPUT_CSS = ROOT_DIR / "css" / "portfolio.css"
TOKENS_CSS = ROOT_DIR / "css" / "tokens.css"


def build_html():
    base_file = LAYOUT_DIR / "base.html"
    if not base_file.exists():
        print(f"❌ Error: {base_file} does not exist.")
        return False

    content = base_file.read_text(encoding="utf-8")

    # Match all placeholders like <!-- {{00-header}} -->
    placeholder_pattern = re.compile(r"<!--\s*\{\{([a-zA-Z0-9_\-]+)\}\}\s*-->")
    matches = placeholder_pattern.findall(content)

    for placeholder in matches:
        target_section = SECTIONS_DIR / f"{placeholder}.html"
        if target_section.exists():
            sec_html = target_section.read_text(encoding="utf-8")
            content = content.replace(f"<!-- {{{{{placeholder}}}}} -->", sec_html)
        else:
            print(f"⚠️ Warning: Missing section component {target_section.name}")

    OUTPUT_HTML.write_text(content, encoding="utf-8")
    return True


def build_css():
    modules_dir = CSS_SRC_DIR / "modules"
    mobile_dir = CSS_SRC_DIR / "mobile"
    if not modules_dir.exists():
        return False

    css_parts = []
    
    # Base tokens first
    src_tokens = CSS_SRC_DIR / "tokens.css"
    if src_tokens.exists():
        tokens_text = src_tokens.read_text(encoding="utf-8")
        css_parts.append(f"/* === MASTER DESIGN TOKENS === */\n" + tokens_text)
        TOKENS_CSS.write_text(tokens_text, encoding="utf-8")

    # Ordered baseline CSS modules
    modules = sorted(modules_dir.glob("*.css"))
    for mod in modules:
        mod_content = mod.read_text(encoding="utf-8")
        css_parts.append(f"\n/* === MODULE: {mod.name} === */\n" + mod_content)

    # Dedicated 1:1 Section Mobile Modules
    if mobile_dir.exists():
        mobile_modules = sorted(mobile_dir.glob("*.css"))
        for m_mod in mobile_modules:
            m_content = m_mod.read_text(encoding="utf-8")
            css_parts.append(f"\n/* === DEDICATED MOBILE MODULE: {m_mod.name} === */\n" + m_content)

    if css_parts:
        bundled_css = "\n".join(css_parts)
        OUTPUT_CSS.write_text(bundled_css, encoding="utf-8")
    return True


def run_build():
    start = time.perf_counter()
    html_ok = build_html()
    css_ok = build_css()
    elapsed_ms = (time.perf_counter() - start) * 1000

    if html_ok and css_ok:
        print(f"⚡ [BUILD SUCCESS] Compiled in {elapsed_ms:.1f}ms")
        print(f"   ↳ HTML: {OUTPUT_HTML.relative_to(ROOT_DIR)} ({OUTPUT_HTML.stat().st_size:,} bytes)")
        print(f"   ↳ CSS:  {OUTPUT_CSS.relative_to(ROOT_DIR)} ({OUTPUT_CSS.stat().st_size:,} bytes)")
        return True
    else:
        print("❌ [BUILD FAILED]")
        return False


def watch():
    print("👀 Watching 'src/' for changes... (Press Ctrl+C to stop)")
    run_build()

    last_mtimes = {}
    while True:
        try:
            changed = False
            for p in SRC_DIR.rglob("*"):
                if p.is_file():
                    mtime = p.stat().st_mtime
                    if p not in last_mtimes or last_mtimes[p] != mtime:
                        last_mtimes[p] = mtime
                        changed = True

            if changed:
                print(f"\n🔄 File change detected at {time.strftime('%H:%M:%S')}")
                run_build()

            time.sleep(0.3)
        except KeyboardInterrupt:
            print("\n👋 Stopped watching.")
            break


if __name__ == "__main__":
    if "--watch" in sys.argv:
        watch()
    else:
        success = run_build()
        sys.exit(0 if success else 1)
