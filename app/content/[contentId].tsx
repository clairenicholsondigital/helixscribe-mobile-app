import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { AppButton } from '@/components/Button';

import {
  getContentItem,
  updateContentItem,
  type ContentItem,
} from '@/api/content';

import { tokens } from '@/theme/tokens';

export default function ContentDetailScreen() {
  const params = useLocalSearchParams<{ contentId?: string | string[] }>();
  const queryClient = useQueryClient();

  const contentId = useMemo(() => {
    const raw = params.contentId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.contentId]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-item', contentId],
    queryFn: () => getContentItem(contentId as string),
    enabled: typeof contentId === 'string' && contentId.trim().length > 0,
  });

  const item = data?.item;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<ContentItem['status']>('draft');

  useEffect(() => {
    if (!item) return;

    setTitle(item.title ?? '');
    setSummary(item.summary ?? '');
    setBody(item.body ?? '');
    setStatus(item.status);
  }, [item]);

  const mutation = useMutation({
    mutationFn: () =>
      updateContentItem(contentId as string, {
        title,
        summary,
        body,
        status,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['content-items'] });
      await queryClient.invalidateQueries({ queryKey: ['content-item', contentId] });

      Alert.alert('Saved', 'Content updated successfully.');
    },
    onError: (err: unknown) => {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save content'
      );
    },
  });

  if (!contentId || !contentId.trim()) {
    return (
      <Screen title="Content not found" subtitle="No content ID was provided in the route.">
        <Text style={styles.meta}>
          Open this screen from the content list so a valid content ID is passed in.
        </Text>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen title="Loading content">
        <LoadingState label="Loading content item" />
      </Screen>
    );
  }

  if (error || !item) {
    return (
      <Screen title="Content not found">
        <ErrorState
          title="Could not load content"
          message={
            error instanceof Error
              ? error.message
              : 'Content item not found'
          }
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={item.title || 'Untitled'}
      subtitle={`${item.content_type} · ${item.status}`}>
      <Stack.Screen options={{ title: item.title || 'Content' }} />

      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard title="Details">
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Enter title"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Summary</Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="Enter summary"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Body</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              style={[styles.input, styles.largeTextArea]}
              multiline
              placeholder="Enter content body"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <TextInput
              value={status}
              onChangeText={(text) =>
                setStatus(text as ContentItem['status'])
              }
              style={styles.input}
              placeholder="draft | ready | published | archived"
              autoCapitalize="none"
            />
          </View>

          <AppButton
            label={mutation.isPending ? 'Saving...' : 'Save changes'}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          />
        </SectionCard>

        <SectionCard title="Meta">
          <Text style={styles.meta}>ID: {item.id}</Text>
          <Text style={styles.meta}>Author: {item.author || 'system'}</Text>
          <Text style={styles.meta}>Type: {item.content_type}</Text>
          <Text style={styles.meta}>Created: {item.created_at}</Text>
          <Text style={styles.meta}>Updated: {item.updated_at}</Text>
          <Text style={styles.meta}>
            Metadata items: {item.metadata?.length ?? 0}
          </Text>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  field: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.sm,
    color: tokens.colors.text,
    backgroundColor: tokens.colors.card,
  },
  textArea: {
    minHeight: 80,
  },
  largeTextArea: {
    minHeight: 160,
  },
  meta: {
    color: tokens.colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});