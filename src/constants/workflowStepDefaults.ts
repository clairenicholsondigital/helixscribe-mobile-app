import { prettyJson } from '@/lib/utils';
import type { WorkflowStepDraft, WorkflowV2StepPayload } from '@/types/workflowsV2';

export const workflowStepTemplates: Record<string, WorkflowV2StepPayload> = {
  prompt: {
    step_type: 'prompt',
    title: 'Prompt step',
    instructions: '',
    input_mode: 'previous_output',
    config: {}
  },
  url_retrieve: {
    step_type: 'url_retrieve',
    title: 'Retrieve URL',
    instructions: '',
    input_mode: 'none',
    config: {
      url: '',
      max_chars: 4000
    }
  },
  knowledge_retrieve: {
    step_type: 'knowledge_retrieve',
    title: 'Knowledge retrieve',
    instructions: '',
    input_mode: 'previous_output',
    config: {
      bucket_name: '',
      top_k: 5
    }
  },
  save_output: {
    step_type: 'save_output',
    title: 'Save output',
    instructions: '',
    input_mode: 'previous_output',
    config: {
      destination: 'inspect_only'
    }
  },
  template_fill: {
    step_type: 'template_fill',
    title: 'Template fill',
    instructions: '',
    input_mode: 'previous_output',
    config: {
      replacements: {}
    }
  }
};

export const workflowStepTemplateOptions = [
  { key: 'prompt', label: 'Add prompt' },
  { key: 'url_retrieve', label: 'Add URL step' },
  { key: 'knowledge_retrieve', label: 'Add knowledge step' },
  { key: 'save_output', label: 'Add save step' },
  { key: 'template_fill', label: 'Add template step' }
] as const;

export function makeStepDraft(
  templateKey: keyof typeof workflowStepTemplates = 'prompt'
): WorkflowStepDraft {
  const template = workflowStepTemplates[templateKey];
  return {
    step_type: template.step_type,
    title: template.title,
    instructions: template.instructions ?? '',
    input_mode: template.input_mode ?? 'previous_output',
    configText: prettyJson(template.config ?? {})
  };
}
