import { Tabs } from 'expo-router';
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
          <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
            <Tabs.Screen
              name="inbox"
              options={{
                title: 'Inbox submission',
                tabBarLabel: 'Inbox'
              }}
            />
            <Tabs.Screen
              name="buckets/index"
              options={{
                title: 'Knowledge buckets',
                tabBarLabel: 'Buckets'
              }}
            />
            <Tabs.Screen
              name="workflows/index"
              options={{
                title: 'Workflows V2',
                tabBarLabel: 'Workflows'
              }}
            />
            <Tabs.Screen name="run-ai" options={{ title: 'Run AI', tabBarLabel: 'Run AI' }} />

            <Tabs.Screen name="buckets/[bucketName]" options={{ href: null, title: 'Bucket detail' }} />
            <Tabs.Screen name="workflows/new" options={{ href: null, title: 'New workflow' }} />
            <Tabs.Screen name="workflows/[workflowId]" options={{ href: null, title: 'Workflow detail' }} />
            <Tabs.Screen name="runs/[runId]" options={{ href: null, title: 'Run detail' }} />
            <Tabs.Screen name="+not-found" options={{ href: null }} />
          </Tabs>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
