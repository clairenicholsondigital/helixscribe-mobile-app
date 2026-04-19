export type JsonObject = Record<string, unknown>;

export type WorkflowV2Step = {
  id?: string;
  step_index?: number;
  step_type: string;
  title: string;
  instructions?: string | null;
  input_mode?: string | null;
  config: JsonObject;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowRunSummary = {
  id: string;
  workflow_id: string;
  status: string;
  trigger_type: string;
  input_payload: JsonObject;
  final_output_text?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowSchedule = {
  id: string;
  workflow_id: string;
  schedule_type: string;
  cron_expression?: string | null;
  interval_seconds?: number | null;
  run_once_at?: string | null;
  timezone_name?: string | null;
  is_enabled: boolean;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_enqueued_for?: string | null;
  max_retries?: number | null;
  retry_delay_seconds?: number | null;
  config: JsonObject;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkflowStepRun = {
  id: string;
  step_id?: string | null;
  step_index: number;
  step_type: string;
  status: string;
  input_payload: JsonObject;
  output_payload: JsonObject;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

export type WorkflowV2 = {
  id: string;
  title: string;
  aim: string;
  status: string;
  is_active: boolean;
  schedule_config: JsonObject;
  metadata: JsonObject;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  schedule_summary?: string;
  latest_run?: WorkflowRunSummary | null;
};

export type WorkflowListResponse = {
  items: WorkflowV2[];
};

export type WorkflowDetailResponse = {
  workflow: WorkflowV2;
  steps: WorkflowV2Step[];
  schedule: WorkflowSchedule | null;
  latest_run: WorkflowRunSummary | null;
  recent_runs: WorkflowRunSummary[];
};

export type WorkflowRunListResponse = {
  items: WorkflowRunSummary[];
};

export type WorkflowRunDetailResponse = {
  run: WorkflowRunSummary;
  step_runs: WorkflowStepRun[];
};

export type WorkflowV2StepPayload = {
  step_type: string;
  title: string;
  instructions?: string;
  input_mode?: string;
  config: JsonObject;
};

export type WorkflowCreatePayload = {
  title: string;
  aim: string;
  steps: WorkflowV2StepPayload[];
  created_by?: string;
  schedule_config?: JsonObject;
  metadata?: JsonObject;
};

export type WorkflowUpdatePayload = Partial<{
  title: string;
  aim: string;
  status: string;
  is_active: boolean;
  steps: WorkflowV2StepPayload[];
  schedule_config: JsonObject;
  metadata: JsonObject;
}>;

export type WorkflowMutateResponse = {
  workflow: WorkflowV2;
};

export type WorkflowRunPayload = {
  trigger_type?: string;
  input_payload?: JsonObject;
  wait_for_completion?: boolean;
  max_retries?: number;
};

export type WorkflowDeleteRunResponse = {
  ok: boolean;
  deleted_run_id: string;
  status: string;
};

export type WorkflowDeleteResponse = {
  ok: boolean;
  deleted_workflow_id: string;
  status: string;
};

export type WorkflowStepDraft = {
  step_type: string;
  title: string;
  instructions: string;
  input_mode: string;
  configText: string;
};

export type WorkflowDraft = {
  title: string;
  aim: string;
  status: string;
  is_active: boolean;
  steps: WorkflowStepDraft[];
  scheduleConfigText: string;
};
