const API_BASE_URL = 'https://api.helixscribe.cloud';

export type WorkflowV2ScheduleConfig = {
  type?: 'disabled' | 'once' | 'interval' | 'cron';
  run_at?: string;
  enabled?: boolean;
  timezone?: string;
  max_retries?: number;
  interval_seconds?: number;
  retry_delay_seconds?: number;
  cron_expression?: string;
};

export type WorkflowV2ScheduleItem = {
  id: string;
  workflow_id: string;
  workflow_title: string | null;
  schedule_type: 'once' | 'interval' | 'cron' | 'disabled';
  cron_expression: string | null;
  interval_seconds: number | null;
  run_once_at: string | null;
  timezone_name: string | null;
  is_enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_enqueued_for: string | null;
  max_retries: number | null;
  retry_delay_seconds: number | null;
  config: WorkflowV2ScheduleConfig | null;
  created_at: string;
  updated_at: string;
};

export type GetWorkflowV2SchedulesResponse = {
  items: WorkflowV2ScheduleItem[];
};

type ApiErrorShape = {
  detail?: string;
  message?: string;
};

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
    throw new Error(
      errorData?.detail ||
        errorData?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export async function getWorkflowV2Schedules(params?: {
  enabled_only?: boolean;
  limit?: number;
}): Promise<GetWorkflowV2SchedulesResponse> {
  const searchParams = new URLSearchParams();

  if (typeof params?.enabled_only === 'boolean') {
    searchParams.set('enabled_only', String(params.enabled_only));
  }

  if (typeof params?.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/workflow-v2/schedules${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseApiResponse<GetWorkflowV2SchedulesResponse>(response);
}