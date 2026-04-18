import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/Button';
import { CodeBlock } from '@/components/CodeBlock';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { TagInput } from '@/components/TagInput';
import { createChunk } from '@/api/chunks';
import { createInboxUntriagedChunk } from '@/api/inbox';
import { useBuckets } from '@/hooks/useBuckets';
import { queryKeys } from '@/lib/queryKeys';
import { buildMobileItemId, formatError, parseTagsInput } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

export function InboxScreen() {
  const queryClient = useQueryClient();
  const bucketsQuery = useBuckets();

  const [title, setTitle] = useState('');
  const [chunkText, setChunkText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [targetBucket, setTargetBucket] = useState('inbox_untriaged');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<unknown>(null);

  async function handleSubmit() {
    if (!title.trim() || !chunkText.trim()) {
      Alert.alert('Missing fields', 'Add both a title and the note text before submitting.');
      return;
    }

    const tags = parseTagsInput(tagsText);

    setSubmitting(true);
    try {
      let response: unknown;
      if (targetBucket === 'inbox_untriaged') {
        response = await createInboxUntriagedChunk({
          title: title.trim(),
          chunk_text: chunkText.trim(),
          tags,
          metadata: {
            created_via: 'helixscribe_mobile_expo'
          }
        });
      } else {
        response = await createChunk({
          bucket_name: targetBucket,
          item_id: buildMobileItemId(targetBucket),
          title: title.trim(),
          chunk_text: chunkText.trim(),
          chunk_index: 0,
          tags,
          metadata: {
            created_via: 'helixscribe_mobile_expo'
          }
        });

        await queryClient.invalidateQueries({ queryKey: queryKeys.chunks(targetBucket) });
      }

      setLastResult(response);
      setTitle('');
      setChunkText('');
      setTagsText('');
      Alert.alert('Saved', `Your note was submitted to ${targetBucket}.`);
    } catch (error) {
      Alert.alert('Submit failed', formatError(error));
    } finally {
      setSubmitting(false);
    }
  }

  const bucketItems = bucketsQuery.data?.items ?? [];

  return (
    <Screen>
      <SectionCard title="Submit a note">
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Quick note title"
            placeholderTextColor={tokens.colors.muted}
            style={styles.input}
            value={title}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Details</Text>
          <TextInput
            multiline
            numberOfLines={8}
            onChangeText={setChunkText}
            placeholder="Type the note or captured text here"
            placeholderTextColor={tokens.colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={chunkText}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tags</Text>
          <TagInput onChangeText={setTagsText} value={tagsText} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Target bucket</Text>
          <View style={styles.pickerShell}>
            {bucketsQuery.isLoading ? (
              <LoadingState label="Loading buckets…" />
            ) : (
              <Picker
                onValueChange={(value) => setTargetBucket(String(value))}
                selectedValue={targetBucket}>
                <Picker.Item label="inbox_untriaged (default)" value="inbox_untriaged" />
                {bucketItems
                  .filter((bucket) => bucket.bucket_name !== 'inbox_untriaged')
                  .map((bucket) => (
                    <Picker.Item
                      key={bucket.bucket_id}
                      label={bucket.bucket_name}
                      value={bucket.bucket_name}
                    />
                  ))}
              </Picker>
            )}
          </View>
          {bucketsQuery.isError ? (
            <ErrorState
              message={formatError(bucketsQuery.error)}
              onRetry={() => bucketsQuery.refetch()}
            />
          ) : null}
        </View>

        <AppButton
          disabled={submitting}
          label={submitting ? 'Submitting…' : `Submit to ${targetBucket}`}
          onPress={handleSubmit}
        />
      </SectionCard>

      {lastResult ? (
        <SectionCard title="Last API response">
          <CodeBlock value={JSON.stringify(lastResult, null, 2)} />
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: tokens.spacing.xs
  },
  label: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  input: {
    backgroundColor: tokens.colors.inputBackground,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    fontSize: 15
  },
  textArea: {
    minHeight: 180
  },
  pickerShell: {
    borderRadius: tokens.radius.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: tokens.colors.card
  }
});
