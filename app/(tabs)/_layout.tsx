import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <FontAwesome name="inbox" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="workflows"
        options={{
          title: 'Workflows',
          tabBarIcon: ({ color, size }) => <FontAwesome name="random" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="knowledge"
        options={{
          title: 'Knowledge',
          tabBarIcon: ({ color, size }) => <FontAwesome name="database" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
