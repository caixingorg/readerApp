import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import defaultTheme from '../theme/theme';
import { TabParamList } from '../types/navigation';

import LibraryScreen from '../features/library/screens/LibraryScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
    const themeContext = useTheme<Theme>();
    // Fallback if context is missing for some reason
    const theme = themeContext || defaultTheme;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors?.primary || '#007AFF',
                tabBarInactiveTintColor: theme.colors?.textSecondary || '#999',
                tabBarStyle: {
                    backgroundColor: theme.colors?.background || '#FFF',
                    borderTopColor: theme.colors?.border || '#EEE',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

                    if (route.name === 'Library') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{ tabBarLabel: 'Library' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'Settings' }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
