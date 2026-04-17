import { router, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { CodeBlock } from '@/components/CodeBlock';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill, toneForRunStatus } from '@/components/StatusPill';
import { WorkflowForm } from '@/components/WorkflowForm';
import {
  deleteWorkflowRunV2,
  runWorkflowV2,
  updateWorkflowV2,
  upsertWorkflowSchedule
} from '@/api/workflowsV2';
import { useWorkflowV2 } from '@/hooks/useWorkflowV2';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatDateTime, formatError, parseJsonObject, prettyJson } from '@/lib/utils';
import {
  detailToWorkflowDraft,
  draftToUpdatePayload
} from '@/lib/workflowDrafts';
import { tokens } from '@/theme/tokens';
import type { WorkflowDraft, WorkflowRunDetailResponse } from '@/types/workflowsV2';

export default function WorkflowDetailScreen() {
  const params = useLocalSearchParams<{ workflowId: string }>();
  const workflowId = decodeRouteParam(params.workflowId);
  const queryClient = useQueryClient();
  const workflowQuery = useWorkflowV2(workflowId);

  const [draft, setDraft] = useState<WorkflowDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testPayloadText, setTestPayloadText] = useState('{}');
  const [testResult, setTestResult] = useState<WorkflowRunDetailResponse | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  useEffect(() => {
    if (workflowQuery.data) {
      setDraft(detailToWorkflowDraft(workflowQuery.data));
    }
  }, [workflowId, workflowQuery.data?.workflow.updated_at]);

  const title = draft?.title || workflowQuery.data?.workflow.title || 'Workflow detail';

  async function refreshAfterRun(runId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(workflowId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowRuns(workflowId) }),
      ...(runId ? [queryClient.invalidateQueries({ queryKey: queryKeys.workflowRun(runId) })] : [])
    ]);
  }

  async function handleSave() {
    if (!draft) {
      return;
    }

    setSaving(true);
    try {
      const payload = draftToUpdatePayload(draft);
      await updateWorkflowV2(workflowId, payload);
      await upsertWorkflowSchedule(
        workflowId,
        (payload.schedule_config ?? {}) as Record<string, unknown>
      );
      await refreshAfterRun();
      Alert.alert('Saved', 'Workflow changes were saved.');
    } catch (error) {
      Alert.alert('Save failed', formatError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleRunTest() {
    if (!draft) {
      return;
    }

    setRunning(true);
    try {
      const inputPayload = parseJsonObject(testPayloadText, 'Test payload');
      const result = await runWorkflowV2(workflowId, {
        trigger_type: 'manual',
        input_payload: inputPayload,
        wait_for_completion: true,
        max_retries: 2
      });

      setTestResult(result);
      await refreshAfterRun(result.run.id);
      Alert.alert('Run complete', `Run ${result.run.id} finished with ${result.run.status}.`);
    } catch (error) {
      Alert.alert('Run failed', formatError(error));
    } finally {
      setRunning(false);
    }
  }

  async function handleDeleteRun(runId: string) {
    setDeletingRunId(runId);
    try {
      await deleteWorkflowRunV2(runId);
      if (testResult?.run.id === runId) {
        setTestResult(null);
      }
      await refreshAfterRun(runId);
      Alert.alert('Deleted', `Run ${runId} was deleted.`);
    } catch (error) {
      Alert.alert('Delete failed', formatError(error));
    } finally {
      setDeletingRunId(null);
    }
  }

  if (workflowQuery.isLoading && !draft) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Workflow detail' }} />
        <Screen>
          <LoadingState label="Loading workflow…" />
        </Screen>
      </>
    );
  }

  if (workflowQuery.isError && !draft) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Workflow detail' }} />
        <Screen>
          <ErrorState
            message={formatError(workflowQuery.error)}
            onRetry={() => workflowQuery.refetch()}
          />
        </Screen>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Workflow detail' }} />
        <Screen>
          <EmptyState
            title="Workflow not available"
            description="The API did not return workflow data for this ID."
          />
        </Screen>
      </>
    );
  }

  const recentRuns = workflowQuery.data?.recent_runs ?? [];

  return (
    <>
      <Tabs.Screen options={{ title }} />
      <Screen
        title={title}
        subtitle="Edit the core workflow fields, then test directly against the existing V2 run endpoint.">
        <WorkflowForm draft={draft} onChange={setDraft} />

        <SectionCard title="Save changes">
          <AppButton
            disabled={saving}
            label={saving ? 'Saving…' : 'Save workflow'}
            onPress={handleSave}
          />
        </SectionCard>

        <SectionCard title="Test this workflow" description="The payload below is sent to `/workflow-v2/workflows/{id}/run` as `input_payload`.">
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={8}
            onChangeText={setTestPayloadText}
            placeholder='{"topic":"mobile"}'
            placeholderTextColor={tokens.colors.muted}
            style={styles.jsonInput}
            textAlignVertical="top"
            value={testPayloadText}
          />

          <View style={styles.actionRow}>
            <AppButton
              disabled={running}
              label={running ? 'Running…' : 'Run test'}
              onPress={handleRunTest}
            />
            <AppButton label="Use empty payload" onPress={() => setTestPayloadText('{}')} tone="ghost" />
          </View>

          {testResult ? (
            <View style={styles.resultArea}>
              <StatusPill
                label={testResult.run.status || 'unknown'}
                tone={toneForRunStatus(testResult.run.status)}
              />
              <Text style={styles.metaText}>Run ID: {testResult.run.id}</Text>
              <Text style={styles.metaText}>
                Started {formatDateTime(testResult.run.started_at)} · Completed{' '}
                {formatDateTime(testResult.run.completed_at)}
              </Text>

              <Text style={styles.subheading}>Final output</Text>
              <CodeBlock value={testResult.run.final_output_text || 'No final output text returned.'} />

              {testResult.run.error_message ? (
                <>
                  <Text style={styles.subheading}>Error</Text>
                  <CodeBlock value={testResult.run.error_message} />
                </>
              ) : null}

              <View style={styles.actionRow}>
                <AppButton
                  label="Open run detail"
                  onPress={() =>
                    router.push({
                      pathname: '/runs/[runId]',
                      params: { runId: testResult.run.id }
                    })
                  }
                  tone="ghost"
                />
              </View>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard title="Recent runs">
          {!recentRuns.length ? (
            <EmptyState
              title="No runs yet"
              description="Run the workflow once from the test section above."
            />
          ) : (
            recentRuns.map((run) => (
              <View key={run.id} style={styles.runCard}>
                <StatusPill label={run.status || 'unknown'} tone={toneForRunStatus(run.status)} />
                <Text style={styles.runTitle}>Run {run.id}</Text>
                <Text style={styles.metaText}>
                  Trigger: {run.trigger_type || 'manual'} · Created {formatDateTime(run.created_at)}
                </Text>
                <Text style={styles.metaText}>
                  Started {formatDateTime(run.started_at)} · Completed {formatDateTime(run.completed_at)}
                </Text>

                {run.final_output_text ? (
                  <>
                    <Text style={styles.subheading}>Output preview</Text>
                    <CodeBlock value={run.final_output_text} />
                  </>
                ) : null}

                {run.error_message ? (
                  <>
                    <Text style={styles.subheading}>Error</Text>
                    <CodeBlock value={run.error_message} />
                  </>
                ) : null}

                <View style={styles.actionRow}>
                  <AppButton
                    label="Open"
                    onPress={() =>
                      router.push({
                        pathname: '/runs/[runId]',
                        params: { runId: run.id }
                      })
                    }
                    tone="ghost"
                  />
                  <AppButton
                    disabled={deletingRunId === run.id}
                    label={deletingRunId === run.id ? 'Deleting…' : 'Delete'}
                    onPress={() => handleDeleteRun(run.id)}
                    tone="danger"
                  />
                </View>
              </View>
            ))
          )}
        </SectionCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  jsonInput: {
    minHeight: 180,
    backgroundColor: tokens.colors.inputBackground,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    fontFamily: 'Courier',
    fontSize: 14
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  resultArea: {
    gap: tokens.spacing.sm
  },
  metaText: {
    color: tokens.colors.muted,
    lineHeight: 20
  },
  subheading: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  runCard: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background
  },
  runTitle: {
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700'
  }
});
