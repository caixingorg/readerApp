import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

export type FilterStatus = 'all' | 'reading' | 'unread' | 'finished';

interface FilterBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    currentFilter: FilterStatus;
    onApply: (filter: FilterStatus) => void;
    counts: Record<FilterStatus, number>;
}

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
    visible,
    onClose,
    currentFilter,
    onApply,
    counts,
}) => {
    const theme = useTheme<Theme>();
    const [selectedFilter, setSelectedFilter] = useState<FilterStatus>(currentFilter);

    const filterOptions: { id: FilterStatus; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'reading', label: 'Reading' },
        { id: 'unread', label: 'Unread' },
        { id: 'finished', label: 'Finished' },
    ];

    useEffect(() => {
        if (visible) {
            setSelectedFilter(currentFilter);
        }
    }, [visible, currentFilter]);

    const handleApply = () => {
        onApply(selectedFilter);
        onClose();
    };

    const handleReset = () => {
        setSelectedFilter('all');
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <Box flex={1} justifyContent="flex-end">
                <Box
                    backgroundColor="background"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    padding="l"
                    paddingBottom="xl"
                    style={styles.modalContent}
                >
                    <Box alignItems="center" marginBottom="l">
                        <Box
                            width={48}
                            height={6}
                            backgroundColor="borderLight"
                            borderRadius="full"
                            marginBottom="m"
                        />
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="space-between"
                            width="100%"
                        >
                            <Text variant="header" fontSize={20} fontWeight="bold">
                                Filter Options
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </Box>
                    </Box>

                    <Text
                        variant="caption"
                        fontWeight="bold"
                        color="textSecondary"
                        textTransform="uppercase"
                        letterSpacing={1}
                        marginBottom="m"
                    >
                        Filter By Status
                    </Text>

                    <Box flexDirection="row" flexWrap="wrap" gap="m" marginBottom="xl">
                        {filterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedFilter(option.id)}
                            >
                                <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    paddingHorizontal="m"
                                    paddingVertical="m"
                                    borderRadius="m"
                                    borderWidth={1}
                                    borderColor={
                                        selectedFilter === option.id ? 'primary' : 'border'
                                    }
                                    style={{
                                        backgroundColor:
                                            selectedFilter === option.id
                                                ? theme.colors.primary
                                                : theme.colors.cardPrimary,
                                    }}
                                >
                                    <Text
                                        fontSize={14}
                                        fontWeight="600"
                                        marginRight="s"
                                        color={
                                            selectedFilter === option.id ? 'white' : 'textPrimary'
                                        }
                                    >
                                        {option.label}
                                    </Text>
                                    {counts[option.id] > 0 && (
                                        <Box
                                            paddingHorizontal="s"
                                            paddingVertical="xs"
                                            borderRadius="s"
                                            minWidth={20}
                                            alignItems="center"
                                            style={{
                                                backgroundColor:
                                                    selectedFilter === option.id
                                                        ? 'rgba(255,255,255,0.2)'
                                                        : theme.colors.cardSecondary,
                                            }}
                                        >
                                            <Text
                                                fontSize={10}
                                                fontWeight="bold"
                                                color={
                                                    selectedFilter === option.id
                                                        ? 'white'
                                                        : 'textSecondary'
                                                }
                                            >
                                                {counts[option.id]}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </TouchableOpacity>
                        ))}
                    </Box>

                    <Box flexDirection="row" gap="m">
                        <TouchableOpacity onPress={handleReset} style={{ flex: 1 }}>
                            <Box
                                padding="m"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="m"
                                backgroundColor="cardSecondary"
                            >
                                <Text variant="body" fontWeight="bold" color="textSecondary">
                                    Reset
                                </Text>
                            </Box>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleApply} style={{ flex: 2 }}>
                            <Box
                                padding="m"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="m"
                                backgroundColor="primary"
                            >
                                <Text variant="body" fontWeight="bold" color="white">
                                    Apply Filters
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default FilterBottomSheet;
