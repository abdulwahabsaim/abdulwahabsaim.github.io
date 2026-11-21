/**
 * Minimal rehype plugin for Cisco CLI blocks and wide tables.
 *  - Prompt lines (R1#, DSW-A1(config-if)#, ASA-1>) get .cli-prompt + .cli-cmd spans.
 *  - Lines starting with "!" become .cli-comment.
 *  - Code blocks get a wrapper with a language label and a copy button hook.
 *  - Tables get a scroll wrapper so they never break the page width on phones.
 */
const PROMPT = /^([A-Za-z][\w.\-/]*(?:\([\w\-/.]+\))?[#>])(\s?.*)$/;

const text = (value) => ({ type: 'text', value });
const span = (cls, children) => ({ type: 'element', tagName: 'span', properties: { className: [cls] }, children });

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(textOf).join('');
}

function highlight(code) {
  const lines = code.replace(/\n$/, '').split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(PROMPT);
    if (m) out.push(span('cli-line is-cmd', [span('cli-prompt', [text(m[1])]), span('cli-cmd', [text(m[2])])]));
    else if (/^\s*!/.test(line)) out.push(span('cli-line cli-comment', [text(line)]));
    // Top-level IOS config commands (interface, router, hostname...) stand out from their sub-commands.
    else if (/^(interface|router|hostname|ip (route|dhcp|nat|access-list)|vlan|line|access-list|spanning-tree|enable|username|crypto|ntp|logging|object|object-group|nat|route|class-map|policy-map)\b/.test(line))
      out.push(span('cli-line cli-top', [text(line)]));
    else out.push(span('cli-line', [text(line)]));
    if (i < lines.length - 1) out.push(text('\n'));
  });
  return out;
}

function walk(node, parent, index, fn) {
  fn(node, parent, index);
  if (node.children) for (let i = 0; i < node.children.length; i++) walk(node.children[i], node, i, fn);
}

export default function rehypeCli() {
  return (tree) => {
    walk(tree, null, 0, (node, parent, index) => {
      if (!parent || node.type !== 'element') return;
      if (node.tagName === 'pre' && !node.properties?.dataWrapped) {
        const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
        if (!code) return;
        const cls = (code.properties?.className || []).find((c) => String(c).startsWith('language-'));
        const lang = cls ? String(cls).replace('language-', '') : 'text';
        code.children = highlight(textOf(code));
        node.properties = { ...(node.properties || {}), dataWrapped: true, tabIndex: 0 };
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['codeblock'], dataLang: lang === 'cisco' || lang === 'ios' ? 'ios' : lang },
          children: [
            {
              type: 'element',
              tagName: 'button',
              properties: { type: 'button', className: ['codeblock-copy'], ariaLabel: 'Copy code' },
              children: [text('Copy')],
            },
            node,
          ],
        };
      }
      if (node.tagName === 'table' && !node.properties?.dataWrapped) {
        node.properties = { ...(node.properties || {}), dataWrapped: true };
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Scrollable table' },
          children: [node],
        };
      }
    });
  };
}
