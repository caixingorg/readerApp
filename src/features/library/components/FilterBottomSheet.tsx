import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
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
    counts
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
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <Box flex={1} justifyContent="flex-end">
                <Box
                    backgroundColor="background"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    padding="l"
                    paddingBottom="xl"
                    className="rounded-t-[32px]"
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
                        <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
                            <Text variant="header" fontSize={20} fontWeight="bold">Filter Options</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
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
                                    borderColor={selectedFilter === option.id ? "primary" : "border"}
                                    backgroundColor={selectedFilter === option.id ? "primary" : "background"}
                                    className={clsx(
                                        "px-4 py-3",
                                        selectedFilter === option.id ? "bg-primary-500" : "bg-white dark:bg-gray-800"
                                    )}
                                >
                                    <Text
                                        fontSize={14}
                                        fontWeight="600"
                                        marginRight="s"
                                        color={selectedFilter === option.id ? "white" : "textPrimary"}
                                        className={clsx(
                                            "text-sm font-semibold mr-2",
                                            selectedFilter === option.id ? "text-white" : "text-gray-600 dark:text-gray-300"
                                        )}
                                    >
                                        {option.label}
                                    </Text>
                                    {counts[option.id] > 0 && (
                                        <Box
                                            paddingHorizontal="xs"
                                            paddingVertical="xs"
                                            borderRadius="s"
                                            minWidth={20}
                                            alignItems="center"
                                            backgroundColor={selectedFilter === option.id ? "secondary" : "borderLight"}
                                            className={clsx(
                                                "px-1.5 py-0.5 rounded-md min-w-[20px] items-center",
                                                selectedFilter === option.id ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
                                            )}
                                        >
                                            <Text
                                                fontSize={10}
                                                fontWeight="bold"
                                                color={selectedFilter === option.id ? "white" : "textSecondary"}
                                                className={clsx(
                                                    "text-[10px] font-bold",
                                                    selectedFilter === option.id ? "text-white" : "text-gray-500 dark:text-gray-400"
                                                )}
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
                        <TouchableOpacity
                            onPress={handleReset}
                            className="flex-1"
                        >
                            <Box
                                padding="m"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="m"
                                backgroundColor="cardSecondary"
                                className="p-4 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800"
                            >
                                <Text variant="body" fontWeight="bold" color="textSecondary">Reset</Text>
                            </Box>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleApply}
                            className="flex-[2]"
                        >
                            <Box
                                padding="m"
                                alignItems="center"
                                justifyContent="center"
                                borderRadius="m"
                                backgroundColor="primary"
                                className="p-4 items-center justify-center rounded-2xl bg-primary-500"
                            >
                                <Text variant="body" fontWeight="bold" color="white">Apply Filters</Text>
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
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    }
});

export default FilterBottomSheet;
