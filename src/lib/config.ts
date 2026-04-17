function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://api.helixscribe.cloud'
);

export const INTERNAL_API_KEY = process.env.EXPO_PUBLIC_INTERNAL_API_KEY?.trim() || '';
