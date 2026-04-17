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
  href:
    | '/content'
    | '/my-schedule'
    | '/(tabs)/inbox'
    | '/(tabs)/workflows'
    | '/(tabs)/run-ai'
    | '/buckets';
};

const HOME_TILES: HomeTile[] = [
  {
    key: 'inbox',
    title: 'Inbox',
    subtitle: 'Review recently generated items and outputs.',
    icon: 'inbox',
    href: '/(tabs)/inbox'
  },
  {
    key: 'workflows',
    title: 'Workflows',
    subtitle: 'Build, edit, and manage your automation flows.',
    icon: 'sitemap',
    href: '/(tabs)/workflows'
  },
  {
    key: 'run-ai',
    title: 'Run AI',
    subtitle: 'Trigger a workflow run using structured inputs.',
    icon: 'play-circle',
    href: '/(tabs)/run-ai'
  },
  {
    key: 'knowledge',
    title: 'Knowledge Buckets',
    subtitle: 'Browse buckets and inspect individual chunks.',
    icon: 'database',
    href: '/buckets'
  },
  {
    key: 'content',
    title: 'Content',
    subtitle: 'Open placeholder content and detail views.',
    icon: 'th-large',
    href: '/content'
  },
  {
    key: 'schedule',
    title: 'My Schedule',
    subtitle: 'See upcoming sessions and planned items.',
    icon: 'calendar',
    href: '/my-schedule'
  }
];

export function HomeScreen() {
  return (
    <Screen
      title="Home"
      subtitle="Use this as your launchpad for inbox, workflows, runs, and knowledge.">
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
