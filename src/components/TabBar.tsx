import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import * as Haptics from 'expo-haptics';
import {
    BookOpen,
    StickyNote,
    BarChart2,
    Settings,
    Library
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Text from './Text';

const TAB_HEIGHT = 70;
const TAB_WIDTH = 280; // Compact width for floating effect
const ICON_SIZE = 24;

const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // Robust checks against "Pro Max" dark palette
    // mainBackground in dark mode is Stone950 (#0C0A09) or Stone900 (#1C1917)
    // Also keeping Slate checks for backward compatibility
    const isDark = [
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.shadowContainer}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 80} // Lower intensity for iOS "glass" feel
                    tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'} // Native iOS blurred materials
                    style={[
                        styles.blurContainer,
                        {
                            // Reduce opacity to let BlurView shine through. 
                            // Dark: almost transparent blue-black. Light: almost transparent white.
                            backgroundColor: isDark ? 'rgba(2, 6, 23, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            paddingBottom: insets.bottom,
                            height: 65 + insets.bottom
                        }
                    ]}
                >
                    <View style={styles.tabsRow}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            // Determine Label Key
                            let labelKey = '';
                            switch (route.name) {
                                case 'Library': labelKey = 'nav.library'; break;
                                case 'Notebook': labelKey = 'nav.notebook'; break;
                                case 'Stats': labelKey = 'nav.stats'; break;
                                case 'Settings': labelKey = 'nav.settings'; break;
                                default: labelKey = 'nav.home';
                            }

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    Haptics.selectionAsync();
                                    navigation.navigate(route.name);
                                }
                            };

                            return (
                                <TabItem
                                    key={route.key}
                                    routeName={route.name}
                                    label={t(labelKey)}
                                    isFocused={isFocused}
                                    onPress={onPress}
                                    theme={theme}
                                />
                            );
                        })}
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

interface TabItemProps {
    routeName: string;
    label: string;
    isFocused: boolean;
    onPress: () => void;
    theme: Theme;
}



const TabItem: React.FC<TabItemProps> = ({ routeName, label, isFocused, onPress, theme }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const translateY = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 1, { damping: 10 });
        opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
        translateY.value = withSpring(isFocused ? -4 : 0, { damping: 12 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const getIcon = () => {
        const color = isFocused ? theme.colors.primary : theme.colors.textSecondary;
        const size = 24;

        switch (routeName) {
            case 'Library':
                return <Library size={size} color={color} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'Notebook':
                return <StickyNote size={size} color={color} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'Stats':
                return <BarChart2 size={size} color={color} strokeWidth={isFocused ? 2.5 : 2} />;
            case 'Settings':
                return <Settings size={size} color={color} strokeWidth={isFocused ? 2.5 : 2} />;
            default:
                return <BookOpen size={size} color={color} />;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.tabItem}
        >
            <Animated.View style={[animatedStyle, styles.iconContainer]}>
                {getIcon()}
                <Text
                    variant="small"
                    color={isFocused ? 'primary' : 'textSecondary'}
                    style={{
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: isFocused ? '600' : '500'
                    }}
                >
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        zIndex: 100,
    },
    shadowContainer: {
        width: '100%',
        backgroundColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4, // Upward shadow
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 10,
    },
    blurContainer: {
        width: '100%',
        // height removed from here, calculated inline
        borderTopWidth: 1,
    },
    tabsRow: {
        flexDirection: 'row',
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around',
    },


    tabItem: {
        height: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TabBar;
