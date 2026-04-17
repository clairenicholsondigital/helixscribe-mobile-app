import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme/tokens';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.card,
    gap: tokens.spacing.xs
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text
  },
  description: {
    color: tokens.colors.muted,
    lineHeight: 20
  }
});
