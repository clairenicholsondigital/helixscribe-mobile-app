import { Picker } from '@react-native-picker/picker';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { runWorkflowV2 } from '@/api/workflowsV2';
import { AppButton } from '@/components/Button';
import { CodeBlock } from '@/components/CodeBlock';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill, toneForRunStatus } from '@/components/StatusPill';
import { useWorkflowsV2 } from '@/hooks/useWorkflowsV2';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime, formatError } from '@/lib/utils';
import { tokens } from '@/theme/tokens';
import type { WorkflowRunDetailResponse } from '@/types/workflowsV2';

type InputRow = {
  id: string;
  key: string;
  value: string;
};

type WorkflowStep = {
  step_type?: string;
  title?: string;
  instructions?: string;
  input_mode?: string;
  config?: Record<string, unknown>;
};

type WorkflowDetail = {
  id: string;
  title?: string;
  aim?: string;
  status?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  schedule_summary?: string;
  steps?: WorkflowStep[];
};

type SuggestedInput = {
  key: string;
  source: 'placeholder' | 'common';
  reason: string;
};

function blankRow(key = '', value = ''): InputRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key,
    value
  };
}

function coerceInputValue(raw: string): string | number | boolean {
  const trimmed = raw.trim();

  if (!trimmed.length) {
    return '';
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && trimmed !== '') {
    return asNumber;
  }

  return raw;
}

function prettifyKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractStringsDeep(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractStringsDeep(item));
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) => extractStringsDeep(item));
  }

  return [];
}

