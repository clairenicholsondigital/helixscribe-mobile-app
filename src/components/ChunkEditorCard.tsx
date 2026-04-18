import { useState } from 'react';
import { Alert, Platform, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/Button';
import { CodeBlock } from '@/components/CodeBlock';
import { InstructionsEditorField } from '@/components/InstructionsEditorField';
import { TagInput } from '@/components/TagInput';
import { deleteChunk, updateChunk } from '@/api/chunks';
import { formatDateTime, formatError, parseTagsInput, tagsToInput } from '@/lib/utils';
import { tokens } from '@/theme/tokens';
import type { Chunk } from '@/types/chunks';

type ChunkEditorCardProps = {
  chunk: Chunk;
  onSaved: () => void;
  onDeleted: () => void;
};

export function ChunkEditorCard({ chunk, onSaved, onDeleted }: ChunkEditorCardProps) {
  const [title, setTitle] = useState(chunk.title ?? '');
  const [chunkText, setChunkText] = useState(chunk.chunk_text);
  const [tagsText, setTagsText] = useState(tagsToInput(chunk.tags));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateChunk(chunk.id, {
        title: title.trim() ? title.trim() : null,
        chunk_text: chunkText.trim(),
        tags: parseTagsInput(tagsText)
      });
      Alert.alert('Saved', `Chunk ${chunk.id} was updated.`);
      onSaved();
    } catch (error) {
      Alert.alert('Save failed', formatError(error));
    } finally {
      setSaving(false);
    }
  }


  async function handleCopyChunkText() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(chunkText);
        Alert.alert('Copied', 'Chunk text copied to clipboard.');
        return;
      }

      await Share.share({ message: chunkText });
      Alert.alert(
        'Share opened',
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? 'Clipboard is unavailable in this environment. A share sheet was opened instead.'
          : 'Clipboard is unavailable in this environment.'
      );
    } catch {
      Alert.alert('Error', 'Could not copy chunk text.');
    }
  }
  function handleDeleteConfirm() {
    Alert.alert('Delete chunk?', `Delete ${chunk.id}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: handleDelete
      }
    ]);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteChunk(chunk.id);
      Alert.alert('Deleted', `Chunk ${chunk.id} was deleted.`);
      onDeleted();
    } catch (error) {
      Alert.alert('Delete failed', formatError(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <Text style={styles.idText}>Chunk {chunk.id}</Text>
        <Text style={styles.metaText}>Updated {formatDateTime(chunk.updated_at)}</Text>
      </View>

      <Text style={styles.metaText}>Item ID: {chunk.item_id}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          onChangeText={setTitle}
          placeholder="Optional title"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          value={title}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Tags</Text>
        <TagInput onChangeText={setTagsText} value={tagsText} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Chunk text</Text>
        <InstructionsEditorField
          value={chunkText}
          onChange={setChunkText}
          onCopy={handleCopyChunkText}
          fieldLabel="Chunk text"
          placeholder="Chunk text"
          previewEmptyText="No chunk text yet."
          helperText="Open full editor for easier chunk text editing."
          modalTitle="Edit chunk text"
          modalDescription="Use the full editor to read and edit long chunk text comfortably."
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Metadata</Text>
        <CodeBlock value={JSON.stringify(chunk.metadata ?? {}, null, 2)} />
      </View>

      <View style={styles.actionRow}>
        <AppButton
          disabled={saving || deleting}
          label={saving ? 'Saving…' : 'Save changes'}
          onPress={handleSave}
        />
        <AppButton
          disabled={saving || deleting}
          label={deleting ? 'Deleting…' : 'Delete'}
          onPress={handleDeleteConfirm}
          tone="danger"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm
  },
  metaRow: {
    gap: tokens.spacing.xs
  },
  idText: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  metaText: {
    color: tokens.colors.muted,
    fontSize: 13
  },
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  }
});
