import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

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
                    return (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => onToggle(option.id)}
                            activeOpacity={0.8}
                            style={{
                                paddingHorizontal: 20,
                                paddingVertical: 8,
                                backgroundColor: isActive ? theme.colors.card : 'transparent',
                                borderRadius: 999, // Full pill
                                shadowColor: isActive ? theme.colors.black : 'transparent',
                                shadowOpacity: isActive ? 0.05 : 0,
                                shadowRadius: 2,
                                elevation: isActive ? 1 : 0,
                            }}
                        >
                            <Text
                                fontSize={14}
                                fontWeight={isActive ? '600' : '500'}
                                color={isActive ? 'text' : 'textSecondary'}
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

export default ViewLayoutToggle;
