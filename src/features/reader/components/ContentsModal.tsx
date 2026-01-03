import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'contents' | 'bookmarks' | 'notes';

interface ContentsModalProps {
    visible: boolean;
    onClose: () => void;
    chapters: EpubChapter[];
    currentHref?: string;
    onSelectChapter: (href: string) => void;
}

const ContentsModal: React.FC<ContentsModalProps> = ({
    visible,
    onClose,
    chapters,
    currentHref,
    onSelectChapter,
}) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<Tab>('contents');

    // Helper to flatten nested chapters if needed, or render recursively.
    // For FlatList, flattening is easier.
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
        // Simple check: current if href matches or base href matches
        // Real logic might compare index, but href is safer for exact match
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

    const renderTab = (tab: Tab, label: string) => (
        <TouchableOpacity
            style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <Text
                variant="body"
                fontWeight={activeTab === tab ? '700' : '400'}
                color={activeTab === tab ? 'primary' : 'text'}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Prevent click through */}
            </TouchableOpacity>

            <Box
                height="80%"
                backgroundColor="background"
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                overflow="hidden"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    paddingBottom: insets.bottom,
                }}
            >
                {/* Header / Tabs */}
                <Box
                    flexDirection="row"
                    borderBottomWidth={1}
                    borderBottomColor="border"
                    height={50}
                    alignItems="center"
                >
                    {renderTab('contents', '目录')}
                    {renderTab('bookmarks', '书签')}
                    {renderTab('notes', '笔记')}
                </Box>

                {/* Content */}
                <Box flex={1}>
                    {activeTab === 'contents' ? (
                        <FlatList
                            data={flatChapters}
                            keyExtractor={(item) => item.id + item.href}
                            renderItem={renderChapterItem}
                            contentContainerStyle={{ paddingVertical: 10 }}
                            initialNumToRender={20}
                        />
                    ) : (
                        <Box flex={1} justifyContent="center" alignItems="center">
                            <Ionicons name="construct-outline" size={48} color={theme.colors.textSecondary} />
                            <Text variant="body" color="textSecondary" marginTop="s">
                                {activeTab === 'bookmarks' ? '书签功能开发中' : '笔记功能开发中'}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    chapterItem: {
        paddingVertical: 12,
        paddingRight: 16,
    },
    tab: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ContentsModal;
