import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/Button';
import { tokens } from '@/theme/tokens';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label="Try again" onPress={onRetry} tone="ghost" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.dangerSoft,
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: tokens.radius.md
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.danger
  },
  message: {
    color: tokens.colors.text,
    lineHeight: 20
  }
});
