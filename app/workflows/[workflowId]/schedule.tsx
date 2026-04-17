import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { upsertWorkflowSchedule } from '@/api/workflowsV2';
import { AppButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { useWorkflowV2 } from '@/hooks/useWorkflowV2';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatError, prettyJson } from '@/lib/utils';

export default function WorkflowScheduleConfigScreen() {
  const params = useLocalSearchParams<{ workflowId: string }>();
  const workflowId = decodeRouteParam(params.workflowId);
  const queryClient = useQueryClient();
  const workflowQuery = useWorkflowV2(workflowId);

  const [scheduleConfigText, setScheduleConfigText] = useState('{}');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workflowQuery.data?.workflow) {
      return;
    }

    setScheduleConfigText(
      prettyJson(workflowQuery.data.workflow.schedule_config ?? {})
    );
  }, [workflowQuery.data?.workflow.id, workflowQuery.data?.workflow.updated_at]);

  async function handleSave() {
    setSaving(true);
    try {
      const parsed = JSON.parse(scheduleConfigText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Schedule config must be a JSON object.');
      }

      await upsertWorkflowSchedule(workflowId, parsed as Record<string, unknown>);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workflow(workflowId) })
      ]);
      Alert.alert('Saved', 'Schedule config was updated.');
      router.back();
    } catch (error) {
      Alert.alert('Save failed', formatError(error));
    } finally {
      setSaving(false);
    }
  }

  if (workflowQuery.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Schedule config' }} />
        <Screen>
          <LoadingState label="Loading schedule config…" />
        </Screen>
      </>
    );
  }

  if (workflowQuery.isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Schedule config' }} />
        <Screen>
          <ErrorState
            message={formatError(workflowQuery.error)}
            onRetry={() => workflowQuery.refetch()}
          />
        </Screen>
      </>
    );
  }

  if (!workflowQuery.data?.workflow) {
    return (
      <>
        <Stack.Screen options={{ title: 'Schedule config' }} />
        <Screen>
          <EmptyState
            title="Workflow not available"
            description="Could not load this workflow schedule configuration."
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Schedule config' }} />
      <Screen
        title="Schedule config"
        subtitle="Edit raw schedule JSON on its own screen and save independently.">
        <SectionCard title="Schedule config JSON">
          <ScheduleEditor
            value={scheduleConfigText}
            onChangeText={setScheduleConfigText}
          />

          <AppButton
            label={saving ? 'Saving…' : 'Save schedule config'}
            onPress={handleSave}
            disabled={saving}
          />
        </SectionCard>
      </Screen>
    </>
  );
}
