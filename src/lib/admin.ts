// Shared by the admin pages (/admin moderation, /admin/places).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Publishable keys — public by design, same as in the app.
export const ENVS = {
  prod: { url: 'https://jbcfgxxdbnjtxclygpgm.supabase.co', key: 'sb_publishable_FlWYjGOw7Db-HwB8Exx3VQ_Ds35WLl9' },
  test: { url: 'https://mgqsxbzqdgvgvnukvknp.supabase.co', key: 'sb_publishable_45AbKAxYJPxCPVY3YMMnMQ_myH6LbsA' },
} as const;
export type Env = keyof typeof ENVS;

export function loadEnv(): Env {
  try { if (localStorage.getItem('arc-admin-env') === 'test') return 'test'; } catch {}
  return 'prod';
}
export function saveEnv(env: Env) {
  try { localStorage.setItem('arc-admin-env', env); } catch {}
}

// One session per database, shared between the admin pages.
export function makeClient(env: Env): SupabaseClient {
  return createClient(ENVS[env].url, ENVS[env].key, { auth: { storageKey: `arc-admin-${env}` } });
}

export const BUCKET = 'location-photos';
export const photoUrl = (env: Env, path: string) =>
  path.startsWith('/') || path.startsWith('blob:') ? path : `${ENVS[env].url}/storage/v1/object/public/${BUCKET}/${path}`;

type Child = Node | string | null | undefined | false | 0;

// Tiny element builder — user content always goes in as text, never as HTML.
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k.includes('-')) node.setAttribute(k, String(v));
    else (node as any)[k] = v;
  }
  add(node, ...children);
  return node;
}

// Like node.append, but skips the false/undefined from `cond && el(...)`.
export const add = (node: Element, ...kids: Child[]) => kids.forEach((k) => { if (k) node.append(k); });

export function svgIcon(d: string, size = 16) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
    s.setAttribute(k, String(v));
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  s.append(p);
  return s;
}

export function makeToast(node: HTMLElement) {
  let timer: number | undefined;
  return (msg: string) => {
    node.textContent = msg;
    node.classList.add('show');
    clearTimeout(timer);
    timer = window.setTimeout(() => node.classList.remove('show'), 2400);
  };
}

const q = <T extends Element>(sel: string) => document.querySelector(sel) as T;

let toastFn: ((msg: string) => void) | undefined;
export const toast = (msg: string) => (toastFn ??= makeToast(q<HTMLElement>('[data-toast]')))(msg);

export function openLightbox(src: string) {
  const box = q<HTMLDialogElement>('[data-lightbox]');
  (box.querySelector('img') as HTMLImageElement).src = src;
  box.showModal();
}

type Ready = (sb: SupabaseClient, env: Env) => void | Promise<void>;

// Wires the shared AdminShell chrome: env pills, login, sign-out, refresh.
// `onReady` runs whenever a signed-in client is available (after load,
// login, env switch or refresh); the page renders into [data-app].
// `demo` (dev server + ?demo only) skips auth with a fake client.
export function initAdmin(onReady: Ready, demo?: () => SupabaseClient) {
  const loginForm = q<HTMLFormElement>('[data-login]');
  const signOutBtn = q<HTMLButtonElement>('[data-signout]');
  const refreshBtn = q<HTMLButtonElement>('[data-refresh]');
  const statusEl = q<HTMLElement>('[data-status]');
  const app = q<HTMLElement>('[data-app]');
  const lightbox = q<HTMLDialogElement>('[data-lightbox]');
  const envBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-env]'));
  lightbox.addEventListener('click', () => lightbox.close());

  let env = loadEnv();
  let sb: SupabaseClient;
  const paintEnv = () => envBtns.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.env === env)));

  const ready = async () => {
    statusEl.textContent = '';
    app.hidden = false;
    await onReady(sb, env);
  };

  async function start() {
    paintEnv();
    if (demo && import.meta.env.DEV && location.search.includes('demo')) {
      sb = demo();
      loginForm.hidden = true;
      signOutBtn.hidden = refreshBtn.hidden = false;
      return ready();
    }
    sb = makeClient(env);
    const { data } = await sb.auth.getSession();
    const signedIn = !!data.session;
    loginForm.hidden = signedIn;
    signOutBtn.hidden = refreshBtn.hidden = !signedIn;
    app.hidden = true;
    statusEl.textContent = '';
    if (signedIn) ready();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    statusEl.textContent = 'Signing in…';
    const { error } = await sb.auth.signInWithPassword({ email: String(fd.get('email')), password: String(fd.get('password')) });
    if (error) { statusEl.textContent = `Sign-in failed: ${error.message}`; return; }
    start();
  });
  signOutBtn.addEventListener('click', async () => { await sb.auth.signOut(); start(); });
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.remove('spin'); void refreshBtn.offsetWidth; refreshBtn.classList.add('spin');
    ready();
  });
  envBtns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.env === env) return;
    env = b.dataset.env as Env;
    saveEnv(env);
    start();
  }));

  start();
}

