// Small SVG charts for the admin analytics (no library): line with crosshair,
// columns (histograms), horizontal bars, funnel, heatmap, scatter matrix and a
// step-flow diagram. Built to the data-viz rules: thin marks, 4 px rounded
// data ends, 2 px lines, recessive hairline grid, text in text colours (never
// the series colour), a hover tooltip on every mark, one y-axis only.
// Colours come from CSS variables on .an (analytics.astro): --s1…--s4 (validated
// categorical: coral, blue, green, violet), --seq-* (coral ramp), --grid, --muted.

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number | undefined>;
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string | null | undefined)[]): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) n.setAttribute(k, String(v));
  for (const k of kids) if (k != null) n.append(typeof k === 'string' ? document.createTextNode(k) : k);
  return n;
}

export const nf = (v: number | null | undefined, digits = 0) =>
  v == null || Number.isNaN(v) ? '–' : v.toLocaleString('de-CH', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
export const compact = (v: number) => (Math.abs(v) >= 1000 ? `${nf(v / 1000, 1)}K` : nf(v));
export const dur = (sec: number | null | undefined) => {
  if (sec == null) return '–';
  if (sec < 60) return `${nf(sec, sec < 10 ? 1 : 0)} s`;
  if (sec < 3600) return `${nf(sec / 60, 1)} min`;
  if (sec < 86400) return `${nf(sec / 3600, 1)} h`;
  return `${nf(sec / 86400, 1)} d`;
};

// ── tooltip (one per page) ───────────────────────────────────────────
let tip: HTMLDivElement | null = null;
function tipEl() {
  if (!tip) { tip = document.createElement('div'); tip.className = 'an-tip'; tip.setAttribute('role', 'status'); document.body.append(tip); }
  return tip;
}
export function showTip(e: MouseEvent | { clientX: number; clientY: number }, lines: (string | [string, string])[]) {
  const t = tipEl();
  t.replaceChildren(...lines.map((l, i) => {
    const row = document.createElement('div');
    if (Array.isArray(l)) {
      const k = document.createElement('span'); k.textContent = l[0];
      const v = document.createElement('b'); v.textContent = l[1];
      row.className = 'an-tip-row'; row.append(k, v);
    } else { row.textContent = l; if (i === 0) row.className = 'an-tip-head'; }
    return row;
  }));
  t.style.display = 'block';
  const w = t.offsetWidth, h = t.offsetHeight;
  const x = Math.min(window.innerWidth - w - 12, e.clientX + 14);
  const y = e.clientY - h - 12 < 8 ? e.clientY + 16 : e.clientY - h - 12;
  t.style.left = `${x + window.scrollX}px`; t.style.top = `${y + window.scrollY}px`;
}
export function hideTip() { if (tip) tip.style.display = 'none'; }
function hover(node: Element, lines: () => (string | [string, string])[]) {
  node.addEventListener('mousemove', (e) => showTip(e as MouseEvent, lines()));
  node.addEventListener('mouseleave', hideTip);
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v) ?? v;
};

