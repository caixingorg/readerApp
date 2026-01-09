import React, { useState } from 'react';
import { Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { Book } from '../../../services/database/types';

interface FilterOptions {
    dateRange: '7days' | '30days' | 'all' | 'custom';
    bookIds: string[];
    tags: string[];
    type: 'All Items' | 'Highlights' | 'Notes' | 'Bookmarks';
}

interface NotebookFilterModalProps {
    visible: boolean;
    onClose: () => void;
    books: Book[];
    currentFilters: FilterOptions;
    onApply: (filters: FilterOptions) => void;
}

const TAGS = ['#Vocabulary', '#Inspiration', '#PlotPoint'];

const NotebookFilterModal: React.FC<NotebookFilterModalProps> = ({
    visible,
    onClose,
    books,
    currentFilters,
    onApply
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const [filters, setFilters] = useState<FilterOptions>(currentFilters);

    const DATE_RANGES = [
        { id: '7days', label: t('notebook.dates.7days') },
        { id: '30days', label: t('notebook.dates.30days') },
        { id: 'all', label: t('notebook.dates.all') },
        { id: 'custom', label: t('notebook.dates.custom') },
    ];

    const TYPES = [
        { id: 'All Items', label: t('notebook.types.all') },
        { id: 'Highlights', label: t('notebook.types.highlight') },
        { id: 'Notes', label: t('notebook.types.note') },
        { id: 'Bookmarks', label: t('notebook.types.bookmark') }
    ];

    const toggleBook = (id: string) => {
        setFilters(prev => ({
            ...prev,
            bookIds: prev.bookIds.includes(id)
                ? prev.bookIds.filter(b => b !== id)
                : [...prev.bookIds, id]
        }));
    };

    const toggleAllBooks = () => {
        setFilters(prev => ({
            ...prev,
            bookIds: prev.bookIds.length === books.length ? [] : books.map(b => b.id)
        }));
    };

    const toggleTag = (tag: string) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Box flex={1} justifyContent="flex-end">
                <Box
                    backgroundColor="background"
                    borderTopLeftRadius="l"
                    borderTopRightRadius="l"
                    height="70%"
                    padding="m"
                >
                    {/* Header */}
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
                        <Box>
                            {/* <Text variant="subheader">{t('notebook.filter.title')}</Text> */}
                            {/* <Text variant="caption" color="textSecondary">{t('notebook.filter.subtitle')}</Text> */}
                        </Box>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </Box>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Type Filter */}
                        <Text variant="caption" fontWeight="bold" marginBottom="s" color="textSecondary">{t('notebook.filter.type')}</Text>
                        <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="l">
                            {TYPES.map(type => {
                                const isSelected = filters.type === type.id;
                                return (
                                    <TouchableOpacity
                                        key={type.id}
                                        onPress={() => setFilters(prev => ({ ...prev, type: type.id as any }))}
                                        style={{
                                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardSecondary,
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 20,
                                            borderWidth: 0,
                                            minWidth: '30%',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text
                                            color={isSelected ? 'textInverse' : 'textSecondary'}
                                            fontWeight="600"
                                            fontSize={14}
                                        >
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </Box>

                        {/* Date Range */}
                        <Text variant="caption" fontWeight="bold" marginBottom="s" color="textSecondary">{t('notebook.filter.date')}</Text>
                        <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="l">
                            {DATE_RANGES.map(range => {
                                const isSelected = filters.dateRange === range.id;
                                return (
                                    <TouchableOpacity
                                        key={range.id}
                                        onPress={() => setFilters(prev => ({ ...prev, dateRange: range.id as any }))}
                                        style={{
                                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardSecondary,
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 20,
                                            borderWidth: 0,
                                            minWidth: '45%',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text
                                            color={isSelected ? 'textInverse' : 'textSecondary'}
                                            fontWeight="600"
                                            fontSize={14}
                                        >
                                            {range.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </Box>

                        {/* Filter by Book */}
                        {/* ... Rest of existing book filter code ... */}
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                            <Text variant="caption" fontWeight="bold" color="textSecondary">{t('notebook.filter.book')}</Text>
                            <TouchableOpacity onPress={toggleAllBooks}>
                                <Text color="primary" fontSize={12} fontWeight="bold">
                                    {filters.bookIds.length === books.length ? t('notebook.filter.deselect_all') : t('notebook.filter.select_all')}
                                </Text>
                            </TouchableOpacity>
                        </Box>
                        <Box marginBottom="l">
                            {books.map(book => (
                                <TouchableOpacity
                                    key={book.id}
                                    onPress={() => toggleBook(book.id)}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                                >
                                    <Box
                                        width={24}
                                        height={24}
                                        borderRadius="s"
                                        borderWidth={2}
                                        borderColor={filters.bookIds.includes(book.id) ? "primary" : "border"}
                                        backgroundColor={filters.bookIds.includes(book.id) ? "primary" : "transparent"}
                                        alignItems="center"
                                        justifyContent="center"
                                        marginRight="m"
                                    >
                                        {filters.bookIds.includes(book.id) && (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        )}
                                    </Box>
                                    <Box flex={1}>
                                        <Text fontWeight="bold" fontSize={16}>{book.title}</Text>
                                        <Text color="textSecondary" fontSize={12}>{book.author}</Text>
                                    </Box>
                                </TouchableOpacity>
                            ))}
                            {books.length > 5 && (
                                <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }}>
                                    <Text color="textSecondary" fontSize={12}>{t('notebook.filter.show_more', { count: books.length - 5 })}</Text>
                                </TouchableOpacity>
                            )}
                        </Box>
                    </ScrollView>

                    {/* Footer Actions */}
                    <Box flexDirection="row" gap="m" paddingVertical="s">
                        <Box flex={1}>
                            <Button
                                title={t('notebook.filter.reset')}
                                variant="secondary"
                                fullWidth
                                onPress={() => setFilters({ type: 'All Items', dateRange: 'all', bookIds: [], tags: [] } as any)}
                            />
                        </Box>
                        <Box flex={1}>
                            <Button
                                title={t('notebook.filter.apply')}
                                variant="primary"
                                fullWidth
                                onPress={() => onApply(filters)}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default NotebookFilterModal;
