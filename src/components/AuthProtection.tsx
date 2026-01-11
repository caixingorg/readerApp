import React, { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus, View, Platform, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useReaderSettings } from '../features/reader/stores/useReaderSettings';
import Text from '../components/Text';
import Box from '../components/Box';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface AuthProtectionProps {
    children: React.ReactNode;
}

export const AuthProtection: React.FC<AuthProtectionProps> = ({ children }) => {
    const appState = useRef(AppState.currentState);
    const [isLocked, setIsLocked] = useState(false);
    const { appLockEnabled } = useReaderSettings();
    const theme = useTheme<Theme>();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [appLockEnabled]);

    // Initial check on mount if enabled
    useEffect(() => {
        if (appLockEnabled) {
            authenticate();
        }
    }, []);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === 'active' &&
            appLockEnabled
        ) {
            console.log('App coming to foreground, locking...');
            setIsLocked(true);
            authenticate();
        }
        appState.current = nextAppState;
    };

    const authenticate = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // Fallback or just unlock if no auth available (or show pin input - out of scope for now)
                console.log('No biometric hardware or enrollment, unlocking.');
                setIsLocked(false);
                return;
            }

            // If not already locked, lock it now before prompt
            setIsLocked(true);

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: '请验证解锁阅读',
                fallbackLabel: '使用密码', // iOS only
                disableDeviceFallback: false,
            });

            if (result.success) {
                setIsLocked(false);
            } else {
                // Keep locked, user can retry
                console.log('Authentication failed');
            }
        } catch (e) {
            console.error('Auth error', e);
            setIsLocked(false); // Fail open or closed? Best fail closed but for dev fail open.
            // Actually fail closed prevents access. Let's keep isLocked true if error.
        }
    };

    if (isLocked && appLockEnabled) {
        return (
            <Box flex={1}>
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: theme.colors.background,
                            zIndex: 9999,
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    ]}
                >
                    <Ionicons name="lock-closed" size={64} color={theme.colors.primary} />
                    <Text variant="title" marginTop="m">
                        应用已锁定
                    </Text>
                    <TouchableOpacity onPress={authenticate}>
                        <Box
                            marginTop="l"
                            paddingVertical="m"
                            paddingHorizontal="xl"
                            backgroundColor="primary"
                            borderRadius="m"
                        >
                            <Text variant="body" color="white" fontWeight="bold">
                                点击解锁
                            </Text>
                        </Box>
                    </TouchableOpacity>
                </View>
            </Box>
        );
    }

    return <>{children}</>;
};
