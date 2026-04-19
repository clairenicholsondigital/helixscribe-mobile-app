import { router, Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQueryClient } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';

import { queryKeys } from '@/lib/queryKeys';

export default function TabLayout() {
  const queryClient = useQueryClient();

  return (
    <Tabs initialRouteName="home">
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="inbox" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="workflows"
        options={{
          title: 'Workflows',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 }}>
              <Pressable
                accessibilityLabel="Refresh workflows"
                onPress={() => queryClient.invalidateQueries({ queryKey: queryKeys.workflows })}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <FontAwesome name="refresh" size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="Create workflow"
                onPress={() => router.push('/workflows/new')}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <FontAwesome name="plus" size={20} />
              </Pressable>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="sitemap" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="run-ai"
        options={{
          title: 'Run AI',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="play-circle" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'Knowledge',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="database" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
