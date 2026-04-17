import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
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

function renderInlineMarkdown(value: string): ReactNode[] {
  const segments = value.split(/(\*\*[^*]+\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return (
        <Text key={`bold-${index}`} style={styles.markdownBold}>
          {segment.slice(2, -2)}
        </Text>
      );
    }

    return <Text key={`text-${index}`}>{segment}</Text>;
  });
}

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return <Text style={styles.meta}>Nothing to preview yet.</Text>;
  }

  const lines = value.split('\n');

  return (
    <View style={styles.previewContainer}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <View key={`empty-${index}`} style={styles.markdownSpacer} />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <Text key={`h3-${index}`} style={styles.markdownHeading3}>
              {renderInlineMarkdown(trimmed.slice(4))}
            </Text>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <Text key={`h2-${index}`} style={styles.markdownHeading2}>
              {renderInlineMarkdown(trimmed.slice(3))}
            </Text>
          );
        }

        if (trimmed.startsWith('# ')) {
          return (
            <Text key={`h1-${index}`} style={styles.markdownHeading1}>
              {renderInlineMarkdown(trimmed.slice(2))}
            </Text>
          );
        }

        if (trimmed.startsWith('- ')) {
          return (
            <View key={`bullet-${index}`} style={styles.bulletRow}>
              <Text style={styles.bulletSymbol}>•</Text>
              <Text style={styles.markdownParagraph}>
                {renderInlineMarkdown(trimmed.slice(2))}
              </Text>
            </View>
          );
        }

        return (
          <Text key={`p-${index}`} style={styles.markdownParagraph}>
            {renderInlineMarkdown(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

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
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);

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

  const handleCopyBody = async () => {
    try {
      const content = body ?? '';

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
        Alert.alert('Copied', 'Content copied to clipboard.');
        return;
      }

      await Share.share({
        message: content,
      });

      Alert.alert(
        'Share opened',
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? 'Clipboard is unavailable in this environment. A share sheet was opened instead.'
          : 'Clipboard is unavailable in this environment.'
      );
    } catch {
      Alert.alert('Error', 'Could not copy content.');
    }
  };

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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Body</Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleCopyBody}
                style={styles.copyButton}>
                <Ionicons
                  name="copy-outline"
                  size={14}
                  color={tokens.colors.primary}
                />
                <Text style={styles.copyButtonLabel}>Copy</Text>
              </Pressable>
            </View>
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
            <Text style={styles.label}>Preview</Text>
            <MarkdownPreview value={body} />
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
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsMetaExpanded((previous) => !previous)}
            style={styles.accordionHeader}>
            <Text style={styles.metaAccordionTitle}>Meta details</Text>
            <Ionicons
              name={isMetaExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={16}
              color={tokens.colors.muted}
            />
          </Pressable>

          {isMetaExpanded ? (
            <View style={styles.accordionBody}>
              <Text style={styles.meta}>ID: {item.id}</Text>
              <Text style={styles.meta}>Author: {item.author || 'system'}</Text>
              <Text style={styles.meta}>Type: {item.content_type}</Text>
              <Text style={styles.meta}>Created: {item.created_at}</Text>
              <Text style={styles.meta}>Updated: {item.updated_at}</Text>
              <Text style={styles.meta}>
                Metadata items: {item.metadata?.length ?? 0}
              </Text>
            </View>
          ) : null}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  copyButtonLabel: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    gap: tokens.spacing.xs,
  },
  markdownHeading1: {
    color: tokens.colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  markdownHeading2: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  markdownHeading3: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  markdownParagraph: {
    color: tokens.colors.text,
    fontSize: 14,
    lineHeight: 22,
    flexShrink: 1,
  },
  markdownBold: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  markdownSpacer: {
    height: tokens.spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.xs,
  },
  bulletSymbol: {
    color: tokens.colors.text,
    lineHeight: 22,
    fontSize: 14,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.xs,
  },
  metaAccordionTitle: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  accordionBody: {
    gap: 2,
  },
  meta: {
    color: tokens.colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});
