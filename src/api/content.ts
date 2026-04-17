const API_BASE_URL = 'https://api.helixscribe.cloud';

export type ContentStatus = 'draft' | 'ready' | 'published' | 'archived';

export type ContentMetadataItem = {
  id: string;
  content_id: string;
  meta_key: string;
  meta_value: unknown;
  meta_group: string | null;
  created_at: string;
};

export type ContentItem = {
  id: string;
  content_key: string | null;
  content_type: string;
  title: string | null;
  body: string;
  status: ContentStatus;
  summary: string | null;
  author: string | null;
  created_at: string;
  updated_at: string;
  metadata?: ContentMetadataItem[];
};

export type GetContentItemsResponse = {
  ok: boolean;
  count: number;
  items: ContentItem[];
};

export type GetContentItemResponse = {
  ok: boolean;
  item: ContentItem;
};

export type UpdateContentItemPayload = {
  content_key?: string | null;
  content_type?: string;
  title?: string | null;
  body?: string;
  status?: ContentStatus;
  summary?: string | null;
  author?: string | null;
};

export type CreateContentItemPayload = {
  content_key?: string | null;
  content_type: string;
  title?: string | null;
  body: string;
  status?: ContentStatus;
  summary?: string | null;
  author?: string | null;
};

export type ContentFilters = {
  content_type?: string;
  status?: string;
  author?: string;
  limit?: number;
};

type ApiErrorShape = {
  detail?: string;
  message?: string;
};

function buildQuery(params: ContentFilters = {}): string {
  const searchParams = new URLSearchParams();

  if (params.content_type?.trim()) {
    searchParams.set('content_type', params.content_type.trim());
  }

  if (params.status?.trim()) {
    searchParams.set('status', params.status.trim());
  }

  if (params.author?.trim()) {
    searchParams.set('author', params.author.trim());
  }

  searchParams.set('limit', String(params.limit ?? 50));

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response, status ${response.status}`);
  }

  if (!response.ok) {
    const errorData = data as ApiErrorShape | null;

    const message =
      errorData?.detail ||
      errorData?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function getContentItems(
  filters: ContentFilters = {}
): Promise<GetContentItemsResponse> {
  const response = await fetch(`${API_BASE_URL}/content/${buildQuery(filters)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseApiResponse<GetContentItemsResponse>(response);
}

export async function getContentItem(
  id: string,
  includeMetadata = true
): Promise<GetContentItemResponse> {
  const searchParams = new URLSearchParams();

  if (includeMetadata) {
    searchParams.set('include_metadata', 'true');
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/content/${id}${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseApiResponse<GetContentItemResponse>(response);
}

export async function createContentItem(
  payload: CreateContentItemPayload
): Promise<GetContentItemResponse> {
  const response = await fetch(`${API_BASE_URL}/content/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<GetContentItemResponse>(response);
}

export async function updateContentItem(
  id: string,
  payload: UpdateContentItemPayload
): Promise<GetContentItemResponse> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<GetContentItemResponse>(response);
}

export async function deleteContentItem(
  id: string
): Promise<{ ok: boolean; deleted_content_id: string }> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseApiResponse<{ ok: boolean; deleted_content_id: string }>(response);
}

export type GetContentMetadataResponse = {
  ok: boolean;
  count: number;
  metadata: ContentMetadataItem[];
};

export type CreateContentMetadataPayload = {
  meta_key: string;
  meta_value: unknown;
  meta_group?: string | null;
};

export async function getContentMetadata(
  contentId: string,
  filters: {
    meta_key?: string;
    meta_group?: string;
  } = {}
): Promise<GetContentMetadataResponse> {
  const searchParams = new URLSearchParams();

  if (filters.meta_key?.trim()) {
    searchParams.set('meta_key', filters.meta_key.trim());
  }

  if (filters.meta_group?.trim()) {
    searchParams.set('meta_group', filters.meta_group.trim());
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/content/${contentId}/metadata${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseApiResponse<GetContentMetadataResponse>(response);
}

export async function createContentMetadata(
  contentId: string,
  payload: CreateContentMetadataPayload
): Promise<{ ok: boolean; item: ContentMetadataItem }> {
  const response = await fetch(`${API_BASE_URL}/content/${contentId}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<{ ok: boolean; item: ContentMetadataItem }>(response);
}