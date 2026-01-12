import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import './src/i18n'; // Initialize i18n
import { ThemeProvider } from '@shopify/restyle';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { toastConfig } from './src/components/toastConfig';
import theme, { darkTheme } from './src/theme/theme';
import RootNavigator from '@/navigation/RootNavigator';
import { initDatabase } from './src/services/database';
import { useThemeStore } from './src/stores/useThemeStore';
import { AutoBackupService } from './src/features/settings/utils/AutoBackupService';
import { AuthProtection } from './src/components/AuthProtection';

const queryClient = new QueryClient();

export default function App() {
    const colorScheme = useColorScheme();
    const { mode } = useThemeStore();

    // Load fonts explicitly
    const [fontsLoaded] = useFonts({
        ...Ionicons.font,
    });

    const activeTheme = React.useMemo(() => {
        if (mode === 'system') {
            return colorScheme === 'dark' ? darkTheme : theme;
        }
        return mode === 'dark' ? darkTheme : theme;
    }, [mode, colorScheme]);

    React.useEffect(() => {
        initDatabase().catch(console.error);
        AutoBackupService.init().catch(console.error);
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider theme={activeTheme}>
                    <QueryClientProvider client={queryClient}>
                        {fontsLoaded ? (
                            <NavigationContainer>
                                <AuthProtection>
                                    <RootNavigator />
                                </AuthProtection>
                            </NavigationContainer>
                        ) : null}
                        <Toast config={toastConfig} />
                    </QueryClientProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
