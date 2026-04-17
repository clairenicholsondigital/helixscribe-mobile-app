import { router } from 'expo-router';

import { AppButton } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  return (
    <Screen title="Page not found" subtitle="That route does not exist in the mobile scaffold yet.">
      <EmptyState
        title="Nothing here"
        description="Go back home and jump into inbox submission, knowledge buckets, or workflows."
      />
      <AppButton label="Back to home" onPress={() => router.replace('/')} />
    </Screen>
  );
}
