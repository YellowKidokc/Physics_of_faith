const API_LOCAL = 'http://localhost:3456/api';
const API_CLOUD = ''; // Phase 4 — Cloudflare Worker URL

interface APIOptions extends RequestInit {
  timeout?: number;
}

export async function apiCall<T = unknown>(path: string, options: APIOptions = {}): Promise<T> {
  const { timeout = 2000, ...fetchOpts } = options;

  // Try local sync_server first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(API_LOCAL + path, {
      ...fetchOpts,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return res.json();
    }
  } catch {
    // Local server not available — fall through
  }

  // Fall back to Cloudflare (Phase 4)
  if (API_CLOUD) {
    const res = await fetch(API_CLOUD + path, {
      ...fetchOpts,
      headers: {
        ...fetchOpts.headers,
      },
    });
    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return res.json();
    }
    throw new Error(`API error: ${res.status}`);
  }

  throw new Error('No API available');
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return apiCall<T>(path);
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiCall<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  return apiCall<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string): Promise<void> {
  return apiCall(path, { method: 'DELETE' });
}

export async function checkServerOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(API_LOCAL + '/clips?limit=1', { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
