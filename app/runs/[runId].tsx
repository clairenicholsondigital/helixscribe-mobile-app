import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { CodeBlock } from '@/components/CodeBlock';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill, toneForRunStatus } from '@/components/StatusPill';
import { deleteWorkflowRunV2 } from '@/api/workflowsV2';
import { useWorkflowRun } from '@/hooks/useWorkflowRun';
import { queryKeys } from '@/lib/queryKeys';
import {
  decodeRouteParam,
  formatDateTime,
  formatError,
  isTerminalRunStatus,
  prettyJson
} from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export default function RunDetailScreen() {
  const params = useLocalSearchParams<{ runId: string }>();
  const runId = decodeRouteParam(params.runId);
  const queryClient = useQueryClient();
  const runQuery = useWorkflowRun(runId);

  async function handleDeleteRun() {
    try {
      await deleteWorkflowRunV2(runId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.workflowRun(runId) });
      Alert.alert('Deleted', `Run ${runId} was deleted.`);
      router.back();
    } catch (error) {
      Alert.alert('Delete failed', formatError(error));
    }
  }

  if (runQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Run detail' }} />
        <Screen>
          <LoadingState label="Loading run…" />
        </Screen>
      </>
    );
  }

  if (runQuery.isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Run detail' }} />
        <Screen>
          <ErrorState message={formatError(runQuery.error)} onRetry={() => runQuery.refetch()} />
        </Screen>
      </>
    );
  }

  const run = runQuery.data?.run;
  const stepRuns = runQuery.data?.step_runs ?? [];

  if (!run) {
    return (
      <>
        <Stack.Screen options={{ title: 'Run detail' }} />
        <Screen>
          <EmptyState
            title="Run not found"
            description="The API did not return a run for this ID."
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Run ${run.id}` }} />
      <Screen title={`Run ${run.id}`} subtitle="Inspect the exact payloads and step outputs returned by the workflow V2 run endpoints.">
        <SectionCard title="Run summary">
          <StatusPill label={run.status || 'unknown'} tone={toneForRunStatus(run.status)} />
          <Text style={styles.metaText}>Workflow ID: {run.workflow_id}</Text>
          <Text style={styles.metaText}>Trigger: {run.trigger_type || 'manual'}</Text>
          <Text style={styles.metaText}>Created {formatDateTime(run.created_at)}</Text>
          <Text style={styles.metaText}>Started {formatDateTime(run.started_at)}</Text>
          <Text style={styles.metaText}>Completed {formatDateTime(run.completed_at)}</Text>

          <Text style={styles.subheading}>Input payload</Text>
          <CodeBlock value={prettyJson(run.input_payload ?? {})} />

          <Text style={styles.subheading}>Final output</Text>
          <CodeBlock value={run.final_output_text || 'No final output text returned.'} />

          {run.error_message ? (
            <>
              <Text style={styles.subheading}>Error</Text>
              <CodeBlock value={run.error_message} />
            </>
          ) : null}

          {isTerminalRunStatus(run.status) ? (
            <AppButton label="Delete run" onPress={handleDeleteRun} tone="danger" />
          ) : null}
        </SectionCard>

        <SectionCard title="Step runs">
          {!stepRuns.length ? (
            <EmptyState
              title="No step runs recorded"
              description="This run did not return any step run rows."
            />
          ) : (
            stepRuns.map((stepRun) => (
              <View key={stepRun.id} style={styles.stepCard}>
                <StatusPill
                  label={`${stepRun.step_index}. ${stepRun.status}`}
                  tone={toneForRunStatus(stepRun.status)}
                />
                <Text style={styles.stepTitle}>{stepRun.step_type}</Text>
                <Text style={styles.metaText}>
                  Started {formatDateTime(stepRun.started_at)} · Completed{' '}
                  {formatDateTime(stepRun.completed_at)}
                </Text>

                <Text style={styles.subheading}>Input</Text>
                <CodeBlock value={prettyJson(stepRun.input_payload ?? {})} />

                <Text style={styles.subheading}>Output</Text>
                <CodeBlock value={prettyJson(stepRun.output_payload ?? {})} />

                {stepRun.error_message ? (
                  <>
                    <Text style={styles.subheading}>Error</Text>
                    <CodeBlock value={stepRun.error_message} />
                  </>
                ) : null}
              </View>
            ))
          )}
        </SectionCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  metaText: {
    color: tokens.colors.muted,
    lineHeight: 20
  },
  subheading: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  stepCard: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background
  },
  stepTitle: {
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700'
  }
});
