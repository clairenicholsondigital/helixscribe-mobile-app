import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme/tokens';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={tokens.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm
  },
  label: {
    color: tokens.colors.muted,
    fontSize: 14
  }
});
