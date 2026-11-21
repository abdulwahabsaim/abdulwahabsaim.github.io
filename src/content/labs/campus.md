---
title: "Enterprise Campus Capstone: Multi-Tier Hierarchical Network Architecture"
name: "Enterprise campus network"
category: "Flagship"
categorySlug: "campus"
order: 0
summary: "A two-building campus of 15 Cisco devices: routed Layer 3 core, multi-area OSPFv2, HSRPv2 with preemption, EtherChannel, Layer 2 security, WLC wireless and dual-ISP failover."
tags: ["Multi-area OSPFv2","HSRPv2","EtherChannel","DHCP Snooping & DAI","WLC 3504","Dual-ISP failover"]
platform: "Packet Tracer"
status: "complete"
featured: 1
repo: "cisco-enterprise-campus-mega-lab"
url: "https://github.com/abdulwahabsaim/cisco-enterprise-campus-mega-lab"
image: "../../assets/labs/campus.png"
acknowledgement: "The scenario is the CCNA Mega Lab by Jeremy McDowell (Jeremy's IT Lab). Every configuration, verification test, addressing plan and slide in this lab is my own work."
slides: ["../../assets/labs/campus-slides/slide-01-network-topology-architecture.png","../../assets/labs/campus-slides/slide-02-dual-etherchannel-pagp-vs-lacp.png","../../assets/labs/campus-slides/slide-03-layer3-routed-core-cef-switching.png","../../assets/labs/campus-slides/slide-04-hsrpv2-rapid-pvst-root-alignment.png","../../assets/labs/campus-slides/slide-05-ospfv2-area0-floating-static-wan.png","../../assets/labs/campus-slides/slide-06-centralized-dhcp-relay-telemetry.png","../../assets/labs/campus-slides/slide-07-perimeter-static-nat-dynamic-pat.png","../../assets/labs/campus-slides/slide-08-layer2-access-security-citadel.png","../../assets/labs/campus-slides/slide-09-dual-stack-ipv6-wlc-mobility.png","../../assets/labs/campus-slides/slide-10-noc-audit-verification-runbook.png"]
---

## Executive Summary & Engineering Objectives

Modern enterprise campus networks demand deterministic traffic steering, protocol-agnostic segmentation, sub-second failover, and multi-layer zero-trust security. This project models a full multi-building enterprise campus (Office A, Office B, Central Core, and Perimeter Edge) configured completely via the Cisco IOS CLI.

```
                    ┌─────────────────────────┐
                    │ Dual-Homed ISP WAN Edge │
                    │   (ISPA / ISPB Backup)  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    R1 Perimeter ASBR    │
                    │   (NAT, PAT, 7x DHCP)   │
                    └────────────┬────────────┘
                         /              \
         10.0.0.32/30   /                \   10.0.0.36/30
                       ▼                  ▼
             ┌────────────────┐  Po1  ┌────────────────┐
             │ CSW1 Core L3   │◄─────►│ CSW2 Core L3   │
             │ (10.0.0.77/32) │ /30   │ (10.0.0.78/32) │
             └───────┬────────┘       └────────┬───────┘
                     │ \                     / │
    Routed /30 Links │  ───────┐     ┌───────  │ Routed /30 Links
                     ▼         ▼     ▼         ▼
             ┌──────────────┬──────────────┐ ┌──────────────┬──────────────┐
             │ DSW-A1 Dist  │ DSW-A2 Dist  │ │ DSW-B1 Dist  │ DSW-B2 Dist  │
             │ (HSRPv2 A1)  │ (HSRPv2 A2)  │ │ (HSRPv2 B1)  │ (HSRPv2 B2)  │
             └───────┬──────┴──────┬───────┘ └───────┬──────┴──────┬───────┘
                     │   PAgP Po1  │                 │   LACP Po1  │
                     ▼             ▼                 ▼             ▼
             ┌──────────────┬──────────────┐ ┌──────────────┬──────────────┐
             │ ASW-A1 - A3    │ WLC1 (3504)  │ │ ASW-B1 - B3    │ SRV1 Server  │
             │ Access Ports │ LWAP1 Wi-Fi  │ │ Access Ports │ LWAP2 Wi-Fi  │
             └──────────────┴──────────────┘ └──────────────┴──────────────┘
                       OFFICE A                         OFFICE B
```

