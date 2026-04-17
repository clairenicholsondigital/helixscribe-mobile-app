import { api, jsonBody } from '@/api/client';
import type {
  WorkflowCreatePayload,
  WorkflowDeleteRunResponse,
  WorkflowDetailResponse,
  WorkflowListResponse,
  WorkflowMutateResponse,
  WorkflowRunDetailResponse,
  WorkflowRunListResponse,
  WorkflowRunPayload,
  WorkflowUpdatePayload
} from '@/types/workflowsV2';

export function listWorkflowsV2(limit = 50): Promise<WorkflowListResponse> {
  return api<WorkflowListResponse>(`/workflow-v2/workflows?limit=${limit}`);
}

export function createWorkflowV2(payload: WorkflowCreatePayload): Promise<WorkflowMutateResponse> {
  return api<WorkflowMutateResponse>('/workflow-v2/workflows', {
    method: 'POST',
    body: jsonBody(payload)
  });
}

export function getWorkflowV2(workflowId: string): Promise<WorkflowDetailResponse> {
  return api<WorkflowDetailResponse>(`/workflow-v2/workflows/${encodeURIComponent(workflowId)}`);
}

export function updateWorkflowV2(
  workflowId: string,
  payload: WorkflowUpdatePayload
): Promise<WorkflowMutateResponse> {
  return api<WorkflowMutateResponse>(`/workflow-v2/workflows/${encodeURIComponent(workflowId)}`, {
    method: 'PATCH',
    body: jsonBody(payload)
  });
}

export function upsertWorkflowSchedule(
  workflowId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/workflow-v2/workflows/${encodeURIComponent(workflowId)}/schedule`, {
    method: 'PUT',
    body: jsonBody(payload)
  });
}

export function runWorkflowV2(
  workflowId: string,
  payload: WorkflowRunPayload
): Promise<WorkflowRunDetailResponse> {
  return api<WorkflowRunDetailResponse>(`/workflow-v2/workflows/${encodeURIComponent(workflowId)}/run`, {
    method: 'POST',
    body: jsonBody(payload)
  });
}

export function listWorkflowRunsV2(
  workflowId: string,
  limit = 20
): Promise<WorkflowRunListResponse> {
  return api<WorkflowRunListResponse>(
    `/workflow-v2/workflows/${encodeURIComponent(workflowId)}/runs?limit=${limit}`
  );
}

export function getWorkflowRunV2(runId: string): Promise<WorkflowRunDetailResponse> {
  return api<WorkflowRunDetailResponse>(`/workflow-v2/runs/${encodeURIComponent(runId)}`);
}

export function deleteWorkflowRunV2(runId: string): Promise<WorkflowDeleteRunResponse> {
  return api<WorkflowDeleteRunResponse>(`/workflow-v2/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE'
  });
}
