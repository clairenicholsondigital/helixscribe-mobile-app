import { router, Tabs, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
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
  updateWorkflowV2
} from '@/api/workflowsV2';
import { useWorkflowV2 } from '@/hooks/useWorkflowV2';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatDateTime, formatError } from '@/lib/utils';
import {
  detailToWorkflowDraft,
  draftToUpdatePayload
} from '@/lib/workflowDrafts';
import { tokens } from '@/theme/tokens';
import type { WorkflowDraft } from '@/types/workflowsV2';

export default function WorkflowDetailScreen() {
  const params = useLocalSearchParams<{ workflowId: string }>();
  const workflowId = decodeRouteParam(params.workflowId);
  const queryClient = useQueryClient();
  const workflowQuery = useWorkflowV2(workflowId);

  const [draft, setDraft] = useState<WorkflowDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [recentRunsExpanded, setRecentRunsExpanded] = useState(false);

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
      const { schedule_config: _scheduleConfig, ...payload } = draftToUpdatePayload(draft);
      await updateWorkflowV2(workflowId, payload);
      await refreshAfterRun();
      Alert.alert('Saved', 'Workflow changes were saved.');
    } catch (error) {
      Alert.alert('Save failed', formatError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRun(runId: string) {
    setDeletingRunId(runId);
    try {
      await deleteWorkflowRunV2(runId);
      await refreshAfterRun(runId);
      Alert.alert('Deleted', `Run ${runId} was deleted.`);
    } catch (error) {
      Alert.alert('Delete failed', formatError(error));
    } finally {
      setDeletingRunId(null);
    }
  }

  async function handleCopyWorkflowCode() {
    const curlCommand = [
      'BASE_URL="https://api.helixscribe.cloud"',
      `curl -sS "$BASE_URL/workflow-v2/workflows/${workflowId}" -H "Accept: application/json" | jq '.steps'`
    ].join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(curlCommand);
        Alert.alert('Copied', 'Workflow curl command copied to clipboard.');
        return;
      }

      await Share.share({ message: curlCommand });
      Alert.alert(
        'Share opened',
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? 'Clipboard is unavailable in this environment. A share sheet was opened instead.'
          : 'Clipboard is unavailable in this environment.'
      );
    } catch {
      Alert.alert('Error', 'Could not copy workflow curl command.');
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
        subtitle="Edit the core workflow fields and review recent run history.">
        <WorkflowForm draft={draft} onChange={setDraft} />

        <SectionCard title="Save changes">
          <AppButton
            label="Copy workflow code"
            tone="ghost"
            onPress={handleCopyWorkflowCode}
          />
          <AppButton
            disabled={saving}
            label={saving ? 'Saving…' : 'Save workflow'}
            onPress={handleSave}
          />
        </SectionCard>


        <SectionCard
          title="Schedule config"
          description="Manage schedule JSON on a dedicated screen to keep this detail view compact.">
          <AppButton
            label="Edit schedule config"
            tone="ghost"
            onPress={() =>
              router.push({
                pathname: '/workflows/[workflowId]/schedule',
                params: { workflowId }
              })
            }
          />
        </SectionCard>

        <SectionCard title="Recent runs" description={`${recentRuns.length} total`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRecentRunsExpanded((value) => !value)}
            style={styles.accordionToggle}>
            <Text style={styles.accordionToggleText}>
              {recentRunsExpanded ? 'Hide recent runs' : 'Show recent runs'}
            </Text>
            <Text style={styles.accordionChevron}>{recentRunsExpanded ? '▾' : '▸'}</Text>
          </Pressable>

          {!recentRunsExpanded ? null : !recentRuns.length ? (
            <EmptyState title="No runs yet" description="No run history is available yet." />
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  accordionToggle: {
    minHeight: 42,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.background
  },
  accordionToggleText: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  accordionChevron: {
    color: tokens.colors.muted,
    fontSize: 16
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
