import React from 'react';
import { TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

interface NotebookFilterStripProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onOpenFilter: () => void;
}

const NotebookFilterStrip: React.FC<NotebookFilterStripProps> = ({
    activeTab,
    onTabChange,
    onOpenFilter,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    const filterTypes = ['All Items', 'Notes'];

    return (
        <Box marginBottom="s" paddingHorizontal="m" flexDirection="row" alignItems="center" gap="s">
            <Box flex={1}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filterTypes}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                    renderItem={({ item }) => {
                        const isActive = activeTab === item;

                        return (
                            <TouchableOpacity onPress={() => onTabChange(item)} activeOpacity={0.7}>
                                <Box
                                    paddingHorizontal="m"
                                    paddingVertical="s"
                                    borderRadius="full"
                                    backgroundColor={isActive ? 'primary' : 'cardSecondary'}
                                    borderWidth={1}
                                    borderColor={isActive ? 'primary' : 'border'}
                                    style={
                                        isActive
                                            ? {
                                                  shadowColor: theme.colors.primary,
                                                  shadowOffset: { width: 0, height: 4 },
                                                  shadowOpacity: 0.2,
                                                  shadowRadius: 8,
                                                  elevation: 3,
                                              }
                                            : undefined
                                    }
                                >
                                    <Text
                                        variant="caption"
                                        fontWeight="600"
                                        color={isActive ? 'white' : 'textSecondary'}
                                    >
                                        {item === 'All Items'
                                            ? t('notebook.types.all')
                                            : item === 'Notes'
                                              ? t('notebook.types.note')
                                              : item}
                                    </Text>
                                </Box>
                            </TouchableOpacity>
                        );
                    }}
                />
            </Box>

            <TouchableOpacity onPress={onOpenFilter} activeOpacity={0.7}>
                <Box
                    padding="s"
                    borderRadius="full"
                    backgroundColor="cardSecondary"
                    borderWidth={1}
                    borderColor="border"
                    width={36}
                    height={36}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Ionicons name="options-outline" size={18} color={theme.colors.textPrimary} />
                </Box>
            </TouchableOpacity>
        </Box>
    );
};

export default NotebookFilterStrip;
