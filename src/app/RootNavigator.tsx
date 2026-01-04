import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import TabNavigator from './TabNavigator';
import ReaderScreen from '../features/reader/screens/ReaderScreen';
import WiFiTransferScreen from '../features/library/screens/WiFiTransferScreen';
import ImportScreen from '../features/library/screens/ImportScreen';
import ReadingStatsScreen from '../features/settings/screens/ReadingStatsScreen';
import TTSSettingsScreen from '../features/settings/screens/TTSSettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Main"
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: 'white' },
            }}
        >
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
                name="Reader"
                component={ReaderScreen}
            />
            <Stack.Screen
                name="WiFiTransfer"
                component={WiFiTransferScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen
                name="Import"
                component={ImportScreen}
            />
            <Stack.Screen
                name="ReadingStats"
                component={ReadingStatsScreen}
            />
            <Stack.Screen
                name="TTSSettings"
                component={TTSSettingsScreen}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;

