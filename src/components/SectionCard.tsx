import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, tokens } from '@/theme/tokens';

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.content}>{children}</View>
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
    gap: tokens.spacing.sm,
    ...cardShadow
  },
  title: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  description: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  content: {
    gap: tokens.spacing.sm
  }
});
