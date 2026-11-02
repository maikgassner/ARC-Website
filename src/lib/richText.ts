import { el } from './admin';

// Description editor: plain text with **bold**, [text](url) links and "- "
// bullet lines — the app's RichDescription (ARC/components/RichDescription.tsx)
// renders the same markers. Toolbar buttons insert them; the preview mirrors
// the app. Used for place descriptions (Places) and event descriptions (Events).
export function richTextEditor(value: string, placeholder: string, onChange: (v: string) => void) {
    const ta = el('textarea', { value, placeholder, rows: 8 });
    const preview = el('div', { class: 'rt-preview' });
    const commit = () => { onChange(ta.value); paintPreview(); };
    const paintPreview = () => {
      const blocks: HTMLElement[] = [];
      let para: string[] = [];
      let list: HTMLElement | null = null;
      // Same tokens as the app: **bold**, [text](url), bare www./https:// links.
      const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|(?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])/g;
      const href = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
      const inline = (node: HTMLElement, text: string) => {
        for (const part of text.split(TOKEN).filter(Boolean)) {
          const md = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
          if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) node.append(el('strong', { textContent: part.slice(2, -2) }));
          else if (md || /^(https?:\/\/|www\.)/i.test(part)) {
            const url = href(md ? md[2] : part);
            node.append(el('a', { href: url, target: '_blank', rel: 'noopener', textContent: md ? md[1] : part.replace(/^https?:\/\//i, '') }));
          } else node.append(part);
        }
        return node;
      };
      const flush = () => { if (para.length) { blocks.push(inline(el('p'), para.join('\n'))); para = []; } list = null; };
      for (const line of ta.value.split('\n')) {
        if (/^\s*[-•*]\s+/.test(line)) {
          if (para.length) { blocks.push(inline(el('p'), para.join('\n'))); para = []; }
          if (!list) { list = el('ul'); blocks.push(list); }
          list.append(inline(el('li'), line.replace(/^\s*[-•*]\s+/, '')));
        } else if (!line.trim()) flush();
        else { list = null; para.push(line); }
      }
      flush();
      preview.replaceChildren(...(blocks.length ? blocks : [el('p', { class: 'rt-empty', textContent: 'Preview appears here.' })]));
    };

    // Wrap the selection in **…** (or insert a placeholder to type over).
    const bold = () => {
      const { selectionStart: a, selectionEnd: b, value } = ta;
      const sel = value.slice(a, b) || 'bold text';
      ta.setRangeText(`**${sel}**`, a, b, 'end');
      if (a === b) ta.setSelectionRange(a + 2, a + 2 + sel.length);
      ta.focus(); commit();
    };
    // Toggle "- " on every line the selection touches.
    const bullets = () => {
      const { selectionStart: a, selectionEnd: b, value } = ta;
      const start = value.lastIndexOf('\n', a - 1) + 1;
      const endIdx = value.indexOf('\n', b);
      const end = endIdx === -1 ? value.length : endIdx;
      const lines = value.slice(start, end).split('\n');
      const allOn = lines.every((l) => /^\s*[-•*]\s+/.test(l) || !l.trim());
      const next = lines.map((l) => (!l.trim() ? l : allOn ? l.replace(/^\s*[-•*]\s+/, '') : `- ${l}`)).join('\n');
      ta.setRangeText(next, start, end, 'select');
      ta.focus(); commit();
    };
    // Turn the selection into [text](url); without a selection insert a placeholder text.
    const link = () => {
      const { selectionStart: a, selectionEnd: b, value } = ta;
      const raw = prompt('Link address (https://…)');
      if (!raw?.trim()) return;
      const url = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
      const label = value.slice(a, b) || 'link text';
      ta.setRangeText(`[${label}](${url})`, a, b, 'end');
      if (a === b) ta.setSelectionRange(a + 1, a + 1 + label.length);
      ta.focus(); commit();
    };
    ta.addEventListener('input', commit);
    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); bold(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); link(); }
      // Enter inside a bullet continues the list; Enter on an empty bullet ends it.
      if (e.key === 'Enter' && !e.shiftKey) {
        const { selectionStart: a, value } = ta;
        const lineStart = value.lastIndexOf('\n', a - 1) + 1;
        const line = value.slice(lineStart, a);
        if (/^\s*-\s+\S/.test(line)) { e.preventDefault(); ta.setRangeText('\n- ', a, ta.selectionEnd, 'end'); commit(); }
        else if (/^\s*-\s*$/.test(line)) { e.preventDefault(); ta.setRangeText('', lineStart, a, 'end'); commit(); }
      }
    });
    paintPreview();
    const toolbar = el('div', { class: 'rt-toolbar' },
      el('button', { type: 'button', class: 'rt-btn', title: 'Bold (⌘B)', onclick: bold }, el('strong', { textContent: 'B' })),
      el('button', { type: 'button', class: 'rt-btn', title: 'Bullet list', onclick: bullets, textContent: '• List' }),
      el('button', { type: 'button', class: 'rt-btn', title: 'Link (⌘K)', onclick: link, textContent: '🔗 Link' }),
      el('span', { class: 'rt-help', textContent: 'Select text, then click. Web addresses become links on their own.' }),
    );
    return { toolbar, textarea: ta, label: el('span', { class: 'rt-label', textContent: 'Preview · as shown in the app' }), preview };
}