### Key Engineering Achievements:
- **Zero Inter-Switch Trunk Saturation:** Synchronized Rapid-PVST+ root bridge placement with HSRPv2 Active gateway roles across all 8 campus VLAN instances.
- **Wire-Speed Routed Core:** Replaced Layer 2 core looping risks with point-to-point `/30` routed links and a Layer 3 routed PortChannel between CSW1 and CSW2.
- **Dual-ISP Perimeter Resiliency:** Deployed primary recursive static default routing over ISP-A with an administrative distance (AD 2) floating backup path over ISP-B, dynamically advertised across OSPF Area 0 via ASBR default injection.
- **Layer 2 Defense-in-Depth:** Fully operational Dynamic ARP Inspection (DAI), DHCP Snooping with untrusted port rate limits (15 pps) and trusted server uplinks, and sticky MAC port security in `restrict` mode.
- **Centralized Enterprise Mobility:** Cisco 3504 WLC split-MAC architecture terminating CAPWAP tunnels from Lightweight APs across multiple L2 broadcast domains via Option 43 discovery.

## Campus Addressing & VLAN Segmentation Schema

The campus employs a structured, hierarchical RFC 1918 addressing plan designed for summarization at the Distribution layer. For the complete interface-by-interface mapping table, see [`docs/addressing-and-vlan-matrix.md`](https://github.com/abdulwahabsaim/cisco-enterprise-campus-mega-lab/blob/main/docs/addressing-and-vlan-matrix.md).

| Office | VLAN ID | Subnet / CIDR | Default Gateway (VIP) | Active Gateway Node | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Office A** | `10` | `10.1.0.0/24` | `10.1.0.1` | DSW-A1 (`10.1.0.2`, Pri 105) | Office A Workstations & Data PCs |
| **Office A** | `20` | `10.2.0.0/24` | `10.2.0.1` | DSW-A2 (`10.2.0.3`, Pri 105) | Office A Cisco 7960 IP Phones |
| **Office A** | `40` | `10.6.0.0/24` | `10.6.0.1` | DSW-A2 (`10.6.0.3`, Pri 105) | Office A enterprise Wireless Clients |
| **Office A** | `99` | `10.0.0.0/28` | `10.0.0.1` | DSW-A1 (`10.0.0.2`, Pri 105) | Office A Management, WLC1, LWAP1 |
| **Office B** | `10` | `10.3.0.0/24` | `10.3.0.1` | DSW-B1 (`10.3.0.2`, Pri 105) | Office B Workstations & Data PCs |
| **Office B** | `20` | `10.4.0.0/24` | `10.4.0.1` | DSW-B2 (`10.4.0.3`, Pri 105) | Office B Cisco 7960 IP Phones |
| **Office B** | `30` | `10.5.0.0/24` | `10.5.0.1` | DSW-B2 (`10.5.0.3`, Pri 105) | Office B Data Center & Server SRV1 |
| **Office B** | `99` | `10.0.0.16/28`| `10.0.0.17`| DSW-B1 (`10.0.0.18`, Pri 105)| Office B Management, LWAP2 |
| **Both** | `1000` | Isolated | None | N/A | Dedicated 802.1Q Native Trunk Security |

## Architectural Deep Dive (9-Part Implementation)

### Part 1: Baseline Administration & Device Hardening
- **Cryptographic Password Protection:** Modern Type 9 scrypt hashing (fallback to Type 5 PBKDF2/MD5) applied across privileged EXEC secrets (`enable secret`) and local administrator accounts (`username cisco secret ccna`).
- **Interactive Session Hardening:** Configured `exec-timeout 30 0` on console and VTY lines to prevent unattended privilege hijacking. Synchronous logging (`logging synchronous`) prevents terminal prompt corruption during asynchronous syslog events.
- **Remote Access Transport:** Suppressed telnet in favor of SSHv2 (`transport input ssh`) paired with standard ACL 1 restricting terminal access exclusively to the secure Office A administrative workstation subnet (`10.1.0.0/24`).

### Part 2: Layer 2 Infrastructure, 802.1Q Trunks & EtherChannels
- **Distribution Interconnect EtherChannels:**
  - **Office A:** Cisco-proprietary PAgP PortChannel 1 between DSW-A1 and DSW-A2 (`channel-protocol pagp`, `channel-group 1 mode desirable`).
  - **Office B:** IEEE 802.3ad standard LACP PortChannel 1 between DSW-B1 and DSW-B2 (`channel-protocol lacp`, `channel-group 1 mode active`).
- **VLAN Trunking Protocol (VTPv2):** DSW-A1 and DSW-B1 operate as VTP Servers in domain `JeremysITLab`, while DSW-A2, DSW-B2, and all Access switches operate as VTP Clients, ensuring automated, consistent VLAN propagation.
- **Trunk Port Hardening:** Explicit Dynamic Trunking Protocol suppression (`switchport nonegotiate`), native VLAN re-tagging to unused VLAN 1000 (`switchport trunk native vlan 1000`), and strict VLAN pruning (`switchport trunk allowed vlan`).

### Part 3: Wire-Speed Layer 3 Core & Active-Active HSRPv2
- **Routed Core Architecture:** Core switches CSW1 and CSW2 terminate all Layer 2 loops by converting physical interfaces to routed interfaces (`no switchport`). A Layer 3 routed EtherChannel (`Port-channel1`, `10.0.0.40/30`) handles high-speed transit between core switches.
- **Multilayer Switching:** Global `ip routing` enabled across all Core and Distribution switches.
- **8-Group HSRPv2 Active-Active Gateway Architecture:**
  - Configured HSRP version 2 (`standby version 2`) across all campus SVIs to enable millisecond timers and expanded group IDs (0-4095).
  - Deployed deterministic traffic sharing: DSW1 acts as Active Router (Priority 105 with `preempt`) for Management and PCs, while DSW2 acts as Active Router (Priority 105 with `preempt`) for Phones and Wi-Fi/Servers.

### Part 4: Rapid-PVST+ Tuning & Elimination of Trunk Hairpinning
A critical flaw in standard campus designs is asymmetric root bridge placement: if DSW-A1 is the HSRP Active default gateway but DSW-A2 is the Spanning Tree Root Bridge, all egress host packets must traverse the inter-switch trunk twice.

```
Suboptimal Hairpinning (STP Root != HSRP Active):
Host ──► Access Switch ──► DSW-A2 (STP Root) ──[Trunk Link Saturation]──► DSW-A1 (HSRP Active Gateway) ──► Core

Engineered Alignment (STP Root == HSRP Active):
Host ──► Access Switch ─────────────────────────► DSW-A1 (STP Root & HSRP Active Gateway) ──► Core
```

By explicitly coordinating Rapid-PVST+ root priorities with HSRP priorities:
- **DSW-A1 / DSW-B1:** `spanning-tree vlan 10,99 root primary` (Priority 24576) & `spanning-tree vlan 20,40/30 root secondary` (Priority 28672).
- **DSW-A2 / DSW-B2:** `spanning-tree vlan 20,40/30 root primary` (Priority 24576) & `spanning-tree vlan 10,99 root secondary` (Priority 28672).
- **Result:** Inter-switch trunk saturation drops to 0% under normal operational conditions.

### Part 5: Enterprise OSPFv2 Backbone & Dual-Homed WAN Failover
- **Single-Area Backbone (Area 0):** OSPF Process 1 runs across R1, CSW1, CSW2, and all four Distribution switches.
- **Deterministic Neighbor Adjacencies:** Physical routed links are configured with `ip ospf network point-to-point`, eliminating DR/BDR election overhead and accelerating convergence.
- **SVI Passive Boundaries:** All client SVIs are set to `passive-interface` to prevent OSPF Hello packet leakage into end-user access networks.
- **ASBR Default Route Injection:** Edge Router R1 injects the default route into OSPF (`default-information originate`). Primary transit routes recursively via ISP-A (`203.0.113.1`), with a floating static route via ISP-B (`203.0.113.5`) configured with Administrative Distance 2 for automatic failover.

### Part 6: Core Network Services (DHCP, DNS, NTP, Syslog, FTP, SSH)
- **Centralized DHCP Server:** R1 hosts 7 distinct DHCP scopes (`A-Mgmt`, `A-PC`, `A-Phone`, `B-Mgmt`, `B-PC`, `B-Phone`, `Wi-Fi`) with the first 10 addresses of each pool reserved (`ip dhcp excluded-address`).
- **Option 43 WLC Discovery:** Pools `A-Mgmt` and `B-Mgmt` deliver vendor-specific Option 43 pointing to WLC1 (`option 43 ip 10.0.0.7`).
- **DHCP Relay:** Distribution switch SVIs relay broadcast Discover packets directly to R1 (`ip helper-address 10.0.0.76`).
- **Telemetry & Infrastructure Services:**
  - Authoritative DNS on SRV1 (`10.5.0.4`) resolving internal and external domains.
  - Stratum 5 NTP Master on R1 with MD5 authentication key 1 (`ntp authentication-key 1 md5 ccna`).
  - Remote Syslog (UDP 514) logging all facility levels to SRV1 with an 8192-byte circular RAM buffer.
  - FTP client credentials configured on R1 for seamless remote IOS firmware staging.

### Part 7: Perimeter NAT/PAT & Layer 2 Defense-in-Depth
- **Edge Address Translation:**
  - **Static 1:1 NAT:** Maps enterprise server SRV1 (`10.5.0.4`) to public IPv4 address `203.0.113.113`.
  - **Dynamic PAT Overload:** Maps internal subnets (defined in ACL 2) to public pool `POOL1` (`203.0.113.200 - 203.0.113.207 /29`) across both ISP uplinks.
- **Inter-Office Access Control:** Extended ACL `OfficeA_to_OfficeB` applied on DSW-A1/A2 SVI 10 permits ICMP diagnostics while denying general IP transit between Office A and Office B PCs.
- **Layer 2 Defense Suite:**
  - **Port Security:** Configured on all Access switch host ports (`f0/1`). Office A/B PC ports allow `maximum 2` MAC addresses (Phone + PC) in `violation restrict` mode with `sticky` learning. Single-host ports allow `maximum 1`.
  - **DHCP Snooping:** Active across VLANs 10, 20, 30, 40, and 99. Uplink ports (`g0/1-2`) are trusted; Option 82 insertion is disabled (`no ip dhcp snooping information option`); untrusted host ports are rate-limited to 15 pps (100 pps on WLC link).
  - **Dynamic ARP Inspection (DAI):** Protects against ARP spoofing/poisoning via the snooping binding database with payload validation (`ip arp inspection validate ip src-mac dst-mac`).

### Part 8: IPv6 Dual-Stack Routing & Link-Local Transit
- **Global IPv6 Routing:** `ipv6 unicast-routing` enabled on R1, CSW1, and CSW2.
- **Perimeter IPv6 Connectivity:** R1 connects to ISP-A via `2001:db8:a::2/64` and ISP-B via `2001:db8:b::2/64`. Default routing includes a primary recursive static route (`::/0 2001:db8:a::1`) and a floating backup route via ISP-B (`::/0 g0/1/0 2001:db8:b::1 2`).
- **Core Dual-Stack Infrastructure:** Core uplinks utilize prefix `2001:db8:a1::/64` and `2001:db8:a2::/64` with IEEE EUI-64 identifier generation. The Core PortChannel1 operates in link-local transit mode (`ipv6 enable`) without requiring global unicast allocation.

### Part 9: Centralized Enterprise Wireless Mobility (Cisco 3504 WLC)
- **Centralized Controller:** Cisco 3504 WLC (`10.0.0.7`) accessed via secure Web GUI.
- **Dynamic Interface Architecture:** Dynamic interface `Wi-Fi` tagged on VLAN 40 (`10.6.0.4/24`) with default gateway `10.6.0.1` and primary DHCP server `10.0.0.76`.
- **WLAN Security Policy:** Profile `Wi-Fi` broadcasting SSID `Wi-Fi` secured with WPA2-Personal (AES/CCMP encryption) and Pre-Shared Key `cisco123`.
- **CAPWAP Tunnel Verification:** Lightweight APs `LAP1` and `LAP2` discover WLC1 via DHCP Option 43, join the controller, establish encrypted CAPWAP control/data tunnels, and broadcast enterprise SSIDs across both office buildings.

## Verification Evidence & Packet Tracer Assessment

This enterprise lab was 100% completed and fully validated within the Cisco Packet Tracer grading assessment engine:

```
================================================================================
CISCO PACKET TRACER ASSESSMENT ENGINE - COMPLETION CERTIFICATE
================================================================================
Activity: Cisco CCNA Mega Lab (Jeremy's IT Lab)
Candidate: Abdul Wahab Saim (CCNA 200-301)
Assessment Status: 100% COMPLETE // ALL ASSESSMENT ITEMS PASSED
Connectivity Tests: 100% PASSED (Dual-ISP Failover, Inter-VLAN Routing, Wireless Join)
================================================================================
Congratulations! You have successfully completed the lab.
================================================================================
```

### Core CLI Verification Proofs:

```cisco
R1# show ip ospf neighbor
Neighbor ID     Pri   State           Dead Time   Address         Interface
10.0.0.77         0   FULL/  -        00:00:37    10.0.0.34       GigabitEthernet0/0
10.0.0.78         0   FULL/  -        00:00:32    10.0.0.38       GigabitEthernet0/1

DSW-A1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl10        2    105 P Active  local           10.1.0.3        10.1.0.1
Vl20        3    100   Standby 10.2.0.3        local           10.2.0.1
Vl40        4    100   Standby 10.6.0.3        local           10.6.0.1
Vl99        1    105 P Active  local           10.0.0.3        10.0.0.1

ASW-A2# show port-security interface f0/1
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 2
Total MAC Addresses        : 2
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 2
Last Source Address:Vlan   : 0060.2F35.91A1:10
Security Violation Count   : 0
```

## NOC Diagnostic & Troubleshooting Runbook

| Triage Domain | Diagnostic CLI Command | Healthy Expected Output | Common Root Cause / Resolution |
| :--- | :--- | :--- | :--- |
| **OSPF Adjacency** | `show ip ospf neighbor` | `FULL/-` on point-to-point links | Subnet mask mismatch, MTU mismatch, or missing `ip ospf network point-to-point`. |
| **HSRP Gateway** | `show standby brief` | One node `Active`, peer `Standby` | Missing `standby version 2` or trunk native VLAN mismatch causing split-brain. |
| **DHCP Leases** | `show ip dhcp binding` | Leases listed across all 7 subnets | Option 82 drop on R1 (ensure `no ip dhcp snooping information option` is set). |
| **DAI Interception** | `show ip arp inspection` | Packet drops = 0 on normal hosts | Uplinks missing `ip arp inspection trust` or host IP spoofing attempt. |
| **Port Security** | `show port-security int <id>` | Port Status `Secure-up`, Violations `0`| Host swapped port or extra MAC connected behind IP Phone (`violation restrict`). |
| **Edge NAT/PAT** | `show ip nat translations` | Dynamic inside local to inside global | ACL 2 missing subnets or `ip nat outside` missing on active WAN interface. |
| **EtherChannel** | `show etherchannel summary` | `(SU)` Layer 2 or `(RU)` Layer 3 | Mismatched protocol modes (PAgP `desirable` vs LACP `active`) or speed/duplex duplex. |