// ── line chart (time series) ─────────────────────────────────────────
export type Series = { name: string; color: string; values: number[]; area?: boolean };
export type Marker = { at: string; label: string; kind?: string };
export function lineChart(opts: { labels: string[]; iso?: string[]; series: Series[]; markers?: Marker[]; height?: number; fmt?: (v: number) => string; tipLabel?: (i: number) => string }): SVGSVGElement {
  const W = 760, H = opts.height ?? 220, L = 36, R = 16, T = 14, B = 26;
  const n = opts.labels.length;
  const max = niceMax(Math.max(1, ...opts.series.flatMap((x) => x.values)));
  const x = (i: number) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const fmt = opts.fmt ?? ((v: number) => compact(v));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'an-chart', role: 'img' });
  for (let k = 0; k <= 4; k++) {
    const v = (max / 4) * k;
    svg.append(s('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'an-grid' }), s('text', { x: L - 6, y: y(v) + 4, class: 'an-axis', 'text-anchor': 'end' }, fmt(v)));
  }
  const step = Math.max(1, Math.ceil(n / 8));
  opts.labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) svg.append(s('text', { x: x(i), y: H - 6, class: 'an-axis', 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, l)); });
  // Release markers and notes: a hairline and a small flag.
  for (const m of opts.markers ?? []) {
    const idx = opts.iso?.indexOf(m.at.slice(0, 10)) ?? -1;
    if (idx < 0) continue;
    const g = s('g', { class: `an-marker ${m.kind ?? ''}` }, s('line', { x1: x(idx), x2: x(idx), y1: T, y2: H - B }), s('circle', { cx: x(idx), cy: T + 2, r: 4 }));
    hover(g, () => [m.kind === 'note' ? 'Note' : m.kind === 'update' ? 'Update' : 'Release', m.label]);
    svg.append(g);
  }
  for (const se of opts.series) {
    const pts = se.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    if (se.area) svg.append(s('polygon', { points: `${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`, fill: se.color, 'fill-opacity': 0.1 }));
    svg.append(s('polyline', { points: pts, fill: 'none', stroke: se.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    const last = se.values.length - 1;
    if (last >= 0) svg.append(s('circle', { cx: x(last), cy: y(se.values[last]), r: 4, fill: se.color, stroke: 'var(--surface)', 'stroke-width': 2 }));
  }
  // Crosshair + tooltip over the whole plot.
  const cross = s('line', { y1: T, y2: H - B, class: 'an-cross', visibility: 'hidden' });
  const dots = opts.series.map((se) => s('circle', { r: 4, fill: se.color, stroke: 'var(--surface)', 'stroke-width': 2, visibility: 'hidden' }));
  const hit = s('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' });
  hit.addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1))));
    cross.setAttribute('x1', String(x(i))); cross.setAttribute('x2', String(x(i))); cross.setAttribute('visibility', 'visible');
    dots.forEach((d, k) => { d.setAttribute('cx', String(x(i))); d.setAttribute('cy', String(y(opts.series[k].values[i] ?? 0))); d.setAttribute('visibility', 'visible'); });
    showTip(e, [opts.tipLabel ? opts.tipLabel(i) : opts.labels[i], ...opts.series.map((se): [string, string] => [se.name, fmt(se.values[i] ?? 0)])]);
  });
  hit.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); dots.forEach((d) => d.setAttribute('visibility', 'hidden')); hideTip(); });
  svg.append(cross, ...dots, hit);
  return svg;
}

