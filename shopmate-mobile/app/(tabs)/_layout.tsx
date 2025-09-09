import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router, Tabs, useRouter } from 'expo-router';
import { Pressable, TouchableOpacity } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/contexts/AuthContext';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login')
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.secondary,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="cart" // dummy route
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={Colors.light.primary} />,
          tabBarActiveTintColor: Colors.light.secondary,
          tabBarLabelStyle: {
            color: Colors.light.primary,
          },
          tabBarActiveBackgroundColor:  Colors.light.secondary
        }}
      />
      <Tabs.Screen
        name="recommend" // dummy route
        options={{
          title: 'Recommend',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="magic" color={Colors.light.primary} />,
          tabBarActiveTintColor: Colors.light.secondary,
          tabBarLabelStyle: {
            color: Colors.light.primary,
          },
          tabBarActiveBackgroundColor:  Colors.light.secondary,
          
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={Colors.light.primary} />,
          tabBarActiveTintColor: Colors.light.secondary,
          tabBarLabelStyle: {
            color: Colors.light.primary,
          },
          tabBarActiveBackgroundColor:  Colors.light.secondary
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={Colors.light.primary} />,
          tabBarActiveTintColor: Colors.light.secondary,
          tabBarLabelStyle: {
            color: Colors.light.primary,
          },
          tabBarActiveBackgroundColor:  Colors.light.secondary
        }}
      />
    </Tabs>
  );
}
