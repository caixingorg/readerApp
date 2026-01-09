import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';

export type SortType = 'recent' | 'scan' | 'title' | 'author';

interface SortBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    currentSort: SortType;
    onApply: (sort: SortType) => void;
}

const SORT_OPTIONS: { id: SortType; label: string }[] = [
    { id: 'recent', label: 'Last Read' },
    { id: 'scan', label: 'Date Added' },
    { id: 'title', label: 'Title (A-Z)' },
    { id: 'author', label: 'Author Name' },
];

const SortBottomSheet: React.FC<SortBottomSheetProps> = ({
    visible,
    onClose,
    currentSort,
    onApply
}) => {
    const theme = useTheme<Theme>();
    const [selectedSort, setSelectedSort] = useState<SortType>(currentSort);

    useEffect(() => {
        if (visible) {
            setSelectedSort(currentSort);
        }
    }, [visible, currentSort]);

    const handleApply = () => {
        onApply(selectedSort);
        onClose();
    };

    const handleReset = () => {
        setSelectedSort('recent');
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
                            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">Sort By</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-8">
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedSort(option.id)}
                                className={clsx(
                                    "flex-row items-center justify-between p-4 mb-3 rounded-2xl border",
                                    selectedSort === option.id
                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                                        : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800"
                                )}
                            >
                                <Text className={clsx(
                                    "text-base font-semibold",
                                    selectedSort === option.id ? "text-primary-600" : "text-gray-600 dark:text-gray-300"
                                )}>
                                    {option.label}
                                </Text>
                                {selectedSort === option.id && (
                                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
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
                            <Text className="text-base font-bold text-white">Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default SortBottomSheet;
