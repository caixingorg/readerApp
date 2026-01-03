import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';
import SideDrawerModal from '../../../components/SideDrawerModal';

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
        const isCurrent = currentHref && item.href.includes(currentHref); // Basic check

        return (
            <TouchableOpacity
                style={[
                    styles.chapterItem,
                    { paddingLeft: 20 + item.level * 20 }
                ]}
                onPress={() => {
                    onSelectChapter(item.href);
                    onClose();
                }}
            >
                <Text
                    variant="body"
                    color={isCurrent ? 'primary' : 'text'}
                    fontWeight={isCurrent ? '700' : '400'}
                    numberOfLines={1}
                >
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SideDrawerModal visible={visible} onClose={onClose} position="left">
            <Box flex={1}>
                {/* Header */}
                <Box
                    padding="m"
                    borderBottomWidth={1}
                    borderBottomColor="border"
                    alignItems="center"
                    paddingTop="l" // Extra padding for status bar if drawer covers it
                >
                    <Text variant="title" fontSize={18} fontWeight="bold">目录</Text>
                </Box>

                <FlatList
                    data={flatChapters}
                    keyExtractor={(item) => item.id + item.href}
                    renderItem={renderChapterItem}
                    contentContainerStyle={{ paddingVertical: 10 }}
                    initialNumToRender={20}
                />
            </Box>
        </SideDrawerModal>
    );
};

const styles = StyleSheet.create({
    chapterItem: {
        paddingVertical: 14,
        paddingRight: 16,
    },
});

export default TOCDrawer;
