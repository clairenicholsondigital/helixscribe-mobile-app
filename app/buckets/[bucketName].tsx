import { Tabs, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text } from 'react-native';

import { ChunkEditorCard } from '@/components/ChunkEditorCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useBucketChunks } from '@/hooks/useBucketChunks';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatError } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export default function BucketChunksScreen() {
  const params = useLocalSearchParams<{ bucketName: string }>();
  const bucketName = decodeRouteParam(params.bucketName);
  const queryClient = useQueryClient();
  const chunksQuery = useBucketChunks(bucketName);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.chunks(bucketName) });
  }

  return (
    <>
      <Tabs.Screen options={{ title: bucketName || 'Bucket' }} />
      <Screen
        title={bucketName}
        subtitle="This mirrors the current bucket chunk page and keeps editing intentionally simple on mobile.">
        {chunksQuery.isLoading ? <LoadingState label="Loading chunks…" /> : null}

        {chunksQuery.isError ? (
          <ErrorState message={formatError(chunksQuery.error)} onRetry={() => chunksQuery.refetch()} />
        ) : null}

        {!chunksQuery.isLoading && !chunksQuery.isError && !chunksQuery.data?.chunks.length ? (
          <EmptyState
            title="No chunks found"
            description="This bucket is empty, or the API returned no chunk records for it."
          />
        ) : null}

        {chunksQuery.data?.chunks.map((chunk) => (
          <ChunkEditorCard
            chunk={chunk}
            key={chunk.id}
            onDeleted={refresh}
            onSaved={refresh}
          />
        ))}

        <Text style={styles.footerText}>
          Showing {(chunksQuery.data?.chunks ?? []).length} chunk(s).
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  footerText: {
    color: tokens.colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg
  }
});
