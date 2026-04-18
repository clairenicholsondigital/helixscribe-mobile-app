import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from 'react-native';

import { AppButton } from '@/components/Button';
import { tokens } from '@/theme/tokens';

type ExpandableTextInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  fieldLabel: string;
  placeholder?: string;
  helperText?: string;
  modalTitle?: string;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>;
};

export function ExpandableTextInput({
  value,
  onChangeText,
  fieldLabel,
  placeholder,
  helperText,
  modalTitle,
  inputProps
}: ExpandableTextInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (!isExpanded) {
      setDraftValue(value);
    }
  }, [isExpanded, value]);

  function openExpandedEditor() {
    setDraftValue(value);
    setIsExpanded(true);
  }

  function handleCancel() {
    setDraftValue(value);
    setIsExpanded(false);
  }

  function handleSave() {
    onChangeText(draftValue);
    setIsExpanded(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        {...inputProps}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.muted}
        style={[styles.input, inputProps?.style]}
        value={value}
      />

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <View style={styles.actionsRow}>
        <AppButton label="Edit full screen" onPress={openExpandedEditor} tone="ghost" size="small" />
      </View>

      <Modal
        animationType="slide"
        onRequestClose={handleCancel}
        presentationStyle="fullScreen"
        transparent={false}
        visible={isExpanded}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', default: undefined })}
          style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle ?? `Edit ${fieldLabel}`}</Text>
            <Text style={styles.modalDescription}>Use full screen to edit longer text more comfortably.</Text>
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>{fieldLabel}</Text>
            <TextInput
              autoFocus
              multiline
              onChangeText={setDraftValue}
              placeholder={placeholder}
              placeholderTextColor={tokens.colors.muted}
              scrollEnabled
              style={styles.modalInput}
              textAlignVertical="top"
              value={draftValue}
            />
          </View>

          <View style={styles.modalActions}>
            <View style={styles.modalActionItem}>
              <AppButton label="Cancel" onPress={handleCancel} tone="ghost" />
            </View>
            <View style={styles.modalActionItem}>
              <AppButton label="Save" onPress={handleSave} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    color: tokens.colors.text,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm
  },
  helperText: {
    color: tokens.colors.muted,
    fontSize: 12
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    paddingTop: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    gap: tokens.spacing.md
  },
  modalHeader: {
    gap: tokens.spacing.xs
  },
  modalTitle: {
    color: tokens.colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  modalDescription: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  modalField: {
    flex: 1,
    gap: tokens.spacing.xs
  },
  modalLabel: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  modalInput: {
    flex: 1,
    minHeight: 280,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    color: tokens.colors.text,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    fontSize: 15,
    lineHeight: 22
  },
  modalActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm
  },
  modalActionItem: {
    flex: 1
  }
});
