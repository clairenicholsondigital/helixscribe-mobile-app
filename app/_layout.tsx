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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="buckets/[bucketName]" options={{ title: 'Bucket chunks' }} />
            <Stack.Screen name="chunks/[chunkId]" options={{ title: 'Chunk detail' }} />
            <Stack.Screen name="workflows/[workflowId]" options={{ title: 'Workflow detail' }} />
            <Stack.Screen name="workflows/new" options={{ title: 'New workflow' }} />
            <Stack.Screen name="run-ai" options={{ title: 'Run AI' }} />
            <Stack.Screen name="runs/[runId]" options={{ title: 'Run detail' }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
