import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

export type ViewLayout = 'carousel' | 'list';

interface ViewLayoutToggleProps {
    activeLayout: ViewLayout;
    onToggle: (layout: ViewLayout) => void;
}

const ViewLayoutToggle: React.FC<ViewLayoutToggleProps> = ({ activeLayout, onToggle }) => {
    const theme = useTheme<Theme>();

    const options: { id: ViewLayout; label: string }[] = [
        { id: 'carousel', label: 'Slider' },
        { id: 'list', label: 'List' },
    ];

    return (
        <Box
            flexDirection="row"
            justifyContent="flex-start"
            alignItems="center"
            paddingVertical="s"
            paddingHorizontal="m"
        >
            <Box
                flexDirection="row"
                backgroundColor="borderLight"
                borderRadius="full"
                padding="xs"
                gap="xs"
            >
                {options.map((option) => {
                    const isActive = activeLayout === option.id;

                    const itemStyle = [
                        styles.item,
                        {
                            backgroundColor: isActive ? theme.colors.card : 'transparent',
                            shadowColor: isActive ? theme.colors.black : 'transparent',
                            shadowOpacity: isActive ? 0.05 : 0,
                        }
                    ];

                    const textWeight = isActive ? '600' : '500' as const;
                    const textColor = isActive ? 'textPrimary' : 'textSecondary' as const;

                    return (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => onToggle(option.id)}
                            activeOpacity={0.8}
                            style={itemStyle}
                        >
                            <Text
                                fontSize={14}
                                fontWeight={textWeight}
                                color={textColor}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    item: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 999,
        shadowRadius: 2,
        elevation: 1, // Let elevation be 1 even if transparent background, or wrap if critical
    }
});

export default ViewLayoutToggle;
