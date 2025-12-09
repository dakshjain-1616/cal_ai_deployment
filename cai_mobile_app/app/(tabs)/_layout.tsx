import { Tabs } from 'expo-router'
import React from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
        headerTitleAlign: 'center',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          backgroundColor: '#fff'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="water"
        options={{
          title: 'Water Tracker',
          tabBarLabel: 'Water',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="water" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="exercise"
        options={{
          title: 'Exercise',
          tabBarLabel: 'Exercise',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dumbbell" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="camera" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={24} color={color} />
        }}
      />
    </Tabs>
  )
}
