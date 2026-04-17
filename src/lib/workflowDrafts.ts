import { makeSchedulePresetText } from '@/constants/workflowScheduleDefaults';
import { makeStepDraft } from '@/constants/workflowStepDefaults';
import { parseJsonObject, prettyJson } from '@/lib/utils';
import type {
  WorkflowCreatePayload,
  WorkflowDetailResponse,
  WorkflowDraft,
  WorkflowStepDraft,
  WorkflowV2StepPayload,
  WorkflowUpdatePayload
} from '@/types/workflowsV2';

export function createEmptyWorkflowDraft(): WorkflowDraft {
  return {
    title: '',
    aim: '',
    status: 'draft',
    is_active: true,
    steps: [makeStepDraft('prompt')],
    scheduleConfigText: makeSchedulePresetText('disabled')
  };
}

export function stepToDraft(step: {
  step_type: string;
  title: string;
  instructions?: string | null;
  input_mode?: string | null;
  config?: Record<string, unknown>;
}): WorkflowStepDraft {
  return {
    step_type: step.step_type ?? 'prompt',
    title: step.title ?? '',
    instructions: step.instructions ?? '',
    input_mode: step.input_mode ?? 'previous_output',
    configText: prettyJson(step.config ?? {})
  };
}

export function detailToWorkflowDraft(detail: WorkflowDetailResponse): WorkflowDraft {
  return {
    title: detail.workflow.title ?? '',
    aim: detail.workflow.aim ?? '',
    status: detail.workflow.status ?? 'draft',
    is_active: detail.workflow.is_active ?? true,
    steps: detail.steps.length > 0 ? detail.steps.map(stepToDraft) : [makeStepDraft('prompt')],
    scheduleConfigText: prettyJson(detail.workflow.schedule_config ?? {})
  };
}

function draftStepToPayload(step: WorkflowStepDraft, index: number): WorkflowV2StepPayload {
  if (!step.step_type.trim()) {
    throw new Error(`Step ${index + 1} needs a step type.`);
  }

  if (!step.title.trim()) {
    throw new Error(`Step ${index + 1} needs a title.`);
  }

  return {
    step_type: step.step_type.trim(),
    title: step.title.trim(),
    instructions: step.instructions.trim(),
    input_mode: step.input_mode.trim() || 'previous_output',
    config: parseJsonObject(step.configText, `Step ${index + 1} config`)
  };
}

function baseValidation(draft: WorkflowDraft): void {
  if (!draft.title.trim()) {
    throw new Error('Workflow title is required.');
  }

  if (!draft.aim.trim()) {
    throw new Error('Workflow aim is required.');
  }

  if (!draft.steps.length) {
    throw new Error('Add at least one workflow step.');
  }
}

export function draftToCreatePayload(draft: WorkflowDraft): WorkflowCreatePayload {
  baseValidation(draft);

  return {
    title: draft.title.trim(),
    aim: draft.aim.trim(),
    steps: draft.steps.map(draftStepToPayload),
    created_by: 'mobile',
    schedule_config: parseJsonObject(draft.scheduleConfigText, 'Schedule config'),
    metadata: {}
  };
}

export function draftToUpdatePayload(draft: WorkflowDraft): WorkflowUpdatePayload {
  baseValidation(draft);

  return {
    title: draft.title.trim(),
    aim: draft.aim.trim(),
    status: draft.status.trim() || 'draft',
    is_active: draft.is_active,
    steps: draft.steps.map(draftStepToPayload),
    schedule_config: parseJsonObject(draft.scheduleConfigText, 'Schedule config')
  };
}
