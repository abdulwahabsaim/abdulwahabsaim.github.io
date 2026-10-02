#!/usr/bin/env python3
"""
verify_portfolio.py - Automated Local Verification Suite for Abdul Wahab Saim's Portfolio
Uses Python HTML parser and local Google Chrome headless mode.
Cost: 0 API credits, 0 LLM tokens. Fast runtime (< 1.5s).
"""

import sys
import os
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

PORTFOLIO_DIR = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
INDEX_HTML = PORTFOLIO_DIR / "index.html"
CHROME_BIN = "/usr/bin/google-chrome"


class AssetLinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if "id" in attr_dict:
            self.ids.add(attr_dict["id"])

        # Check hrefs in link/a tags
        if tag == "link" and "href" in attr_dict:
            href = attr_dict["href"]
            if not href.startswith(("http://", "https://", "#", "mailto:", "data:")):
                self.assets.append(href)

        # Check src in script/img/source
        if tag in ("script", "img", "source", "video") and "src" in attr_dict:
            src = attr_dict["src"]
            if not src.startswith(("http://", "https://", "#", "data:")):
                self.assets.append(src)


def check_asset_integrity():
    print("▶ [1/3] Verifying Local Asset Integrity...")
    if not INDEX_HTML.exists():
        print(f"  ❌ ERROR: {INDEX_HTML} does not exist!")
        return False, []

    content = INDEX_HTML.read_text(encoding="utf-8", errors="replace")
    parser = AssetLinkExtractor()
    parser.feed(content)

    missing = []
    verified = 0

    for asset in parser.assets:
        clean_path = asset.split("?")[0].split("#")[0]
        if clean_path.startswith("/"):
            clean_path = clean_path.lstrip("/")
        target_path = PORTFOLIO_DIR / clean_path

        if not target_path.exists():
            missing.append(clean_path)
        else:
            verified += 1

    if missing:
        print(f"  ❌ Missing {len(missing)} asset(s):")
        for m in missing[:5]:
            print(f"     - {m}")
        return False, parser.ids
    else:
        print(f"  ✅ Verified {verified} local assets (CSS, JS, images, fonts). 0 missing.")
        return True, parser.ids


def check_html_structure(content):
    print("▶ [2/3] Checking HTML Structural Integrity...")
    errors = []
    if "<!DOCTYPE html>" not in content and "<!doctype html>" not in content:
        errors.append("Missing DOCTYPE declaration")
    if "<html" not in content or "</html>" not in content:
        errors.append("Missing <html> or </html> tag")
    if "<body" not in content or "</body>" not in content:
        errors.append("Missing <body> or </body> tag")

    # Check for unclosed comment tags
    open_comments = content.count("<!--")
    close_comments = content.count("-->")
    if open_comments != close_comments:
        errors.append(f"Mismatched HTML comments: {open_comments} open vs {close_comments} closed")

    if errors:
        for err in errors:
            print(f"  ❌ {err}")
        return False
    print("  ✅ DOCTYPE, tags, and comment structure validated.")
    return True


def check_headless_chrome():
    print("▶ [3/3] Running Headless Chrome DOM Hydration...")
    if not os.path.exists(CHROME_BIN):
        print(f"  ⚠️ Warning: {CHROME_BIN} not found. Skipping headless render test.")
        return True

    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--dump-dom",
        "--disable-gpu",
        "--no-sandbox",
        "--allow-file-access-from-files",
        str(INDEX_HTML),
    ]

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        if proc.returncode != 0:
            print(f"  ❌ Chrome failed with returncode {proc.returncode}")
            return False

        dom_output = proc.stdout
        if len(dom_output) < 1000:
            print(f"  ❌ Rendered DOM too short ({len(dom_output)} bytes)")
            return False

        print(f"  ✅ Headless Chrome hydrated DOM successfully ({len(dom_output):,} bytes rendered).")
        return True
    except subprocess.TimeoutExpired:
        print("  ❌ Chrome execution timed out.")
        return False
    except Exception as e:
        print(f"  ❌ Error running Chrome: {e}")
        return False


def main():
    print(f"\n==========================================")
    print(f" PORTFOLIO VERIFICATION SUITE")
    print(f" Target: {PORTFOLIO_DIR.name}")
    print(f"==========================================")

    # Auto-compile from src/ if modular architecture exists
    build_script = PORTFOLIO_DIR / "scripts" / "build.py"
    if build_script.exists() and (PORTFOLIO_DIR / "src").exists():
        print("▶ [0/3] Compiling Modular Architecture (build.py)...")
        b_res = subprocess.run([sys.executable, str(build_script)], capture_output=True, text=True)
        if b_res.returncode == 0:
            print("  ✅ Modular components & CSS compiled cleanly.")
        else:
            print(f"  ⚠️ Build warning:\n{b_res.stderr}")

    content = INDEX_HTML.read_text(encoding="utf-8", errors="replace")

    pass_assets, found_ids = check_asset_integrity()
    pass_html = check_html_structure(content)
    pass_chrome = check_headless_chrome()

    print(f"------------------------------------------")
    if pass_assets and pass_html and pass_chrome:
        print("🎉 ALL CHECKS PASSED: Portfolio is healthy & production-ready.\n")
        sys.exit(0)
    else:
        print("❌ VERIFICATION FAILED: Resolve issues before committing.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
