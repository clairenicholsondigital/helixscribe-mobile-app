import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { getWorkflowV2Schedules, type WorkflowV2ScheduleItem } from '@/api/workflowV2Schedules';
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
      ? `One-off, ${formatDateTime(item.run_once_at)}`
      : 'One-off';
  }

  if (item.schedule_type === 'interval') {
    return item.interval_seconds
      ? `Every ${item.interval_seconds} seconds`
      : 'Interval';
  }

  if (item.schedule_type === 'cron') {
    return item.cron_expression
      ? `Cron, ${item.cron_expression}`
      : 'Cron';
  }

  return item.schedule_type;
}

function buildNote(item: WorkflowV2ScheduleItem) {
  const parts: string[] = [];

  parts.push(`Status: ${item.is_enabled ? 'Enabled' : 'Disabled'}`);
  parts.push(`Timezone: ${item.timezone_name || 'UTC'}`);
  parts.push(`Next run: ${formatDateTime(item.next_run_at)}`);
  parts.push(`Last run: ${formatDateTime(item.last_run_at)}`);

  return parts.join('\n');
}

export default function MyScheduleScreen() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['workflow-v2-schedules', { enabled_only: true }],
    queryFn: () => getWorkflowV2Schedules({ enabled_only: true, limit: 50 }),
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <Screen
        title="My Schedule"
        subtitle="Loading scheduled workflow items.">
        <LoadingState label="Loading schedules" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        title="My Schedule"
        subtitle="There was a problem loading scheduled workflow items.">
        <ErrorState
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="My Schedule"
      subtitle={`Showing ${items.length} enabled Workflow V2 schedule${items.length === 1 ? '' : 's'}.`}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }>
        <View style={styles.list}>
          {items.length === 0 ? (
            <SectionCard title="No schedules found">
              <Text style={styles.note}>
                There are currently no enabled Workflow V2 schedules.
              </Text>
            </SectionCard>
          ) : (
            items.map((item) => (
              <SectionCard
                key={item.id}
                title={`${formatScheduleLabel(item)} · ${item.workflow_title || 'Untitled workflow'}`}>
                <Text style={styles.note}>{buildNote(item)}</Text>

                <View style={styles.metaBlock}>
                  <Text style={styles.meta}>Workflow ID: {item.workflow_id}</Text>
                  <Text style={styles.meta}>Schedule ID: {item.id}</Text>
                  <Text style={styles.meta}>Updated: {formatDateTime(item.updated_at)}</Text>
                </View>

                <View style={styles.actionRow}>
                  <AppButton
                    label="View schedule"
                    onPress={() =>
                      router.push({
                        pathname: '/schedules/[scheduleId]',
                        params: { scheduleId: item.id },
                      })
                    }
                  />
                  <AppButton
                    label="Open workflow"
                    onPress={() =>
                      router.push({
                        pathname: '/workflows/[workflowId]',
                        params: { workflowId: item.workflow_id },
                      })
                    }
                    tone="ghost"
                  />
                </View>
              </SectionCard>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: tokens.spacing.xl,
  },
  list: {
    gap: tokens.spacing.md,
  },
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
