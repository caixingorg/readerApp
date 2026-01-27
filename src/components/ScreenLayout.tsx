import React from 'react';
import { StatusBar, StatusBarStyle, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import Header from './Header';

interface ScreenLayoutProps {
    children: React.ReactNode;
    edges?: Edge[];
    backgroundColor?: keyof Theme['colors'];
    statusBarStyle?: StatusBarStyle;
    testID?: string;
    disableSafeAreaTop?: boolean;

    // Integrated Header Props
    title?: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    headerCenter?: React.ReactNode;
    onGoBack?: () => void;
    showBack?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
    children,
    edges = ['top', 'left', 'right'],
    backgroundColor = 'background',
    statusBarStyle = 'dark-content',
    testID,
    disableSafeAreaTop = false,

    // Integrated Header Props
    title,
    subtitle,
    headerRight,
    headerCenter,
    onGoBack,
    showBack,
}) => {
    const theme = useTheme<Theme>();

    // Determine if we should use the integrated header
    const hasHeader = title || headerCenter || headerRight || showBack || onGoBack;

    // If we use the integrated header, or if explicitly asked, disable custom top safe area
    const shouldDisableSafeAreaTop = disableSafeAreaTop || !!hasHeader;
    const activeEdges = shouldDisableSafeAreaTop ? edges.filter((e) => e !== 'top') : edges;

    return (
        <SafeAreaView
            edges={activeEdges}
            style={{
                flex: 1,
                backgroundColor: theme.colors[backgroundColor],
            }}
            testID={testID}
        >
            <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors[backgroundColor]} />

            {hasHeader && (
                <Header
                    title={title || ''}
                    subtitle={subtitle}
                    rightAction={headerRight}
                    headerCenter={headerCenter}
                    showBack={showBack}
                    onBackPress={onGoBack}
                    backgroundColor={backgroundColor}
                />
            )}

            <View style={{ flex: 1 }}>{children}</View>
        </SafeAreaView>
    );
};

export default ScreenLayout;
