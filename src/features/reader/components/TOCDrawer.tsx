import React from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';
import SideDrawerModal from '../../../components/SideDrawerModal';
import clsx from 'clsx';

interface TOCDrawerProps {
    visible: boolean;
    onClose: () => void;
    chapters: EpubChapter[];
    currentHref?: string;
    onSelectChapter: (href: string) => void;
}

const TOCDrawer: React.FC<TOCDrawerProps> = ({
    visible,
    onClose,
    chapters,
    currentHref,
    onSelectChapter,
}) => {
    const theme = useTheme<Theme>();

    // Helper to flatten nested chapters
    const flattenChapters = (items: EpubChapter[], level = 0): (EpubChapter & { level: number })[] => {
        let result: (EpubChapter & { level: number })[] = [];
        items.forEach(item => {
            result.push({ ...item, level });
            if (item.subitems && item.subitems.length > 0) {
                result = result.concat(flattenChapters(item.subitems, level + 1));
            }
        });
        return result;
    };

    const flatChapters = flattenChapters(chapters);

    const renderChapterItem = ({ item }: { item: EpubChapter & { level: number } }) => {
        const isCurrent = currentHref && item.href.includes(currentHref);

        return (
            <TouchableOpacity
                className={clsx(
                    "py-3.5 pr-4 border-b border-gray-100 dark:border-gray-800",
                    isCurrent && "bg-primary-50 dark:bg-primary-900/20"
                )}
                style={{ paddingLeft: 20 + item.level * 20 }}
                onPress={() => {
                    onSelectChapter(item.href);
                    onClose();
                }}
            >
                <Text
                    className={clsx(
                        "text-sm",
                        isCurrent ? "font-bold text-primary-600 dark:text-primary-400" : "font-normal text-gray-700 dark:text-gray-300"
                    )}
                    numberOfLines={1}
                >
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SideDrawerModal visible={visible} onClose={onClose} position="left">
            <View className="flex-1 bg-white dark:bg-gray-900">
                {/* Header */}
                <View className="p-4 border-b border-gray-200 dark:border-gray-700 items-center pt-8">
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">目录</Text>
                </View>

                <FlatList
                    data={flatChapters}
                    keyExtractor={(item) => item.id + item.href}
                    renderItem={renderChapterItem}
                    contentContainerStyle={{ paddingVertical: 10 }}
                    initialNumToRender={20}
                />
            </View>
        </SideDrawerModal>
    );
};

export default TOCDrawer;
