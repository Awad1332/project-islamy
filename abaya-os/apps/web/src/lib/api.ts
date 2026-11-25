'use client';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;
const listeners = new Set<(t: string | null) => void>();

export function setAccessToken(t: string | null) {
  accessToken = t;
  listeners.forEach((l) => l(t));
}
export function getAccessToken() {
  return accessToken;
}
export function onTokenChange(fn: (t: string | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(async (r) => (r.ok ? ((await r.json()).accessToken as string) : null))
      .catch(() => null)
      .then((t) => {
        setAccessToken(t);
        return t;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined;

export async function api<T = any>(path: string, opts: { method?: string; body?: Body; query?: Record<string, unknown>; retry?: boolean } = {}): Promise<T> {
  const qs = opts.query
    ? '?' + new URLSearchParams(Object.entries(opts.query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString()
    : '';
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}${qs}`, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      credentials: 'include',
      headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: opts.body ? (isForm ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network error');
  }
  if (res.status === 401 && opts.retry !== false && !path.startsWith('/auth/')) {
    const t = await refreshAccessToken();
    if (t) return api<T>(path, { ...opts, retry: false });
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) window.location.href = '/login';
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'ERROR', e.message ?? res.statusText, e.details);
  }
  return json as T;
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; pageCount: number }