// ── columns (histogram / ordered buckets) ────────────────────────────
export function columns(opts: { items: { label: string; value: number; note?: string }[]; color?: string; height?: number; fmt?: (v: number) => string; highlight?: (i: number) => boolean }): SVGSVGElement {
  const W = 760, H = opts.height ?? 200, L = 8, R = 8, T = 22, B = 26;
  const n = Math.max(1, opts.items.length);
  const max = niceMax(Math.max(1, ...opts.items.map((i) => i.value)));
  const band = (W - L - R) / n, bw = Math.min(56, band * 0.6);
  const fmt = opts.fmt ?? nf;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'an-chart', role: 'img' });
  svg.append(s('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'an-grid' }));
  opts.items.forEach((it, i) => {
    const h = (it.value / max) * (H - T - B), cx = L + band * i + band / 2, top = H - B - h;
    const color = opts.highlight && !opts.highlight(i) ? 'var(--seq-2)' : (opts.color ?? 'var(--s1)');
    const r = Math.min(4, h / 2);
    const g = s('g', {},
      s('path', { d: `M${cx - bw / 2},${H - B} V${top + r} q0,-${r} ${r},-${r} H${cx + bw / 2 - r} q${r},0 ${r},${r} V${H - B} Z`, fill: color }),
      s('text', { x: cx, y: top - 6, class: 'an-val', 'text-anchor': 'middle' }, fmt(it.value)),
      s('text', { x: cx, y: H - 8, class: 'an-axis', 'text-anchor': 'middle' }, it.label),
      s('rect', { x: cx - band / 2, y: T, width: band, height: H - T - B, fill: 'transparent' }));
    hover(g, () => [it.label, ['Count', fmt(it.value)], ...(it.note ? [it.note] : [])]);
    svg.append(g);
  });
  return svg;
}

// ── horizontal bars (ranked list) ────────────────────────────────────
export function hbars(items: { label: string; value: number; of?: number; sub?: string; color?: string; tip?: (string | [string, string])[]; onClick?: () => void }[], opts: { fmt?: (v: number) => string; pct?: boolean } = {}): HTMLDivElement {
  const box = document.createElement('div'); box.className = 'an-hbars';
  const max = Math.max(1, ...items.map((i) => i.of ?? i.value));
  const fmt = opts.fmt ?? nf;
  for (const it of items) {
    const row = document.createElement(it.onClick ? 'button' : 'div');
    row.className = 'an-hrow';
    if (it.onClick) { (row as HTMLButtonElement).type = 'button'; row.addEventListener('click', it.onClick); }
    const lab = document.createElement('span'); lab.className = 'an-hlabel'; lab.textContent = it.label;
    if (it.sub) { const sub = document.createElement('small'); sub.textContent = it.sub; lab.append(sub); }
    const track = document.createElement('span'); track.className = 'an-htrack';
    const fill = document.createElement('span'); fill.className = 'an-hfill';
    fill.style.width = `${Math.max(it.value > 0 ? 1.5 : 0, (it.value / (it.of ?? max)) * 100)}%`;
    if (it.color) fill.style.background = it.color;
    track.append(fill);
    const val = document.createElement('b');
    val.textContent = fmt(it.value);
    if (opts.pct && it.of) { const p = document.createElement('small'); p.textContent = ` ${nf((it.value / it.of) * 100)} %`; val.append(p); }
    row.append(lab, track, val);
    if (it.tip) hover(row, () => it.tip!);
    box.append(row);
  }
  return box;
}

// ── funnel (steps with drop between them) ────────────────────────────
export function funnel(steps: { label: string; value: number; median?: string; left?: number; onClick?: () => void }[]): HTMLDivElement {
  const box = document.createElement('div'); box.className = 'an-funnel';
  const top = Math.max(1, steps[0]?.value ?? 1);
  steps.forEach((st, i) => {
    const prev = i ? steps[i - 1].value : st.value;
    const row = document.createElement(st.onClick ? 'button' : 'div');
    row.className = 'an-fstep';
    if (st.onClick) { (row as HTMLButtonElement).type = 'button'; row.addEventListener('click', st.onClick); }
    const name = document.createElement('span'); name.className = 'an-fname'; name.textContent = st.label;
    const bar = document.createElement('span'); bar.className = 'an-fbar';
    const fill = document.createElement('span'); fill.className = 'an-ffill'; fill.style.width = `${(st.value / top) * 100}%`;
    bar.append(fill);
    const val = document.createElement('b'); val.textContent = nf(st.value);
    const conv = document.createElement('small');
    conv.textContent = i ? `${nf(prev ? (st.value / prev) * 100 : 0)} % of previous` : 'start';
    const drop = document.createElement('span'); drop.className = 'an-fdrop';
    if (i && prev > st.value) drop.textContent = `−${nf(prev - st.value)}`;
    const med = document.createElement('span'); med.className = 'an-fmed'; med.textContent = st.median ?? '';
    row.append(name, bar, val, conv, drop, med);
    hover(row, () => [st.label, ['Reached', nf(st.value)], ['Of start', `${nf((st.value / top) * 100)} %`], ...(i ? [['Of previous', `${nf(prev ? (st.value / prev) * 100 : 0)} %`] as [string, string]] : []),
      ...(st.left ? [['Left here', nf(st.left)] as [string, string]] : []), ...(st.median ? [['Typical time here', st.median] as [string, string]] : []), ...(st.onClick ? ['Click: sessions that left here'] : [])]);
    box.append(row);
  });
  return box;
}

// ── heatmap (cohort × day) ───────────────────────────────────────────
export function heatmap(rows: { label: string; n: number; cells: (number | null)[]; ns: (number | null)[] }[], cols: string[]): HTMLTableElement {
  const t = document.createElement('table'); t.className = 'an-heat';
  const head = document.createElement('tr');
  for (const h of ['Sign-up week', 'People', ...cols]) { const th = document.createElement('th'); th.textContent = h; head.append(th); }
  t.append(head);
  for (const r of rows) {
    const tr = document.createElement('tr');
    const a = document.createElement('th'); a.textContent = r.label; tr.append(a);
    const b = document.createElement('td'); b.textContent = nf(r.n); b.className = 'an-heat-n'; tr.append(b);
    r.cells.forEach((v, i) => {
      const td = document.createElement('td');
      if (v == null) { td.textContent = '·'; td.className = 'an-heat-na'; }
      else {
        const step = v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 45 ? 3 : v < 65 ? 4 : 5;
        td.className = `an-heat-${step}`;
        td.textContent = `${nf(v)} %`;
        hover(td, () => [`${r.label} · ${cols[i]}`, ['Came back', `${nf(v)} %`], ['Of', nf(r.ns[i] ?? 0)]]);
      }
      tr.append(td);
    });
    t.append(tr);
  }
  return t;
}

// ── scatter (time on screen × exit rate), quadrants labelled ─────────
export function scatter(points: { label: string; x: number; y: number; size: number; color?: string; onClick?: () => void }[], opts: { xLabel: string; yLabel: string; xMid: number; yMid: number; quads: [string, string, string, string]; xFmt?: (v: number) => string; yFmt?: (v: number) => string }): SVGSVGElement {
  const W = 760, H = 360, L = 48, R = 16, T = 16, B = 40;
  const xMax = niceMax(Math.max(1, ...points.map((p) => p.x)) * 1.05), yMax = niceMax(Math.max(1, ...points.map((p) => p.y)) * 1.05);
  const x = (v: number) => L + (v / xMax) * (W - L - R), y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'an-chart', role: 'img' });
  const mx = x(Math.min(opts.xMid, xMax)), my = y(Math.min(opts.yMid, yMax));
  svg.append(
    s('rect', { x: mx, y: T, width: W - R - mx, height: my - T, class: 'an-quad-bad' }),
    s('line', { x1: mx, x2: mx, y1: T, y2: H - B, class: 'an-grid' }), s('line', { x1: L, x2: W - R, y1: my, y2: my, class: 'an-grid' }),
    s('text', { x: W - R - 6, y: T + 14, class: 'an-quad', 'text-anchor': 'end' }, opts.quads[0]),
    s('text', { x: L + 6, y: T + 14, class: 'an-quad' }, opts.quads[1]),
    s('text', { x: L + 6, y: H - B - 8, class: 'an-quad' }, opts.quads[2]),
    s('text', { x: W - R - 6, y: H - B - 8, class: 'an-quad', 'text-anchor': 'end' }, opts.quads[3]),
    s('text', { x: (L + W - R) / 2, y: H - 6, class: 'an-axis', 'text-anchor': 'middle' }, opts.xLabel),
    s('text', { x: 12, y: (T + H - B) / 2, class: 'an-axis', 'text-anchor': 'middle', transform: `rotate(-90 12 ${(T + H - B) / 2})` }, opts.yLabel));
  for (let k = 0; k <= 4; k++) {
    svg.append(s('text', { x: x((xMax / 4) * k), y: H - B + 14, class: 'an-axis', 'text-anchor': 'middle' }, (opts.xFmt ?? nf)((xMax / 4) * k)),
      s('text', { x: L - 6, y: y((yMax / 4) * k) + 4, class: 'an-axis', 'text-anchor': 'end' }, (opts.yFmt ?? nf)((yMax / 4) * k)));
  }
  const maxSize = Math.max(1, ...points.map((p) => p.size));
  for (const p of [...points].sort((a, b) => b.size - a.size)) {
    const r = 4 + Math.sqrt(p.size / maxSize) * 14;
    const c = s('circle', { cx: x(p.x), cy: y(p.y), r, fill: p.color ?? 'var(--s2)', 'fill-opacity': 0.55, stroke: 'var(--surface)', 'stroke-width': 2, class: p.onClick ? 'an-click' : '' });
    hover(c, () => [p.label, [opts.xLabel, (opts.xFmt ?? nf)(p.x)], [opts.yLabel, (opts.yFmt ?? nf)(p.y)], ['Views', nf(p.size)]]);
    if (p.onClick) c.addEventListener('click', p.onClick);
    svg.append(c);
    if (r > 9) svg.append(s('text', { x: x(p.x), y: y(p.y) - r - 4, class: 'an-val', 'text-anchor': 'middle' }, p.label));
  }
  return svg;
}

