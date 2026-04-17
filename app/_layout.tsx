import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerBackTitle: 'Back'
            }}>
            <Stack.Screen name="index" options={{ title: 'HelixScribe' }} />
            <Stack.Screen name="inbox" options={{ title: 'Inbox submission' }} />
            <Stack.Screen name="buckets/index" options={{ title: 'Knowledge buckets' }} />
            <Stack.Screen name="workflows/index" options={{ title: 'Workflows V2' }} />
            <Stack.Screen name="workflows/new" options={{ title: 'New workflow' }} />
            <Stack.Screen name="runs/[runId]" options={{ title: 'Run detail' }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
