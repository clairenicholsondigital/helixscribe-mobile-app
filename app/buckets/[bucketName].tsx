import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusPill } from '@/components/StatusPill';
import { useBucketChunks } from '@/hooks/useBucketChunks';
import { queryKeys } from '@/lib/queryKeys';
import { decodeRouteParam, formatError, truncateText } from '@/lib/utils';
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
        subtitle="Showing a lightweight chunk list. Open any chunk for full metadata and editing.">
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
          <Pressable
            key={chunk.id}
            onPress={() =>
              router.push({
                pathname: '/chunks/[chunkId]',
                params: { chunkId: chunk.id, bucketName }
              })
            }
            style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
            <SectionCard title={chunk.title || 'Untitled chunk'}>
              {chunk.tags?.length ? (
                <View style={styles.tagRow}>
                  {chunk.tags.map((tag) => (
                    <StatusPill key={`${chunk.id}-${tag}`} label={tag} tone="primary" />
                  ))}
                </View>
              ) : (
                <Text style={styles.mutedText}>No tags</Text>
              )}
              <Text style={styles.chunkPreview}>{truncateText(chunk.chunk_text, 220)}</Text>
            </SectionCard>
          </Pressable>
        ))}

        <Text style={styles.footerText}>Showing {(chunksQuery.data?.chunks ?? []).length} chunk(s).</Text>

        <Pressable onPress={refresh} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
          <Text style={styles.refreshText}>Refresh list</Text>
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    borderRadius: tokens.radius.lg
  },
  pressed: {
    opacity: 0.92
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  mutedText: {
    color: tokens.colors.muted,
    fontSize: 13
  },
  chunkPreview: {
    color: tokens.colors.text,
    lineHeight: 21
  },
  footerText: {
    color: tokens.colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: tokens.spacing.sm
  },
  refreshButton: {
    alignSelf: 'center',
    marginBottom: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md
  },
  refreshText: {
    color: tokens.colors.primary,
    fontWeight: '600'
  }
});