function extractSuggestedInputs(workflow: WorkflowDetail | null): SuggestedInput[] {
  if (!workflow) {
    return [];
  }

  const found = new Map<string, SuggestedInput>();

  const steps = workflow.steps ?? [];
  const placeholderRegex = /\{\{\s*(?:workflow_input|input_payload)\.([a-zA-Z0-9_]+)\s*\}\}/g;

  for (const step of steps) {
    const haystack = [
      step.instructions ?? '',
      ...extractStringsDeep(step.config)
    ].join('\n');

    const matches = haystack.matchAll(placeholderRegex);
    for (const match of matches) {
      const key = match[1]?.trim();
      if (!key) {
        continue;
      }

      if (!found.has(key)) {
        found.set(key, {
          key,
          source: 'placeholder',
          reason: `Found in step "${step.title || step.step_type || 'Untitled step'}"`
        });
      }
    }
  }

  const title = (workflow.title || '').toLowerCase();
  const aim = (workflow.aim || '').toLowerCase();
  const combined = `${title} ${aim}`;

  const commonHints: Array<{ key: string; when: boolean; reason: string }> = [
    {
      key: 'email_text',
      when: combined.includes('email'),
      reason: 'Common for email support workflows'
    },
    {
      key: 'context',
      when: combined.includes('support') || combined.includes('knowledge'),
      reason: 'Useful for routing and retrieval context'
    },
    {
      key: 'url',
      when: combined.includes('url') || combined.includes('blog'),
      reason: 'Common for URL-based content workflows'
    },
    {
      key: 'topic',
      when: combined.includes('post') || combined.includes('linkedin') || combined.includes('seo'),
      reason: 'Useful for topic-driven content workflows'
    },
    {
      key: 'audience',
      when: combined.includes('post') || combined.includes('marketing') || combined.includes('linkedin'),
      reason: 'Helpful for tone and relevance'
    }
  ];

  for (const hint of commonHints) {
    if (hint.when && !found.has(hint.key)) {
      found.set(hint.key, {
        key: hint.key,
        source: 'common',
        reason: hint.reason
      });
    }
  }

  return Array.from(found.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function summariseStep(step: WorkflowStep, index: number) {
  const title = step.title || `Step ${index + 1}`;
  const type = step.step_type || 'unknown';
  const mode = step.input_mode || 'previous_output';

  return `${index + 1}. ${title} · ${type} · input: ${mode}`;
}

async function fetchWorkflowV2Detail(workflowId: string): Promise<WorkflowDetail> {
  const baseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://api.helixscribe.cloud';

  const response = await fetch(`${baseUrl}/workflow-v2/workflows/${workflowId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load workflow detail: ${response.status} ${text}`);
  }

  return response.json();
}

export default function RunAiScreen() {
  const workflowsQuery = useWorkflowsV2(100);
  const queryClient = useQueryClient();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [inputRows, setInputRows] = useState<InputRow[]>([blankRow()]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WorkflowRunDetailResponse | null>(null);

  const workflows = workflowsQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [selectedWorkflowId, workflows]);

  useEffect(() => {
    setResult(null);
    setInputRows([blankRow()]);
  }, [selectedWorkflowId]);

  const selectedWorkflowSummary = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  const workflowDetailQuery = useQuery({
    queryKey: [...queryKeys.workflow(selectedWorkflowId), 'detail'],
    queryFn: () => fetchWorkflowV2Detail(selectedWorkflowId),
    enabled: Boolean(selectedWorkflowId)
  });

  const selectedWorkflow = workflowDetailQuery.data ?? null;

  const suggestedInputs = useMemo(
    () => extractSuggestedInputs(selectedWorkflow),
    [selectedWorkflow]
  );

  const payloadPreview = useMemo(() => {
    const output: Record<string, unknown> = {};

    inputRows.forEach((row) => {
      const key = row.key.trim();
      if (!key) {
        return;
      }
      output[key] = coerceInputValue(row.value);
    });

    return output;
  }, [inputRows]);

  function updateRow(id: string, field: 'key' | 'value', next: string) {
    setInputRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: next } : row)));
  }

  function addRow(key = '', value = '') {
    setInputRows((rows) => [...rows, blankRow(key, value)]);
  }

  function addSuggestedInput(key: string) {
    setInputRows((rows) => {
      const exists = rows.some((row) => row.key.trim() === key);
      if (exists) {
        return rows;
      }

      if (rows.length === 1 && !rows[0].key.trim() && !rows[0].value.trim()) {
        return [blankRow(key, '')];
      }

      return [...rows, blankRow(key, '')];
    });
  }

  function removeRow(id: string) {
    setInputRows((rows) => {
      if (rows.length <= 1) {
        return [blankRow()];
      }

      return rows.filter((row) => row.id !== id);
    });
  }

  function clearInputs() {
    setInputRows([blankRow()]);
  }

  function fillExampleValues() {
    const nextRows = suggestedInputs.length
      ? suggestedInputs.map((item) => {
          let value = '';

          switch (item.key) {
            case 'email_text':
              value = 'A member says they cannot log in and needs help accessing recordings.';
              break;
            case 'context':
              value = 'NWR member support';
              break;
            case 'url':
              value = 'https://helixscribe.ai/blog/example-post';
              break;
            case 'topic':
              value = 'How internal linking supports SEO';
              break;
            case 'audience':
              value = 'Small business owners';
              break;
            default:
              value = '';
          }

          return blankRow(item.key, value);
        })
      : [blankRow('topic', 'Example topic')];

    setInputRows(nextRows);
  }

  async function handleRunTest() {
    if (!selectedWorkflowId) {
      Alert.alert('Choose a workflow', 'Pick a workflow before running a test.');
      return;
    }

    setRunning(true);
    try {
      const runResult = await runWorkflowV2(selectedWorkflowId, {
        trigger_type: 'manual',
        input_payload: payloadPreview,
        wait_for_completion: true,
        max_retries: 2
      });

      setResult(runResult);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflow(selectedWorkflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflowRuns(selectedWorkflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflowRun(runResult.run.id) })
      ]);

      Alert.alert('Run complete', `Run ${runResult.run.id} finished with ${runResult.run.status}.`);
    } catch (error) {
      Alert.alert('Run failed', formatError(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Run AI' }} />
      <Screen
        title="Run AI"
        subtitle="Pick a workflow, see what inputs it likely expects, then run it without guessing JSON keys.">
        <SectionCard title="Choose workflow">
          {workflowsQuery.isLoading ? (
            <Text style={styles.helperText}>Loading workflows…</Text>
          ) : workflowsQuery.isError ? (
            <ErrorState message={formatError(workflowsQuery.error)} onRetry={workflowsQuery.refetch} />
          ) : !workflows.length ? (
            <EmptyState
              title="No workflows available"
              description="Create a workflow first, then come back to run it here."
            />
          ) : (
            <View style={styles.pickerWrap}>
              <Picker
                dropdownIconColor={tokens.colors.text}
                selectedValue={selectedWorkflowId}
                style={styles.picker}
                onValueChange={(value) => setSelectedWorkflowId(String(value))}>
                {workflows.map((workflow) => (
                  <Picker.Item
                    key={workflow.id}
                    label={workflow.title || workflow.id}
                    value={workflow.id}
                  />
                ))}
              </Picker>
            </View>
          )}

          {selectedWorkflowSummary ? (
            <View style={styles.metaBlock}>
              <Text style={styles.helperText}>
                Selected: {selectedWorkflowSummary.title || selectedWorkflowSummary.id}
              </Text>
              {selectedWorkflowSummary.aim ? (
                <Text style={styles.helperText}>Aim: {selectedWorkflowSummary.aim}</Text>
              ) : null}
              {selectedWorkflowSummary.schedule_summary ? (
                <Text style={styles.helperText}>
                  Schedule: {selectedWorkflowSummary.schedule_summary}
                </Text>
              ) : null}
            </View>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Workflow guide"
          description="This uses the workflow detail to surface likely inputs and a quick step summary.">
          {!selectedWorkflowId ? (
            <Text style={styles.helperText}>Choose a workflow to see its detail.</Text>
          ) : workflowDetailQuery.isLoading ? (
            <Text style={styles.helperText}>Loading workflow detail…</Text>
          ) : workflowDetailQuery.isError ? (
            <ErrorState message={formatError(workflowDetailQuery.error)} onRetry={workflowDetailQuery.refetch} />
          ) : selectedWorkflow ? (
            <>
              {selectedWorkflow.aim ? (
                <>
                  <Text style={styles.subheading}>What this workflow is for</Text>
                  <Text style={styles.bodyText}>{selectedWorkflow.aim}</Text>
                </>
              ) : null}

              <Text style={styles.subheading}>Suggested inputs</Text>
              {suggestedInputs.length ? (
                <View style={styles.chipWrap}>
                  {suggestedInputs.map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => addSuggestedInput(item.key)}
                      style={styles.chip}>
                      <Text style={styles.chipText}>+ {item.key}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.helperText}>
                  No explicit placeholders were detected in the steps, so custom inputs may still be needed.
                </Text>
              )}

              {suggestedInputs.length ? (
                <View style={styles.hintList}>
                  {suggestedInputs.map((item) => (
                    <Text key={`${item.key}-hint`} style={styles.helperText}>
                      • {item.key}: {item.reason}
                    </Text>
                  ))}
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <AppButton label="Add suggested inputs" onPress={() => suggestedInputs.forEach((item) => addSuggestedInput(item.key))} tone="secondary" />
                <AppButton label="Fill example values" onPress={fillExampleValues} tone="ghost" />
              </View>

              <Text style={styles.subheading}>Step summary</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.stepsBox}>
                  {(selectedWorkflow.steps ?? []).length ? (
                    (selectedWorkflow.steps ?? []).map((step, index) => (
                      <Text key={`${step.title || step.step_type || 'step'}-${index}`} style={styles.stepText}>
                        {summariseStep(step, index)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.helperText}>No step detail returned for this workflow.</Text>
                  )}
                </View>
              </ScrollView>
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Inputs" description="Tap suggested inputs above, or add your own fields.">
          {inputRows.map((row, index) => (
            <View key={row.id} style={styles.inputRow}>
              <Text style={styles.inputLabel}>Field {index + 1}</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => updateRow(row.id, 'key', text)}
                placeholder={`Input name ${index + 1}`}
                placeholderTextColor={tokens.colors.muted}
                style={styles.textInput}
                value={row.key}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => updateRow(row.id, 'value', text)}
                placeholder={row.key ? `Value for ${prettifyKey(row.key)}` : 'Value'}
                placeholderTextColor={tokens.colors.muted}
                style={[styles.textInput, styles.valueInput]}
                value={row.value}
                multiline
              />
              <AppButton label="Remove" onPress={() => removeRow(row.id)} tone="ghost" />
            </View>
          ))}

          <View style={styles.actionRow}>
            <AppButton label="Add input" onPress={() => addRow()} tone="secondary" />
            <AppButton label="Clear" onPress={clearInputs} tone="ghost" />
            <AppButton
              disabled={running || !selectedWorkflowId}
              label={running ? 'Running…' : 'Run test'}
              onPress={handleRunTest}
            />
          </View>

          <Text style={styles.subheading}>Payload preview</Text>
          <CodeBlock value={JSON.stringify(payloadPreview, null, 2)} />
        </SectionCard>

        {result ? (
          <SectionCard title="Run result">
            <StatusPill
              label={result.run.status || 'unknown'}
              tone={toneForRunStatus(result.run.status)}
            />
            <Text style={styles.helperText}>Run ID: {result.run.id}</Text>
            <Text style={styles.helperText}>
              Started {formatDateTime(result.run.started_at)} · Completed{' '}
              {formatDateTime(result.run.completed_at)}
            </Text>

            <Text style={styles.subheading}>Final output</Text>
            <CodeBlock value={result.run.final_output_text || 'No final output text returned.'} />

            {result.run.error_message ? (
              <>
                <Text style={styles.subheading}>Error</Text>
                <CodeBlock value={result.run.error_message} />
              </>
            ) : null}

            <View style={styles.actionRow}>
              <AppButton
                label="Open run detail"
                onPress={() =>
                  router.push({
                    pathname: '/runs/[runId]',
                    params: { runId: result.run.id }
                  })
                }
                tone="ghost"
              />
            </View>
          </SectionCard>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  pickerWrap: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    overflow: 'hidden'
  },
  picker: {
    color: tokens.colors.text
  },
  metaBlock: {
    gap: tokens.spacing.xs
  },
  helperText: {
    color: tokens.colors.muted,
    lineHeight: 20
  },
  bodyText: {
    color: tokens.colors.text,
    lineHeight: 22
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  chip: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 999,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: tokens.colors.inputBackground
  },
  chipText: {
    color: tokens.colors.text,
    fontWeight: '600'
  },
  hintList: {
    gap: tokens.spacing.xs
  },
  stepsBox: {
    minWidth: '100%',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground
  },
  stepText: {
    color: tokens.colors.text,
    lineHeight: 20
  },
  inputRow: {
    gap: tokens.spacing.xs,
    padding: tokens.spacing.sm,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background
  },
  inputLabel: {
    color: tokens.colors.text,
    fontWeight: '700',
    fontSize: 13
  },
  textInput: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    color: tokens.colors.text,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm
  },
  valueInput: {
    minHeight: 72,
    textAlignVertical: 'top'
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  subheading: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '700'
  }
});