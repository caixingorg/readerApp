import React from 'react';
import { ScrollView, Linking, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as FileSystem from 'expo-file-system/legacy';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import { Theme } from '../../../theme/theme';
import { version } from '../../../../package.json';
import { useThemeStore } from '../../../stores/useThemeStore';
import { BookRepository } from '../../../services/database/BookRepository';

interface SettingItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    isDestructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
    isDestructive = false
}) => {
    const theme = useTheme<Theme>();

    return (
        <Box
            backgroundColor="card"
            padding="m"
            marginBottom="s"
            borderRadius="m"
            borderWidth={1}
            borderColor="border"
            flexDirection="row"
            alignItems="center"
            onTouchEnd={onPress}
        >
            <Box
                width={40}
                height={40}
                backgroundColor={isDestructive ? 'error' : 'foreground'}
                borderRadius="m"
                justifyContent="center"
                alignItems="center"
                marginRight="m"
                opacity={isDestructive ? 0.1 : 1}
                position="absolute"
                left={theme.spacing.m}
            />
            <Box
                width={40}
                height={40}
                justifyContent="center"
                alignItems="center"
                marginRight="m"
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={isDestructive ? theme.colors.error : theme.colors.primary}
                />
            </Box>

            <Box flex={1}>
                <Text variant="body" color={isDestructive ? 'error' : 'text'}>{label}</Text>
                {value && (
                    <Text variant="caption" color="textSecondary" marginTop="xs">
                        {value}
                    </Text>
                )}
            </Box>

            {showArrow && (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            )}
        </Box>
    );
};

const ThemeOption = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => {
    const theme = useTheme<Theme>();
    return (
        <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
            <Box
                paddingVertical="m"
                alignItems="center"
                backgroundColor="card"
                borderWidth={1}
                borderColor={active ? 'primary' : 'border'}
                borderRadius="m"
                opacity={active ? 1 : 0.7}
            >
                <Text variant="body" fontWeight={active ? 'bold' : 'normal'} color={active ? 'primary' : 'text'}>
                    {label}
                </Text>
            </Box>
        </TouchableOpacity>
    );
};

const SettingsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { mode, setMode } = useThemeStore();

    const handleAbout = () => {
        Alert.alert(
            'ReaderApp',
            `版本 ${version}\n\n一个简洁优雅的电子书阅读应用\n\n© 2026 ReaderApp`,
            [{ text: '确定' }]
        );
    };

    const handleFeedback = async () => {
        const email = 'feedback@readerapp.com';
        const subject = 'ReaderApp 反馈';
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert('错误', '无法打开邮件应用');
        }
    };

    const handleClearCache = async () => {
        Alert.alert(
            '清除缓存',
            '确定要删除所有临时文件吗？这不会删除您的书籍，但需要重新解析 EPUB。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确定',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const cacheDir = (FileSystem.cacheDirectory || '') + 'books/';
                            await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                            Alert.alert('成功', '缓存已清除');
                        } catch (e) {
                            console.error(e);
                            Alert.alert('错误', '清除缓存失败');
                        }
                    }
                }
            ]
        );
    };

    const handleResetLibrary = () => {
        Alert.alert(
            '⚠️ 危险：重置书库',
            '此操作将永久删除所有已导入的书籍、阅读进度和笔记。此操作无法撤销！',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确认重置',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Delete DB
                            await BookRepository.deleteAll();

                            // 2. Delete User Documents
                            const docsDir = FileSystem.documentDirectory + 'books/';
                            await FileSystem.deleteAsync(docsDir, { idempotent: true });

                            // 3. Delete Cache
                            const cacheDir = (FileSystem.cacheDirectory || '') + 'books/';
                            await FileSystem.deleteAsync(cacheDir, { idempotent: true });

                            Alert.alert('重置完成', '应用已恢复初始状态', [{ text: '好的' }]);
                        } catch (e) {
                            console.error(e);
                            Alert.alert('错误', '重置失败: ' + e);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScreenLayout>
            <Box paddingHorizontal="l" paddingTop="m" paddingBottom="m">
                <Text variant="header">设置</Text>
            </Box>

            <ScrollView contentContainerStyle={{ padding: theme.spacing.l, paddingTop: 0 }}>
                {/* Visual Settings */}
                <Text variant="title" marginBottom="m" color="textSecondary">外观</Text>

                <Box flexDirection="row" gap="s" marginBottom="l">
                    <ThemeOption label="浅色" active={mode === 'light'} onPress={() => setMode('light')} />
                    <ThemeOption label="深色" active={mode === 'dark'} onPress={() => setMode('dark')} />
                    <ThemeOption label="自动" active={mode === 'system'} onPress={() => setMode('system')} />
                </Box>

                {/* Storage Settings */}
                <Text variant="title" marginBottom="m" color="textSecondary">存储与数据</Text>

                <SettingItem
                    icon="trash-outline"
                    label="清除缓存"
                    value="释放临时空间"
                    onPress={handleClearCache}
                />

                <SettingItem
                    icon="alert-circle-outline"
                    label="重置书库"
                    value="删除所有数据"
                    isDestructive
                    onPress={handleResetLibrary}
                />

                {/* About Settings */}
                <Text variant="title" marginTop="xl" marginBottom="m" color="textSecondary">关于</Text>

                <SettingItem
                    icon="information-circle-outline"
                    label="关于 ReaderApp"
                    value={`v${version}`}
                    onPress={handleAbout}
                />

                <SettingItem
                    icon="chatbubble-ellipses-outline"
                    label="反馈与建议"
                    onPress={handleFeedback}
                />

                {/* Footer */}
                <Box marginTop="xl" alignItems="center" paddingBottom="xl">
                    <Text variant="caption" color="textTertiary">
                        Made with ❤️ by ReaderApp Team
                    </Text>
                </Box>
            </ScrollView>
        </ScreenLayout>
    );
};

export default SettingsScreen;
