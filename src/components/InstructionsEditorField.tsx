import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';

import { AppButton } from '@/components/Button';
import { tokens } from '@/theme/tokens';

type InstructionsEditorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  fieldLabel?: string;
  placeholder?: string;
  previewEmptyText?: string;
  helperText?: string;
  modalTitle?: string;
  modalDescription?: string;
  editButtonLabel?: string;
};

export function InstructionsEditorField({
  value,
  onChange,
  onCopy,
  fieldLabel = 'Instructions',
  placeholder = 'What should this step do?',
  previewEmptyText = 'No instructions yet.',
  helperText = 'Open full editor for easier editing.',
  modalTitle = 'Edit instructions',
  modalDescription = 'Use the full editor to review and edit long prompts comfortably.',
  editButtonLabel = 'Edit full screen'
}: InstructionsEditorFieldProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
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
    onChange(draftValue);
    setIsExpanded(false);
  }

  if (!isMobile) {
    return (
      <View style={styles.desktopContainer}>
        <TextInput
          multiline
          numberOfLines={8}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.muted}
          style={[styles.input, styles.desktopTextArea]}
          textAlignVertical="top"
          value={value}
        />
        <View style={styles.desktopActionsRow}>
          <AppButton label={editButtonLabel} onPress={openExpandedEditor} tone="ghost" size="small" />
        </View>

        <InstructionsEditorModal
          draftValue={draftValue}
          fieldLabel={fieldLabel}
          isVisible={isExpanded}
          modalDescription={modalDescription}
          modalTitle={modalTitle}
          onCancel={handleCancel}
          onCopy={onCopy}
          onDraftChange={setDraftValue}
          onSave={handleSave}
          placeholder={placeholder}
        />
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      <View style={styles.previewBox}>
        <Text
          numberOfLines={5}
          ellipsizeMode="tail"
          style={[styles.previewText, !value ? styles.placeholderText : null]}>
          {value || previewEmptyText}
        </Text>
      </View>

      <Text style={styles.helpText}>{helperText}</Text>

      <View style={styles.mobileActionsRow}>
        <Pressable accessibilityRole="button" onPress={onCopy} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={14} color={tokens.colors.primary} />
          <Text style={styles.iconButtonLabel}>Copy</Text>
        </Pressable>

        <AppButton label={editButtonLabel} onPress={openExpandedEditor} tone="ghost" />
      </View>

      <InstructionsEditorModal
        draftValue={draftValue}
        fieldLabel={fieldLabel}
        isVisible={isExpanded}
        modalDescription={modalDescription}
        modalTitle={modalTitle}
        onCancel={handleCancel}
        onCopy={onCopy}
        onDraftChange={setDraftValue}
        onSave={handleSave}
        placeholder={placeholder}
      />
    </View>
  );
}

type InstructionsEditorModalProps = {
  isVisible: boolean;
  draftValue: string;
  fieldLabel: string;
  placeholder: string;
  modalTitle: string;
  modalDescription: string;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onCopy: () => void;
};

function InstructionsEditorModal({
  isVisible,
  draftValue,
  fieldLabel,
  placeholder,
  modalTitle,
  modalDescription,
  onDraftChange,
  onCancel,
  onSave,
  onCopy
}: InstructionsEditorModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      presentationStyle="fullScreen"
      transparent={false}
      visible={isVisible}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalDescription}>{modalDescription}</Text>
        </View>

        <View style={styles.modalField}>
          <View style={styles.modalLabelRow}>
            <Text style={styles.modalLabel}>{fieldLabel}</Text>
            <Pressable accessibilityRole="button" onPress={onCopy} style={styles.iconButton}>
              <Ionicons name="copy-outline" size={14} color={tokens.colors.primary} />
              <Text style={styles.iconButtonLabel}>Copy</Text>
            </Pressable>
          </View>

          <TextInput
            autoFocus
            multiline
            onChangeText={onDraftChange}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.muted}
            scrollEnabled
            style={[styles.input, styles.fullscreenTextArea]}
            textAlignVertical="top"
            value={draftValue}
          />
        </View>

        <View style={styles.modalActions}>
          <View style={styles.modalActionItem}>
            <AppButton label="Cancel" onPress={onCancel} tone="ghost" />
          </View>
          <View style={styles.modalActionItem}>
            <AppButton label="Save" onPress={onSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    gap: tokens.spacing.sm
  },
  desktopContainer: {
    gap: tokens.spacing.sm
  },
  input: {
    backgroundColor: tokens.colors.inputBackground,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  previewBox: {
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    minHeight: 116,
    justifyContent: 'center'
  },
  previewText: {
    color: tokens.colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  placeholderText: {
    color: tokens.colors.muted
  },
  helpText: {
    color: tokens.colors.muted,
    fontSize: 12
  },
  mobileActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacing.sm
  },
  desktopActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  desktopTextArea: {
    minHeight: 168
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background
  },
  iconButtonLabel: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '600'
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
  modalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalLabel: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  fullscreenTextArea: {
    flex: 1,
    minHeight: 280,
    paddingTop: tokens.spacing.md
  },
  modalActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm
  },
  modalActionItem: {
    flex: 1
  }
});