// ── flow diagram: steps as columns by order, links as ribbons ────────
// A light Sankey: each step is a node in the column of its typical position,
// link width = how often people went from one step to the next. Links that go
// back (to an earlier column) are drawn dashed-free in the second colour.
export function stepFlow(steps: string[], links: { from_step: string; to_step: string; times: number }[]): SVGSVGElement {
  const order = [...steps, ...(links.some((l) => l.to_step === '(end)') ? ['(end)'] : [])];
  const W = 760, colW = (W - 40) / Math.max(1, order.length - 1 || 1), H = 260, top = 30, nodeH = 150;
  const x = (k: number) => 20 + (order.length === 1 ? (W - 40) / 2 : k * colW);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'an-chart', role: 'img' });
  const maxT = Math.max(1, ...links.map((l) => l.times));
  const idx = (st: string) => order.indexOf(st);
  for (const l of links) {
    const a = idx(l.from_step), b = idx(l.to_step);
    if (a < 0 || b < 0) continue;
    const w = 2 + (l.times / maxT) * 22;
    const y1 = top + nodeH / 2, back = b <= a;
    const d = back
      ? `M${x(a)},${y1} C${x(a)},${y1 + 90} ${x(b)},${y1 + 90} ${x(b)},${y1 + 6}`
      : `M${x(a)},${y1} C${(x(a) + x(b)) / 2},${y1 - 30 - (b - a - 1) * 18} ${(x(a) + x(b)) / 2},${y1 - 30 - (b - a - 1) * 18} ${x(b)},${y1}`;
    const p = s('path', { d, fill: 'none', stroke: back ? 'var(--s2)' : 'var(--s1)', 'stroke-width': w, 'stroke-opacity': back ? 0.45 : 0.35, 'stroke-linecap': 'round' });
    hover(p, () => [`${l.from_step} → ${l.to_step}`, ['Times', nf(l.times)], back ? 'Went back (loop)' : b === a + 1 ? 'Next step' : 'Skipped ahead']);
    svg.append(p);
  }
  order.forEach((st, k) => {
    svg.append(s('rect', { x: x(k) - 5, y: top + nodeH / 2 - 14, width: 10, height: 28, rx: 4, fill: st === '(end)' ? 'var(--ok)' : 'var(--ink-700)' }),
      s('text', { x: x(k), y: top + nodeH / 2 - 22, class: 'an-val', 'text-anchor': k === 0 ? 'start' : k === order.length - 1 ? 'end' : 'middle' }, st));
  });
  return svg;
}
