import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill, toneForRunStatus } from '@/components/StatusPill';
import { deleteWorkflowV2, runWorkflowV2 } from '@/api/workflowsV2';
import { useWorkflowsV2 } from '@/hooks/useWorkflowsV2';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime, formatError, truncateText } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export function WorkflowsScreen() {
  const queryClient = useQueryClient();
  const workflowsQuery = useWorkflowsV2();
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const filteredWorkflows = useMemo(() => {
    const items = workflowsQuery.data?.items ?? [];
    if (!searchTerm) {
      return items;
    }

    return items.filter((workflow) => workflow.title.toLowerCase().includes(searchTerm));
  }, [workflowsQuery.data?.items, searchTerm]);

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

  async function handleDelete(workflowId: string) {
    setDeletingWorkflowId(workflowId);
    try {
      await deleteWorkflowV2(workflowId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflow(workflowId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflowRuns(workflowId) })
      ]);
      Alert.alert('Deleted', 'Workflow was deleted.');
    } catch (error) {
      Alert.alert('Delete failed', formatError(error));
    } finally {
      setDeletingWorkflowId(null);
    }
  }

  function confirmDelete(workflowId: string, workflowTitle: string) {
    Alert.alert(
      'Delete workflow?',
      `Are you sure you want to delete "${workflowTitle}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(workflowId);
          }
        }
      ]
    );
  }

  return (
    <Screen
      actions={
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>Search workflows</Text>
          <TextInput
            accessibilityLabel="Search workflows by name"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchInput}
            placeholder="Type a workflow name..."
            placeholderTextColor={tokens.colors.muted}
            style={styles.searchInput}
            value={searchInput}
          />
        </View>
      }>
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
          description="Use the + button in the top-right to create your first workflow."
        />
      ) : null}

      {!workflowsQuery.isLoading && !workflowsQuery.isError && !filteredWorkflows.length && searchTerm ? (
        <EmptyState
          title="No matching workflows"
          description={`No workflow titles match "${searchInput.trim()}".`}
        />
      ) : null}

      {filteredWorkflows.map((workflow) => (
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
            <AppButton
              disabled={deletingWorkflowId === workflow.id}
              label={deletingWorkflowId === workflow.id ? 'Deleting…' : 'Delete'}
              onPress={() => confirmDelete(workflow.id, workflow.title)}
              size="small"
              tone="danger"
            />
          </View>
        </SectionCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    gap: tokens.spacing.xs
  },
  searchLabel: {
    color: tokens.colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    backgroundColor: tokens.colors.inputBackground
  },
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
