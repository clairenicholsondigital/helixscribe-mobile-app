import { API_BASE_URL, INTERNAL_API_KEY } from '@/lib/config';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const finalPath = path.startsWith('/') ? path : `/${path}`;
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (INTERNAL_API_KEY && !headers.has('X-Internal-Key')) {
    headers.set('X-Internal-Key', INTERNAL_API_KEY);
  }

  const response = await fetch(`${API_BASE_URL}${finalPath}`, {
    ...init,
    headers
  });

  const parsed = await parseResponseBody(response);

  if (!response.ok) {
    const detail =
      typeof parsed === 'string'
        ? parsed
        : typeof parsed === 'object' && parsed !== null
          ? String(
              (parsed as { detail?: unknown; message?: unknown }).detail ??
                (parsed as { detail?: unknown; message?: unknown }).message ??
                response.statusText
            )
          : response.statusText;

    throw new ApiError(response.status, detail, parsed);
  }

  return (parsed ?? {}) as T;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
