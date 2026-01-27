import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    headerCenter?: React.ReactNode;
    rightAction?: React.ReactNode;
    children?: React.ReactNode;
    backgroundColor?: keyof Theme['colors'];
}

function Header({
    title,
    subtitle,
    showBack = false,
    onBackPress,
    headerCenter,
    rightAction,
    children,
    backgroundColor = 'mainBackground',
}: HeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const theme = useTheme<Theme>();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    // Android Status Bar handling
    // If we rely purely on SafeAreaView, it might not add enough padding if the status bar is translucent.
    // We add a safety buffer on Android.
    // Android Status Bar handling
    // We safeguard against low values by taking the max of insets, currentHeight, and a safe minimum (24)
    const androidPaddingEntry = Math.max(insets.top, StatusBar.currentHeight || 0, 24);

    // Add extra breathing room (16dp) to clear extensive notches/cameras
    const topPadding = Platform.OS === 'android'
        ? androidPaddingEntry + 16
        : insets.top;

    return (
        <View
            style={{
                backgroundColor: theme.colors[backgroundColor],
                paddingHorizontal: theme.spacing.m,
                paddingBottom: theme.spacing.m,
                paddingTop: topPadding,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {/* Left Section: Back Button or Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {showBack && !headerCenter && (
                        <TouchableOpacity
                            onPress={handleBack}
                            style={{
                                marginRight: theme.spacing.m,
                                padding: 4,
                            }}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={theme.colors.textPrimary}
                            />
                        </TouchableOpacity>
                    )}

                    {headerCenter ? (
                        <View style={{ flex: 1 }}>
                            {headerCenter}
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 32,
                                    lineHeight: 40,
                                    fontWeight: '800',
                                    color: theme.colors.textPrimary,
                                }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {title}
                            </Text>
                            {subtitle && (
                                <Text
                                    style={{
                                        fontSize: 12, // Approx caption size
                                        color: theme.colors.textSecondary,
                                        marginTop: theme.spacing.xs,
                                    }}
                                >
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Right Section: Actions */}
                {rightAction && (
                    <View style={{ marginLeft: theme.spacing.m, alignItems: 'center', justifyContent: 'center' }}>
                        {rightAction}
                    </View>
                )}
            </View>

            {/* Optional Children (e.g. Search Bar) */}
            {children && (
                <View style={{ marginTop: theme.spacing.m }}>
                    {children}
                </View>
            )}
        </View>
    );
};

export default Header;
