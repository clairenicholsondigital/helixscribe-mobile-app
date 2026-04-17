import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { getContentItems, type ContentItem } from '@/api/content';
import { cardShadow, tokens } from '@/theme/tokens';

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Unknown update';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown update';

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildSummary(item: ContentItem) {
  const raw = item.summary?.trim() || item.body?.trim() || 'No summary available.';
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}

export default function ContentScreen() {
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['content-items'],
    queryFn: () => getContentItems({ limit: 50 }),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  if (isLoading) {
    return (
      <Screen
        title="Content"
        subtitle="Loading content items from HelixScribe.">
        <LoadingState label="Loading content" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        title="Content"
        subtitle="There was a problem loading your content items.">
        <ErrorState
          title="Could not load content"
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Content"
      subtitle={`Showing ${items.length} content item${items.length === 1 ? '' : 's'} from the API.`}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }>
        <View style={styles.list}>
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No content items found</Text>
              <Text style={styles.emptyText}>
                The API returned no content for the current request.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/content/[contentId]',
                    params: { contentId: item.id },
                  })
                }
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={styles.headerRow}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title?.trim() || 'Untitled content'}
                  </Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.content_type}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>
                    {formatDateTime(item.updated_at)}
                  </Text>
                </View>

                {!!item.author && item.author.toLowerCase() !== 'system' && (
                  <Text style={styles.author}>By {item.author}</Text>
                )}

                <Text style={styles.summary}>{buildSummary(item)}</Text>

                <Text style={styles.idText}>ID: {item.id}</Text>
              </Pressable>
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
  card: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    ...cardShadow,
  },
  pressed: {
    opacity: 0.96,
  },
  headerRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: tokens.colors.background,
  },
  statusText: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: tokens.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  metaDot: {
    color: tokens.colors.muted,
    fontSize: 13,
  },
  author: {
    color: tokens.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  summary: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  idText: {
    color: tokens.colors.muted,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
    ...cardShadow,
  },
  emptyTitle: {
    color: tokens.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});