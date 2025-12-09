import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DashboardScreen from './screens/DashboardScreen'
import WaterTrackerScreen from './screens/WaterTrackerScreen'
import ExerciseTrackerScreen from './screens/ExerciseTrackerScreen'
import SettingsScreen from './screens/SettingsScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName

            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline'
            } else if (route.name === 'Water') {
              iconName = focused ? 'water' : 'water-outline'
            } else if (route.name === 'Exercise') {
              iconName = focused ? 'dumbbell' : 'dumbbell'
            } else if (route.name === 'Settings') {
              iconName = focused ? 'cog' : 'cog-outline'
            }

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            backgroundColor: '#fff'
          }
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: 'Dashboard' }}
        />
        <Tab.Screen
          name="Water"
          component={WaterTrackerScreen}
          options={{ tabBarLabel: 'Water' }}
        />
        <Tab.Screen
          name="Exercise"
          component={ExerciseTrackerScreen}
          options={{ tabBarLabel: 'Exercise' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
