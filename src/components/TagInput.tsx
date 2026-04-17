import { StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/theme/tokens';

type TagInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function TagInput({
  value,
  onChangeText,
  placeholder = 'capture, mobile, idea'
}: TagInputProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.muted}
        style={styles.input}
        value={value}
      />
      <Text style={styles.hint}>Comma-separated tags</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing.xs
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
  hint: {
    color: tokens.colors.muted,
    fontSize: 12
  }
});
