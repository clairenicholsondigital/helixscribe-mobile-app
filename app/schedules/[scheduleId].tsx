import { router, Tabs, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { getWorkflowV2Schedules, type WorkflowV2ScheduleItem } from '@/api/workflowV2Schedules';
import { decodeRouteParam } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatScheduleLabel(item: WorkflowV2ScheduleItem) {
  if (item.schedule_type === 'once') {
    return item.run_once_at
      ? `One-off · ${formatDateTime(item.run_once_at)}`
      : 'One-off';
  }

  if (item.schedule_type === 'interval') {
    return item.interval_seconds
      ? `Every ${item.interval_seconds} seconds`
      : 'Interval';
  }

  if (item.schedule_type === 'cron') {
    return item.cron_expression
      ? `Cron · ${item.cron_expression}`
      : 'Cron';
  }

  return item.schedule_type;
}

export default function ScheduleDetailScreen() {
  const params = useLocalSearchParams<{ scheduleId: string }>();
  const scheduleId = decodeRouteParam(params.scheduleId);

  const schedulesQuery = useQuery({
    queryKey: ['workflow-v2-schedules', { enabled_only: true }],
    queryFn: () => getWorkflowV2Schedules({ enabled_only: true, limit: 100 }),
  });

  const schedule = schedulesQuery.data?.items.find((item) => item.id === scheduleId);
  const title = schedule?.workflow_title || 'Schedule detail';

  if (schedulesQuery.isLoading) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Schedule detail' }} />
        <Screen>
          <LoadingState label="Loading schedule…" />
        </Screen>
      </>
    );
  }

  if (schedulesQuery.isError) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Schedule detail' }} />
        <Screen>
          <ErrorState
            message={schedulesQuery.error instanceof Error ? schedulesQuery.error.message : 'Unknown error'}
            onRetry={() => schedulesQuery.refetch()}
          />
        </Screen>
      </>
    );
  }

  if (!schedule) {
    return (
      <>
        <Tabs.Screen options={{ title: 'Schedule detail' }} />
        <Screen>
          <EmptyState
            title="Schedule not available"
            description="This schedule was not found in the currently enabled schedule list."
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Tabs.Screen options={{ title }} />
      <Screen
        title={schedule.workflow_title || 'Untitled workflow schedule'}
        subtitle="Open the exact workflow attached to this schedule, or inspect the latest run details.">
        <SectionCard title={formatScheduleLabel(schedule)}>
          <Text style={styles.note}>Status: {schedule.is_enabled ? 'Enabled' : 'Disabled'}</Text>
          <Text style={styles.note}>Timezone: {schedule.timezone_name || 'UTC'}</Text>
          <Text style={styles.note}>Next run: {formatDateTime(schedule.next_run_at)}</Text>
          <Text style={styles.note}>Last run: {formatDateTime(schedule.last_run_at)}</Text>
          <Text style={styles.note}>Created: {formatDateTime(schedule.created_at)}</Text>
          <Text style={styles.note}>Updated: {formatDateTime(schedule.updated_at)}</Text>

          <View style={styles.metaBlock}>
            <Text style={styles.meta}>Workflow ID: {schedule.workflow_id}</Text>
            <Text style={styles.meta}>Schedule ID: {schedule.id}</Text>
            <Text style={styles.meta}>Last enqueued for: {schedule.last_enqueued_for || 'Not available'}</Text>
          </View>

          <View style={styles.actionRow}>
            <AppButton
              label="Open workflow"
              onPress={() =>
                router.push({
                  pathname: '/workflows/[workflowId]',
                  params: { workflowId: schedule.workflow_id },
                })
              }
            />
            {schedule.last_enqueued_for ? (
              <AppButton
                label="Open last run"
                onPress={() =>
                  router.push({
                    pathname: '/runs/[runId]',
                    params: { runId: schedule.last_enqueued_for },
                  })
                }
                tone="ghost"
              />
            ) : null}
          </View>
        </SectionCard>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  note: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metaBlock: {
    marginTop: tokens.spacing.sm,
    gap: 4,
  },
  meta: {
    color: tokens.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
});
