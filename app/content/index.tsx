import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { contentItems } from '@/constants/contentItems';
import { cardShadow, tokens } from '@/theme/tokens';

export default function ContentScreen() {
  return (
    <Screen
      title="Content"
      subtitle="Placeholder content items. Tap any card to open details.">
      <View style={styles.list}>
        {contentItems.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => router.push(`/content/${item.id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{`${item.category} · ${item.duration}`}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: tokens.spacing.md
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.xs,
    ...cardShadow
  },
  pressed: {
    opacity: 0.95
  },
  title: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  meta: {
    color: tokens.colors.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  summary: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});
