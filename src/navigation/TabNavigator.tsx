import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import defaultTheme from '../theme/theme';
import { TabParamList } from '../types/navigation';
import TabBar from '../components/TabBar';

import LibraryScreen from '../features/library/screens/LibraryScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
    const themeContext = useTheme<Theme>();
    const { t } = useTranslation();
    // Fallback if context is missing for some reason
    const theme = themeContext || defaultTheme;

    return (
        <Tab.Navigator
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                sceneStyle: {
                    backgroundColor: theme.colors.mainBackground,
                },
            }}
        >
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{ tabBarLabel: t('nav.home') }}
            />
            <Tab.Screen
                name="Notebook"
                component={require('../features/notebook/screens/NotebookScreen').default}
                options={{ tabBarLabel: t('nav.notebook') }}
            />
            <Tab.Screen
                name="Stats"
                component={require('../features/stats/screens/ReadingStatsScreen').default}
                options={{ tabBarLabel: t('nav.stats') }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: t('nav.settings') }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
