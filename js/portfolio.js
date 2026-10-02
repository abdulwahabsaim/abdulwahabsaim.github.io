/**
 * ==========================================================================
 * ENTERPRISE NETWORK ENGINEERING PORTFOLIO ENGINE (PHASE 4 PRODUCTION)
 * Candidate: Abdul Wahab Saim — Junior Network & NOC Engineer (CCNA)
 * High-Performance, Zero-Slop, Accessible Client Orchestrator
 * ==========================================================================
 */

(function () {
  'use strict';

  var allProjects = [];
  var currentCategory = 'all';
  var currentSearch = '';
  var caseStudySlideIndex = 0;
  var deckModalSlideIndex = 0;

  // Safe Storage Helpers
  function safeStorageGet(key, fallback) {
    try {
      var val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeStorageSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ================= 0. CENTRALIZED OVERLAY MANAGER (B6, B9, B24) =================
  var OverlayManager = (function () {
    var stack = [];
    var lockCount = 0;
    var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function isLocked() {
      return lockCount > 0;
    }

    function lockScroll() {
      lockCount++;
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
    }

    function unlockScroll() {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = '';
      }
    }

    function getFocusableElements(container) {
      if (!container) return [];
      var els = container.querySelectorAll(FOCUSABLE_SELECTOR);
      return Array.prototype.filter.call(els, function (el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      });
    }

    function trapFocus(container, e) {
      var focusables = getFocusableElements(container);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }

    function handleKeydown(e) {
      if (!stack.length) return;
      var topOverlay = stack[stack.length - 1];

      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        close(topOverlay.id);
        return;
      }

      if (e.key === 'Tab' || e.keyCode === 9) {
        var container = document.getElementById(topOverlay.id);
        if (container) {
          trapFocus(container, e);
        }
      }
    }

    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('keydown', handleKeydown, true);

    function open(id, options) {
      options = options || {};
      var el = document.getElementById(id);
      if (!el) return;

      var existingIdx = -1;
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].id === id) {
          existingIdx = i;
          break;
        }
      }
      if (existingIdx !== -1) return;

      var triggerEl = options.trigger || document.activeElement;
      stack.push({ id: id, trigger: triggerEl, options: options });
      lockScroll();

      el.setAttribute('aria-modal', 'true');
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
      el.classList.add('open');
      el.classList.remove('pointer-events-none');
      el.style.pointerEvents = 'auto';

      if (options.onOpen) options.onOpen(el);

      requestAnimationFrame(function () {
        var focusables = getFocusableElements(el);
        if (options.initialFocus) {
          var target = el.querySelector(options.initialFocus);
          if (target && typeof target.focus === 'function') {
            target.focus();
            return;
          }
        }
        if (focusables.length && typeof focusables[0].focus === 'function') {
          focusables[0].focus();
        }
      });
    }

    function close(id) {
      var idx = -1;
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].id === id) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return;

      var item = stack.splice(idx, 1)[0];
      var el = document.getElementById(id);

      if (el) {
        el.classList.remove('open');
        el.classList.add('pointer-events-none');
        el.style.pointerEvents = 'none';
        el.setAttribute('aria-modal', 'false');
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('inert', '');
        if (item.options && item.options.onClose) {
          item.options.onClose(el);
        }
      }

      unlockScroll();

      if (item.trigger && typeof item.trigger.focus === 'function') {
        try {
          item.trigger.focus();
        } catch (e) {}
      }
    }

    function isOpen(id) {
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].id === id) return true;
      }
      return false;
    }

    return {
      open: open,
      close: close,
      isOpen: isOpen,
      isLocked: isLocked
    };
  })();

  // ================= 1. THEME TOGGLE (B1 SAFE STORAGE) =================
  function initTheme() {
    var themeToggle = document.getElementById('theme-toggle');
    var html = document.documentElement;

    function setTheme(theme, skipEvent) {
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
      document.body.removeAttribute('data-theme');
      safeStorageSet('theme-v2', theme);
      updateThemeIcon(theme);
      if (themeToggle) {
        var label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        themeToggle.setAttribute('aria-label', label);
        themeToggle.setAttribute('title', label);
      }
      var metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#070B13' : '#F5F8FC');
      }
      if (!skipEvent) {
        try {
          window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: theme } }));
        } catch (e) {}
      }
    }

    function updateThemeIcon(theme) {
      var icon = document.getElementById('theme-icon');
      var label = document.getElementById('theme-label');
      if (icon) {
        if (theme === 'dark') {
          icon.innerHTML = '<svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
        } else {
          icon.innerHTML = '<svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
        }
      }
      if (label) {
        label.textContent = theme === 'dark' ? 'Dark' : 'Light';
      }
    }

    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var savedTheme = safeStorageGet('theme-v2', prefersLight ? 'light' : 'dark');
    setTheme(savedTheme);

    try {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
        if (!safeStorageGet('theme-v2', null)) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      });
    } catch(e) {}

    var isThemeTransitioning = false;

    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var isDark = html.classList.contains('dark');
        var nextTheme = isDark ? 'light' : 'dark';
        var root = document.documentElement;

        if (isThemeTransitioning || root.dataset.magicuiThemeVt === 'active') return;

        // Check if browser supports View Transition API (Chrome 111+, Safari 18+)
        if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setTheme(nextTheme);
          return;
        }

        // Percentage-based snapshot coordinates (MagicUI specification)
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var rect = themeToggle.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        var maxRadius = Math.hypot(
          Math.max(cx, viewportWidth - cx),
          Math.max(cy, viewportHeight - cy)
        );

        var toX = ((cx / viewportWidth) * 100).toFixed(3) + '%';
        var toY = ((cy / viewportHeight) * 100).toFixed(3) + '%';
        var point = toX + ' ' + toY;
        var refBox = Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2;
        var toRadius = ((maxRadius / refBox) * 100).toFixed(3) + '%';

        var clipPath = [
          'circle(0% at ' + point + ')',
          'circle(' + toRadius + ' at ' + point + ')'
        ];

        isThemeTransitioning = true;
        root.dataset.magicuiThemeVt = 'active';
        root.style.setProperty('--magicui-theme-toggle-vt-duration', '400ms');
        root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

        var pendingTheme = nextTheme;
        var cleanup = function () {
          isThemeTransitioning = false;
          delete root.dataset.magicuiThemeVt;
          root.style.removeProperty('--magicui-theme-toggle-vt-duration');
          root.style.removeProperty('--magicui-theme-vt-clip-from');
          // Fire themechanged AFTER animation — keeps canvas redraw out of transition
          try {
            window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: pendingTheme } }));
          } catch (e) {}
        };

        var transition = document.startViewTransition(function () {
          setTheme(nextTheme, true); // skipEvent=true → no canvas reflow mid-animation
        });

        if (transition && transition.finished && typeof transition.finished.finally === 'function') {
          transition.finished.finally(cleanup).catch(function () {});
        } else {
          setTimeout(cleanup, 450);
        }

        if (transition && transition.ready) {
          transition.ready.then(function () {
            document.documentElement.animate(
              {
                clipPath: clipPath
              },
              {
                duration: 400,
                easing: 'ease-in-out',
                fill: 'forwards',
                pseudoElement: '::view-transition-new(root)'
              }
            );
          }).catch(function () {});
        }
      });
    }

    // Header scroll blur and border intensifier (§4.1, §6)
    var header = document.getElementById('site-header');
    if (header) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 8) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }, { passive: true });
    }

    // Floating dock scroll-hide / scroll-show (swipe down = hide, swipe up = show)
    var floatingDock = document.getElementById('mobile-floating-dock');
    if (floatingDock) {
      var lastScrollY = window.scrollY;
      var dockHideThreshold = 5; // px — prevents jitter on tiny scrolls
      window.addEventListener('scroll', function () {
        var currentY = window.scrollY;
        var delta = currentY - lastScrollY;
        if (delta > dockHideThreshold) {
          // Scrolling DOWN — hide dock
          floatingDock.classList.add('dock-hidden');
        } else if (delta < -dockHideThreshold) {
          // Scrolling UP — show dock
          floatingDock.classList.remove('dock-hidden');
        }
        lastScrollY = currentY;
      }, { passive: true });
    }

    // Scroll-Spy for main navigation active indicator (§4.1)
    if (window.IntersectionObserver) {
      var sections = document.querySelectorAll('section[id], main[id]');
      var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
      var dockItems = document.querySelectorAll('.dock-item[data-dock-target]');
      if (sections.length && (navLinks.length || dockItems.length)) {
        var spyObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = entry.target.getAttribute('id');
              // Update desktop nav links
              navLinks.forEach(function (link) {
                var href = link.getAttribute('href');
                if (href === '#' + id) {
                  link.classList.add('active-nav');
                } else if (href && href.startsWith('#')) {
                  link.classList.remove('active-nav');
                }
              });
              // Update mobile floating dock items
              dockItems.forEach(function (item) {
                var target = item.getAttribute('data-dock-target');
                if (target === id) {
                  item.classList.add('active');
                } else {
                  item.classList.remove('active');
                }
              });
            }
          });
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

        sections.forEach(function (sec) {
          spyObserver.observe(sec);
        });
      }
    }
  }

  // ================= 2. MOBILE NAVIGATION =================
  function toggleMobileMenu(forceClose) {
    var btn = document.getElementById('mobile-menu-btn');
    var menu = document.getElementById('mobile-nav-menu');
    var icon = document.getElementById('mobile-menu-icon');
    if (!btn || !menu) return;

    var willOpen = forceClose === true ? false : (forceClose === false ? true : menu.classList.contains('hidden'));
    if (willOpen) {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      if (icon) {
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
      }
    } else {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (icon) {
        icon.innerHTML = '<line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line>';
      }
    }
  }

  function initMobileNav() {
    // Listen for Escape key, outside click, and desktop resize
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        toggleMobileMenu(true);
      }
    });

    document.addEventListener('click', function (e) {
      var menu = document.getElementById('mobile-nav-menu');
      var btn = document.getElementById('mobile-menu-btn');
      if (!menu || !btn) return;
      if (!menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
          toggleMobileMenu(true);
        }
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) {
        toggleMobileMenu(true);
      }
    }, { passive: true });
  }

  var CAMPUS_SLIDES = [
    {
      id: 1,
      title: 'Slide 01: Dual-Homed Multi-Tier Campus Topology (15 Nodes)',
      shortTitle: 'Topology Blueprint',
      domain: 'Campus Architecture',
      src: 'assets/labs/campus/slides/slide-01-network-topology-architecture.png',
      webp: 'assets/labs/campus/slides/slide-01-network-topology-architecture.webp',
      thumb: 'assets/labs/campus/slides/slide-01-network-topology-architecture-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-01-network-topology-architecture.png',
      badge: '15 Infrastructure Nodes',
      desc: 'Complete 15-node dual-building enterprise campus blueprint. Edge ASBR R1 dual-homed to ISP-A & ISP-B, wire-speed routed core switches CSW1/CSW2, dual distribution blocks for Office A & B, 6 access switches, enterprise server SRV1, and centralized Cisco 3504 WLC mobility.',
      kpis: [
        { label: 'Campus Nodes', val: '15 Active Devices' },
        { label: 'Core Transit', val: '/30 Point-to-Point' },
        { label: 'Network Hierarchy', val: '3-Tier Modular' }
      ],
      cliCmd: 'R1# show ip ospf neighbor',
      cliBadge: 'Area 0 Full Adjacency',
      cliOutput: 'Neighbor ID     Pri   State           Dead Time   Address         Interface\n10.0.0.77         0   FULL/  -        00:00:37    10.0.0.34       GigabitEthernet0/0 (CSW1)\n10.0.0.78         0   FULL/  -        00:00:32    10.0.0.38       GigabitEthernet0/1 (CSW2)\n\n*OSPF-5-ADJCHG: Process 1, Nbr 10.0.0.77 on Gi0/0 from LOADING to FULL\n✓ 15-Node Campus Core Converged (Po1 10.0.0.40/30) · 0 Packet Drops'
    },
    {
      id: 2,
      title: 'Slide 02: Dual EtherChannels — Cisco PAgP vs IEEE 802.3ad LACP',
      shortTitle: 'PAgP vs LACP',
      domain: 'EtherChannel Trunking',
      src: 'assets/labs/campus/slides/slide-02-dual-etherchannel-pagp-vs-lacp.png',
      webp: 'assets/labs/campus/slides/slide-02-dual-etherchannel-pagp-vs-lacp.webp',
      thumb: 'assets/labs/campus/slides/slide-02-dual-etherchannel-pagp-vs-lacp-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-02-dual-etherchannel-pagp-vs-lacp.png',
      badge: 'PortChannel 1 SU',
      desc: 'Side-by-side protocol battlecard comparing Cisco proprietary PAgP (desirable/desirable) on Office A distribution against IEEE 802.3ad LACP (active/active) on Office B distribution. Implements src-dst-ip hashing and dedicated native VLAN 1000 isolation.',
      kpis: [
        { label: 'Office A Trunk', val: 'PAgP Po1 (Desirable)' },
        { label: 'Office B Trunk', val: 'IEEE LACP Po1 (Active)' },
        { label: 'Load Balancing', val: 'src-dst-ip Hash' }
      ],
      cliCmd: 'DSW-A1# show etherchannel summary',
      cliBadge: 'PortChannel 1 Operational',
      cliOutput: 'Group  Port-channel  Protocol    Ports\n------+-------------+-----------+-----------------------------------------------\n1      Po1(SU)         PAgP      Gi0/1(P)    Gi0/2(P)   \n\nRU - Routed Up, SU - Switched Up, P - In Port-channel\n✓ PortChannel 1 in SU state · 2 Gbps aggregated bandwidth\n✓ Native VLAN 1000 isolated · 802.1Q tagged trunks active'
    },
    {
      id: 3,
      title: 'Slide 03: Wire-Speed Layer 3 Routed Core & CEF Switching Fabrics',
      shortTitle: 'Routed Core & CEF',
      domain: 'Layer 3 Routed Core',
      src: 'assets/labs/campus/slides/slide-03-layer3-routed-core-cef-switching.png',
      webp: 'assets/labs/campus/slides/slide-03-layer3-routed-core-cef-switching.webp',
      thumb: 'assets/labs/campus/slides/slide-03-layer3-routed-core-cef-switching-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-03-layer3-routed-core-cef-switching.png',
      badge: 'Zero STP Loops',
      desc: 'Contrasting Legacy Layer 2 STP blocking with Modern Wire-Speed Layer 3 CEF routing. /30 point-to-point transit links and inter-core routed PortChannel 1 eliminate spanning-tree loops, enable Equal-Cost Multi-Path (ECMP), and guarantee sub-millisecond hardware convergence.',
      kpis: [
        { label: 'Transit Links', val: '/30 Point-to-Point' },
        { label: 'Inter-Core Link', val: 'Po1 (10.0.0.40/30)' },
        { label: 'FIB Forwarding', val: 'Cisco CEF Hardware' }
      ],
      cliCmd: 'CSW1# show ip route | include 10.0.0',
      cliBadge: 'CEF Hardware Forwarding',
      cliOutput: 'O        10.0.0.36/30 [110/2] via 10.0.0.42, 00:41:12, Port-channel1\n                      [110/2] via 10.0.0.33, 00:41:12, GigabitEthernet0/1\nC        10.0.0.40/30 is directly connected, Port-channel1\nC        10.0.0.32/30 is directly connected, GigabitEthernet0/1\n\n✓ Equal-Cost Multi-Path (ECMP) verified across L3 PortChannel 1\n✓ 0 STP Loops · Wire-Speed ASIC forwarding active'
    },
    {
      id: 4,
      title: 'Slide 04: HSRPv2 Per-VLAN Active/Standby & Rapid-PVST+ Root Alignment',
      shortTitle: 'HSRPv2 & STP Root',
      domain: 'Gateway Redundancy',
      src: 'assets/labs/campus/slides/slide-04-hsrpv2-rapid-pvst-root-alignment.png',
      webp: 'assets/labs/campus/slides/slide-04-hsrpv2-rapid-pvst-root-alignment.webp',
      thumb: 'assets/labs/campus/slides/slide-04-hsrpv2-rapid-pvst-root-alignment-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-04-hsrpv2-rapid-pvst-root-alignment.png',
      badge: 'Tuned Failover',
      desc: 'Per-VLAN First-Hop Gateway redundancy across 8 HSRPv2 groups strictly aligned with Rapid-PVST+ root bridge priorities. DSW-A1 is Primary Gateway & STP Root for odd VLANs (10, 99); DSW-A2 for even VLANs (20, 40). Eliminates inter-switch trunk saturation with tuned preemption timers.',
      kpis: [
        { label: 'Root Alignment', val: 'STP Root == HSRP VIP' },
        { label: 'Active Groups', val: '8 HSRPv2 Groups' },
        { label: 'Convergence', val: '< 1s Hardware Converged' }
      ],
      cliCmd: 'DSW-A1# show standby brief',
      cliBadge: 'HSRP Active & Preempt',
      cliOutput: 'Interface   Grp  Pri P State   Active          Standby         Virtual IP\nVl10        2    105 P Active  local           10.1.0.3        10.1.0.1 (PCs)\nVl20        3    100   Standby 10.2.0.3        local           10.2.0.1 (Phones)\nVl40        4    100   Standby 10.6.0.3        local           10.6.0.1 (Wi-Fi)\nVl99        9    105 P Active  local           10.0.0.3        10.0.0.1 (Mgmt)\n\n✓ Rapid-PVST+ Bridge ID 4096 aligns with HSRP Priority 105\n✓ 0 Hairpinning across Inter-Switch Trunk · Symmetrical Egress'
    },
    {
      id: 5,
      title: 'Slide 05: OSPFv2 Backbone Area 0 & Dual-Homed WAN Failover',
      shortTitle: 'OSPF & Dual WAN',
      domain: 'Dynamic WAN Routing',
      src: 'assets/labs/campus/slides/slide-05-ospfv2-area0-floating-static-wan.png',
      webp: 'assets/labs/campus/slides/slide-05-ospfv2-area0-floating-static-wan.webp',
      thumb: 'assets/labs/campus/slides/slide-05-ospfv2-area0-floating-static-wan-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-05-ospfv2-area0-floating-static-wan.png',
      badge: 'Floating Static AD 2',
      desc: 'Single-area OSPF backbone with ip ospf network point-to-point links bypassing 40-second DR/BDR election timeouts. Perimeter ASBR R1 injects default routes into Area 0 with dual-homed WAN failover: ISP-A primary (AD 1) and ISP-B backup (floating static AD 2).',
      kpis: [
        { label: 'Network Type', val: 'Point-to-Point (No DR)' },
        { label: 'Primary WAN', val: 'ISP-A (AD 1 / 203.0.113.1)' },
        { label: 'Backup WAN', val: 'ISP-B (AD 2 Floating)' }
      ],
      cliCmd: 'R1# show ip route static',
      cliBadge: 'Dual WAN Failover Active',
      cliOutput: 'S*    0.0.0.0/0 [1/0] via 203.0.113.1 (ISP-A GigabitEthernet0/2)\n! Backup floating static route dormant in running-config:\n! ip route 0.0.0.0 0.0.0.0 203.0.113.6 2 (ISP-B Gi0/3)\n\n✓ OSPF Area 0 Backbone Converged (Hello: 10s, Dead: 40s)\n✓ Sub-second failover to ISP-B on primary WAN carrier drop'
    },
    {
      id: 6,
      title: 'Slide 06: Centralized DHCP Services, Relay & Option 43 Telemetry',
      shortTitle: 'DHCP & Option 43',
      domain: 'Enterprise Services',
      src: 'assets/labs/campus/slides/slide-06-centralized-dhcp-relay-telemetry.png',
      webp: 'assets/labs/campus/slides/slide-06-centralized-dhcp-relay-telemetry.webp',
      thumb: 'assets/labs/campus/slides/slide-06-centralized-dhcp-relay-telemetry-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-06-centralized-dhcp-relay-telemetry.png',
      badge: '7 DHCP Pools',
      desc: 'Centralized enterprise address management hosting 7 DHCP scopes on R1. Distribution switches execute ip helper-address GIADDR translation across routed cores. Implements DHCP Option 43 (hex sub-option 0xf104) to automate CAPWAP discovery for lightweight APs without manual staging.',
      kpis: [
        { label: 'DHCP Scopes', val: '7 Enterprise Pools' },
        { label: 'WLC Discovery', val: 'Option 43 (Hex 0xf104)' },
        { label: 'Time Sync', val: 'NTP MD5 Stratum 5' }
      ],
      cliCmd: 'R1# show ip dhcp binding',
      cliBadge: 'Scopes Active — Option 43',
      cliOutput: 'IP address       Client-ID/Hardware address   Lease expiration        Type\n10.1.0.50        0100.5079.6668.01            Oct 01 2026 12:00 AM    Automatic\n10.2.0.55        0100.5079.6668.02            Oct 01 2026 12:00 AM    Automatic\n10.6.0.12        0100.3504.wlc1.01            Oct 01 2026 12:00 AM    Automatic\n\n✓ Option 43 sub-option 0xf104 broadcasting WLC1 10.6.0.10\n✓ ip helper-address active on DSW-A1/A2 and DSW-B1/B2 SVIs'
    },
    {
      id: 7,
      title: 'Slide 07: Perimeter Static 1:1 NAT & Dynamic PAT Overload',
      shortTitle: 'NAT & Dynamic PAT',
      domain: 'Edge Translation',
      src: 'assets/labs/campus/slides/slide-07-perimeter-static-nat-dynamic-pat.png',
      webp: 'assets/labs/campus/slides/slide-07-perimeter-static-nat-dynamic-pat.webp',
      thumb: 'assets/labs/campus/slides/slide-07-perimeter-static-nat-dynamic-pat-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-07-perimeter-static-nat-dynamic-pat.png',
      badge: 'RFC 3022 NAT Engine',
      desc: 'RFC 3022 network address translation engine on perimeter router R1. Employs Static 1:1 NAT to expose DMZ Enterprise Server SRV1 to public clients, while Dynamic PAT Overload translates all internal corporate subnets (10.0.0.0/8) behind dual WAN public interfaces.',
      kpis: [
        { label: 'DMZ Server NAT', val: '1:1 Static (SRV1)' },
        { label: 'Client Internet', val: 'Dynamic PAT Overload' },
        { label: 'Inside Interfaces', val: 'Gi0/0, Gi0/1 (Core)' }
      ],
      cliCmd: 'R1# show ip nat translations',
      cliBadge: 'NAT & Dynamic PAT Overload',
      cliOutput: 'Pro  Inside global         Inside local          Outside local         Outside global\ntcp  203.0.113.2:80        10.5.0.10:80          ---                   --- (SRV1 Static)\nudp  203.0.113.1:53210     10.1.0.50:53210       8.8.8.8:53            8.8.8.8:53\ntcp  203.0.113.1:49152     10.2.0.55:49152       203.0.113.200:443     203.0.113.200:443\n\n✓ 1:1 Static NAT for SRV1 DMZ verified\n✓ Dynamic PAT pool overload fully mapped across dual WAN links'
    },
    {
      id: 8,
      title: 'Slide 08: Layer 2 Security Suite — DAI, DHCP Snooping & Port-Security',
      shortTitle: 'L2 Defense Citadel',
      domain: 'Layer 2 Hardening',
      src: 'assets/labs/campus/slides/slide-08-layer2-access-security-citadel.png',
      webp: 'assets/labs/campus/slides/slide-08-layer2-access-security-citadel.webp',
      thumb: 'assets/labs/campus/slides/slide-08-layer2-access-security-citadel-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-08-layer2-access-security-citadel.png',
      badge: 'Layer 2 Hardening',
      desc: 'Access-layer defense-in-depth security citadel. Dynamic ARP Inspection (DAI) validates ARP packets against the DHCP snooping binding database. Untrusted access ports enforce 15 pps rate-limiting. Sticky MAC port security in restrict mode prevents unauthorized rogue machines from entering the network.',
      kpis: [
        { label: 'ARP Defense', val: 'Dynamic ARP Inspection' },
        { label: 'Snooping', val: 'DHCP Trust Boundaries' },
        { label: 'Port Security', val: 'Sticky MAC (Restrict)' }
      ],
      cliCmd: 'ASW-A1# show ip dhcp snooping binding',
      cliBadge: 'DHCP Snooping & DAI Trusted',
      cliOutput: 'MacAddress          IpAddress        Lease(sec)  Type          VLAN  Interface\n------------------  ---------------  ----------  ------------  ----  --------------------\n00:50:79:66:68:01   10.1.0.50        86400       dhcp-snooping 10    FastEthernet0/1\n00:50:79:66:68:02   10.2.0.55        86400       dhcp-snooping 20    FastEthernet0/2\n\n✓ DAI Active: 0 ARP Spoofing Drops\n✓ Rate limit: 15 pps on untrusted access ports | BPDU Guard active'
    },
    {
      id: 9,
      title: 'Slide 09: Dual-Stack IPv6 Routing Fabric & Cisco 3504 WLC Mobility',
      shortTitle: 'IPv6 & Wireless WLC',
      domain: 'Wireless & IPv6',
      src: 'assets/labs/campus/slides/slide-09-dual-stack-ipv6-wlc-mobility.png',
      webp: 'assets/labs/campus/slides/slide-09-dual-stack-ipv6-wlc-mobility.webp',
      thumb: 'assets/labs/campus/slides/slide-09-dual-stack-ipv6-wlc-mobility-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-09-dual-stack-ipv6-wlc-mobility.png',
      badge: 'CAPWAP Mobility',
      desc: 'Dual-Stack IPv6 global unicast architecture combined with enterprise centralized wireless. Cisco 3504 WLC manages lightweight APs (LWAP1, LWAP2) via CAPWAP tunnels (UDP 5246/5247) with Split-MAC architecture. Delivers seamless campus-wide 802.11 roaming and WPA2-Enterprise security.',
      kpis: [
        { label: 'Wireless Controller', val: 'Cisco 3504 (VLAN 40)' },
        { label: 'Tunnel Protocol', val: 'CAPWAP (UDP 5246/5247)' },
        { label: 'Addressing', val: 'Dual-Stack IPv4/IPv6' }
      ],
      cliCmd: 'WLC1# show ap summary',
      cliBadge: 'CAPWAP Mobility Tunnels',
      cliOutput: 'Number of APs.................................... 2\n\nAP Name          Slots  AP Model             MAC Address       State    Port\n---------------  -----  -------------------  ----------------  -------  -----\nLWAP1            2      AIR-AP2802I-B-K9     00:3a:98:41:22:01 Registered 1    \nLWAP2            2      AIR-AP2802I-B-K9     00:3a:98:41:22:02 Registered 1    \n\n✓ LWAP1 & LWAP2 joined WLC1 via DHCP Option 43\n✓ Split-MAC architecture active: 0 roam disconnects reported'
    },
    {
      id: 10,
      title: 'Slide 10: NOC Audit & Verification Runbook Matrix',
      shortTitle: 'NOC Verification',
      domain: 'NOC Audit & Sign-off',
      src: 'assets/labs/campus/slides/slide-10-noc-audit-verification-runbook.png',
      webp: 'assets/labs/campus/slides/slide-10-noc-audit-verification-runbook.webp',
      thumb: 'assets/labs/campus/slides/slide-10-noc-audit-verification-runbook-thumb.webp',
      raw: 'assets/labs/campus/slides/slide-10-noc-audit-verification-runbook.png',
      badge: 'NOC Verification Checklist',
      desc: 'Production engineering handover runbook. Comprehensive 10-point NOC CLI verification matrix auditing every protocol: EtherChannel PAgP/LACP, OSPF Area 0, HSRPv2 preemption, DHCP Option 43, DAI ARP tables, NAT translations, and CAPWAP tunnels with zero open triage tickets.',
      kpis: [
        { label: 'Audit Points', val: '10 Verification Checks' },
        { label: 'Handover Status', val: 'Fully Documented' },
        { label: 'Verification', val: 'Zero Open Triage Tickets' }
      ],
      cliCmd: 'NOC# show run | section verification',
      cliBadge: 'NOC Verification Checklist',
      cliOutput: '[TEST 01] L3 Routed Core OSPF Area 0 Neighbor Adjacencies   [PASS - FULL]\n[TEST 02] Inter-Core L3 PortChannel 1 /30 Wire-Speed CEF     [PASS - UP/UP]\n[TEST 03] Office A PAgP PortChannel 1 Bundled Desirable       [PASS - SU]\n[TEST 04] Office B IEEE LACP PortChannel 1 Bundled Active     [PASS - SU]\n[TEST 05] HSRPv2 Gateway Preemption & STP Root Alignment     [PASS - SYNC]\n[TEST 06] Dual-Homed WAN Failover (ISP-A Primary, ISP-B AD2)  [PASS - CONVERGED]\n[TEST 07] Centralized DHCP Relay (7 Scopes) + Option 43       [PASS - BOUND]\n[TEST 08] Enterprise Perimeter 1:1 Static NAT & Dynamic PAT   [PASS - TRANSLATING]\n[TEST 09] Layer 2 Defense: DAI Validation + DHCP Snooping     [PASS - SECURE]\n[TEST 10] Cisco 3504 WLC CAPWAP Wireless Mobility Roaming     [PASS - REGISTERED]\n\n✓ CCNA Capstone Infrastructure Audit: 10/10 Verification Checks Documented'
    }
  ];

  // ================= 3. CAMPUS SLIDE & 4K LIGHTBOX CONTROLLER =================
  function selectCaseStudySlide(index) {
    if (index < 0 || index >= CAMPUS_SLIDES.length) return;
    caseStudySlideIndex = index;
    var slide = CAMPUS_SLIDES[index];

    var img = document.getElementById('cs-active-slide-img');
    var titleEl = document.getElementById('cs-deck-title');
    var counterEl = document.getElementById('cs-deck-counter');

    if (titleEl) titleEl.textContent = slide.title;
    if (counterEl) counterEl.textContent = 'SLIDE ' + (index + 1).toString().padStart(2, '0') + ' / ' + CAMPUS_SLIDES.length;

    if (img) {
      img.style.opacity = '0.5';
      img.src = slide.webp || slide.src;
      img.alt = slide.title;
      setTimeout(function () {
        img.style.opacity = '1';
      }, 50);
    }

    var thumbs = document.querySelectorAll('.cs-thumb-card');
    thumbs.forEach(function (thumb, idx) {
      if (idx === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  function prevCaseStudySlide() {
    var prev = (caseStudySlideIndex - 1 + CAMPUS_SLIDES.length) % CAMPUS_SLIDES.length;
    selectCaseStudySlide(prev);
  }

  function nextCaseStudySlide() {
    var next = (caseStudySlideIndex + 1) % CAMPUS_SLIDES.length;
    selectCaseStudySlide(next);
  }

  function openTopologyDeckModal(index) {
    index = (typeof index === 'number' && !isNaN(index)) ? index : 0;
    if (index < 0 || index >= CAMPUS_SLIDES.length) index = 0;
    deckModalSlideIndex = index;

    var modal = document.getElementById('topology-deck-modal');
    var card = document.getElementById('topology-deck-card');
    if (!modal || !card) return;

    updateDeckModalContent(deckModalSlideIndex);

    OverlayManager.open('topology-deck-modal', {
      initialFocus: '[data-action="next-deck-slide"]',
      onOpen: function () {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
      },
      onClose: function () {
        card.classList.remove('scale-100');
        card.classList.add('scale-95');
        modal.classList.add('opacity-0', 'pointer-events-none');
      }
    });
  }

  function closeTopologyDeckModal() {
    OverlayManager.close('topology-deck-modal');
  }

  function nextDeckSlide() {
    deckModalSlideIndex = (deckModalSlideIndex + 1) % CAMPUS_SLIDES.length;
    updateDeckModalContent(deckModalSlideIndex);
  }

  function prevDeckSlide() {
    deckModalSlideIndex = (deckModalSlideIndex - 1 + CAMPUS_SLIDES.length) % CAMPUS_SLIDES.length;
    updateDeckModalContent(deckModalSlideIndex);
  }

  function updateDeckModalContent(index) {
    var slide = CAMPUS_SLIDES[index];
    if (!slide) return;

    var title = document.getElementById('deck-modal-title');
    var counter = document.getElementById('deck-modal-counter');
    var img = document.getElementById('deck-modal-img');
    var rawBtn = document.getElementById('deck-modal-download-btn');

    if (title) title.textContent = slide.title;
    if (counter) counter.textContent = (index + 1) + ' / ' + CAMPUS_SLIDES.length;
    if (img) {
      img.src = slide.webp || slide.src;
      img.alt = slide.title;
    }
    if (rawBtn) rawBtn.href = slide.raw || slide.src;
  }

  window.openTopologyDeckModal = openTopologyDeckModal;
  window.closeTopologyDeckModal = closeTopologyDeckModal;
  window.nextDeckSlide = nextDeckSlide;
  window.prevDeckSlide = prevDeckSlide;

  // ================= 4. DATA LOADING & DIRECTORY SEARCH / FILTER =================
  function loadProjects() {
    allProjects = window.PORTFOLIO_PROJECTS || [];
  }

  var activeProtocols = [];

  function initProtocolFilters() {
    var chips = document.querySelectorAll('.proto-chip[data-proto-filter], .apple-proto-chip[data-proto-filter]');
    if (!chips.length) return;

    if (allProjects && allProjects.length) {
      chips.forEach(function (chip) {
        var proto = (chip.getAttribute('data-proto-filter') || '').toLowerCase().trim();
        if (!proto) return;
        var count = allProjects.filter(function (p) {
          var pool = ((p.title || '') + ' ' + (p.summary || '') + ' ' + (p.tags ? p.tags.join(' ') : '') + ' ' + (p.problem_and_fix || '')).toLowerCase();
          return pool.indexOf(proto) !== -1;
        }).length;
        var rawLabel = chip.textContent.split('(')[0].trim();
        chip.textContent = rawLabel + ' (' + count + ')';
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var proto = (this.getAttribute('data-proto-filter') || '').toLowerCase().trim();
        if (!proto) return;

        var idx = activeProtocols.indexOf(proto);
        if (idx !== -1) {
          activeProtocols.splice(idx, 1);
          this.classList.remove('is-active');
          this.setAttribute('aria-pressed', 'false');
        } else {
          activeProtocols.push(proto);
          this.classList.add('is-active');
          this.setAttribute('aria-pressed', 'true');
        }

        renderTier3Explorer();
      });
    });
  }

  function resetAllFilters() {
    currentCategory = 'all';
    currentSearch = '';
    activeProtocols = [];

    var searchInput = document.getElementById('project-search');
    if (searchInput) searchInput.value = '';

    var clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.classList.add('hidden');

    var filterBtns = document.querySelectorAll('[data-filter-cat]');
    filterBtns.forEach(function (b) {
      var cat = b.getAttribute('data-filter-cat');
      if (cat === 'all') {
        b.classList.add('filter-active');
        b.setAttribute('aria-selected', 'true');
      } else {
        b.classList.remove('filter-active');
        b.setAttribute('aria-selected', 'false');
      }
    });

    var protoChips = document.querySelectorAll('.proto-chip[data-proto-filter]');
    protoChips.forEach(function (c) {
      c.classList.remove('is-active');
      c.setAttribute('aria-pressed', 'false');
    });

    renderTier3Explorer();
  }

  function initFilters() {
    var filterBtns = document.querySelectorAll('[data-filter-cat]');

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = this.getAttribute('data-filter-cat') || 'all';

        if (cat === 'all') {
          resetAllFilters();
          return;
        }

        filterBtns.forEach(function (b) {
          b.classList.remove('filter-active');
          b.setAttribute('aria-selected', 'false');
        });

        this.classList.add('filter-active');
        this.setAttribute('aria-selected', 'true');

        currentCategory = cat;
        renderTier3Explorer();
      });
    });

    initProtocolFilters();
  }

  function initSearch() {
    var searchInput = document.getElementById('project-search');
    var clearBtn = document.getElementById('search-clear-btn');

    function updateClearBtnVisibility() {
      if (!clearBtn) return;
      if (searchInput && searchInput.value.trim().length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        currentSearch = e.target.value.trim().toLowerCase();
        updateClearBtnVisibility();
        renderTier3Explorer();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        currentSearch = '';
        updateClearBtnVisibility();
        renderTier3Explorer();
      });
    }
  }

  function getFilteredProjects() {
    return allProjects.filter(function (p) {
      var matchesCat = (currentCategory === 'all') || (p.category_slug === currentCategory);
      if (!matchesCat) return false;

      var textPool = (
        (p.title || '') + ' ' + 
        (p.summary || '') + ' ' + 
        (p.category || '') + ' ' + 
        (p.tags ? p.tags.join(' ') : '') + ' ' + 
        (p.folder || '') + ' ' +
        (p.problem_and_fix || '')
      ).toLowerCase();

      if (currentSearch && textPool.indexOf(currentSearch) === -1) {
        return false;
      }

      if (activeProtocols.length > 0) {
        var matchesProto = activeProtocols.some(function (proto) {
          return textPool.indexOf(proto) !== -1;
        });
        if (!matchesProto) return false;
      }

      return true;
    });
  }

  function renderTier3Explorer() {
    var container = document.getElementById('explorer-table-body');
    var counter = document.getElementById('results-count');
    if (!container) return;

    var filtered = getFilteredProjects();

    if (counter) {
      counter.textContent = 'Showing ' + filtered.length + ' of ' + allProjects.length + ' documented enterprise labs';
    }

    if (filtered.length === 0) {
      container.innerHTML = 
        '<tr><td colspan="5" class="py-12 text-center text-slate-500">' +
          '<svg class="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' +
          '<p class="text-xs font-semibold" style="color: var(--text);">No networking labs matched your filters.</p>' +
          '<p class="text-xs mt-1" style="color: var(--muted);">Try selecting another protocol or clearing your search.</p>' +
          '<button type="button" class="btn btn-ghost btn-xs text-xs font-mono mt-3 rounded border !py-1 !px-3" style="border-color: var(--line-strong);" data-action="clear-filters">Clear all filters</button>' +
        '</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (p, index) {
      var tagsPills = p.tags ? p.tags.slice(0, 3).map(function (t) {
        return '<span class="apple-tag-pill">' + escapeHtml(t) + '</span>';
      }).join('') : '';

      var disciplineClass = 'apple-discipline-routing';
      var dotClass = 'bg-sky-500';
      if (p.category_slug === 'campus') {
        disciplineClass = 'apple-discipline-campus';
        dotClass = 'bg-blue-500';
      } else if (p.category_slug === 'security') {
        disciplineClass = 'apple-discipline-security';
        dotClass = 'bg-emerald-500';
      } else if (p.category_slug === 'services') {
        disciplineClass = 'apple-discipline-services';
        dotClass = 'bg-amber-500';
      }

      html += 
        '<tr class="directory-row group cursor-pointer" data-action="open-case-study" data-lab-id="' + p.id + '">' +
          '<td class="col-idx">' +
            '<span class="apple-index-badge">' + String(index + 1).padStart(2, '0') + '</span>' +
          '</td>' +
          '<td class="col-scenario">' +
            '<div class="font-display font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">' +
              escapeHtml(p.title) +
            '</div>' +
          '</td>' +
          '<td class="col-discipline whitespace-nowrap">' +
            '<span class="apple-discipline-pill ' + disciplineClass + '">' +
              '<span class="w-1.5 h-1.5 rounded-full ' + dotClass + '"></span>' +
              escapeHtml(p.category) +
            '</span>' +
          '</td>' +
          '<td class="col-protocols">' +
            '<div class="flex flex-wrap gap-1">' + tagsPills + '</div>' +
          '</td>' +
          '<td class="col-action whitespace-nowrap">' +
            '<button type="button" class="apple-action-btn" data-action="open-case-study" data-lab-id="' + p.id + '" aria-label="' + escapeHtml('View NOC Runbook for ' + p.title) + '">' +
              'View Runbook <svg class="w-3.5 h-3.5 ml-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
            '</button>' +
          '</td>' +
        '</tr>';
    });

    container.innerHTML = html;
  }

  // ================= 5. CASE STUDY DRAWER & RUNBOOK =================
  window.openCaseStudy = function (projectId, options) {
    var project = allProjects.find(function (p) { return p.id === projectId; });
    if (!project) return;

    var drawer = document.getElementById('case-study-drawer');
    var backdrop = document.getElementById('drawer-backdrop');
    var contentElem = document.getElementById('drawer-content');
    if (!drawer || !backdrop || !contentElem) return;

    options = options || {};
    if (!options.skipHistory && window.location.hash !== '#lab=' + project.id) {
      try {
        history.pushState({ labId: project.id }, '', '#lab=' + project.id);
      } catch (e) {
        window.location.hash = 'lab=' + project.id;
      }
    }

    var tagsHtml = '';
    if (project.tags) {
      tagsHtml = project.tags.map(function (t) {
        return '<span class="tag-badge text-xs font-mono">' + escapeHtml(t) + '</span>';
      }).join(' ');
    }

    var tableHtml = '';
    if (project.addressing_table) {
      tableHtml = 
        '<div class="my-6">' +
          '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-semibold">Addressing &amp; Interface Schema</h4>' +
          '<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">' +
            renderMarkdownTable(project.addressing_table) +
          '</div>' +
        '</div>';
    }

    var problemHtml = '';
    if (project.problem_and_fix) {
      problemHtml = 
        '<div class="my-6 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">' +
          '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 font-semibold">' +
            '<svg class="w-4 h-4 inline mr-1 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Engineering Resolution' +
          '</h4>' +
          '<div class="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans space-y-1">' +
            renderMarkdownText(project.problem_and_fix) +
          '</div>' +
        '</div>';
    }

    var verifHtml = '';
    if (project.verification) {
      verifHtml = 
        '<div class="my-6">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">' +
              '<svg class="w-4 h-4 inline mr-1 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Cisco IOS CLI Telemetry &amp; Verification' +
            '</h4>' +
            '<button type="button" data-action="copy-drawer-code" class="btn btn-ghost btn-xs text-xs font-mono !py-0.5 !px-2 rounded border border-slate-700">Copy</button>' +
          '</div>' +
          '<pre class="drawer-code-block p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">' +
            escapeHtml(project.verification) +
          '</pre>' +
        '</div>';
    }

    var isCampusLab = project.id === 'campus' || project.category_slug === 'campus';
    var slidesDeckHtml = '';

    if (isCampusLab) {
      var initialSlide = CAMPUS_SLIDES[caseStudySlideIndex || 0];
      slidesDeckHtml = 
        '<div class="my-6">' +
          '<div class="flex items-center justify-between mb-2.5">' +
            '<div class="flex items-center gap-2">' +
              '<span class="w-2 h-2 rounded-full bg-blue-500"></span>' +
              '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">10-Slide Engineering Architecture Deck</h4>' +
            '</div>' +
            '<span id="cs-deck-counter" class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">SLIDE ' + ((caseStudySlideIndex || 0) + 1).toString().padStart(2, '0') + ' / ' + CAMPUS_SLIDES.length + '</span>' +
          '</div>' +

          '<div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md">' +
            '<div class="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-300 select-none">' +
              '<span id="cs-deck-title" class="font-bold text-slate-100 truncate pr-2">' + escapeHtml(initialSlide.title) + '</span>' +
              '<button type="button" data-action="open-deck" class="px-2.5 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition-all flex items-center gap-1 font-semibold shrink-0">' +
                '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg> 4K Inspect' +
              '</button>' +
            '</div>' +

            '<div id="cs-stage-container" data-action="open-deck" class="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer select-none group">' +
              '<img id="cs-active-slide-img" src="' + (initialSlide.webp || initialSlide.src) + '" alt="' + escapeHtml(initialSlide.title) + '" width="1080" height="608" decoding="async" class="w-full h-full object-contain" />' +
              
              '<button type="button" data-action="prev-cs-slide" class="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center transition-colors" aria-label="Previous Slide">' +
                '<svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>' +
              '</button>' +
              '<button type="button" data-action="next-cs-slide" class="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center transition-colors" aria-label="Next Slide">' +
                '<svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +

          '<!-- 10-Slide Filmstrip -->' +
          '<div class="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">' +
            CAMPUS_SLIDES.map(function (slide, idx) {
              var isActive = idx === (caseStudySlideIndex || 0) ? ' border-blue-500' : ' border-transparent';
              var thumbSrc = slide.thumb || slide.src;
              return '<button type="button" data-action="select-cs-slide" data-cs-slide-idx="' + idx + '" class="shrink-0 w-24 rounded border-2 overflow-hidden bg-slate-900 transition-all' + isActive + '" title="' + escapeHtml(slide.title) + '" aria-label="' + escapeHtml(slide.title) + '">' +
                '<div class="aspect-[16/9] w-full overflow-hidden bg-slate-950 relative">' +
                  '<img src="' + thumbSrc + '" width="240" height="135" alt="" loading="lazy" decoding="async" class="w-full h-full object-cover" />' +
                  '<span class="absolute top-0.5 left-0.5 px-1 rounded bg-black/80 text-xs font-mono text-white">' + (idx + 1) + '</span>' +
                '</div>' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>';
    }

    var topoHtml = '';
    if (project.topology_img) {
      topoHtml = 
        '<div class="my-6">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Topology Architecture</h4>' +
            '<span class="text-xs font-mono text-slate-400">Cisco Packet Tracer / GNS3</span>' +
          '</div>' +
          '<div class="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-950 shadow-sm">' +
            '<img src="' + project.topology_img + '" alt="Topology Diagram" class="w-full h-auto rounded object-contain max-h-[460px] mx-auto" />' +
          '</div>' +
        '</div>';
    }

    var configsHtml = '';
    if (project.configs && project.configs.length > 0) {
      var cfgBadges = project.configs.map(function (c) {
        return '<span class="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">' +
                 '<svg class="w-3.5 h-3.5 inline mr-1 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> ' + escapeHtml(c) +
               '</span>';
      }).join(' ');

      configsHtml = 
        '<div class="my-6">' +
          '<h4 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-semibold">Configuration Files</h4>' +
          '<div class="flex flex-wrap gap-2">' + cfgBadges + '</div>' +
        '</div>';
    }

    var currIdx = allProjects.findIndex(function (p) { return p.id === project.id; });
    var prevLab = currIdx > 0 ? allProjects[currIdx - 1] : null;
    var nextLab = (currIdx !== -1 && currIdx < allProjects.length - 1) ? allProjects[currIdx + 1] : null;

    var navButtonsHtml = '';
    if (prevLab || nextLab) {
      navButtonsHtml = '<div class="flex items-center gap-2">';
      if (prevLab) {
        navButtonsHtml += '<button type="button" data-action="open-case-study" data-lab-id="' + prevLab.id + '" class="btn btn-ghost btn-sm !text-xs font-mono" title="' + escapeHtml(prevLab.title) + '">← Prev lab</button>';
      }
      if (nextLab) {
        navButtonsHtml += '<button type="button" data-action="open-case-study" data-lab-id="' + nextLab.id + '" class="btn btn-ghost btn-sm !text-xs font-mono" title="' + escapeHtml(nextLab.title) + '">Next lab →</button>';
      }
      navButtonsHtml += '</div>';
    }

    contentElem.innerHTML = 
      '<div>' +
        '<div class="flex items-center gap-2 mb-3">' +
          '<span class="tag-badge text-xs font-semibold">' + escapeHtml(project.category) + '</span>' +
          '<span class="text-xs font-mono text-slate-400">·</span>' +
          '<span class="text-xs font-mono text-emerald-500">Documented Lab</span>' +
        '</div>' +

        '<h2 class="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-4">' +
          escapeHtml(project.title) +
        '</h2>' +

        '<div class="flex flex-wrap gap-1.5 mb-6">' +
          tagsHtml +
        '</div>' +

        '<div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">' +
          escapeHtml(project.summary) +
        '</div>' +

        slidesDeckHtml +
        topoHtml +
        tableHtml +
        problemHtml +
        verifHtml +
        configsHtml +

        '<div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">' +
          navButtonsHtml +
          '<div class="flex items-center gap-2">' +
            '<a href="' + escapeHtml(project.repo_url) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary inline-flex items-center gap-1.5 min-h-[44px]">' +
              '<svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> View Repository on GitHub' +
            '</a>' +
            '<button type="button" data-action="close-case-study" class="btn btn-ghost">' +
              'Close Runbook' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var progressLine = document.getElementById('drawer-progress');
    if (progressLine) {
      progressLine.style.width = '0%';
      drawer.onscroll = function () {
        var maxScroll = drawer.scrollHeight - drawer.clientHeight;
        var pct = maxScroll > 0 ? (drawer.scrollTop / maxScroll) * 100 : 0;
        progressLine.style.width = Math.min(Math.max(pct, 0), 100) + '%';
      };
    }

    OverlayManager.open('case-study-drawer', {
      initialFocus: '#drawer-close-btn',
      onOpen: function () {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        var wrapper = document.getElementById('drawer-wrapper');
        if (wrapper) wrapper.classList.add('open');
      },
      onClose: function () {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        var wrapper = document.getElementById('drawer-wrapper');
        if (wrapper) wrapper.classList.remove('open');
        if (!options.skipHistory && window.location.hash.indexOf('#lab=') === 0) {
          try {
            history.pushState(null, '', window.location.pathname + window.location.search);
          } catch (e) {
            window.location.hash = '';
          }
        }
      }
    });

    if (backdrop) {
      backdrop.onclick = function () {
        window.closeCaseStudy();
      };
    }
  };

  window.closeCaseStudy = function (options) {
    OverlayManager.close('case-study-drawer');
  };

  function checkUrlDeepLink() {
    var hash = window.location.hash || '';
    if (hash.indexOf('#lab=') === 0) {
      var labId = hash.replace('#lab=', '').trim();
      if (labId) {
        window.openCaseStudy(labId, { skipHistory: true });
      }
    } else if (hash.indexOf('#directory?tag=') === 0 || hash.indexOf('#directory?search=') === 0) {
      var tag = decodeURIComponent((hash.split('?')[1] || '').split('=')[1] || '').trim();
      if (tag) {
        setTimeout(function () { applyTagFilter(tag); }, 150);
      }
    }
  }

  window.addEventListener('popstate', function () {
    var hash = window.location.hash || '';
    if (hash.indexOf('#lab=') === 0) {
      var labId = hash.replace('#lab=', '').trim();
      window.openCaseStudy(labId, { skipHistory: true });
    } else if (hash.indexOf('#directory?tag=') === 0 || hash.indexOf('#directory?search=') === 0) {
      var tag = decodeURIComponent((hash.split('?')[1] || '').split('=')[1] || '').trim();
      if (tag) {
        applyTagFilter(tag);
      }
    } else if (OverlayManager.isOpen('case-study-drawer')) {
      window.closeCaseStudy({ skipHistory: true });
    }
  });

// ================= 10. MARKDOWN TABLE PARSER =================
  function renderMarkdownTable(md) {
    if (!md) return '';
    var lines = md.trim().split('\n');
    if (lines.length < 2) return '';

    var headerLine = lines[0];
    var dataLines = lines.slice(2);

    var headers = headerLine.split('|').map(function (h) { return h.trim(); }).filter(function (h) { return h.length > 0; });

    var html = '<table class="case-study-table"><thead><tr>';
    headers.forEach(function (h) {
      html += '<th>' + formatInlineMarkdown(h) + '</th>';
    });
    html += '</tr></thead><tbody>';

    dataLines.forEach(function (line) {
      if (!line.trim() || line.indexOf('|') === -1) return;
      var cols = line.split('|').map(function (c) { return c.trim(); });
      if (cols.length > 2) {
        cols = cols.slice(1, -1);
      }
      html += '<tr>';
      cols.forEach(function (col) {
        html += '<td class="font-mono text-xs">' + formatInlineMarkdown(col) + '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  function formatInlineMarkdown(str) {
    if (!str) return '';
    var escaped = escapeHtml(str);
    // Bold with **text** or __text__ (processed first)
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    escaped = escaped.replace(/__(.+?)__/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    // Italic with *text* or _text_ (No look-behind assertions for Safari < 16.4 compatibility)
    escaped = escaped.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em class="italic text-slate-600 dark:text-slate-400">$2</em>');
    escaped = escaped.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em class="italic text-slate-600 dark:text-slate-400">$2</em>');
    // Inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-200/85 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold border border-slate-300/60 dark:border-slate-700/60">$1</code>');
    // Links [text](url) - Sanitized against javascript: URLs (B30)
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, function (match, text, url) {
      var cleanUrl = (url || '').trim();
      if (/^(https?:\/\/|mailto:|\/|\.\/|#|assets\/|slides\/)/i.test(cleanUrl)) {
        return '<a href="' + escapeHtml(cleanUrl) + '" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 font-medium inline-flex items-center gap-1 underline underline-offset-2">' + text + '</a>';
      }
      return text;
    });
    return escaped;
  }

  function renderMarkdownText(md) {
    if (!md) return '';
    var rawLines = md.split('\n');
    var out = [];
    var inList = false;
    var tableBuffer = [];
    var inCodeBlock = false;
    var codeBlockBuffer = [];

    function flushTable() {
      if (tableBuffer.length > 0) {
        var tableMd = tableBuffer.join('\n');
        tableBuffer = [];
        out.push('<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg my-4 shadow-sm">' + renderMarkdownTable(tableMd) + '</div>');
      }
    }

    function flushCodeBlock() {
      if (codeBlockBuffer.length > 0) {
        var code = codeBlockBuffer.join('\n');
        codeBlockBuffer = [];
        out.push('<pre class="terminal-snippet text-xs my-3 p-3.5 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 overflow-x-auto font-mono"><code>' + escapeHtml(code) + '</code></pre>');
      }
    }

    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i];
      var trimmed = line.trim();

      // Fenced code blocks
      if (trimmed.startsWith('```')) {
        if (inList) { out.push('</ul>'); inList = false; }
        if (tableBuffer.length > 0) flushTable();
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBlockBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        continue;
      }

      // Table line
      if (trimmed.startsWith('|')) {
        if (inList) { out.push('</ul>'); inList = false; }
        tableBuffer.push(line);
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable();
      }

      if (!trimmed) {
        if (inList) {
          out.push('</ul>');
          inList = false;
        }
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('<hr class="my-4 border-slate-200 dark:border-slate-800" />');
        continue;
      }

      // Blockquotes / Tips
      if (trimmed.startsWith('>')) {
        if (inList) { out.push('</ul>'); inList = false; }
        var bq = trimmed.replace(/^>\s*/, '');
        out.push('<div class="pl-3 py-1.5 my-2 border-l-2 border-blue-500 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 rounded-r-md">' + formatInlineMarkdown(bq) + '</div>');
        continue;
      }

      // Headings: #, ##, ###, ####
      var headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        if (inList) { out.push('</ul>'); inList = false; }
        var level = headingMatch[1].length;
        var headingText = formatInlineMarkdown(headingMatch[2]);
        if (level === 1) {
          out.push('<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3 font-mono">' + headingText + '</h3>');
        } else if (level === 2) {
          out.push('<h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-5 mb-2.5 font-mono">' + headingText + '</h4>');
        } else if (level === 3) {
          out.push('<h5 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 font-mono uppercase tracking-wider"><svg class="w-3 h-3 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> ' + headingText + '</h5>');
        } else {
          out.push('<h6 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1.5 font-mono uppercase tracking-wider">' + headingText + '</h6>');
        }
        continue;
      }

      // Bullet lists (- or * or numbered list or nested indent)
      var listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          out.push('<ul class="space-y-2 my-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">');
          inList = true;
        }
        var indent = listMatch[1].length;
        var itemContent = formatInlineMarkdown(listMatch[3]);
        var indentClass = indent >= 2 ? 'pl-5 text-slate-600 dark:text-slate-400' : 'pl-0';
        var dotColor = indent >= 2 ? 'bg-slate-400 dark:bg-slate-500' : 'bg-blue-500';
        out.push('<li class="flex items-start gap-2.5 ' + indentClass + '"><span class="w-1.5 h-1.5 rounded-full ' + dotColor + ' shrink-0 mt-2"></span><span class="flex-1 leading-relaxed">' + itemContent + '</span></li>');
        continue;
      }

      // Standard paragraph
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push('<p class="my-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">' + formatInlineMarkdown(trimmed) + '</p>');
    }

    if (inCodeBlock) flushCodeBlock();
    if (tableBuffer.length > 0) flushTable();
    if (inList) out.push('</ul>');

    return out.join('\n');
  }

  

  // ================= 6. GLOBAL DELEGATED ACTION LISTENER =================
  document.body.addEventListener('click', function (e) {
    var actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    var action = actionEl.getAttribute('data-action');

    if (action === 'toggle-mobile-menu') {
      if (actionEl.tagName === 'A' && actionEl.getAttribute('href')) {
        var href = actionEl.getAttribute('href');
        toggleMobileMenu(true);
        if (href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          var target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            try {
              history.pushState(null, '', href);
            } catch (err) {}
          }
        }
        return;
      }
      e.preventDefault();
      toggleMobileMenu();
    } else if (action === 'open-deck') {
      e.preventDefault();
      var deckIdx = actionEl.getAttribute('data-deck-index');
      var num = deckIdx !== null ? parseInt(deckIdx, 10) : (typeof caseStudySlideIndex !== 'undefined' ? caseStudySlideIndex : 0);
      openTopologyDeckModal(isNaN(num) ? 0 : num);
    } else if (action === 'close-deck') {
      e.preventDefault();
      closeTopologyDeckModal();
    } else if (action === 'prev-deck-slide') {
      e.preventDefault();
      prevDeckSlide();
    } else if (action === 'next-deck-slide') {
      e.preventDefault();
      nextDeckSlide();
    } else if (action === 'prev-cs-slide') {
      e.preventDefault();
      prevCaseStudySlide();
    } else if (action === 'next-cs-slide') {
      e.preventDefault();
      nextCaseStudySlide();
    } else if (action === 'select-cs-slide') {
      e.preventDefault();
      var csIdx = parseInt(actionEl.getAttribute('data-cs-slide-idx'), 10);
      selectCaseStudySlide(csIdx);
    } else if (action === 'open-case-study') {
      e.preventDefault();
      var labId = actionEl.getAttribute('data-lab-id');
      if (labId) openCaseStudy(labId);
    } else if (action === 'close-case-study') {
      e.preventDefault();
      closeCaseStudy();
    }
  });

  // ================= HERO ENHANCEMENTS (§4.2) =================
  function initHeroCounters() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    if (prefersReduced) return;

    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-counter'), 10);
      if (isNaN(target)) return;
      var duration = 700;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var easeOut = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(easeOut * target);
        el.textContent = current;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
      window.requestAnimationFrame(step);
    });
  }

  var currentSimMsg = 'Hover or tap a device to see its role';

  function initHeroTopology() {
    var tooltipText = document.getElementById('hero-node-tooltip-text');
    var nodes = document.querySelectorAll('.hero-topo-node');

    nodes.forEach(function (node) {
      function showInfo() {
        var info = node.getAttribute('data-info');
        if (tooltipText && info) {
          tooltipText.textContent = info;
          tooltipText.style.color = 'var(--text)';
        }
      }
      function resetInfo() {
        if (tooltipText) {
          tooltipText.textContent = currentSimMsg;
          tooltipText.style.color = '';
        }
      }

      node.addEventListener('mouseenter', showInfo);
      node.addEventListener('mouseleave', resetInfo);
      node.addEventListener('focus', showInfo);
      node.addEventListener('blur', resetInfo);
    });

    var animatedSvgs = document.querySelectorAll('.hero-topo-frame svg, #p-topo svg, .case-study-diagram svg');
    if (animatedSvgs.length && 'IntersectionObserver' in window) {
      var isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isReduced) {
        animatedSvgs.forEach(function (svg) {
          if (typeof svg.pauseAnimations === 'function') {
            try { svg.pauseAnimations(); } catch (e) {}
          }
        });
      } else {
        var svgAnimObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var svg = entry.target;
            if (entry.isIntersecting) {
              if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof svg.unpauseAnimations === 'function') {
                try { svg.unpauseAnimations(); } catch (e) {}
              }
            } else {
              if (typeof svg.pauseAnimations === 'function') {
                try { svg.pauseAnimations(); } catch (e) {}
              }
            }
          });
        }, { threshold: 0.1 });
        animatedSvgs.forEach(function (svg) { svgAnimObserver.observe(svg); });
      }
    }
  }

  function initTopoSimulation() {
    var simBtns = document.querySelectorAll('.sim-btn[data-sim]');
    var primaryPath = document.getElementById('primary-path');
    var packetPulses = document.querySelectorAll('.packet-pulses animateMotion');
    var linkR1CSW1 = document.getElementById('topo-link-r1-csw1');
    var nodeDSWA1 = document.getElementById('topo-node-dsw-a1');
    var tooltipText = document.getElementById('hero-node-tooltip-text');

    if (!simBtns.length) return;

    var paths = {
      'normal': 'M 320 54 L 240 126 L 157 228 L 113 321',
      'core-down': 'M 320 54 L 400 126 L 157 228 L 113 321',
      'gateway-down': 'M 320 54 L 240 126 L 267 228 L 198 321'
    };

    var messages = {
      'normal': 'Normal state: traffic forwards via primary Core CSW1 and HSRPv2 Active Root DSW-A1.',
      'core-down': 'Core link R1-CSW1 down: OSPF Area 0 ECMP reroutes via CSW2 with 0 packet drop.',
      'gateway-down': 'HSRP standby DSW-A2 becomes active; OSPF & PAgP reconverge via standby gateway.'
    };

    simBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var simType = this.getAttribute('data-sim') || 'normal';

        simBtns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-checked', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-checked', 'true');

        if (linkR1CSW1) linkR1CSW1.classList.remove('is-failed');
        if (nodeDSWA1) nodeDSWA1.classList.remove('is-failed');

        if (simType === 'core-down' && linkR1CSW1) {
          linkR1CSW1.classList.add('is-failed');
        } else if (simType === 'gateway-down' && nodeDSWA1) {
          nodeDSWA1.classList.add('is-failed');
        }

        var newPath = paths[simType] || paths['normal'];
        if (primaryPath) primaryPath.setAttribute('d', newPath);
        packetPulses.forEach(function (pulse) {
          pulse.setAttribute('path', newPath);
        });

        currentSimMsg = messages[simType] || messages['normal'];
        if (tooltipText) {
          tooltipText.textContent = currentSimMsg;
          tooltipText.style.color = 'var(--text)';
        }
      });
    });
  }

  // ================= HERO CONSOLE (TECHNICAL ARSENAL & LIVE CISCO IOS CLI) =================
  function initHeroConsole() {
    var btnSkills = document.getElementById('hero-tab-skills');
    var btnTerminal = document.getElementById('hero-tab-terminal');
    var panelSkills = document.getElementById('hero-panel-skills');
    var panelTerminal = document.getElementById('hero-panel-terminal');
    var termInput = document.getElementById('hero-terminal-input');
    var termStream = document.getElementById('hero-terminal-stream');
    var termHistory = document.getElementById('hero-terminal-history');

    var hasRevealedInitialTerminal = false;

    function playTerminalReveal() {
      if (!termStream) return;
      if (hasRevealedInitialTerminal) {
        if (termInput) termInput.focus();
        if (termStream) termStream.scrollTop = termStream.scrollHeight;
        return;
      }
      hasRevealedInitialTerminal = true;
      termStream.scrollTop = 0;

      var lines = termHistory ? termHistory.querySelectorAll('.terminal-line') : [];
      if (!lines.length) return;

      if (typeof gsap !== 'undefined' && typeof TextPlugin !== 'undefined') {
        var firstLine = lines[0];
        var remainingLines = Array.from(lines).slice(1);

        remainingLines.forEach(function (l) {
          l.style.opacity = '0';
          l.style.transform = 'translateY(5px)';
        });

        var cmdSpan = firstLine.querySelector('span:last-child');
        if (cmdSpan) {
          cmdSpan.innerHTML = '<span id="cli-typed-cmd"></span><span class="cli-typing-cursor"></span>';
          var targetSpan = document.getElementById('cli-typed-cmd');

          firstLine.classList.add('revealed');
          firstLine.style.opacity = '1';
          firstLine.style.transform = 'none';

          var tl = gsap.timeline();
          tl.to(targetSpan, {
            text: { value: 'show running-config', delimiter: '' },
            duration: 0.65,
            ease: 'none',
            onComplete: function () {
              var cursor = firstLine.querySelector('.cli-typing-cursor');
              if (cursor) cursor.style.display = 'none';
            }
          });

          tl.to(remainingLines, {
            opacity: 1,
            y: 0,
            duration: 0.28,
            stagger: 0.035,
            ease: 'power2.out',
            onStart: function () {
              remainingLines.forEach(function (l) { l.classList.add('revealed'); });
            },
            onComplete: function () {
              if (termInput) termInput.focus();
            }
          }, '+=0.1');
        }
      } else {
        // High-precision vanilla fallback: typewriter effect + staggered reveals
        var firstLine = lines[0];
        var remainingLines = Array.from(lines).slice(1);
        remainingLines.forEach(function (l) { l.classList.remove('revealed'); });

        var cmdSpan = firstLine ? firstLine.querySelector('span:last-child') : null;
        if (cmdSpan) {
          cmdSpan.innerHTML = '<span id="cli-typed-cmd"></span><span class="cli-typing-cursor"></span>';
          var targetSpan = document.getElementById('cli-typed-cmd');
          var cmdText = 'show running-config';
          var charIdx = 0;
          firstLine.classList.add('revealed');

          var typeInterval = setInterval(function () {
            if (charIdx < cmdText.length) {
              if (targetSpan) targetSpan.textContent += cmdText.charAt(charIdx);
              charIdx++;
            } else {
              clearInterval(typeInterval);
              var cursor = firstLine.querySelector('.cli-typing-cursor');
              if (cursor) cursor.style.display = 'none';
              remainingLines.forEach(function (line, idx) {
                setTimeout(function () {
                  line.classList.add('revealed');
                  if (idx === remainingLines.length - 1 && termInput) {
                    termInput.focus();
                  }
                }, (idx + 1) * 35);
              });
            }
          }, 30);
        } else {
          lines.forEach(function (l) { l.classList.add('revealed'); });
          if (termInput) termInput.focus();
        }
      }
    }

    function switchConsole(tab) {
      var isSkills = tab === 'skills';

      if (btnSkills) {
        btnSkills.setAttribute('aria-selected', isSkills ? 'true' : 'false');
        btnSkills.setAttribute('tabindex', isSkills ? '0' : '-1');
        btnSkills.classList.toggle('is-active', isSkills);
      }

      if (btnTerminal) {
        btnTerminal.setAttribute('aria-selected', !isSkills ? 'true' : 'false');
        btnTerminal.setAttribute('tabindex', !isSkills ? '0' : '-1');
        btnTerminal.classList.toggle('is-active', !isSkills);
      }

      if (panelSkills) {
        panelSkills.style.display = '';
        panelSkills.classList.remove('hidden');
        panelSkills.classList.toggle('is-active', isSkills);
        panelSkills.setAttribute('aria-hidden', isSkills ? 'false' : 'true');
      }

      if (panelTerminal) {
        panelTerminal.style.display = '';
        panelTerminal.classList.remove('hidden');
        panelTerminal.classList.toggle('is-active', !isSkills);
        panelTerminal.setAttribute('aria-hidden', !isSkills ? 'false' : 'true');
      }

      if (!isSkills) {
        if (!hasRevealedInitialTerminal && termStream) {
          termStream.scrollTop = 0;
        }
        playTerminalReveal();
      }
    }

    window.switchHeroConsole = switchConsole;

    if (btnSkills) {
      btnSkills.addEventListener('click', function () { switchConsole('skills'); });
      btnSkills.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (btnTerminal) btnTerminal.focus();
          switchConsole('terminal');
        }
      });
    }

    if (btnTerminal) {
      btnTerminal.addEventListener('click', function () { switchConsole('terminal'); });
      btnTerminal.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (btnSkills) btnSkills.focus();
          switchConsole('skills');
        }
      });
    }

    // Terminal Commands Engine
    var cmdHistory = [];
    var historyIndex = -1;
    var availableCommands = ['about', 'skills', 'projects', 'certs', 'resume', 'contact', 'sudo hire', 'clear', 'help'];

    var commandHandlers = {
      'about': function () {
        return [
          '<p class="terminal-line t-comment">! Candidate Profile &amp; NOC Operational Readiness</p>',
          '<p class="terminal-line"><span class="t-kw">name</span> <strong class="t-val-strong">Abdul Wahab Saim</strong></p>',
          '<p class="terminal-line"><span class="t-kw">role</span> <span class="t-success">Junior Network &amp; NOC Engineer</span></p>',
          '<p class="terminal-line"><span class="t-kw">certification</span> <span class="t-val">Cisco CCNA 200-301 (CSCO15110282, valid to Feb 2029)</span></p>',
          '<p class="terminal-line"><span class="t-kw">education</span> <span class="t-val">B.Sc. Computer Science (CGPA 3.58, University of Central Punjab)</span></p>',
          '<p class="terminal-line"><span class="t-kw">location</span> <span class="t-val">Goes, Zeeland, Netherlands 🇳🇱</span></p>',
          '<p class="terminal-line"><span class="t-kw">work-auth</span> <span class="t-val">Authorised to work in the Netherlands</span></p>',
          '<p class="terminal-line"><span class="t-kw">portfolio</span> <span class="t-val">32 Documented Labs · 15-Node Flagship Enterprise Campus Network</span></p>'
        ];
      },
      'skills': function () {
        return [
          '<p class="terminal-line t-comment">! Technical Competency &amp; Layer 2/3 Capabilities</p>',
          '<p class="terminal-line"><span class="t-kw">routing-l3</span> <span class="t-val">OSPFv2 Multi-Area, HSRPv2 Gateway Redundancy, EIGRP (AS 7/100), IPv6 Dual-Stack, ECMP</span></p>',
          '<p class="terminal-line"><span class="t-kw">switching-l2</span> <span class="t-val">802.1Q Trunks, Multilayer SVIs, Rapid-PVST+, STP Root Guard, EtherChannel (LACP/PAgP)</span></p>',
          '<p class="terminal-line"><span class="t-kw">l2-defense</span> <span class="t-val">Dynamic ARP Inspection (DAI), DHCP Snooping, Sticky MAC Port Security</span></p>',
          '<p class="terminal-line"><span class="t-kw">platforms</span> <span class="t-val">Cisco IOS-XE, Cisco 3504 WLC, Packet Tracer 8.2+, GNS3, Wireshark</span></p>',
          '<p class="terminal-line"><span class="t-kw">services</span> <span class="t-val">DHCP Relay, Extended ACLs, NAT/PAT Overload, Modular QoS CLI (MQC), NTPv4, SSHv2</span></p>'
        ];
      },
      'projects': function () {
        return [
          '<p class="terminal-line t-comment">! Documented Enterprise Repositories &amp; Topologies (32 Labs)</p>',
          '<p class="terminal-line"><span class="t-kw">flagship</span> <span class="t-val">15-Node Campus Mega Lab [L3 Core + WLC + DAI + OSPF + HSRP] &rarr; <a href="#flagship" class="t-link">#flagship</a></span></p>',
          '<p class="terminal-line"><span class="t-kw">routing</span> <span class="t-val">13 Labs (OSPFv2, EIGRP, HSRP, Floating Static Routes, Inter-VLAN SVI)</span></p>',
          '<p class="terminal-line"><span class="t-kw">security</span> <span class="t-val">13 Labs (Port Security, DAI, DHCP Snooping, EtherChannel, Rapid-PVST+)</span></p>',
          '<p class="terminal-line"><span class="t-kw">services</span> <span class="t-val">5 Labs (DHCP Relay, NAT/PAT Overload, NTP, WLC Wireless Mobility)</span></p>',
          '<p class="terminal-line t-comment">! Explore all 32 labs in the directory &rarr; <a href="#directory" class="t-link">#directory</a></p>'
        ];
      },
      'certs': function () {
        return [
          '<p class="terminal-line t-comment">! Cisco CCNA 200-301 Official Credential</p>',
          '<p class="terminal-line"><span class="t-kw">certification</span> <span class="t-val-strong">Cisco Certified Network Associate (CCNA 200-301)</span></p>',
          '<p class="terminal-line"><span class="t-kw">cisco-id</span> <span class="t-success">CSCO15110282 [VERIFIED]</span></p>',
          '<p class="terminal-line"><span class="t-kw">cert-date</span> <span class="t-val">February 26, 2026</span></p>',
          '<p class="terminal-line"><span class="t-kw">valid-thru</span> <span class="t-val">February 26, 2029</span></p>',
          '<p class="terminal-line"><span class="t-kw">verify-hash</span> <span class="t-param font-mono">852d6536dadd4375ac8964bdbd599b94</span></p>',
          '<p class="terminal-line"><span class="t-kw">verify-url</span> <a href="https://www.cisco.com/go/verifycertificate" target="_blank" rel="noopener noreferrer" class="t-link">https://www.cisco.com/go/verifycertificate ↗</a></p>'
        ];
      },
      'resume': function () {
        window.open('assets/Abdul-Wahab-Saim-CV.pdf', '_blank');
        return [
          '<p class="terminal-line t-success">% Opening assets/Abdul-Wahab-Saim-CV.pdf...</p>',
          '<p class="terminal-line t-comment">! Official Curriculum Vitae opened successfully.</p>'
        ];
      },
      'cv': function () {
        return commandHandlers['resume']();
      },
      'contact': function () {
        return [
          '<p class="terminal-line t-comment">! Direct Contact &amp; NOC Communication Endpoints</p>',
          '<p class="terminal-line"><span class="t-kw">email</span> <a href="mailto:abdulwahabsaim58.nl@gmail.com" class="t-link">abdulwahabsaim58.nl@gmail.com</a></p>',
          '<p class="terminal-line"><span class="t-kw">linkedin</span> <a href="https://linkedin.com/in/abdulwahabsaim" target="_blank" rel="noopener noreferrer" class="t-link">https://linkedin.com/in/abdulwahabsaim ↗</a></p>',
          '<p class="terminal-line"><span class="t-kw">github</span> <a href="https://github.com/abdulwahabsaim" target="_blank" rel="noopener noreferrer" class="t-link">https://github.com/abdulwahabsaim ↗</a></p>',
          '<p class="terminal-line"><span class="t-kw">location</span> <span class="t-val">Goes, Zeeland, Netherlands 🇳🇱</span></p>'
        ];
      },
      'sudo hire': function () {
        return [
          '<p class="terminal-line t-success">[ACCESS GRANTED // NOC PRIVILEGES UNLOCKED]</p>',
          '<p class="terminal-line"><span class="t-kw">Candidate:</span>   <strong class="t-val-strong">Abdul Wahab Saim</strong> (CCNA CSCO15110282)</p>',
          '<p class="terminal-line"><span class="t-kw">Decision:</span>    <span class="t-success">10/10 Hire Recommendation</span></p>',
          '<p class="terminal-line"><span class="t-kw">Role:</span>        <span class="t-val">Junior Network Engineer / NOC Specialist</span></p>',
          '<p class="terminal-line"><span class="t-kw">Work Auth:</span>   <span class="t-val">Authorised to work in the Netherlands 🇳🇱</span></p>',
          '<p class="terminal-line"><span class="t-kw">Next Action:</span> Send interview handshake to <a href="mailto:abdulwahabsaim58.nl@gmail.com" class="t-link font-bold">abdulwahabsaim58.nl@gmail.com</a></p>'
        ];
      },
      'hire': function () {
        return commandHandlers['sudo hire']();
      },
      'help': function () {
        return [
          '<p class="terminal-line t-comment">! Available Cisco IOS Candidate EXEC Commands:</p>',
          '<p class="terminal-line">  <span class="t-success">about</span>      - Candidate summary and NOC readiness</p>',
          '<p class="terminal-line">  <span class="t-success">skills</span>     - Layer 2, Layer 3, security, and tooling competencies</p>',
          '<p class="terminal-line">  <span class="t-success">projects</span>   - Summary of 32 documented enterprise labs</p>',
          '<p class="terminal-line">  <span class="t-success">certs</span>      - Official CCNA 200-301 telemetry &amp; verification hash</p>',
          '<p class="terminal-line">  <span class="t-success">resume</span>     - Open curriculum vitae (PDF)</p>',
          '<p class="terminal-line">  <span class="t-success">contact</span>    - Direct communication channels</p>',
          '<p class="terminal-line">  <span class="t-success">sudo hire</span>  - Unlock executive hire recommendation</p>',
          '<p class="terminal-line">  <span class="t-success">clear</span>      - Clear terminal history</p>'
        ];
      }
    };

    var activeStreamTimers = [];

    function clearActiveStream() {
      activeStreamTimers.forEach(function (t) { clearTimeout(t); });
      activeStreamTimers = [];
      if (termHistory) {
        var pending = termHistory.querySelectorAll('.terminal-stream-line:not(.streamed)');
        pending.forEach(function (el) {
          el.classList.add('streamed', 'revealed');
        });
      }
    }

    function runCommand(raw) {
      if (!termHistory) return;
      var clean = (raw || '').trim();
      var cmd = clean.toLowerCase();

      // Flush any ongoing stream before starting new command
      clearActiveStream();

      var promptP = document.createElement('p');
      promptP.className = 'terminal-line terminal-output-line revealed';
      promptP.style.opacity = '1';
      promptP.style.transform = 'none';
      promptP.innerHTML = '<span class="t-prompt">core-rtr-01#</span> ' + (clean ? '<span class="t-cmd">' + escapeHtml(clean) + '</span>' : '');
      termHistory.appendChild(promptP);

      if (termStream) {
        termStream.scrollTop = termStream.scrollHeight;
      }

      if (!cmd) {
        return;
      }

      if (cmd === 'clear' || cmd === 'cls') {
        termHistory.innerHTML = '';
        if (termStream) termStream.scrollTop = 0;
        return;
      }

      var fn = commandHandlers[cmd];
      var rawLines = [];

      if (fn) {
        rawLines = fn();
      } else {
        rawLines = [
          '<p class="terminal-line text-rose-500 font-semibold">% Unknown command: "' + escapeHtml(cmd) + '" — Available candidate commands: <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'about\')">about</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'skills\')">skills</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'projects\')">projects</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'certs\')">certs</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'resume\')">resume</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'contact\')">contact</span>, <span class="t-success underline cursor-pointer" onclick="window.runCiscoCommand(\'sudo hire\')">sudo hire</span>. Type <span class="t-param underline cursor-pointer" onclick="window.runCiscoCommand(\'help\')">help</span> for details.</p>'
        ];
      }

      // Create stream element nodes initially hidden
      var streamElements = rawLines.map(function (l) {
        var div = document.createElement('div');
        div.innerHTML = l;
        var child = div.firstElementChild || div;
        child.classList.add('terminal-line', 'terminal-stream-line');
        child.classList.remove('revealed');
        termHistory.appendChild(child);
        return child;
      });

      // Stream lines in realistic sequence (32ms per line, 45ms initial terminal processing ack)
      var staggerMs = 32;
      var initialAckMs = 45;

      streamElements.forEach(function (el, idx) {
        var timer = setTimeout(function () {
          el.classList.add('streamed', 'revealed');
          if (termStream) {
            termStream.scrollTop = termStream.scrollHeight;
          }
          if (idx === streamElements.length - 1 && termInput) {
            termInput.focus();
          }
        }, initialAckMs + (idx * staggerMs));
        activeStreamTimers.push(timer);
      });
    }

    window.runCiscoCommand = function (cmd) {
      if (termInput) termInput.value = '';
      cmdHistory.push(cmd);
      historyIndex = -1;
      runCommand(cmd);
      if (termInput) termInput.focus();
    };
    window.executeHeroQuickCmd = window.runCiscoCommand;

    if (termInput) {
      termInput.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          var val = termInput.value.trim().toLowerCase();
          if (val) {
            var match = availableCommands.find(function (c) {
              return c.indexOf(val) === 0;
            });
            if (match) termInput.value = match;
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (cmdHistory.length && historyIndex < cmdHistory.length - 1) {
            historyIndex++;
            termInput.value = cmdHistory[cmdHistory.length - 1 - historyIndex];
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) {
            historyIndex--;
            termInput.value = cmdHistory[cmdHistory.length - 1 - historyIndex];
          } else {
            historyIndex = -1;
            termInput.value = '';
          }
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          var val = termInput.value;
          termInput.value = '';
          if (val.trim()) {
            cmdHistory.push(val.trim());
            historyIndex = -1;
          }
          runCommand(val);
        }
      });
    }

    // Proof-linked chips jumping to directory (§2.4)
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.hero-chip[data-tag], .tag-badge[data-tag]');
      if (chip) {
        var tag = chip.getAttribute('data-tag');
        if (tag) {
          e.preventDefault();
          try {
            history.pushState(null, '', '#directory?tag=' + encodeURIComponent(tag));
          } catch(err) {}
          applyTagFilter(tag);
        }
        return;
      }

      var cmdBtn = e.target.closest('[data-action="run-cisco-cmd"]');
      if (cmdBtn) {
        e.preventDefault();
        var cmd = cmdBtn.getAttribute('data-cmd');
        if (cmd && window.runCiscoCommand) {
          window.runCiscoCommand(cmd);
        }
        return;
      }

      var switchBtn = e.target.closest('[data-action="switch-console"]');
      if (switchBtn) {
        e.preventDefault();
        var targetTab = switchBtn.getAttribute('data-console-tab');
        if (targetTab && window.switchHeroConsole) {
          window.switchHeroConsole(targetTab);
        }
        return;
      }
    });

    // Staggered hero-enter reveal trigger
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var heroEls = document.querySelectorAll('.hero-enter');
        heroEls.forEach(function (el) { el.classList.add('hero-in'); });
      });
    });
  }

  function applyTagFilter(tag) {
    activeProtocols = [];
    var protoChips = document.querySelectorAll('.proto-chip[data-proto-filter]');
    protoChips.forEach(function (c) {
      c.classList.remove('is-active');
      c.setAttribute('aria-pressed', 'false');
    });

    var searchInput = document.getElementById('project-search');
    var clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) {
      searchInput.value = tag;
      if (clearBtn) clearBtn.classList.remove('hidden');
      currentSearch = tag.toLowerCase();
      renderTier3Explorer();
      var dirSection = document.getElementById('directory');
      if (dirSection) {
        dirSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // ================= SECTION REVEALS & MOTION (§5.4, §6) =================
  function initSectionReveal() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '120px 0px' });

    reveals.forEach(function (el) {
      observer.observe(el);
    });

    // Safety net: ensure nothing stays invisible even if observer is slow
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        el.classList.add('in');
      });
    }, 1200);
  }

  function initCardSpotlights() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    var rafPending = false;
    var lastEvent = null;

    document.addEventListener('pointermove', function (e) {
      lastEvent = e;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          if (!lastEvent) return;
          var card = lastEvent.target.closest('.card, .card-enterprise, .step-card, .feature-icon-tile');
          if (!card) return;
          var rect = card.getBoundingClientRect();
          var x = (lastEvent.clientX - rect.left) + 'px';
          var y = (lastEvent.clientY - rect.top) + 'px';
          card.style.setProperty('--mouse-x', x);
          card.style.setProperty('--mouse-y', y);
          card.style.setProperty('--mx', x);
          card.style.setProperty('--my', y);
        });
      }
    }, { passive: true });
  }

  // ================= PHASE D: ATMOSPHERE & RESTORED ITEMS (§3) =================

  // 1. 2D Canvas Constellation (§3.1)
  function initConstellation() {
    var c = document.getElementById('constellation');
    if (!c) return;
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var N = 45, pts = [], raf = null, vis = true, w = 0, h = 0, dpr = 1;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function color() {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4C8DFF';
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = c.clientWidth || (c.parentElement ? c.parentElement.clientWidth : 800);
      h = c.clientHeight || (c.parentElement ? c.parentElement.clientHeight : 500);
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      pts = [];
      for (var i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var col = color();
      ctx.lineWidth = 1;

      for (var i = 0; i < N; i++) {
        for (var j = i + 1; j < N; j++) {
          var dx = pts[i].x - pts[j].x;
          var dy = pts[i].y - pts[j].y;
          var d = dx * dx + dy * dy;
          if (d < 150 * 150) {
            ctx.globalAlpha = 0.16 * (1 - Math.sqrt(d) / 150);
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 0.45;
      ctx.fillStyle = col;
      pts.forEach(function (p) {
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      });
    }

    function tick() {
      if (!vis) return;
      pts.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });
      draw();
      raf = requestAnimationFrame(tick);
    }

    size();
    seed();
    draw();

    if (reduce) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        vis = entries[0].isIntersecting;
        if (vis && !raf) {
          tick();
        } else if (!vis && raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      }).observe(c);
    }

    window.addEventListener('resize', function () {
      size();
      seed();
      draw();
    }, { passive: true });

    window.addEventListener('themechanged', function () {
      draw();
    });

    tick();
  }

  // 2. Scroll Progress Bar (§3, §135)
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(Math.max(progress, 0), 1) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 3. Local Time in Goes, Netherlands (§3, §137)
  function initLocalTime() {
    var clockEl = document.getElementById('nl-clock');
    if (!clockEl) return;
    var formatter = null;
    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (e) {}

    var timer = null;

    function update() {
      if (formatter) {
        try {
          clockEl.textContent = formatter.format(new Date());
          return;
        } catch (err) {}
      }
      var now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    function startTimer() {
      if (!timer) {
        update();
        timer = setInterval(update, 60000);
      }
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    startTimer();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    });
  }

  // 4. 1-Click Email & Credential Copy (§4.1, §4.6, §4.8)
  function initCopyEmail() {
    var copyBtn = document.getElementById('copy-email-btn');
    var snapBtn = document.getElementById('copy-snapshot-email-btn');

    function handleCopy(text, btn) {
      if (!btn) return;
      var origText = btn.textContent;
      function onCopied() {
        btn.textContent = 'Copied!';
        btn.style.color = 'var(--ok)';
        setTimeout(function () {
          btn.textContent = origText;
          btn.style.color = '';
        }, 1500);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onCopied).catch(fallback);
      } else {
        fallback();
      }

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        onCopied();
      }
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        handleCopy('abdulwahabsaim58.nl@gmail.com', copyBtn);
      });
    }

    if (snapBtn) {
      snapBtn.addEventListener('click', function () {
        handleCopy('abdulwahabsaim58.nl@gmail.com', snapBtn);
      });
    }

    document.addEventListener('click', function (e) {
      var ciscoIdBtn = e.target.closest('[data-action="copy-cisco-id"]');
      if (ciscoIdBtn) {
        e.preventDefault();
        handleCopy('CSCO15110282', ciscoIdBtn);
        return;
      }

      var verifyCodeBtn = e.target.closest('[data-action="copy-verify-code"]');
      if (verifyCodeBtn) {
        e.preventDefault();
        handleCopy('852d6536dadd4375ac8964bdbd599b94', verifyCodeBtn);
        return;
      }

      var copyDrawerBtn = e.target.closest('[data-action="copy-drawer-code"]');
      if (copyDrawerBtn) {
        e.preventDefault();
        var block = copyDrawerBtn.closest('div.my-6') ? copyDrawerBtn.closest('div.my-6').querySelector('.drawer-code-block') : document.querySelector('.drawer-code-block');
        if (block) {
          handleCopy(block.innerText || block.textContent, copyDrawerBtn);
        }
        return;
      }

      var clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        resetAllFilters();
        return;
      }
    });
  }

  // 5. ⌘K Command Palette (§3, §133)
  function initCmdPalette() {
    var dialog = document.getElementById('cmd-dialog');
    var triggerBtn = document.getElementById('cmd-palette-btn');
    var input = document.getElementById('cmd-input');
    var list = document.getElementById('cmd-list');
    var closeBtn = document.getElementById('cmd-close-btn');
    var countEl = document.getElementById('cmd-count');
    if (!dialog || !input || !list) return;

    var lastFocusedEl = null;
    var selectedIndex = 0;
    var currentResults = [];

    var sectionDestinations = [
      { title: 'Top / Hero Overview & NOC Console', id: 'top', type: 'Section', badge: 'Top' },
      { title: 'Flagship Campus Network (15-Node Core/Dist/Access)', id: 'flagship', type: 'Section', badge: 'Flagship' },
      { title: 'Selected Lab Repositories (Routing, Security, Services)', id: 'repos', type: 'Section', badge: 'Repos' },
      { title: 'All 32 Documented Labs Directory', id: 'directory', type: 'Section', badge: 'Directory' },
      { title: 'Core Networking Technical Skills', id: 'skills', type: 'Section', badge: 'Skills' },
      { title: 'Cisco Certification (CCNA 200-301) & Education', id: 'credentials', type: 'Section', badge: 'Cert' },
      { title: 'Engineering Methodology & Workflow', id: 'methodology', type: 'Section', badge: 'Workflow' },
      { title: 'Contact Abdul Wahab Saim & Availability', id: 'contact', type: 'Section', badge: 'Contact' }
    ];

    function buildResults(query) {
      query = (query || '').toLowerCase().trim();
      var results = [];

      // 1. Filter sections
      sectionDestinations.forEach(function (sec) {
        if (!query || sec.title.toLowerCase().indexOf(query) !== -1 || sec.type.toLowerCase().indexOf(query) !== -1 || sec.id.indexOf(query) !== -1) {
          results.push({
            title: sec.title,
            sub: '#' + sec.id,
            badge: sec.badge,
            action: function () {
              var target = document.getElementById(sec.id);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
      });

      // 2. Filter labs from allProjects
      if (allProjects && allProjects.length) {
        allProjects.forEach(function (lab) {
          var matchTitle = lab.title && lab.title.toLowerCase().indexOf(query) !== -1;
          var matchId = lab.id && lab.id.toLowerCase().indexOf(query) !== -1;
          var matchCategory = lab.category && lab.category.toLowerCase().indexOf(query) !== -1;
          var matchTags = lab.tags && lab.tags.some(function (t) { return t.toLowerCase().indexOf(query) !== -1; });
          var matchProtocols = lab.protocols && lab.protocols.some(function (p) { return p.toLowerCase().indexOf(query) !== -1; });

          if (!query || matchTitle || matchId || matchCategory || matchTags || matchProtocols) {
            var devCount = lab.deviceCount || lab.devices;
            var devStr = devCount ? (' · ' + devCount + ' devices') : '';
            results.push({
              title: lab.title,
              sub: (lab.category || 'Lab') + devStr,
              badge: lab.category || 'Lab',
              action: function () {
                if (window.openCaseStudy) {
                  window.openCaseStudy(lab.id);
                } else {
                  var labEl = document.querySelector('[data-lab-id="' + lab.id + '"]');
                  if (labEl) labEl.scrollIntoView({ behavior: 'smooth' });
                }
              }
            });
          }
        });
      }

      return results;
    }

    function setSelected(newIndex) {
      if (!currentResults.length) return;
      var oldItem = list.children[selectedIndex];
      if (oldItem) {
        oldItem.classList.remove('is-selected');
        oldItem.setAttribute('aria-selected', 'false');
      }
      selectedIndex = newIndex;
      var newItem = list.children[selectedIndex];
      if (newItem) {
        newItem.classList.add('is-selected');
        newItem.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', newItem.id);
        newItem.scrollIntoView({ block: 'nearest' });
      }
    }

    function renderResults() {
      list.innerHTML = '';
      if (!currentResults.length) {
        input.removeAttribute('aria-activedescendant');
        list.innerHTML = '<div class="p-4 text-center text-xs font-mono" style="color: var(--muted);">No matching destinations found.</div>';
        return;
      }

      currentResults.forEach(function (res, idx) {
        var item = document.createElement('div');
        item.id = 'cmd-item-' + idx;
        item.className = 'cmd-item' + (idx === selectedIndex ? ' is-selected' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', idx === selectedIndex ? 'true' : 'false');
        item.innerHTML = '<div><div class="font-medium text-xs">' + escapeHtml(res.title) + '</div><div class="text-xs font-mono mt-0.5" style="color: var(--muted);">' + escapeHtml(res.sub) + '</div></div><span class="cmd-item-badge">' + escapeHtml(res.badge) + '</span>';
        item.addEventListener('click', function () {
          closeDialog();
          res.action();
        });
        list.appendChild(item);
      });

      var activeEl = list.children[selectedIndex];
      if (activeEl) {
        input.setAttribute('aria-activedescendant', activeEl.id);
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    function update() {
      currentResults = buildResults(input.value);
      selectedIndex = 0;
      renderResults();
      if (countEl) {
        countEl.textContent = currentResults.length + (currentResults.length === 1 ? ' destination' : ' destinations');
      }
    }

    function openDialog() {
      lastFocusedEl = document.activeElement;
      input.value = '';
      update();
      document.body.style.overflow = 'hidden';
      input.setAttribute('aria-expanded', 'true');
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      input.focus();
    }

    function closeDialog() {
      document.body.style.overflow = '';
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
      }
    }

    if (triggerBtn) {
      var isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
      var kbd = triggerBtn.querySelector('kbd');
      if (kbd) {
        kbd.textContent = isMac ? '⌘K' : 'Ctrl K';
      }
      triggerBtn.setAttribute('aria-label', isMac ? 'Open command palette (⌘K)' : 'Open command palette (Ctrl+K)');
      triggerBtn.addEventListener('click', openDialog);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeDialog);
    }

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) {
        closeDialog();
      }
    });

    input.addEventListener('input', update);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentResults.length > 0) {
          setSelected((selectedIndex + 1) % currentResults.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentResults.length > 0) {
          setSelected((selectedIndex - 1 + currentResults.length) % currentResults.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults[selectedIndex]) {
          var action = currentResults[selectedIndex].action;
          closeDialog();
          action();
        }
      } else if (e.key === 'Escape') {
        closeDialog();
      }
    });

    window.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialog.hasAttribute('open')) {
          closeDialog();
        } else {
          openDialog();
        }
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'Up')) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // 6. Desktop Topology Hover Preview (§4.4)
  function initTopoHoverPreview() {
    var preview = document.getElementById('topo-hover-preview');
    var img = document.getElementById('topo-hover-img');
    var title = document.getElementById('topo-hover-title');
    var tableBody = document.getElementById('explorer-table-body');
    if (!preview || !img || !title || !tableBody) return;

    if (window.matchMedia && window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;

    tableBody.addEventListener('mouseover', function (e) {
      var row = e.target.closest('.directory-row[data-lab-id]');
      if (!row) return;

      var labId = row.getAttribute('data-lab-id');
      var lab = allProjects.find(function (p) { return p.id === labId; });
      if (!lab || !lab.topology_img) return;

      img.src = lab.topology_webp || lab.topology_img;
      title.textContent = lab.title || '';
      preview.classList.add('is-visible');
    });

    tableBody.addEventListener('mousemove', function (e) {
      if (!preview.classList.contains('is-visible')) return;
      var x = e.clientX + 20;
      var y = e.clientY - 90;
      var previewWidth = 280;
      var previewHeight = 180;

      if (x + previewWidth > window.innerWidth - 10) {
        x = e.clientX - previewWidth - 20;
      }
      if (y + previewHeight > window.innerHeight - 10) {
        y = window.innerHeight - previewHeight - 10;
      }
      if (y < 10) y = 10;

      preview.style.left = x + 'px';
      preview.style.top = y + 'px';
    });

    tableBody.addEventListener('mouseout', function (e) {
      var row = e.target.closest('.directory-row[data-lab-id]');
      var rel = e.relatedTarget ? e.relatedTarget.closest('.directory-row[data-lab-id]') : null;
      if (row && (!rel || rel !== row)) {
        preview.classList.remove('is-visible');
      }
    });
  }

  // 7. Section Navigation Rail (§4.7)
  function initSectionNavRail() {
    var rail = document.getElementById('section-nav-rail');
    if (!rail) return;

    var sections = ['top', 'flagship', 'repos', 'cases', 'directory', 'skills', 'credentials', 'methodology', 'contact'];
    var dots = rail.querySelectorAll('.rail-dot[data-section]');
    if (!dots.length) return;

    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          dots.forEach(function (dot) {
            var dotSec = dot.getAttribute('data-section');
            if (dotSec === id || (id === 'repos' && dotSec === 'cases')) {
              dot.classList.add('is-active');
              dot.setAttribute('aria-current', 'true');
            } else {
              dot.classList.remove('is-active');
              dot.removeAttribute('aria-current');
            }
          });
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(function (secId) {
      var el = document.getElementById(secId);
      if (el) observer.observe(el);
    });
  }

  // ================= 8. SKILLS ACCORDION CONTROLLER (SCROLL-DRIVEN & INTERACTIVE) =================
  function initSkillsAccordion() {
    var section = document.getElementById('skills');
    var items = document.querySelectorAll('.skills-accordion-item');
    if (!items.length) return;

    var lastManualClickTime = 0;
    var currentActiveIndex = 0;

    // Detect currently active item on load
    items.forEach(function (item, idx) {
      if (item.classList.contains('active')) {
        currentActiveIndex = idx;
      }
    });

    // 1. Manual Click Toggle
    items.forEach(function (item, idx) {
      var headerBtn = item.querySelector('.skills-row');
      if (!headerBtn) return;

      headerBtn.addEventListener('click', function () {
        lastManualClickTime = Date.now();
        var isActive = item.classList.contains('active');

        // Close other items for crisp single-open focus
        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('active');
            var otherBtn = other.querySelector('.skills-row');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isActive) {
          item.classList.remove('active');
          headerBtn.setAttribute('aria-expanded', 'false');
          currentActiveIndex = -1;
        } else {
          item.classList.add('active');
          headerBtn.setAttribute('aria-expanded', 'true');
          currentActiveIndex = idx;
        }
      });

      headerBtn.addEventListener('keydown', function (e) {
        var targetIdx = -1;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          targetIdx = (idx + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          targetIdx = (idx - 1 + items.length) % items.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          targetIdx = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          targetIdx = items.length - 1;
        }
        if (targetIdx !== -1) {
          var nextBtn = items[targetIdx].querySelector('.skills-row');
          if (nextBtn) nextBtn.focus();
        }
      });
    });

    function setActiveItem(targetIndex) {
      if (targetIndex === currentActiveIndex) return;
      currentActiveIndex = targetIndex;

      items.forEach(function (item, idx) {
        var btn = item.querySelector('.skills-row');
        if (idx === targetIndex) {
          if (!item.classList.contains('active')) {
            item.classList.add('active');
            if (btn) btn.setAttribute('aria-expanded', 'true');
          }
        } else {
          if (item.classList.contains('active')) {
            item.classList.remove('active');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    // 2. Buttery Smooth Scroll-Driven Progressive Expansion (Locked viewport parallax stepper with Hysteresis)
    var ticking = false;

    function onScrollSkills() {
      if (!section) return;
      // Skip automatic update if user clicked an accordion recently
      if (Date.now() - lastManualClickTime < 3000) return;

      var isPinned = window.matchMedia && window.matchMedia('(min-width: 768px) and (min-height: 720px)').matches;
      if (!isPinned) return; // In mobile / unpinned viewports, preserve manual tap control to avoid layout jump

      var rect = section.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;
      var topStickyOffset = 64; // navbar height offset var(--header-h)
      var scrollDistance = topStickyOffset - rect.top;
      var maxTravel = rect.height - (windowHeight - topStickyOffset);

      if (maxTravel <= 0) return;

      // Above sticky section: retain first tab
      if (scrollDistance < 0) {
        setActiveItem(0);
        return;
      }

      // Past sticky section: retain last tab
      if (scrollDistance > maxTravel) {
        setActiveItem(items.length - 1);
        return;
      }

      var progress = Math.max(0, Math.min(1, scrollDistance / maxTravel));

      // 4-Deck Hysteresis Stepper: Prevents boundary flicker and ensures seamless 60fps transitions
      var nextIndex = currentActiveIndex;
      if (currentActiveIndex === 0) {
        if (progress > 0.26) nextIndex = 1;
      } else if (currentActiveIndex === 1) {
        if (progress < 0.20) nextIndex = 0;
        else if (progress > 0.51) nextIndex = 2;
      } else if (currentActiveIndex === 2) {
        if (progress < 0.45) nextIndex = 1;
        else if (progress > 0.76) nextIndex = 3;
      } else if (currentActiveIndex === 3) {
        if (progress < 0.70) nextIndex = 2;
      } else {
        nextIndex = Math.min(items.length - 1, Math.floor(progress * items.length));
      }

      setActiveItem(nextIndex);
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          onScrollSkills();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ================= 9. TOUCH SNAP SLIDER ENGINE (MOBILE & HORIZONTAL SWIPE) =================
  function setupTouchSnapSlider(options) {
    var container = document.getElementById(options.containerId);
    if (!container) return;

    var dots = document.querySelectorAll(options.dotsSelector);
    var prevBtn = document.getElementById(options.prevBtnId);
    var nextBtn = document.getElementById(options.nextBtnId);
    var counter = document.getElementById(options.counterId);
    var cards = container.querySelectorAll(options.cardSelector);
    if (!cards.length) return;

    var currentIndex = 0;

    function updateActiveState(index) {
      if (index < 0) index = 0;
      if (index >= cards.length) index = cards.length - 1;
      currentIndex = index;

      dots.forEach(function (dot, i) {
        if (i === index) {
          dot.classList.add('active-dot');
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.classList.remove('active-dot');
          dot.removeAttribute('aria-current');
        }
      });

      if (counter) {
        counter.textContent = String(index + 1);
      }

      if (prevBtn) {
        prevBtn.style.opacity = index === 0 ? '0.35' : '1';
        prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
      }

      if (nextBtn) {
        nextBtn.style.opacity = index === cards.length - 1 ? '0.35' : '1';
        nextBtn.style.pointerEvents = index === cards.length - 1 ? 'none' : 'auto';
      }
    }

    var isProgrammaticScroll = false;
    var programmaticScrollTimer = null;

    function scrollToIndex(index) {
      if (index < 0) index = 0;
      if (index >= cards.length) index = cards.length - 1;
      var card = cards[index];
      if (card) {
        isProgrammaticScroll = true;
        clearTimeout(programmaticScrollTimer);
        programmaticScrollTimer = setTimeout(function () {
          isProgrammaticScroll = false;
        }, 500);

        container.scrollTo({
          left: card.offsetLeft,
          behavior: 'smooth'
        });
        updateActiveState(index);
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        scrollToIndex(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        scrollToIndex(currentIndex + 1);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-index'), 10);
        if (!isNaN(idx)) scrollToIndex(idx);
      });
    });

    var scrollTimer = null;
    container.addEventListener('scroll', function () {
      if (isProgrammaticScroll) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        if (isProgrammaticScroll) return;
        var scrollLeft = container.scrollLeft;
        var cardWidth = cards[0].offsetWidth;
        if (cardWidth > 0) {
          var newIndex = Math.round(scrollLeft / (cardWidth + 16));
          updateActiveState(newIndex);
        }
      }, 60);
    }, { passive: true });

    updateActiveState(0);
  }

  function initSliders() {
    // 1. Repositories Carousel
    setupTouchSnapSlider({
      containerId: 'repo-slider-container',
      dotsSelector: '#repo-slider-dots .repo-dot',
      prevBtnId: 'repo-slider-prev',
      nextBtnId: 'repo-slider-next',
      counterId: 'repo-slider-counter',
      cardSelector: '.card-enterprise'
    });

    // 2. NOC Engineering Protocol Carousel
    setupTouchSnapSlider({
      containerId: 'protocol-slider-container',
      dotsSelector: '#protocol-slider-dots .snap-dot',
      prevBtnId: 'protocol-slider-prev',
      nextBtnId: 'protocol-slider-next',
      counterId: 'protocol-slider-counter',
      cardSelector: '.card-enterprise'
    });

    // 3. Official Credentials Carousel
    setupTouchSnapSlider({
      containerId: 'credentials-slider-container',
      dotsSelector: '#credentials-slider-dots .snap-dot',
      prevBtnId: 'credentials-slider-prev',
      nextBtnId: 'credentials-slider-next',
      counterId: 'credentials-slider-counter',
      cardSelector: '.card'
    });
  }

  // ================= 10. INITIALIZATION =================
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initMobileNav();
    initHeroCounters();
    initHeroTopology();
    initHeroConsole();
    initTopoSimulation();
    initSectionReveal();
    initCardSpotlights();
    initConstellation();
    initScrollProgress();
    initLocalTime();
    initCopyEmail();
    initCmdPalette();
    initSectionNavRail();
    initSkillsAccordion();
    initSliders();
    loadProjects();
    initFilters();
    initSearch();
    initTopoHoverPreview();
    checkUrlDeepLink();
  });

})();
