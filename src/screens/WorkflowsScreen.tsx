import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill, toneForRunStatus } from '@/components/StatusPill';
import { runWorkflowV2 } from '@/api/workflowsV2';
import { useWorkflowsV2 } from '@/hooks/useWorkflowsV2';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime, formatError, truncateText } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export function WorkflowsScreen() {
  const queryClient = useQueryClient();
  const workflowsQuery = useWorkflowsV2();
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  async function handleRun(workflowId: string) {
    setRunningWorkflowId(workflowId);
    try {
      const result = await runWorkflowV2(workflowId, {
        trigger_type: 'manual',
        input_payload: {},
        wait_for_completion: true,
        max_retries: 2
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflow(workflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflowRuns(workflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflowRun(result.run.id) })
      ]);

      Alert.alert('Workflow run finished', `Run ${result.run.id} ended with status ${result.run.status}.`);
    } catch (error) {
      Alert.alert('Run failed', formatError(error));
    } finally {
      setRunningWorkflowId(null);
    }
  }

  return (
    <Screen
      actions={<AppButton label="New workflow" onPress={() => router.push('/workflows/new')} />}
      title="Workflows V2"
      subtitle="Browse, open, and test the mobile-first subset of your V2 workflow manager.">
      {workflowsQuery.isLoading ? <LoadingState label="Loading workflows…" /> : null}

      {workflowsQuery.isError ? (
        <ErrorState
          message={formatError(workflowsQuery.error)}
          onRetry={() => workflowsQuery.refetch()}
        />
      ) : null}

      {!workflowsQuery.isLoading && !workflowsQuery.isError && !workflowsQuery.data?.items.length ? (
        <EmptyState
          title="No workflows found"
          description="Create the first mobile workflow from the button above."
        />
      ) : null}

      {(workflowsQuery.data?.items ?? []).map((workflow) => (
        <SectionCard
          key={workflow.id}
          title={workflow.title}
          description={workflow.aim || 'No aim has been set.'}>
          <View style={styles.pillRow}>
            <StatusPill label={workflow.status || 'draft'} tone="primary" />
            <StatusPill label={workflow.is_active ? 'active' : 'inactive'} />
            {workflow.latest_run ? (
              <StatusPill
                label={`latest: ${workflow.latest_run.status}`}
                tone={toneForRunStatus(workflow.latest_run.status)}
              />
            ) : null}
          </View>

          <Text style={styles.metaText}>
            Schedule: {workflow.schedule_summary || 'Manual only'}
          </Text>
          <Text style={styles.metaText}>Updated {formatDateTime(workflow.updated_at)}</Text>

          {workflow.latest_run ? (
            <Text style={styles.metaText}>
              Latest run: {formatDateTime(workflow.latest_run.started_at)} ·{' '}
              {truncateText(workflow.latest_run.final_output_text ?? workflow.latest_run.error_message ?? '', 100)}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <AppButton
              label="Open"
              onPress={() =>
                router.push({
                  pathname: '/workflows/[workflowId]',
                  params: { workflowId: workflow.id }
                })
              }
            />
            <AppButton
              disabled={runningWorkflowId === workflow.id}
              label={runningWorkflowId === workflow.id ? 'Running…' : 'Run now'}
              onPress={() => handleRun(workflow.id)}
              tone="ghost"
            />
          </View>
        </SectionCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  metaText: {
    color: tokens.colors.muted,
    lineHeight: 20
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  }
});
