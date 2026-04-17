import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { contentItems } from '@/constants/contentItems';
import { tokens } from '@/theme/tokens';

export default function ContentDetailScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const content = contentItems.find((item) => item.id === contentId);

  if (!content) {
    return (
      <Screen title="Content not found" subtitle="This content item does not exist.">
        <Text style={styles.bodyText}>
          Try going back to the Content list and selecting another item.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen title={content.title} subtitle={`${content.category} · ${content.duration}`}>
      <Stack.Screen options={{ title: content.title }} />
      <SectionCard title="Overview" description={content.summary}>
        <Text style={styles.bodyText}>{content.details}</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: tokens.colors.text,
    fontSize: 15,
    lineHeight: 22
  }
});
