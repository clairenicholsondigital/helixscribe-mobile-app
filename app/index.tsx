import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { API_BASE_URL } from '@/lib/config';
import { tokens } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <Screen
      title="HelixScribe"
      subtitle="Functional mobile control over inbox capture, knowledge buckets, chunks, workflows V2, and run inspection.">
      <SectionCard title="Fast actions" description="Use the shortcuts below to reach the parts of the system you said matter most on mobile.">
        <View style={styles.buttonColumn}>
          <AppButton label="Inbox submission" onPress={() => router.push('/inbox')} />
          <AppButton
            label="Knowledge buckets"
            onPress={() => router.push('/buckets')}
            tone="secondary"
          />
          <AppButton
            label="Workflows V2"
            onPress={() => router.push('/workflows')}
            tone="ghost"
          />
          <AppButton
            label="Run AI"
            onPress={() => router.push('/run-ai')}
            tone="secondary"
          />
        </View>
      </SectionCard>

      <SectionCard title="API target" description="The scaffold points at your existing HelixScribe API by default.">
        <Text style={styles.apiValue}>{API_BASE_URL}</Text>
      </SectionCard>

      <SectionCard title="Current scope" description="This project deliberately stays narrow, so you can get to a useful mobile app faster.">
        <Text style={styles.scopeLine}>• Inbox submission</Text>
        <Text style={styles.scopeLine}>• Bucket list and chunk pages</Text>
        <Text style={styles.scopeLine}>• Workflow V2 list</Text>
        <Text style={styles.scopeLine}>• Workflow detail, save, and test run</Text>
        <Text style={styles.scopeLine}>• Run AI simplified tester</Text>
        <Text style={styles.scopeLine}>• Run detail</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttonColumn: {
    gap: tokens.spacing.sm
  },
  apiValue: {
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '600'
  },
  scopeLine: {
    color: tokens.colors.text,
    lineHeight: 22
  }
});
