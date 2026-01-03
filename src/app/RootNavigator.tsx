import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import TabNavigator from './TabNavigator';
import ReaderScreen from '../features/reader/screens/ReaderScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen
                    name="Reader"
                    component={ReaderScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
