import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

export type FilterType = 'all' | 'unread' | 'reading' | 'finished' | 'favorites';

interface CategoryFilterProps {
    activeFilter: FilterType;
    counts: Record<FilterType, number>;
    onSelect: (filter: FilterType) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeFilter, counts, onSelect }) => {
    const theme = useTheme<Theme>();

    const filters: { id: FilterType; label: string }[] = [
        { id: 'all', label: '全部' },
        { id: 'unread', label: '未读' },
        { id: 'reading', label: '在读' },
        { id: 'finished', label: '已完成' },
        { id: 'favorites', label: '收藏' }, // Placeholder for future implementation
    ];

    return (
        <Box
            paddingVertical="s"
            backgroundColor="mainBackground" // Ensure background is solid for sticky header
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                centerContent={true}
                contentContainerStyle={{
                    paddingHorizontal: theme.spacing.m,
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {filters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    const count = counts[filter.id];
                    const label = filter.id === 'all' ? filter.label : `${filter.label} ${count || 0}`;

                    return (
                        <TouchableOpacity
                            key={filter.id}
                            onPress={() => onSelect(filter.id)}
                            activeOpacity={0.7}
                            style={{ marginRight: 8 }}
                        >
                            <Box
                                height={32}
                                paddingHorizontal="m"
                                borderRadius="l"
                                backgroundColor={isActive ? 'primary' : 'cardSecondary'}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Text
                                    fontSize={14}
                                    fontWeight="500"
                                    color={isActive ? 'white' : 'textSecondary'}
                                >
                                    {label}
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </Box>
    );
};

export default CategoryFilter;
