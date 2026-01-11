import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

export interface OptionItem {
    label: string;
    value: string;
    icon?: keyof typeof Ionicons.glyphMap;
    badge?: string; // e.g. "Ag" for fonts
}

interface SelectionModalProps {
    visible: boolean;
    title: string;
    options: OptionItem[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
    variant?: 'list' | 'grid'; // 'list' for fonts, 'grid' for animations
}

const SelectionModal: React.FC<SelectionModalProps> = ({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
    variant = 'list',
}) => {
    const theme = useTheme<Theme>();

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Box
                    backgroundColor="card"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    padding="l"
                    maxHeight="80%"
                    style={styles.modalContainer}
                >
                    {/* Handle Bar */}
                    <Box alignItems="center" marginBottom="m">
                        <Box width={40} height={4} backgroundColor="border" borderRadius="full" />
                    </Box>

                    {/* Header */}
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="l"
                    >
                        <View style={styles.headerPlaceholder} />
                        <Text variant="header" fontSize={18}>
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text color="primary" fontWeight="bold">
                                Done
                            </Text>
                        </TouchableOpacity>
                    </Box>

                    {/* Content */}
                    {variant === 'list' ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Box gap="m" paddingBottom="xl">
                                {options.map((option) => {
                                    const isSelected = selectedValue === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => onSelect(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <Box
                                                flexDirection="row"
                                                alignItems="center"
                                                padding="m"
                                                borderRadius="l"
                                                borderWidth={1}
                                                borderColor={isSelected ? 'primary' : 'borderLight'}
                                                backgroundColor={isSelected ? 'background' : 'card'}
                                            >
                                                {!!option.badge && (
                                                    <Box
                                                        width={40}
                                                        height={40}
                                                        borderRadius="full"
                                                        backgroundColor="borderLight"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        marginRight="m"
                                                    >
                                                        <Text fontWeight="medium" fontSize={16}>
                                                            {option.badge}
                                                        </Text>
                                                    </Box>
                                                )}
                                                <Text
                                                    variant="body"
                                                    flex={1}
                                                    fontWeight={isSelected ? 'bold' : 'regular'}
                                                >
                                                    {option.label}
                                                </Text>
                                                {isSelected ? (
                                                    <Box
                                                        width={24}
                                                        height={24}
                                                        borderRadius="full"
                                                        backgroundColor="primary"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={16}
                                                            color="white"
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Box
                                                        width={24}
                                                        height={24}
                                                        borderRadius="full"
                                                        borderWidth={1}
                                                        borderColor="border"
                                                    />
                                                )}
                                            </Box>
                                        </TouchableOpacity>
                                    );
                                })}
                            </Box>
                        </ScrollView>
                    ) : (
                        // Grid Variant (for Animations etc)
                        <Box flexDirection="row" flexWrap="wrap" gap="m" paddingBottom="xl">
                            {options.map((option) => {
                                const isSelected = selectedValue === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => onSelect(option.value)}
                                        style={styles.gridItem}
                                        activeOpacity={0.7}
                                    >
                                        <Box
                                            alignItems="center"
                                            padding="l"
                                            borderRadius="l"
                                            style={[
                                                styles.gridItemContainer,
                                                {
                                                    backgroundColor: isSelected
                                                        ? theme.colors.secondary
                                                        : theme.colors.cardSecondary,
                                                    borderWidth: isSelected ? 2 : 0,
                                                    borderColor: theme.colors.primary,
                                                },
                                            ]}
                                        >
                                            {/* Checkmark Badge for Grid */}
                                            {isSelected && (
                                                <Box position="absolute" top={8} right={8}>
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={20}
                                                        color={theme.colors.primary}
                                                    />
                                                </Box>
                                            )}

                                            {!!option.icon && (
                                                <Ionicons
                                                    name={option.icon}
                                                    size={32}
                                                    color={
                                                        isSelected
                                                            ? theme.colors.primary
                                                            : theme.colors.textSecondary
                                                    }
                                                />
                                            )}
                                            <Text
                                                variant="body"
                                                marginTop="m"
                                                style={{
                                                    color: isSelected
                                                        ? theme.colors.primary
                                                        : theme.colors.textSecondary,
                                                    fontWeight: isSelected ? '700' : '400',
                                                }}
                                            >
                                                {option.label}
                                            </Text>
                                        </Box>
                                    </TouchableOpacity>
                                );
                            })}
                        </Box>
                    )}

                    {/* Cancel Button */}
                    <TouchableOpacity onPress={onClose}>
                        <Box
                            backgroundColor="borderLight"
                            padding="m"
                            borderRadius="l"
                            alignItems="center"
                        >
                            <Text fontWeight="bold">Cancel</Text>
                        </Box>
                    </TouchableOpacity>
                </Box>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    headerPlaceholder: {
        width: 40,
    },
    gridItem: {
        width: '47%',
    },
    gridItemContainer: {
        width: '100%',
    },
});

export default SelectionModal;
