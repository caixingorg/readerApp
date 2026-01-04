import React from 'react';
import { SectionList, Linking, Alert, View } from 'react-native';
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
import { DataExportService } from '../utils/DataExportService';
import SettingsItem, { SettingsItemProps } from '../components/SettingsItem';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigation';
import clsx from 'clsx';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SettingsSection {
    title?: string;
    data: SettingsItemProps[];
}

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
        if (supported) await Linking.openURL(url);
        else Alert.alert('错误', '无法打开邮件应用');
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
                            await BookRepository.deleteAll();
                            const docsDir = FileSystem.documentDirectory + 'books/';
                            await FileSystem.deleteAsync(docsDir, { idempotent: true });
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

    const sections: SettingsSection[] = [
        {
            title: '外观',
            data: [
                {
                    label: '主题模式',
                    icon: 'color-palette-outline',
                    value: mode === 'system' ? '跟随系统' : mode === 'dark' ? '深色' : '浅色',
                    type: 'link',
                    onPress: () => {
                        Alert.alert('选择主题', '', [
                            { text: '浅色', onPress: () => setMode('light') },
                            { text: '深色', onPress: () => setMode('dark') },
                            { text: '跟随系统', onPress: () => setMode('system') },
                            { text: '取消', style: 'cancel' }
                        ]);
                    }
                }
            ]
        },
        {
            title: '阅读体验',
            data: [
                {
                    label: '阅读统计',
                    icon: 'stats-chart-outline',
                    type: 'link',
                    onPress: () => navigation.navigate('ReadingStats')
                },
                {
                    label: '语音朗读',
                    icon: 'mic-outline',
                    type: 'link',
                    onPress: () => navigation.navigate('TTSSettings')
                },
                {
                    label: '音量键翻页',
                    icon: 'volume-high-outline',
                    type: 'toggle',
                    value: volumeKeyFlip,
                    onValueChange: (val) => {
                        setVolumeKeyFlip(val);
                        if (hapticFeedback) Haptics.selectionAsync();
                    }
                },
                {
                    label: '翻页振动',
                    icon: 'finger-print-outline',
                    type: 'toggle',
                    value: hapticFeedback,
                    onValueChange: (val) => {
                        setHapticFeedback(val);
                        if (val) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                },
                {
                    label: '长按速度',
                    icon: 'timer-outline',
                    value: longPressSpeed === 'fast' ? '快' : longPressSpeed === 'slow' ? '慢' : '正常',
                    type: 'link',
                    onPress: () => {
                        Alert.alert('长按菜单速度', '', [
                            { text: '快 (250ms)', onPress: () => setLongPressSpeed('fast') },
                            { text: '正常 (500ms)', onPress: () => setLongPressSpeed('normal') },
                            { text: '慢 (800ms)', onPress: () => setLongPressSpeed('slow') },
                            { text: '取消', style: 'cancel' }
                        ]);
                    }
                }
            ]
        },
        {
            title: '书架管理',
            data: [
                {
                    label: '视图模式',
                    icon: 'grid-outline',
                    value: viewMode === 'grid' ? '网格' : '列表',
                    type: 'link',
                    onPress: () => {
                        Alert.alert('书架视图', '', [
                            { text: '网格模式', onPress: () => setViewMode('grid') },
                            { text: '列表模式', onPress: () => setViewMode('list') },
                            { text: '取消', style: 'cancel' }
                        ]);
                    }
                },
                {
                    label: '显示文件大小',
                    icon: 'document-text-outline',
                    type: 'toggle',
                    value: showFileSize,
                    onValueChange: setShowFileSize
                },
                {
                    label: '显示格式标签',
                    icon: 'bookmark-outline',
                    type: 'toggle',
                    value: showFormatLabel,
                    onValueChange: setShowFormatLabel
                },
                {
                    label: 'TXT 编码',
                    icon: 'code-working-outline',
                    value: forceEncoding ? (forceEncoding === 'gbk' ? 'GBK' : 'UTF-8') : '自动',
                    type: 'link',
                    onPress: () => {
                        Alert.alert('强制 TXT 编码', '', [
                            { text: '自动 (推荐)', onPress: () => setForceEncoding(null) },
                            { text: 'UTF-8', onPress: () => setForceEncoding('utf8') },
                            { text: 'GBK / GB18030', onPress: () => setForceEncoding('gbk') },
                            { text: '取消', style: 'cancel' }
                        ]);
                    }
                }
            ]
        },
        {
            title: '数据与安全',
            data: [
                {
                    label: '自动备份',
                    icon: 'time-outline',
                    description: '每天自动备份一次阅读进度',
                    type: 'toggle',
                    value: autoBackupEnabled,
                    onValueChange: setAutoBackupEnabled
                },
                {
                    label: '应用锁',
                    icon: 'lock-closed-outline',
                    description: '启动或后台恢复时需验证',
                    type: 'toggle',
                    value: appLockEnabled,
                    onValueChange: setAppLockEnabled
                },
                {
                    label: '导出数据',
                    icon: 'cloud-upload-outline',
                    type: 'link',
                    onPress: DataExportService.exportData
                },
                {
                    label: '导入数据',
                    icon: 'cloud-download-outline',
                    type: 'link',
                    onPress: DataExportService.importData
                },
                {
                    label: '清除缓存',
                    icon: 'trash-outline',
                    type: 'action',
                    onPress: handleClearCache
                },
                {
                    label: '重置书库',
                    icon: 'alert-circle-outline',
                    type: 'action',
                    isDestructive: true,
                    onPress: handleResetLibrary
                }
            ]
        },
        {
            title: '关于',
            data: [
                {
                    label: '关于 ReaderApp',
                    icon: 'information-circle-outline',
                    value: `v${version}`,
                    type: 'link',
                    onPress: handleAbout
                },
                {
                    label: '反馈与建议',
                    icon: 'chatbubble-ellipses-outline',
                    type: 'link',
                    onPress: handleFeedback
                }
            ]
        }
    ];

    return (
        <ScreenLayout>
            <View className="flex-1 bg-gray-50 dark:bg-black">
                <Box paddingHorizontal="l" paddingTop="m" paddingBottom="s">
                    <Text variant="header">设置</Text>
                </Box>

                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item.label + index}
                    renderItem={({ item, section, index }) => (
                        <SettingsItem
                            {...item}
                            isLast={index === section.data.length - 1}
                        />
                    )}
                    renderSectionHeader={({ section: { title } }) => (
                        title ? (
                            <Text className="px-4 py-2 text-sm font-medium text-gray-500 uppercase mt-4 mb-1">
                                {title}
                            </Text>
                        ) : null
                    )}
                    SectionSeparatorComponent={() => <View className="h-0" />}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListFooterComponent={
                        <View className="items-center py-8">
                            <Text className="text-xs text-gray-400">
                                Made with ❤️ by ReaderApp Team
                            </Text>
                        </View>
                    }
                />
            </View>
        </ScreenLayout>
    );
};

export default SettingsScreen;