// Shown in [data-status] by pages when an RPC fails.
export function showError(message: string) {
  q<HTMLElement>('[data-app]').hidden = true;
  q<HTMLElement>('[data-status]').textContent = message.includes('Not allowed')
    ? 'This account is not an admin. Add it to the admins table (see migration 0087).'
    : message.includes('Could not find the function')
      ? 'The admin functions are missing in this database — run the admin migrations (0087, 0089) here first.'
      : `Error: ${message}`;
}

// Any image file / blob → something drawable with its pixel size. SVG goes
// through <img> (createImageBitmap can't decode it) at ~1200 px.
async function loadDrawable(file: Blob): Promise<{ img: CanvasImageSource; w: number; h: number }> {
  if (file.type === 'image/svg+xml') {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const w = ratio >= 1 ? 1200 : Math.round(1200 * ratio), h = ratio >= 1 ? Math.round(1200 / ratio) : 1200;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      return { img: c, w, h };
    } finally { URL.revokeObjectURL(url); }
  }
  const bmp = await createImageBitmap(file);
  return { img: bmp, w: bmp.width, h: bmp.height };
}

// Profile photos are shown round (map pin, place header), so they're always
// stored as a filled square. Photos: centre crop. Logos — transparent
// (PNG/WebP/SVG) or on a plain one-colour background (border all the same
// colour) — get their margins trimmed and are scaled as big as fits inside
// the circle, on white (transparent; Arc dark when the logo itself is almost
// all white, so it doesn't vanish) or on their own background colour.
export async function toAvatar(file: Blob, size = 800): Promise<Blob> {
  const { img, w: W, h: H } = await loadDrawable(file);
  const src = document.createElement('canvas');
  src.width = W; src.height = H;
  const sctx = src.getContext('2d', { willReadFrequently: true })!;
  sctx.drawImage(img, 0, 0);
  const { data } = sctx.getImageData(0, 0, W, H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1, transparent = false, lum = 0, opaque = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, a = data[i + 3];
    if (a < 250) transparent = true;
    if (a > 10) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (a > 128) { lum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255; opaque++; }
    }
  }
  // No transparency: is the border one flat colour? Then it's a logo on a
  // background — trim everything close to that colour.
  let bg = transparent ? (opaque && lum / opaque > 0.85 ? '#292b2c' : '#fff') : '';
  if (!transparent) {
    const edge: number[] = [];
    const step = Math.max(1, Math.floor((W + H) / 400));
    for (let x = 0; x < W; x += step) edge.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y += step) edge.push(y * W, y * W + W - 1);
    const mean = [0, 1, 2].map((c) => edge.reduce((sum, p) => sum + data[p * 4 + c], 0) / edge.length);
    const near = (i: number) => Math.abs(data[i] - mean[0]) + Math.abs(data[i + 1] - mean[1]) + Math.abs(data[i + 2] - mean[2]) < 40;
    if (edge.filter((p) => near(p * 4)).length / edge.length > 0.97) {
      x0 = W; y0 = H; x1 = -1; y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
        if (!near((y * W + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 >= 0) bg = `rgb(${mean.map(Math.round).join(',')})`;
    }
  }
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const ctx = out.getContext('2d')!;
  const logo = !!bg && x1 >= 0;
  ctx.fillStyle = bg || '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = 'high';
  if (logo) {
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const scale = (size * 0.9) / Math.hypot(w, h); // box diagonal = 90 % of the circle
    const dw = w * scale, dh = h * scale;
    ctx.drawImage(src, x0, y0, w, h, (size - dw) / 2, (size - dh) / 2, dw, dh);
  } else {
    const side = Math.min(W, H);
    ctx.drawImage(src, (W - side) / 2, (H - side) / 2, side, side, 0, 0, size, size);
  }
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('Could not read image'))), 'image/jpeg', 0.88));
}

// The website tools (fill / logo / import) use the admin-fill-from-website
// edge function, which is only deployed on PROD — TEST lives in another
// Supabase org.
export const PROD_ONLY = 'Website tools only run on PROD — switch to PROD at the top (the edge function isn’t deployed on TEST).';
