import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/Button';
import { InstructionsEditorField } from '@/components/InstructionsEditorField';
import { formatError, parseJsonObject } from '@/lib/utils';
import { tokens } from '@/theme/tokens';
import type { WorkflowStepDraft } from '@/types/workflowsV2';

type StepEditorProps = {
  index: number;
  step: WorkflowStepDraft;
  onChange: (step: WorkflowStepDraft) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function StepEditor({
  index,
  step,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: StepEditorProps) {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  let configError: string | null = null;
  try {
    parseJsonObject(step.configText, `Step ${index + 1} config`);
  } catch (error) {
    configError = formatError(error);
  }

  async function handleCopyInstructions() {
    const instructions = step.instructions ?? '';

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(instructions);
        Alert.alert('Copied', 'Instructions copied to clipboard.');
        return;
      }

      await Share.share({ message: instructions });
      Alert.alert(
        'Share opened',
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? 'Clipboard is unavailable in this environment. A share sheet was opened instead.'
          : 'Clipboard is unavailable in this environment.'
      );
    } catch {
      Alert.alert('Error', 'Could not copy instructions.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Step {index + 1}</Text>
        <View style={styles.actionRow}>
          {onMoveUp ? <AppButton label="Up" onPress={onMoveUp} size="small" tone="ghost" /> : null}
          {onMoveDown ? <AppButton label="Down" onPress={onMoveDown} size="small" tone="ghost" /> : null}
          <AppButton label="Remove" onPress={onDelete} size="small" tone="danger" />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Step type</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => onChange({ ...step, step_type: value })}
          placeholder="prompt"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          value={step.step_type}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          onChangeText={(value) => onChange({ ...step, title: value })}
          placeholder="Prompt step"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          value={step.title}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Input mode</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => onChange({ ...step, input_mode: value })}
          placeholder="previous_output"
          placeholderTextColor={tokens.colors.muted}
          style={styles.input}
          value={step.input_mode}
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Instructions</Text>
        </View>
        <InstructionsEditorField
          value={step.instructions ?? ''}
          onChange={(value) => onChange({ ...step, instructions: value })}
          onCopy={handleCopyInstructions}
        />
      </View>

      <View style={styles.field}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsConfigExpanded((value) => !value)}
          style={styles.accordionHeader}>
          <Text style={styles.label}>Config JSON</Text>
          <Ionicons
            name={isConfigExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={tokens.colors.muted}
          />
        </Pressable>

        {isConfigExpanded ? (
          <View style={styles.accordionBody}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={8}
              onChangeText={(value) => onChange({ ...step, configText: value })}
              placeholder='{"bucket_name":"notes","top_k":5}'
              placeholderTextColor={tokens.colors.muted}
              style={[styles.input, styles.codeArea]}
              textAlignVertical="top"
              value={step.configText}
            />
            <Text style={[styles.help, configError ? styles.errorText : null]}>
              {configError ?? 'Config must be a JSON object.'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.background,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm
  },
  header: {
    gap: tokens.spacing.sm
  },
  title: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  field: {
    gap: tokens.spacing.xs
  },
  label: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
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
  codeArea: {
    minHeight: 160,
    fontFamily: 'Courier'
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40
  },
  accordionBody: {
    gap: tokens.spacing.xs
  },
  help: {
    color: tokens.colors.muted,
    fontSize: 12
  },
  errorText: {
    color: tokens.colors.danger
  }
});
