#!/usr/bin/env python3
"""
=============================================================================
PORTFOLIO PROJECT DATA COMPILER & GITHUB REPO INGESTOR
Extracts all 32 networking labs from Abdul Wahab Saim's local repositories:
1. cisco-enterprise-campus-mega-lab
2. enterprise-routing-labs (13 labs)
3. layer2-security-labs (13 labs)
4. network-services-labs (5 labs)

Generates:
- portfolio-redesign/data/projects.json
- portfolio-redesign/js/projects-data.js (Zero-CORS offline client script)
- Copies topology screenshots to portfolio-redesign/assets/labs/<slug>/
=============================================================================
"""

import os
import sys
import glob
import re
import json
import shutil

ROOT_DIR = "/home/abdul-wahab/1. Saim/Academics/github"
OUTPUT_DIR = os.path.join(ROOT_DIR, "portfolio-redesign")
DATA_DIR = os.path.join(OUTPUT_DIR, "data")
JS_DIR = os.path.join(OUTPUT_DIR, "js")
ASSETS_DIR = os.path.join(OUTPUT_DIR, "assets", "labs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(JS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

REPOS_CONFIG = [
    {
        "id": "cisco-enterprise-campus-mega-lab",
        "category": "Flagship Campus",
        "category_slug": "campus",
        "github_url": "https://github.com/abdulwahabsaim/cisco-enterprise-campus-mega-lab",
        "is_single_lab": True
    },
    {
        "id": "enterprise-routing-labs",
        "category": "Enterprise Routing",
        "category_slug": "routing",
        "github_url": "https://github.com/abdulwahabsaim/enterprise-routing-labs",
        "is_single_lab": False
    },
    {
        "id": "layer2-security-labs",
        "category": "Layer 2 Security",
        "category_slug": "security",
        "github_url": "https://github.com/abdulwahabsaim/layer2-security-labs",
        "is_single_lab": False
    },
    {
        "id": "network-services-labs",
        "category": "Network Services",
        "category_slug": "services",
        "github_url": "https://github.com/abdulwahabsaim/network-services-labs",
        "is_single_lab": False
    }
]


def clean_title(raw_title: str) -> str:
    # Strip markdown headers, emojis, badges
    t = re.sub(r'^#+\s*', '', raw_title)
    t = re.sub(r'[\U00010000-\U0010ffff]', '', t)  # emojis
    t = re.sub(r'[🛡️🗺️📊🎯🛠️🧰⚡📦🏆📑📌🔹✅]', '', t)
    t = re.sub(r'\[!\[.*?\]\(.*?\)\]\(.*?\)', '', t)
    t = t.strip()
    return t


def extract_section(content: str, section_names: list) -> str:
    lines = content.split('\n')
    capturing = False
    result = []
    current_level = 2

    for line in lines:
        header_match = re.match(r'^(#{1,4})\s+(.+)$', line)
        if header_match:
            hashes, title = header_match.groups()
            level = len(hashes)
            clean_hdr = title.lower()
            
            if any(name.lower() in clean_hdr for name in section_names):
                capturing = True
                current_level = level
                continue
            elif capturing and level <= current_level:
                # Next major section reached
                break

        if capturing:
            result.append(line)

    return '\n'.join(result).strip()


def parse_lab(repo_path: str, lab_folder: str, category: str, category_slug: str, repo_github: str, lab_num: int = 1) -> dict:
    folder_abs = os.path.join(repo_path, lab_folder) if lab_folder else repo_path
    readme_path = os.path.join(folder_abs, "README.md")
    
    slug = f"{category_slug}-{lab_folder}" if lab_folder else category_slug
    slug = re.sub(r'[^a-zA-Z0-9_\-]', '-', slug).lower()

    title = lab_folder.replace('-', ' ').title() if lab_folder else os.path.basename(repo_path).replace('-', ' ').title()
    summary = ""
    problem_and_fix = ""
    table_content = ""
    verification_content = ""
    configs = []
    pkt_file = ""

    # Check for .pkt file
    all_files = os.listdir(folder_abs) if os.path.exists(folder_abs) else []
    for f in all_files:
        if f.endswith('.pkt'):
            pkt_file = f
        elif f.endswith(('.ios', '.cfg')):
            configs.append(f)

    # Topology image resolution
    topo_src = None
    if os.path.exists(os.path.join(folder_abs, "topology.png")):
        topo_src = os.path.join(folder_abs, "topology.png")
    else:
        # Search for any png in folder
        pngs = [os.path.join(folder_abs, f) for f in all_files if f.lower().endswith(('.png', '.jpg')) and not f.startswith('.')]
        if pngs:
            topo_src = sorted(pngs)[0]

    # Target asset path in portfolio
    dest_img_rel = f"assets/labs/{slug}/topology.png"
    dest_img_abs = os.path.join(OUTPUT_DIR, dest_img_rel)
    os.makedirs(os.path.dirname(dest_img_abs), exist_ok=True)

    if topo_src and os.path.exists(topo_src):
        try:
            shutil.copyfile(topo_src, dest_img_abs)
        except Exception as e:
            print(f"Warning: could not copy {topo_src}: {e}")
    else:
        dest_img_rel = "assets/labs/default_topology.png"

    # Tags extraction
    tags = []

    # Read and parse README.md
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Extract title
        first_h1 = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if first_h1:
            title = clean_title(first_h1.group(1))

        # Extract summary / Executive Summary
        exec_sum = extract_section(content, ["Executive Summary", "Overview", "Introduction", "Engineering Objectives"])
        if exec_sum:
            # Clean summary to 2-3 sentences
            clean_sum = re.sub(r'```.*?```', '', exec_sum, flags=re.DOTALL)
            clean_sum = re.sub(r'!\[.*?\]\(.*?\)', '', clean_sum)
            clean_sum = re.sub(r'<.*?>', '', clean_sum)
            lines = [l.strip() for l in clean_sum.split('\n') if l.strip() and not l.strip().startswith('|') and not l.strip().startswith('#')]
            summary = ' '.join(lines[:3])
            summary = summary[:260] + ('...' if len(summary) > 260 else '')

        # Extract Problem & Fix / Key Concepts / Troubleshooting
        problem_fix = extract_section(content, ["Key High-Availability Concepts", "Problem", "Root Cause", "Troubleshooting", "Key Concepts Explained", "NOC Diagnostic", "Architectural Deep Dive"])
        if problem_fix:
            problem_and_fix = problem_fix[:1500]

        # Extract Addressing Table
        table_match = re.search(r'(\|.*?\n\|[-:\s|]+\n(?:\|.*?\n)+)', content)
        if table_match:
            table_content = table_match.group(1)

        # Extract Verification Section
        verif_section = extract_section(content, ["Verification", "Real-World Failover Test Matrix", "Command Reference", "CLI Output", "Validation"])
        if verif_section:
            verification_content = verif_section[:1500]

        # Extract Protocol Tags
        protocol_badges = re.findall(r'Protocol-([A-Za-z0-9_\-\+]+)', content)
        if protocol_badges:
            cleaned_badges = []
            for b in protocol_badges:
                b_clean = re.sub(r'-[0-9a-fA-F]{6}$', '', b)
                b_clean = re.sub(r'-(?:brightgreen|green|blue|red|orange|success|informational)$', '', b_clean)
                b_clean = b_clean.replace('_', ' ').strip()
                if b_clean:
                    cleaned_badges.append(b_clean)
            tags.extend(cleaned_badges)

    # Clean markdown formatting in title and summary
    title = clean_title(title).replace('**', '').strip()
    if not summary:
        summary = f"Production Cisco IOS-XE networking lab covering {title} with end-to-end Packet Tracer simulation and CLI telemetry verification."
    else:
        summary = summary.replace('**', '').replace('`', '').strip()

    # Protocol heuristics based on title/folder
    folder_str = (lab_folder + " " + title).lower()
    auto_tags = []
    if "ospf" in folder_str: auto_tags.extend(["OSPFv2", "Area 0/1", "LSA Types"])
    if "eigrp" in folder_str: auto_tags.extend(["EIGRP AS 7", "DUAL Metric", "Feasible Successor"])
    if "hsrp" in folder_str: auto_tags.extend(["HSRPv2", "Virtual VIP", "Preempt Failover"])
    if "vlan" in folder_str or "svi" in folder_str: auto_tags.extend(["802.1Q Trunk", "Inter-VLAN SVI", "VTPv3"])
    if "stp" in folder_str or "root-guard" in folder_str: auto_tags.extend(["STP Root Guard", "BPDU Guard", "Loop Guard"])
    if "port-security" in folder_str: auto_tags.extend(["Port Security", "Sticky MAC", "Err-Disable"])
    if "dai" in folder_str: auto_tags.extend(["DAI", "ARP Poisoning Mitigation", "Trusted Uplink"])
    if "dhcp" in folder_str and "snooping" in folder_str: auto_tags.extend(["DHCP Snooping", "Rogue Server Filter", "Binding DB"])
    if "etherchannel" in folder_str: auto_tags.extend(["LACP 802.3ad", "PAgP", "PortChannel"])
    if "acl" in folder_str: auto_tags.extend(["Extended ACL", "Stateful Filtering", "Port 80/443"])
    if "wlc" in folder_str or "wireless" in folder_str: auto_tags.extend(["Cisco 3504 WLC", "CAPWAP Mobility", "FlexConnect"])
    if "ntp" in folder_str: auto_tags.extend(["NTP Stratum 2", "MD5 Authentication", "Clock Sync"])
    if "syslog" in folder_str: auto_tags.extend(["Syslog Trap 6", "UDP 514", "Telemetry Log"])
    if "gre" in folder_str: auto_tags.extend(["GRE Tunnel", "OSPF Over GRE", "Keepalive"])
    if "nat" in folder_str or "pat" in folder_str: auto_tags.extend(["PAT Overload", "NAT Pool", "RFC 1918"])
    if "qos" in folder_str: auto_tags.extend(["Modular QoS CLI", "DSCP EF", "Bandwidth Guarantee"])
    if "ipv6" in folder_str: auto_tags.extend(["IPv6 Dual-Stack", "SLAAC", "EUI-64"])

    final_tags = list(dict.fromkeys(tags + auto_tags))[:5]
    if not final_tags:
        final_tags = ["Cisco IOS-XE", "Packet Tracer", "CLI Verified"]

    github_folder_url = f"{repo_github}/tree/main/{lab_folder}" if lab_folder else repo_github

    return {
        "id": slug,
        "lab_num": lab_num,
        "title": title,
        "folder": lab_folder,
        "category": category,
        "category_slug": category_slug,
        "summary": summary,
        "tags": final_tags,
        "topology_img": dest_img_rel,
        "has_pkt": bool(pkt_file),
        "pkt_file": pkt_file,
        "configs": configs,
        "github_url": github_folder_url,
        "problem_and_fix": problem_and_fix,
        "addressing_table": table_content,
        "verification": verification_content
    }


def main():
    print("Compiling all 32 Cisco lab projects...")
    all_projects = []
    lab_counter = 1

    for rcfg in REPOS_CONFIG:
        repo_abs = os.path.join(ROOT_DIR, rcfg["id"])
        if not os.path.exists(repo_abs):
            print(f"Skipping {rcfg['id']} (not found on disk)")
            continue

        if rcfg["is_single_lab"]:
            # Mega Lab
            proj = parse_lab(
                repo_path=repo_abs,
                lab_folder="",
                category=rcfg["category"],
                category_slug=rcfg["category_slug"],
                repo_github=rcfg["github_url"],
                lab_num=1
            )
            # Custom enhancements for Flagship Mega Lab
            proj["title"] = "Enterprise Campus Capstone: Multi-Tier Hierarchical Network"
            proj["summary"] = "Full-scale corporate campus architecture spanning 15 Cisco IOS devices: dual distribution blocks, wire-speed Layer 3 Core, Active-Active HSRPv2, Rapid-PVST+ root alignment, DAI/DHCP Snooping defense, Cisco 3504 WLC mobility, and dual-homed WAN failover."
            proj["tags"] = ["15 Nodes", "L3 Core & HSRPv2", "OSPFv2 Multi-Area", "DAI & Port Security", "Cisco 3504 WLC"]
            all_projects.append(proj)
            print(f"  [+] {proj['category']}: {proj['title']}")
        else:
            # Subfolder labs
            subdirs = sorted([d for d in os.listdir(repo_abs) if os.path.isdir(os.path.join(repo_abs, d)) and not d.startswith('.') and not d in ['assets', 'configs', 'slides', 'linkedin']])
            for d in subdirs:
                proj = parse_lab(
                    repo_path=repo_abs,
                    lab_folder=d,
                    category=rcfg["category"],
                    category_slug=rcfg["category_slug"],
                    repo_github=rcfg["github_url"],
                    lab_num=lab_counter
                )
                all_projects.append(proj)
                lab_counter += 1
                print(f"  [+] {proj['category']} Lab {lab_counter-1}: {proj['title']}")

    # Write to JSON
    json_path = os.path.join(DATA_DIR, "projects.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_projects, f, indent=2)
    print(f"\nSaved {len(all_projects)} labs to {json_path}")

    # Write to zero-CORS JS file for instant local and web load
    js_path = os.path.join(JS_DIR, "projects-data.js")
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write("/** Auto-generated from local GitHub repos. Zero-CORS, offline-ready. */\n")
        f.write("window.PORTFOLIO_PROJECTS = ")
        json.dump(all_projects, f, indent=2)
        f.write(";\n")
    print(f"Saved zero-CORS client data to {js_path}")


if __name__ == "__main__":
    main()
