/**
 * Single source of truth for portfolio copy.
 * Every claim here maps to verified facts (CCNA, labs, coursework, eezyprint, peer support).
 * Lab work is described as lab work. No em-dashes anywhere.
 */
import ccna from '../assets/certs/ccna.png';
import msAdds from '../assets/certs/ms-adds.png';
import msEntra from '../assets/certs/ms-entra.png';
import jsm from '../assets/certs/atlassian-jsm.png';

export const profile = {
  name: 'Abdul Wahab Saim',
  short: 'Saim',
  role: 'Junior Network Engineer',
  headline: 'CCNA-certified junior network engineer',
  email: 'abdulwahabsaim58.nl@gmail.com',
  github: 'https://github.com/abdulwahabsaim',
  linkedin: 'https://linkedin.com/in/abdulwahabsaim',
  site: 'https://abdulwahabsaim.github.io',
  cv: '/Abdul-Wahab-Saim-CV.pdf',
  location: 'Goes, Zeeland, Netherlands',
  description:
    'Abdul Wahab Saim is a CCNA-certified junior network engineer in the Netherlands, available full-time. 32 documented Cisco labs in routing, switching, Layer 2 security and network services.',
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Labs', href: '#labs' },
  { label: 'Credentials', href: '#credentials' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];

/** Short copy for the five featured labs, keyed by lab id. */
export const featured: Record<string, { lede: string; points: string[] }> = {
  campus: {
    lede: 'Two office blocks, a routed Layer 3 core and a dual-ISP edge across 15 Cisco devices, designed and configured as one campus.',
    points: [
      'HSRPv2 active gateways aligned with Rapid-PVST+ root bridges',
      'Multi-area OSPFv2 with floating static failover to a second ISP',
      'DHCP Snooping, DAI and Port Security at the access layer',
    ],
  },
  'firewall-nat-pat-dmz-server-publishing': {
    lede: 'A Cisco ASA in EVE-NG translating the inside LAN out through one public address and publishing three DMZ web servers to the internet.',
    points: [
      'PAT overload for the inside subnet, plus static and dynamic NAT',
      'Destination NAT for three web servers on 802.1Q subinterfaces',
      'Outside ACLs written against real IPs, per the ASA 9.x NAT order',
    ],
  },

  'routing-hsrp-gateway-redundancy': {
    lede: 'Two HSRPv2 groups, one facing the LAN and one facing the WAN, so traffic fails over in both directions with no asymmetric return path.',
    points: [
      'Priority 110 active, 100 standby, preemption on both groups',
      'Virtual gateways 10.1.1.1 for the LAN and 8.8.8.1 for the WAN',
      'Failover tested by taking the active router down',
    ],
  },
  'security-enterprise-extended-acls-service-filtering': {
    lede: 'Extended ACLs applied inbound on the edge router LANs, so unwanted traffic is dropped before it ever crosses the serial WAN link.',
    points: [
      'DNS (UDP 53) to SRV1 denied for LAN 1',
      'HTTP and HTTPS to SRV2 denied for LAN 2',
      'PC1 isolated from LAN 2, all other traffic permitted',
    ],
  },

  'services-enterprise-wlc-centralized-wireless': {
    lede: 'A Cisco 3504 controller running split-MAC wireless: lightweight APs join over CAPWAP and each SSID maps to its own VLAN.',
    points: [
      '802.1Q trunk to a Catalyst 3650, native VLAN 10 for management',
      'Dynamic interfaces: Internal on VLAN 100, Guest on VLAN 200',
      'WPA2-Personal (AES) SSIDs with APs joined and clients associated',
    ],
  },
};

export const categories = [
  { slug: 'routing', label: 'Routing', blurb: 'OSPF, EIGRP, static and floating static, HSRP, NAT, QoS, GRE and IPv6.' },
  { slug: 'security', label: 'Layer 2 and security', blurb: 'VLANs, STP guards, EtherChannel, Port Security, DHCP Snooping, DAI, ACLs and SSH.' },
  { slug: 'services', label: 'Network services', blurb: 'DHCP relay, DNS, NTP, Syslog and centralized wireless.' },
  { slug: 'firewall', label: 'Firewalls', blurb: 'Cisco ASA zones, ACLs, NAT and DMZ publishing in EVE-NG. Added lesson by lesson.' },
] as const;

export const process = [
  {
    title: 'Plan',
    icon: 'ph:map-trifold',
    text: 'Addressing plan, VLAN map and requirements written down before a single device is placed.',
  },
  {
    title: 'Build',
    icon: 'ph:graph',
    text: 'The topology goes into Packet Tracer, GNS3 or EVE-NG, cabled exactly the way the design says.',
  },
  {
    title: 'Configure',
    icon: 'ph:terminal-window',
    text: 'Every device from the Cisco IOS CLI: interfaces, routing and redundancy first, hardening last.',
  },
  {
    title: 'Verify',
    icon: 'ph:pulse',
    text: 'show and debug output for each feature, then failover tests: pull a link and watch it converge.',
  },
  {
    title: 'Document',
    icon: 'ph:git-commit',
    text: 'README runbook, clean configs and the topology pushed to Git, one commit per file.',
  },
];

export const credentials = [
  {
    id: 'ccna',
    issuer: 'Cisco',
    icon: 'simple-icons:cisco',
    kind: 'Certification',
    title: 'Cisco Certified Network Associate',
    code: 'CCNA 200-301',
    date: 'February 2026',
    note: 'Valid through February 2029',
    // Deep link: opens Cisco's CertMetrics record with the verification number already filled in.
    verify: { label: 'Verify credential', href: 'https://cp.certmetrics.com/cisco/en/public/verify/credential/852d6536dadd4375ac8964bdbd599b94' },
    image: ccna,
  },
  {
    id: 'ms-adds',
    issuer: 'Microsoft',
    icon: 'simple-icons:microsoft',
    kind: 'Applied Skills',
    title: 'Administer Active Directory Domain Services',
    code: 'Microsoft Applied Skills',
    date: 'November 2026',
    note: 'Hands-on lab assessment',
    verify: { label: 'Verify credential', href: 'https://learn.microsoft.com/en-us/users/abdulwahabsaim/credentials/79c096475bfb39a0' },
    image: msAdds,
  },
  {
    id: 'ms-entra',
    issuer: 'Microsoft',
    icon: 'simple-icons:microsoft',
    kind: 'Applied Skills',
    title: 'Get started with identities and access using Microsoft Entra',
    code: 'Microsoft Applied Skills',
    date: 'November 2026',
    note: 'Hands-on lab assessment',
    verify: { label: 'Verify credential', href: 'https://learn.microsoft.com/en-us/users/abdulwahabsaim/credentials/f6ba56b7933690ed' },
    image: msEntra,
  },
  {
    id: 'jsm',
    issuer: 'Atlassian',
    icon: 'simple-icons:atlassian',
    kind: 'Credential',
    title: 'Jira Service Management Fundamentals with AI',
    code: 'Atlassian Credentialed',
    date: 'November 2026',
    note: 'Queues, SLAs, request types, agent permissions',
    verify: { label: 'Verify credential', href: 'https://cp.certmetrics.com/atlassian/en/public/verify/credential/eb1ebbd08f3b4f5797091b9240db1176' },
    image: jsm,
  },
];

export const training = [
  { label: 'Cisco CCNP and Cisco ASA/FTD firewalls', where: 'Corvit', status: 'Taking classes now' },
  { label: 'Red Hat System Administration (RHCSA)', where: 'Corvit', status: 'Coursework completed' },
];

/**
 * Timeline, oldest first. status 'done' entries sit on the filled rail; 'next' entries are
 * shown as unlocking (in progress) beyond the "now" point.
 */
export const experience: {
  period: string;
  org: string;
  place?: string;
  kind: string;
  role: string;
  note?: string;
  body: string[];
  tags: string[];
  status: 'done' | 'next';
  icon: string;
}[] = [
  {
    period: '2022 - 2024',
    org: 'eezyprint',
    place: 'Gujranwala',
    kind: 'Part-time, family business',
    role: 'IT and systems assistant',
    body: [
      'Looked after 4 production PCs, an HP LaserJet, an Epson Stylus Photo 1390, an HP DesignJet 5500 and network scanners for a wholesale print and business-card press.',
      'Set up host-shared LAN printing, fixed driver conflicts, spooler freezes and NIC errors, and ran bare-metal Windows installs with drivers, partitioning and CorelDRAW staging.',
    ],
    tags: ['Windows', 'LAN printing', 'Drivers', 'Cabling'],
    status: 'done',
    icon: 'ph:briefcase',
  },
  {
    period: '2022 - 2026',
    org: 'University of Central Punjab',
    place: 'Lahore',
    kind: 'Education',
    role: 'BS Computer Science',
    note: '7 of 8 semesters completed',
    body: [
      'Computer Communications & Networks, Operating Systems, Information Security, Computer Organization and Assembly Language, Digital Logic Design and Introduction to Database Systems, each with a lab component.',
      'Around 210 ECTS of coursework, with 255+ Word reports, 117+ PowerPoint decks and Excel models along the way.',
    ],
    tags: ['Networking', 'Operating Systems', 'Information Security', 'C++'],
    status: 'done',
    icon: 'ph:graduation-cap',
  },
  {
    period: '2022 - now',
    org: 'Personal lab and peer support',
    place: 'Gujranwala and the Netherlands',
    kind: 'Hands-on',
    role: 'Systems and network support',
    body: [
      '50+ clean OS installs, re-images and dual-boots across 20+ machines: Dell Latitude, HP EliteBook, Lenovo ThinkPad and Apple through Boot Camp.',
      'RAM upgrades, HDD to SATA and NVMe migrations, Ethernet termination, and spare TP-Link and Huawei routers reused as Wi-Fi repeaters and bridges.',
      'Ubuntu Linux is my daily operating system, with QEMU/KVM, VMware and VirtualBox for lab machines.',
    ],
    tags: ['Windows 10/11', 'Ubuntu Linux', 'Hardware upgrades', 'Wi-Fi bridging'],
    status: 'done',
    icon: 'ph:wrench',
  },
  {
    period: 'Aug - Oct 2025',
    org: 'Corvit',
    place: 'Lahore, online',
    kind: 'Training',
    role: 'CCNA Enterprise and Linux training',
    body: [
      'Instructor-led CCNA Enterprise course, plus Red Hat System Administration coursework: Linux file system, users and groups, permissions, processes and partitions.',
    ],
    tags: ['CCNA Enterprise', 'RHCSA coursework', 'Linux'],
    status: 'done',
    icon: 'ph:chalkboard-teacher',
  },
  {
    period: 'Feb 2026',
    org: 'Cisco',
    kind: 'Certification',
    role: 'CCNA 200-301 certified',
    body: ['Passed the Cisco Certified Network Associate exam. Valid through February 2029.'],
    tags: ['CCNA 200-301'],
    status: 'done',
    icon: 'simple-icons:cisco',
  },
  {
    period: 'Nov 2026',
    org: 'Microsoft',
    kind: 'Credentials',
    role: 'Microsoft Applied Skills',
    body: [
      'Administer Active Directory Domain Services, and Get started with identities and access using Microsoft Entra. Both are hands-on lab assessments.',
      'The same month: Atlassian Credentialed in Jira Service Management Fundamentals with AI.',
    ],
    tags: ['AD DS', 'Microsoft Entra', 'Jira Service Management'],
    status: 'done',
    icon: 'simple-icons:microsoft',
  },
  {
    period: 'In progress',
    org: 'Corvit',
    kind: 'Training',
    role: 'Cisco CCNP',
    body: ['Taking CCNP classes now, building on the CCNA routing and switching foundation.'],
    tags: ['CCNP'],
    status: 'next',
    icon: 'ph:lock-simple-open',
  },
  {
    period: 'In progress',
    org: 'Corvit',
    kind: 'Training',
    role: 'Cisco ASA and FTD firewalls',
    body: ['Each lesson becomes a lab in EVE-NG and a folder in Git. Three ASA labs are published so far.'],
    tags: ['Cisco ASA', 'FTD', 'EVE-NG'],
    status: 'next',
    icon: 'ph:lock-simple-open',
  },
];

/**
 * Toolbox groups. `core` items are shown filled (the strongest, most-practised skills);
 * `proof` names the evidence behind the group and `href` links to it.
 */
export const toolbox = [
  {
    title: 'Routing and switching',
    icon: 'ph:share-network',
    proof: '13 routing labs and the 15-device campus',
    href: '/labs/#routing',
    core: ['Cisco IOS CLI', 'Multi-area OSPFv2', 'HSRPv2', 'VLANs and 802.1Q'],
    items: ['Cisco IOS CLI', 'Multi-area OSPFv2', 'HSRPv2', 'VLANs and 802.1Q', 'STP and Rapid-PVST+', 'EtherChannel (LACP, PAgP)', 'EIGRP', 'Static and floating static', 'IPv4 and IPv6 subnetting'],
  },
  {
    title: 'Security',
    icon: 'ph:shield-check',
    proof: '13 Layer 2 and security labs, 3 ASA labs in progress',
    href: '/labs/#security',
    core: ['DHCP Snooping', 'Dynamic ARP Inspection', 'Port Security'],
    items: ['DHCP Snooping', 'Dynamic ARP Inspection', 'Port Security', 'Standard and extended ACLs', 'SSHv2 device hardening', 'NAT and PAT', 'Cisco ASA (in training)'],
  },
  {
    title: 'Services and operations',
    icon: 'ph:gear-six',
    proof: '5 service labs and an Atlassian JSM credential',
    href: '/labs/#services',
    core: ['DHCP relay', 'Syslog'],
    items: ['DHCP relay', 'Syslog', 'NTP', 'DNS', 'Cisco 3504 WLC', 'Jira Service Management', 'Git and Markdown runbooks'],
  },
  {
    title: 'Systems',
    icon: 'ph:desktop-tower',
    proof: 'Daily Ubuntu, 50+ OS installs, 2 Microsoft Applied Skills',
    href: '#credentials',
    core: ['Ubuntu Linux (daily)', 'Windows 10/11 imaging'],
    items: ['Ubuntu Linux (daily)', 'Windows 10/11 imaging', 'Active Directory DS', 'Microsoft Entra ID', 'Microsoft 365', 'QEMU/KVM, VMware, VirtualBox'],
  },
];

export const facts = [
  { label: 'Certified', value: 'Cisco CCNA 200-301' },
  { label: 'Availability', value: 'Full-time' },
  { label: 'Based in', value: 'Goes, Zeeland. Open to relocating.' },
  { label: 'Languages', value: 'English and Urdu. Learning Dutch.' },
];

/** Short human descriptions for the lab repositories (GitHub descriptions contain em-dashes). */
export const repoBlurbs: Record<string, string> = {
  'cisco-enterprise-campus-mega-lab': '15-device campus with configs, addressing and a 10-slide architecture deck.',
  'enterprise-routing-labs': '13 routing labs: OSPF, EIGRP, HSRP, NAT, QoS, GRE and IPv6.',
  'layer2-security-labs': '13 switching and security labs: STP guards, EtherChannel, DAI and ACLs.',
  'network-services-labs': '5 service labs: DHCP relay, DNS, NTP, Syslog and WLC wireless.',
  'cisco-asa-firewall-labs': 'Cisco ASA labs in EVE-NG, added one lesson at a time.',
};
