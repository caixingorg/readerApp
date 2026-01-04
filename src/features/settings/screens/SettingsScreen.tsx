import React from 'react';
import { ScrollView, Linking, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import * as FileSystem from 'expo-file-system/legacy';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import { Theme } from '../../../theme/theme';
import { version } from '../../../../package.json';
import { useThemeStore } from '../../../stores/useThemeStore';
import { useLibrarySettings } from '../../library/stores/useLibrarySettings';
import { BookRepository } from '../../../services/database/BookRepository';
import { useReaderSettings } from '../../reader/stores/useReaderSettings';
import { Switch } from 'react-native';
import { DataExportService } from '../utils/DataExportService';

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

import { RootStackParamList } from '../../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

const SettingsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { mode, setMode } = useThemeStore();
    const {
        volumeKeyFlip, setVolumeKeyFlip,
        hapticFeedback, setHapticFeedback,
        longPressSpeed, setLongPressSpeed,
        forceEncoding, setForceEncoding,
        autoBackupEnabled, setAutoBackupEnabled,
        appLockEnabled, setAppLockEnabled
    } = useReaderSettings();
    const {
        viewMode, setViewMode,
        showFileSize, setShowFileSize,
        showFormatLabel, setShowFormatLabel
    } = useLibrarySettings();

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

                <Box backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Text variant="body" fontWeight="bold">存储路径</Text>
                    <Text variant="caption" color="textSecondary" marginTop="s">
                        {FileSystem.documentDirectory}
                    </Text>
                </Box>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Box>
                            <Text variant="body">自动备份</Text>
                            <Text variant="caption" color="textSecondary">每天自动备份一次</Text>
                        </Box>
                    </Box>
                    <Switch value={autoBackupEnabled} onValueChange={setAutoBackupEnabled} />
                </Box>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Box>
                            <Text variant="body">应用锁</Text>
                            <Text variant="caption" color="textSecondary">启动或后台恢复时需验证</Text>
                        </Box>
                    </Box>
                    <Switch value={appLockEnabled} onValueChange={setAppLockEnabled} />
                </Box>

                <SettingItem
                    icon="cloud-upload-outline"
                    label="导出数据"
                    value="备份阅读进度与笔记"
                    onPress={DataExportService.exportData}
                />

                <SettingItem
                    icon="cloud-download-outline"
                    label="导入数据"
                    value="从备份恢复"
                    onPress={DataExportService.importData}
                />

                <SettingItem
                    icon="trash-outline"
                    label="清除缓存"
                    value="释放临时空间"
                    onPress={handleClearCache}
                />

                {/* Reading Settings */}
                <Text variant="title" marginTop="l" marginBottom="m" color="textSecondary">阅读设置</Text>

                <TouchableOpacity onPress={() => navigation.navigate('TTSSettings')}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="mic-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text variant="body">语音朗读设置</Text>
                        </Box>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </Box>
                </TouchableOpacity>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="volume-high-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Text variant="body">音量键翻页</Text>
                    </Box>
                    <Switch value={volumeKeyFlip} onValueChange={setVolumeKeyFlip} />
                </Box>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="finger-print-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Text variant="body">翻页振动</Text>
                    </Box>
                    <Switch value={hapticFeedback} onValueChange={setHapticFeedback} />
                </Box>

                <TouchableOpacity onPress={() => {
                    Alert.alert('长按菜单速度', '选择长按呼出菜单的响应速度', [
                        { text: '快 (250ms)', onPress: () => setLongPressSpeed('fast') },
                        { text: '正常 (500ms)', onPress: () => setLongPressSpeed('normal') },
                        { text: '慢 (800ms)', onPress: () => setLongPressSpeed('slow') },
                        { text: '取消', style: 'cancel' }
                    ]);
                }}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="timer-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text variant="body">长按速度</Text>
                        </Box>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="caption" color="textSecondary" marginRight="s">
                                {longPressSpeed === 'fast' ? '快' : longPressSpeed === 'slow' ? '慢' : '正常'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                        </Box>
                    </Box>
                </TouchableOpacity>

                <SettingItem
                    icon="alert-circle-outline"
                    label="重置书库"
                    value="删除所有数据"
                    isDestructive
                    onPress={handleResetLibrary}
                />

                {/* Interface Settings */}
                <Text variant="title" marginTop="l" marginBottom="m" color="textSecondary">界面设置</Text>

                <TouchableOpacity onPress={() => {
                    Alert.alert('书架视图', '选择默认视图模式', [
                        { text: '网格模式', onPress: () => setViewMode('grid') },
                        { text: '列表模式', onPress: () => setViewMode('list') },
                        { text: '取消', style: 'cancel' }
                    ]);
                }}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="grid-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text variant="body">书架视图</Text>
                        </Box>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="caption" color="textSecondary" marginRight="s">
                                {viewMode === 'grid' ? '网格' : '列表'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                        </Box>
                    </Box>
                </TouchableOpacity>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Text variant="body">显示文件大小</Text>
                    </Box>
                    <Switch value={showFileSize} onValueChange={setShowFileSize} />
                </Box>

                <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                        <Text variant="body">显示格式标签</Text>
                    </Box>
                    <Switch value={showFormatLabel} onValueChange={setShowFormatLabel} />
                </Box>

                <TouchableOpacity onPress={() => {
                    Alert.alert('强制 TXT 编码', '如果不确定请选择自动', [
                        { text: '自动 (推荐)', onPress: () => setForceEncoding(null) },
                        { text: 'UTF-8', onPress: () => setForceEncoding('utf8') },
                        { text: 'GBK / GB18030', onPress: () => setForceEncoding('gbk') },
                        { text: '取消', style: 'cancel' }
                    ]);
                }}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="code-working-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text variant="body">TXT 编码</Text>
                        </Box>
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="caption" color="textSecondary" marginRight="s">
                                {forceEncoding ? (forceEncoding === 'gbk' ? 'GBK' : 'UTF-8') : '自动'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                        </Box>
                    </Box>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ReadingStats')}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="m" borderWidth={1} borderColor="border">
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text variant="body">阅读统计</Text>
                        </Box>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                    </Box>
                </TouchableOpacity>

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
