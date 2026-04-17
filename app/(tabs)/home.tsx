import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { cardShadow, tokens } from '@/theme/tokens';

type HomeTile = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof FontAwesome.glyphMap;
  href: '/content' | '/my-schedule';
};

const HOME_TILES: HomeTile[] = [
  {
    key: 'content',
    title: 'Content',
    subtitle: 'Browse placeholder content and open the detail screen.',
    icon: 'th-large',
    href: '/content'
  },
  {
    key: 'schedule',
    title: 'My Schedule',
    subtitle: 'See your planned sessions and upcoming items.',
    icon: 'calendar',
    href: '/my-schedule'
  }
];

export default function HomeScreen() {
  return (
    <Screen
      title="Home"
      subtitle="Start from here, then jump into Content or your schedule.">
      <View style={styles.grid}>
        {HOME_TILES.map((tile) => (
          <Pressable
            key={tile.key}
            accessibilityRole="button"
            onPress={() => router.push(tile.href)}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
            <View style={styles.iconWrap}>
              <FontAwesome name={tile.icon} size={20} color={tokens.colors.primary} />
            </View>
            <Text style={styles.title}>{tile.title}</Text>
            <Text style={styles.subtitle}>{tile.subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: tokens.spacing.md
  },
  tile: {
    backgroundColor: tokens.colors.card,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    ...cardShadow
  },
  tilePressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }]
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primarySoft
  },
  title: {
    color: tokens.colors.text,
    fontSize: 19,
    fontWeight: '700'
  },
  subtitle: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});
