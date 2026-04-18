import { Picker } from '@react-native-picker/picker';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { runWorkflowV2 } from '@/api/workflowsV2';
import { AppButton } from '@/components/Button';
import { ExpandableTextInput } from '@/components/ExpandableTextInput';
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

type WorkflowSummary = {
  id: string;
  title?: string;
  aim?: string;
  status?: string;
  is_active?: boolean;
  schedule_summary?: string;
};

type WorkflowRunFormField = {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  example?: unknown;
  used_in_steps?: Array<{
    step_index?: number;
    step_title?: string;
    step_type?: string;
  }>;
};

type WorkflowRunFormResponse = {
  workflow: {
    id: string;
    title?: string;
    aim?: string;
    status?: string;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  steps: Array<{
    id?: string;
    step_index?: number;
    step_type?: string;
    title?: string;
    instructions?: string;
    input_mode?: string;
    config?: Record<string, unknown>;
  }>;
  run_form: {
    mode: 'metadata' | 'inferred';
    fields: WorkflowRunFormField[];
    example_payload?: Record<string, unknown>;
  };
};

type InputRow = {
  id: string;
  key: string;
  value: string;
  locked?: boolean;
};

type FormActionValue =
  | 'none'
  | 'reset_examples'
  | 'reset_blank'
  | 'add_custom'
  | 'clear_all';

function blankRow(key = '', value = '', locked = false): InputRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key,
    value,
    locked
  };
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function coerceInputValue(raw: string): string | number | boolean | Record<string, unknown> | unknown[] {
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

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
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

function getFieldLabel(field: WorkflowRunFormField) {
  return field.label?.trim() || prettifyKey(field.key);
}

function buildRowsFromFields(
  fields: WorkflowRunFormField[],
  preferredPayload?: Record<string, unknown>,
  useBlankValues = false
): InputRow[] {
  if (!fields.length) {
    return [blankRow()];
  }

  return fields.map((field) => {
    let value = '';

    if (!useBlankValues) {
      if (preferredPayload && field.key in preferredPayload) {
        value = toDisplayString(preferredPayload[field.key]);
      } else if (field.example !== undefined && field.example !== null && field.example !== '') {
        value = toDisplayString(field.example);
      } else if (field.default !== undefined && field.default !== null && field.default !== '') {
        value = toDisplayString(field.default);
      }
    }

    return blankRow(field.key, value, true);
  });
}

async function fetchWorkflowV2RunForm(workflowId: string): Promise<WorkflowRunFormResponse> {
  const baseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://api.helixscribe.cloud';

  const response = await fetch(`${baseUrl}/workflow-v2/workflows/${workflowId}/run-form`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load workflow run form: ${response.status} ${text}`);
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
  const [formAction, setFormAction] = useState<FormActionValue>('none');

  const hasInitialisedFormRef = useRef<string | null>(null);

  const workflows = workflowsQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [selectedWorkflowId, workflows]);

  useEffect(() => {
    setResult(null);
    setInputRows([blankRow()]);
    hasInitialisedFormRef.current = null;
    setFormAction('none');
  }, [selectedWorkflowId]);

  const selectedWorkflowSummary = useMemo(
    () =>
      (workflows.find((workflow) => workflow.id === selectedWorkflowId) as WorkflowSummary | null) ??
      null,
    [selectedWorkflowId, workflows]
  );

  const workflowRunFormQuery = useQuery({
    queryKey: [...queryKeys.workflow(selectedWorkflowId), 'run-form'],
    queryFn: () => fetchWorkflowV2RunForm(selectedWorkflowId),
    enabled: Boolean(selectedWorkflowId)
  });

  const workflowRunForm = workflowRunFormQuery.data ?? null;
  const formFields = workflowRunForm?.run_form?.fields ?? [];
  const examplePayload = workflowRunForm?.run_form?.example_payload ?? {};

  useEffect(() => {
    if (!selectedWorkflowId || !workflowRunForm) {
      return;
    }

    if (hasInitialisedFormRef.current === selectedWorkflowId) {
      return;
    }

    setInputRows(buildRowsFromFields(formFields, examplePayload, false));
    hasInitialisedFormRef.current = selectedWorkflowId;
  }, [selectedWorkflowId, workflowRunForm, formFields, examplePayload]);

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

  function addCustomRow() {
    setInputRows((rows) => [...rows, blankRow()]);
  }

  function removeRow(id: string) {
    setInputRows((rows) => {
      if (rows.length <= 1) {
        return [blankRow()];
      }
      return rows.filter((row) => row.id !== id);
    });
  }

  function resetToExamples() {
    setInputRows(buildRowsFromFields(formFields, examplePayload, false));
  }

  function resetToBlankForm() {
    setInputRows(buildRowsFromFields(formFields, examplePayload, true));
  }

  function clearEverything() {
    setInputRows([blankRow()]);
  }

  function handleFormAction(action: FormActionValue) {
    setFormAction(action);

    if (action === 'reset_examples') {
      resetToExamples();
    } else if (action === 'reset_blank') {
      resetToBlankForm();
    } else if (action === 'add_custom') {
      addCustomRow();
    } else if (action === 'clear_all') {
      clearEverything();
    }

    setFormAction('none');
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
      <Screen subtitle="Choose a workflow, fill in the fields, and run it without building the payload by hand.">
        <SectionCard title="Choose workflow">
          {workflowsQuery.isLoading ? (
            <Text style={styles.helperText}>Loading workflows…</Text>
          ) : workflowsQuery.isError ? (
            <ErrorState message={formatError(workflowsQuery.error)} onRetry={workflowsQuery.refetch} />
          ) : !workflows.length ? (
            <EmptyState
              title="No workflows available"
              description="Create a workflow first, then come back here to run it."
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

        <SectionCard title="Inputs" description="These fields are ready to fill in straight away.">
          {workflowRunFormQuery.isLoading ? (
            <Text style={styles.helperText}>Loading fields…</Text>
          ) : workflowRunFormQuery.isError ? (
            <ErrorState
              message={formatError(workflowRunFormQuery.error)}
              onRetry={workflowRunFormQuery.refetch}
            />
          ) : (
            <>
              <View style={styles.toolbarRow}>
                <View style={styles.actionPickerWrap}>
                  <Picker
                    dropdownIconColor={tokens.colors.text}
                    selectedValue={formAction}
                    style={styles.picker}
                    onValueChange={(value) => handleFormAction(value as FormActionValue)}>
                    <Picker.Item label="Form actions" value="none" />
                    <Picker.Item label="Reset to examples" value="reset_examples" />
                    <Picker.Item label="Reset to blank form" value="reset_blank" />
                    <Picker.Item label="Add custom field" value="add_custom" />
                    <Picker.Item label="Clear all" value="clear_all" />
                  </Picker>
                </View>
              </View>

              {inputRows.map((row, index) => {
                const fieldDef = formFields.find((field) => field.key === row.key);
                const label = fieldDef ? getFieldLabel(fieldDef) : `Field ${index + 1}`;
                const isMultiline =
                  fieldDef?.type === 'textarea' ||
                  row.value.includes('\n') ||
                  row.value.length > 80;

                return (
                  <View key={row.id} style={styles.inputRow}>
                    <Text style={styles.inputLabel}>
                      {label}
                      {fieldDef?.required ? ' *' : ''}
                    </Text>

                    {fieldDef?.description ? (
                      <Text style={styles.helperText}>{fieldDef.description}</Text>
                    ) : null}

                    <ExpandableTextInput
                      fieldLabel={label}
                      helperText={isMultiline ? 'Tip: open full screen for easier editing.' : undefined}
                      inputProps={{
                        autoCapitalize: 'none',
                        autoCorrect: false,
                        multiline: isMultiline,
                        style: [styles.textInput, isMultiline ? styles.valueInput : null],
                        textAlignVertical: isMultiline ? 'top' : 'center'
                      }}
                      modalTitle={`Edit ${label}`}
                      onChangeText={(text) => updateRow(row.id, 'value', text)}
                      placeholder={
                        fieldDef?.example !== undefined && fieldDef.example !== null && fieldDef.example !== ''
                          ? `Example: ${toDisplayString(fieldDef.example)}`
                          : row.key
                            ? `Value for ${prettifyKey(row.key)}`
                            : 'Value'
                      }
                      value={row.value}
                    />

                    <View style={styles.rowFooter}>
                      <Text style={styles.fieldKeyText}>Key: {row.key || 'custom field'}</Text>
                      <AppButton label="Remove" onPress={() => removeRow(row.id)} tone="ghost" />
                    </View>
                  </View>
                );
              })}

              {inputRows.some((row) => !row.locked) ? (
                <View style={styles.customSection}>
                  <Text style={styles.subheading}>Custom field names</Text>
                  {inputRows
                    .filter((row) => !row.locked)
                    .map((row) => (
                      <TextInput
                        key={`${row.id}-key`}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={(text) => updateRow(row.id, 'key', text)}
                        placeholder="Custom input name"
                        placeholderTextColor={tokens.colors.muted}
                        style={styles.textInput}
                        value={row.key}
                      />
                    ))}
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <AppButton
                  disabled={running || !selectedWorkflowId}
                  label={running ? 'Running…' : 'Run test'}
                  onPress={handleRunTest}
                />
              </View>
            </>
          )}
        </SectionCard>

        {result ? (
          <SectionCard title="Run result">
            <StatusPill
              label={result.run.status || 'unknown'}
              tone={toneForRunStatus(result.run.status)}
            />
            <Text style={styles.helperText}>Run ID: {result.run.id}</Text>
            <Text style={styles.helperText}>
              Started {formatDateTime(result.run.started_at)} · Completed {formatDateTime(result.run.completed_at)}
            </Text>

            <Text style={styles.subheading}>Final output</Text>
            <Text style={styles.resultText}>
              {result.run.final_output_text || 'No final output text returned.'}
            </Text>

            {result.run.error_message ? (
              <>
                <Text style={styles.subheading}>Error</Text>
                <Text style={styles.errorText}>{result.run.error_message}</Text>
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
  actionPickerWrap: {
    minWidth: 220,
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
    minHeight: 96,
    textAlignVertical: 'top'
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.sm
  },
  fieldKeyText: {
    color: tokens.colors.muted,
    fontSize: 12,
    flex: 1
  },
  customSection: {
    gap: tokens.spacing.sm
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
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
  },
  resultText: {
    color: tokens.colors.text,
    lineHeight: 22
  },
  errorText: {
    color: tokens.colors.text,
    lineHeight: 22
  }
});