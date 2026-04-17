import { Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { ChunkEditorCard } from '@/components/ChunkEditorCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useBucketChunks } from '@/hooks/useBucketChunks';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatError } from '@/lib/utils';

export default function ChunkDetailScreen() {
  const params = useLocalSearchParams<{ chunkId: string; bucketName?: string }>();
  const chunkId = decodeRouteParam(params.chunkId);
  const bucketName = decodeRouteParam(params.bucketName);
  const queryClient = useQueryClient();

  const chunksQuery = useBucketChunks(bucketName);
  const chunk = chunksQuery.data?.chunks.find((item) => item.id === chunkId);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.chunks(bucketName) });
  }

  return (
    <>
      <Stack.Screen options={{ title: chunk?.title || 'Chunk detail' }} />
      <Screen>
        {!bucketName ? (
          <ErrorState message="Missing bucket name in route. Open this page from a bucket chunk list." />
        ) : null}

        {bucketName && chunksQuery.isLoading ? <LoadingState label="Loading chunk…" /> : null}

        {bucketName && chunksQuery.isError ? (
          <ErrorState message={formatError(chunksQuery.error)} onRetry={() => chunksQuery.refetch()} />
        ) : null}

        {bucketName && !chunksQuery.isLoading && !chunksQuery.isError && !chunk ? (
          <EmptyState
            title="Chunk not found"
            description="The selected chunk was not found in this bucket. Try reopening it from the bucket list."
          />
        ) : null}

        {bucketName && chunk ? <ChunkEditorCard chunk={chunk} onDeleted={refresh} onSaved={refresh} /> : null}
      </Screen>
    </>
  );
}
