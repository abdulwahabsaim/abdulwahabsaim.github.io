---
title: "Layer 3 Campus Architecture: Multilayer Switching & SVI Inter-VLAN Routing"
name: "Inter-VLAN routing with SVIs"
category: "Routing"
categorySlug: "routing"
order: 6
summary: "Migrating legacy Router-on-a-Stick (ROAS) to a high-performance Enterprise Multilayer Switching design utilizing Switch Virtual Interfaces (SVIs) and dedicated L3 routed uplinks."
tags: ["SVI","Multilayer switch","802.1Q"]
platform: "Packet Tracer"
status: "complete"
repo: "enterprise-routing-labs"
url: "https://github.com/abdulwahabsaim/enterprise-routing-labs/tree/main/06-intervlan-routing-multilayer-svi"
image: "../../assets/labs/routing-intervlan-routing-multilayer-svi.png"
---

## Executive Summary & Lab Objectives

In modern enterprise campus networks, relying on an edge router for inter-VLAN routing (Router-on-a-Stick) creates a severe bandwidth bottleneck ("router-on-a-stick hair-pinning"). 

This lab demonstrates the architectural shift to **Multilayer Switching**. By migrating inter-VLAN routing down to the Distribution layer (Catalyst 3650), traffic between local departments (VLANs) routes at hardware wire-speed. The edge router (R1) is relieved of LAN processing and now strictly handles WAN edge forwarding.

**Key Tasks Performed:**
1. **SVI Configuration:** Configured Switch Virtual Interfaces (VLAN 10, 20, 30) on the Multilayer Switch (SW2) to act as default gateways for campus hosts.
2. **L3 Routed Uplink:** Converted the trunk link between the Distribution Switch (SW2) and Edge Router (R1) into a dedicated Layer 3 point-to-point link using the `no switchport` command.
3. **Global Routing Engine:** Enabled the IP routing engine globally on Catalyst 3650 (`ip routing`).
4. **Recursive Static Routing:** Established default routing from the Multilayer Switch to the Edge Router, and from the Edge Router out to the WAN.

## IP Addressing & VLAN Parameter Schema

| Device | Interface | Role / Zone | IP Address | Subnet Mask | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW2 (L3)** | `Vlan 10` | Engineering Gateway | `10.0.0.62` | `255.255.255.192` | Active |
| **SW2 (L3)** | `Vlan 20` | Sales/HR Gateway | `10.0.0.126` | `255.255.255.192` | Active |
| **SW2 (L3)** | `Vlan 30` | Management Gateway | `10.0.0.190` | `255.255.255.192` | Active |
| **SW2 (L3)** | `Gig1/0/2` | L3 Uplink to Router | `10.0.0.193` | `255.255.255.252` | Active (`no switchport`) |
| **R1 (Edge)**| `Gig0/0` | Downlink to Core/Dist | `10.0.0.194` | `255.255.255.252` | Active |
| **R1 (Edge)**| `Gig0/0/0` | WAN / Internet Uplink | `1.1.1.2` | `255.255.255.0` | Active |

## Cisco IOS Configuration Highlights

### SW2: Enabling Wire-Speed Inter-VLAN Routing (SVIs)
```ios
! Enable global routing engine on the Catalyst switch
SW2(config)# ip routing

! Configure SVI default gateways for local subnets
SW2(config)# interface Vlan10
SW2(config-if)# description ## SVI Gateway for Engineering ##
SW2(config-if)# ip address 10.0.0.62 255.255.255.192
SW2(config-if)# no shutdown

SW2(config)# interface Vlan20
SW2(config-if)# description ## SVI Gateway for Sales_HR ##
SW2(config-if)# ip address 10.0.0.126 255.255.255.192
SW2(config-if)# no shutdown
```

### SW2: Point-to-Point Layer 3 Uplink & Default Route
```ios
! Convert L2 physical port to L3 routed port
SW2(config)# interface GigabitEthernet1/0/2
SW2(config-if)# description ## L3 Point-to-Point Routed Uplink to R1 ##
SW2(config-if)# no switchport
SW2(config-if)# ip address 10.0.0.193 255.255.255.252
SW2(config-if)# no shutdown

! Route unknown traffic (Internet) to Edge Router R1
SW2(config)# ip route 0.0.0.0 0.0.0.0 10.0.0.194
```

## Verification & Operational Proof

### 1. Verifying SVIs and L3 Port Status on Multilayer Switch (SW2)
```text
SW2# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet1/0/1   unassigned      YES unset  up                    up
GigabitEthernet1/0/2   10.0.0.193      YES manual up                    up
Vlan10                 10.0.0.62       YES manual up                    up
Vlan20                 10.0.0.126      YES manual up                    up
Vlan30                 10.0.0.190      YES manual up                    up
```
*Validation:* SVIs are `up/up` and processing local inter-VLAN traffic. Physical port `Gig1/0/2` holds its own L3 address.

### 2. Validating the Routing Table on SW2
```text
SW2# show ip route
Gateway of last resort is 10.0.0.194 to network 0.0.0.0

      10.0.0.0/8 is variably subnetted, 8 subnets, 3 masks
C        10.0.0.0/26 is directly connected, Vlan10
C        10.0.0.64/26 is directly connected, Vlan20
C        10.0.0.128/26 is directly connected, Vlan30
C        10.0.0.192/30 is directly connected, GigabitEthernet1/0/2
S*    0.0.0.0/0 [1/0] via 10.0.0.194
```
*Validation:* SW2 acts as a fully functional router. It has `Connected` routes for all local VLANs and a Gateway of Last Resort pointing to R1.

## Verification & Troubleshooting Cheat Sheet

| Diagnostic Command | Execution Mode | Purpose & Application |
| :--- | :--- | :--- |
| `show ip route` | Privileged EXEC (`#`) | Verifies that SVIs are injected into the routing table as `C` (Connected) routes and the default route `S*` is active. |
| `show ip interface brief` | Privileged EXEC (`#`) | Quick check to ensure SVIs are `up/up`. If an SVI is `up/down`, check if the VLAN is allowed on an active trunk or access port. |
| `show vlan brief` | Privileged EXEC (`#`) | Ensures VLANs exist in the local database. *An SVI will not come up if the VLAN doesn't exist in the database.* |
| `show interfaces trunk` | Privileged EXEC (`#`) | Confirms L2 topology paths are open for VLANs to traverse between Access and Distribution switches. |

## Test Matrix & Pass/Fail Criteria

| Test Scenario | Action Performed | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Inter-VLAN Routing** | PC in VLAN 10 pings PC in VLAN 20 | ICMP Echo Success (Routed locally by SW2). | ✅ **Pass** |
| **WAN Reachability** | PC in VLAN 10 pings WAN IP `1.1.1.2` | ICMP Echo Success (Forwarded by SW2 default route to R1). | ✅ **Pass** |
| **L2 Isolation** | Verify broadcast domains | ARP requests do not leak across VLANs. | ✅ **Pass** |
