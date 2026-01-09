import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';

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
            <View className="flex-1 justify-end">
                <View
                    className="bg-white dark:bg-gray-900 rounded-t-[32px] p-6 pb-10"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
                        <View className="flex-row items-center justify-between w-full">
                            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">Filter Options</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filter By Status</Text>

                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {filterOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedFilter(option.id)}
                                className={clsx(
                                    "flex-row items-center px-4 py-3 rounded-xl border",
                                    selectedFilter === option.id
                                        ? "bg-primary-500 border-primary-500"
                                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                )}
                            >
                                <Text className={clsx(
                                    "text-sm font-semibold mr-2",
                                    selectedFilter === option.id ? "text-white" : "text-gray-600 dark:text-gray-300"
                                )}>
                                    {option.label}
                                </Text>
                                {counts[option.id] > 0 && (
                                    <View className={clsx(
                                        "px-1.5 py-0.5 rounded-md min-w-[20px] items-center",
                                        selectedFilter === option.id ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
                                    )}>
                                        <Text className={clsx(
                                            "text-[10px] font-bold",
                                            selectedFilter === option.id ? "text-white" : "text-gray-500 dark:text-gray-400"
                                        )}>
                                            {counts[option.id]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={handleReset}
                            className="flex-1 p-4 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800"
                        >
                            <Text className="text-base font-bold text-gray-600 dark:text-gray-300">Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleApply}
                            className="flex-[2] p-4 items-center justify-center rounded-2xl bg-primary-500"
                        >
                            <Text className="text-base font-bold text-white">Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default FilterBottomSheet;
