import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

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
    onApply,
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
                                Sort By
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

                    <Box marginBottom="xl">
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedSort(option.id)}
                            >
                                <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    padding="m"
                                    marginBottom="s"
                                    borderRadius="m"
                                    borderWidth={1}
                                    borderColor={selectedSort === option.id ? 'primary' : 'border'}
                                    style={{
                                        backgroundColor:
                                            selectedSort === option.id
                                                ? 'rgba(56, 189, 248, 0.1)' // Light blue tint
                                                : theme.colors.cardPrimary,
                                    }}
                                >
                                    <Text
                                        variant="body"
                                        fontWeight="600"
                                        color={
                                            selectedSort === option.id ? 'primary' : 'textPrimary'
                                        }
                                    >
                                        {option.label}
                                    </Text>
                                    {selectedSort === option.id && (
                                        <Ionicons
                                            name="checkmark"
                                            size={20}
                                            color={theme.colors.primary}
                                        />
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
                                    Apply
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

export default SortBottomSheet;
