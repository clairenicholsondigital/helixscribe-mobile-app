import { Picker } from '@react-native-picker/picker';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

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

function blankRow(): InputRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key: '',
    value: ''
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

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  function updateRow(id: string, field: 'key' | 'value', next: string) {
    setInputRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: next } : row)));
  }

  function addRow() {
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

  function clearInputs() {
    setInputRows([blankRow()]);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Run AI' }} />
      <Screen
        title="Run AI"
        subtitle="Pick any workflow, type simple key/value inputs, and test without writing JSON.">
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
                  <Picker.Item key={workflow.id} label={workflow.title || workflow.id} value={workflow.id} />
                ))}
              </Picker>
            </View>
          )}

          {selectedWorkflow ? (
            <Text style={styles.helperText}>Selected: {selectedWorkflow.title || selectedWorkflow.id}</Text>
          ) : null}
        </SectionCard>

        <SectionCard title="Inputs" description="Add only the fields your workflow expects.">
          {inputRows.map((row, index) => (
            <View key={row.id} style={styles.inputRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => updateRow(row.id, 'key', text)}
                placeholder={`Input name ${index + 1} (e.g. topic)`}
                placeholderTextColor={tokens.colors.muted}
                style={styles.textInput}
                value={row.key}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(text) => updateRow(row.id, 'value', text)}
                placeholder="Value"
                placeholderTextColor={tokens.colors.muted}
                style={styles.textInput}
                value={row.value}
              />
              <AppButton label="Remove" onPress={() => removeRow(row.id)} tone="ghost" />
            </View>
          ))}

          <View style={styles.actionRow}>
            <AppButton label="Add input" onPress={addRow} tone="secondary" />
            <AppButton label="Clear" onPress={clearInputs} tone="ghost" />
            <AppButton disabled={running || !selectedWorkflowId} label={running ? 'Running…' : 'Run test'} onPress={handleRunTest} />
          </View>

          <Text style={styles.subheading}>Payload preview</Text>
          <CodeBlock value={JSON.stringify(payloadPreview, null, 2)} />
        </SectionCard>

        {result ? (
          <SectionCard title="Run result">
            <StatusPill label={result.run.status || 'unknown'} tone={toneForRunStatus(result.run.status)} />
            <Text style={styles.helperText}>Run ID: {result.run.id}</Text>
            <Text style={styles.helperText}>
              Started {formatDateTime(result.run.started_at)} · Completed {formatDateTime(result.run.completed_at)}
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
  textInput: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    color: tokens.colors.text,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm
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
