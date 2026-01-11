import React from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme/theme';
import Box from './Box';

interface ScreenLayoutProps {
    children: React.ReactNode;
    edges?: Edge[];
    backgroundColor?: keyof Theme['colors'];
    statusBarStyle?: StatusBarStyle;
    testID?: string;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
    children,
    edges = ['top', 'left', 'right'],
    backgroundColor = 'background',
    statusBarStyle = 'dark-content',
    testID,
}) => {
    const theme = useTheme<Theme>();

    return (
        <SafeAreaView
            edges={edges}
            style={{
                flex: 1,
                backgroundColor: theme.colors[backgroundColor],
            }}
            testID={testID}
        >
            <StatusBar barStyle={statusBarStyle} backgroundColor={theme.colors[backgroundColor]} />
            <Box flex={1}>{children}</Box>
        </SafeAreaView>
    );
};

export default ScreenLayout;
