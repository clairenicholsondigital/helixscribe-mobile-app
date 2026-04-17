import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/Button';
import {
  makeSchedulePresetText,
  schedulePresetOptions
} from '@/constants/workflowScheduleDefaults';
import { formatError, parseJsonObject } from '@/lib/utils';
import { tokens } from '@/theme/tokens';

type ScheduleEditorProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function ScheduleEditor({ value, onChangeText }: ScheduleEditorProps) {
  let validationMessage = 'Schedule config must be a JSON object.';
  let hasError = false;

  try {
    parseJsonObject(value, 'Schedule config');
    validationMessage = 'Saved exactly as raw JSON, matching the API shape.';
  } catch (error) {
    hasError = true;
    validationMessage = formatError(error);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.presetRow}>
        {schedulePresetOptions.map((option) => (
          <AppButton
            key={option.key}
            label={option.label}
            onPress={() => onChangeText(makeSchedulePresetText(option.key))}
            tone="ghost"
          />
        ))}
      </View>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        numberOfLines={10}
        onChangeText={onChangeText}
        placeholder='{"type":"disabled","enabled":false}'
        placeholderTextColor={tokens.colors.muted}
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />

      <Text style={[styles.help, hasError ? styles.errorText : null]}>{validationMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.sm
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm
  },
  input: {
    minHeight: 180,
    backgroundColor: tokens.colors.inputBackground,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    fontFamily: 'Courier',
    fontSize: 14
  },
  help: {
    color: tokens.colors.muted,
    fontSize: 12
  },
  errorText: {
    color: tokens.colors.danger
  }
});
