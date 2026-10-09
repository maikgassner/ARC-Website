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
