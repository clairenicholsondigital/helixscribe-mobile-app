import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { tokens } from '@/theme/tokens';

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  note: string;
};

const scheduleItems: ScheduleItem[] = [
  {
    id: '1',
    time: '09:00 AM',
    title: 'Editorial Standup',
    note: 'Review priorities and blockers for this week.'
  },
  {
    id: '2',
    time: '11:30 AM',
    title: 'Content Workshop',
    note: 'Draft outlines for upcoming campaign assets.'
  },
  {
    id: '3',
    time: '03:00 PM',
    title: 'Review Session',
    note: 'Share drafts and gather feedback from stakeholders.'
  }
];

export default function MyScheduleScreen() {
  return (
    <Screen
      title="My Schedule"
      subtitle="Placeholder schedule items linked from the Home screen.">
      <View style={styles.list}>
        {scheduleItems.map((item) => (
          <SectionCard key={item.id} title={`${item.time} · ${item.title}`}>
            <Text style={styles.note}>{item.note}</Text>
          </SectionCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: tokens.spacing.md
  },
  note: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});
