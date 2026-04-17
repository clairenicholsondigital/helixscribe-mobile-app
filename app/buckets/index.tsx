import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill } from '@/components/StatusPill';
import { useBuckets } from '@/hooks/useBuckets';
import { formatDateTime, formatError } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export default function BucketsScreen() {
  const bucketsQuery = useBuckets();

  return (
    <Screen
      title="Knowledge buckets"
      subtitle="Open a bucket to view and edit the chunks that already live inside it.">
      {bucketsQuery.isLoading ? <LoadingState label="Loading buckets…" /> : null}

      {bucketsQuery.isError ? (
        <ErrorState message={formatError(bucketsQuery.error)} onRetry={() => bucketsQuery.refetch()} />
      ) : null}

      {!bucketsQuery.isLoading && !bucketsQuery.isError && !bucketsQuery.data?.items.length ? (
        <EmptyState
          title="No buckets found"
          description="The API returned an empty list, so there is nothing to open yet."
        />
      ) : null}

      {(bucketsQuery.data?.items ?? []).map((bucket) => (
        <Pressable
          key={bucket.bucket_id}
          onPress={() =>
            router.push({
              pathname: '/buckets/[bucketName]',
              params: { bucketName: bucket.bucket_name }
            })
          }
          style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
          <SectionCard
            title={bucket.bucket_name}
            description={bucket.summary || 'No summary on this bucket yet.'}>
            <View style={styles.pillRow}>
              <StatusPill label={`${bucket.item_count ?? 0} items`} />
              <StatusPill label={`${bucket.chunk_count ?? 0} chunks`} tone="primary" />
              <StatusPill label={`${bucket.topic_count ?? 0} topics`} tone="success" />
            </View>
            <Text style={styles.metaText}>Updated {formatDateTime(bucket.updated_at)}</Text>
          </SectionCard>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    borderRadius: tokens.radius.lg
  },
  pressed: {
    opacity: 0.92
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  metaText: {
    color: tokens.colors.muted,
    fontSize: 13
  }
});
