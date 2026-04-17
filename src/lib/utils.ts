export function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export function parseJsonObject(text: string, label = 'JSON'): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(/[,\n]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function tagsToInput(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}

export function decodeRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return decodeURIComponent(value[0] ?? '');
  }
  return decodeURIComponent(value ?? '');
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function truncateText(value: string | null | undefined, maxLength = 160): string {
  if (!value) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function buildMobileItemId(bucketName: string): string {
  const safeBucket = bucketName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  return `${safeBucket}_${Date.now()}`;
}

export function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

export function isTerminalRunStatus(status: string | null | undefined): boolean {
  const normalised = String(status ?? '').trim().toLowerCase();
  return ['completed', 'failed', 'cancelled'].includes(normalised);
}
