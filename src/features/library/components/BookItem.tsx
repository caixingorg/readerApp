import { TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import Card from '@/components/Card';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { useTranslation } from 'react-i18next';
import BookCover from './BookCover';

interface BookItemProps {
    book: Book;
    viewMode: 'grid' | 'list';
    onPress: () => void;
    onLongPress?: () => void;
    onMenuPress?: () => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    showFileSize?: boolean;
    showFormatLabel?: boolean;
}

const CircularProgress = ({ progress }: { progress: number }) => {
    const theme = useTheme<Theme>();
    const dashArray = `${progress}, 100`;

    return (
        <Box width={24} height={24} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Svg viewBox="0 0 36 36" width="100%" height="100%">
                <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.colors.border}
                    strokeWidth="4"
                />
                <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth="4"
                    strokeDasharray={dashArray}
                />
            </Svg>
        </Box>
    );
};

const BookItem: React.FC<BookItemProps> = ({
    book,
    viewMode,
    onPress,
    onLongPress,
    onMenuPress,
    isSelectionMode = false,
    isSelected = false,
    showFileSize = false,
    showFormatLabel = true,
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const isGrid = viewMode === 'grid';

    // Helper to format size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isFinished = book.progress >= 99;
    const isUnread = book.progress < 1;

    const { width } = useWindowDimensions();
    const itemWidth = (width - (theme.spacing.s || 8) * 2 - 24) / 2;

    const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

    if (isGrid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onLongPress?.();
                }}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                <Box
                    overflow="hidden"
                    borderRadius="m"
                    shadowColor="shadow"
                    shadowOpacity={0.1}
                    shadowRadius={4}
                    backgroundColor="cardPrimary"
                    width={itemWidth}
                    margin="xs"
                    borderWidth={isSelected ? 2 : 0}
                    borderColor={isSelected ? 'primary' : 'transparent'}
                >
                    {/* Cover Area - 3/4 Aspect Ratio */}
                    <Box
                        aspectRatio={3 / 4}
                        backgroundColor="cardSecondary"
                        overflow="hidden"
                        position="relative"
                    >
                        <BookCover
                            cover={book.cover}
                            title={book.title}
                            width="100%"
                            height="100%"
                            borderRadius="none"
                        >
                            {/* Format Badge */}
                            {showFormatLabel && (
                                <Box
                                    backgroundColor="warning"
                                    position="absolute"
                                    top={8}
                                    right={8}
                                    paddingHorizontal="xs"
                                    paddingVertical="none"
                                    style={{ paddingVertical: 2 }} // fine tune
                                    borderRadius="s"
                                    zIndex={10}
                                    shadowColor="shadow"
                                    shadowOpacity={0.2}
                                >
                                    <Text color="white" fontSize={10} fontWeight="bold">
                                        {book.fileType?.toUpperCase() || 'TXT'}
                                    </Text>
                                </Box>
                            )}

                            {/* Selection Overlay */}
                            {isSelectionMode && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    bottom={0}
                                    left={0}
                                    right={0}
                                    zIndex={10}
                                    alignItems="center"
                                    justifyContent="center"
                                    backgroundColor={isSelected ? 'overlay' : 'transparent'} // Using overlay (semi-transparent black)
                                    style={
                                        isSelected
                                            ? { backgroundColor: 'rgba(0,0,0,0.2)' }
                                            : undefined
                                    }
                                >
                                    <Box
                                        width={24}
                                        height={24}
                                        borderRadius="full"
                                        borderWidth={2}
                                        alignItems="center"
                                        justifyContent="center"
                                        position="absolute"
                                        top={8}
                                        left={8}
                                        backgroundColor={isSelected ? 'primary' : 'cardPrimary'}
                                        borderColor={isSelected ? 'primary' : 'textTertiary'}
                                    >
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={14} color="white" />
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </BookCover>
                    </Box>

                    {/* Info Area */}
                    <Box padding="s">
                        <Box
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            gap="s"
                            marginBottom="xs"
                        >
                            <Text
                                numberOfLines={2}
                                variant="body"
                                fontWeight="500"
                                lineHeight={20}
                                style={{ flex: 1, fontSize: 16 }}
                                color="textPrimary"
                            >
                                {book.title}
                            </Text>

                            {/* Progress Ring */}
                            {!isFinished && !isUnread && (
                                <CircularProgress progress={book.progress} />
                            )}
                            {isFinished && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={20}
                                    color={theme.colors.primary}
                                />
                            )}
                        </Box>

                        <Text numberOfLines={1} color="textSecondary" fontSize={14}>
                            {book.author || t('book.unknown_author')}
                        </Text>
                    </Box>
                </Box>
            </TouchableOpacity>
        );
    }

    // List Layout
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onLongPress?.();
            }}
            activeOpacity={0.7}
        >
            <Card
                variant="flat"
                flexDirection="row"
                alignItems="center"
                padding="s"
                marginBottom="s"
                borderWidth={1}
                borderColor={isSelected ? 'primary' : 'transparent'}
                backgroundColor={isSelected ? 'cardSecondary' : 'cardPrimary'} // was primary-50... use cardSecondary for slight tint
                style={isSelected ? { backgroundColor: theme.colors.secondary } : undefined}
            >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <Box marginRight="s">
                        <Box
                            width={20}
                            height={20}
                            borderRadius="full"
                            borderWidth={2}
                            alignItems="center"
                            justifyContent="center"
                            backgroundColor={isSelected ? 'primary' : 'transparent'}
                            borderColor={isSelected ? 'primary' : 'textTertiary'}
                        >
                            {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                        </Box>
                    </Box>
                )}

                {/* Cover */}
                <Box marginRight="m">
                    <BookCover
                        cover={book.cover}
                        title={book.title}
                        width={48}
                        height={64}
                        borderRadius="s"
                    >
                        {isUnread && !isFinished && (
                            <Box
                                position="absolute"
                                top={4}
                                left={4}
                                width={8}
                                height={8}
                                backgroundColor="error"
                                borderRadius="full"
                                borderWidth={1}
                                borderColor="cardPrimary"
                            />
                        )}
                    </BookCover>
                </Box>

                {/* Info */}
                <Box flex={1} style={{ minWidth: 0, overflow: 'hidden' }}>
                    {/* Title Row */}
                    <Box flexDirection="row" alignItems="center" marginBottom="xs">
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            variant="body"
                            fontWeight="600"
                            color="textPrimary"
                            style={{ flex: 1 }}
                        >
                            {book.title}
                        </Text>
                        {isFinished && (
                            <Box marginLeft="xs">
                                <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={theme.colors.primary}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Author */}
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        variant="small"
                        color="textSecondary"
                        marginBottom="s"
                        fontWeight="500"
                    >
                        {book.author || t('book.unknown_author')}
                    </Text>

                    {/* Progress/Status Row */}
                    <Box flexDirection="row" alignItems="center">
                        {!isFinished && book.progress > 0 ? (
                            <Box flexDirection="row" alignItems="center" flex={1} marginRight="m">
                                <Box
                                    flex={1}
                                    height={4}
                                    backgroundColor="border"
                                    borderRadius="full"
                                    marginRight="s"
                                    overflow="hidden"
                                >
                                    <Box
                                        height="100%"
                                        backgroundColor="primary"
                                        borderRadius="full"
                                        style={{ width: `${book.progress}%` }}
                                    />
                                </Box>
                                <Text
                                    variant="small"
                                    fontSize={10}
                                    color="textTertiary"
                                    fontWeight="bold"
                                >
                                    {Math.round(book.progress)}%
                                </Text>
                            </Box>
                        ) : isFinished ? (
                            <Text
                                variant="small"
                                fontSize={10}
                                color="success"
                                fontWeight="bold"
                                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                            >
                                {t('book.status.completed')}
                            </Text>
                        ) : (
                            <Text
                                variant="small"
                                fontSize={10}
                                color="textTertiary"
                                fontWeight="bold"
                                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                            >
                                {t('book.status.unread')}
                            </Text>
                        )}

                        {showFileSize && book.size && (
                            <Text variant="small" fontSize={10} color="textTertiary" marginLeft="s">
                                {formatSize(book.size)}
                            </Text>
                        )}
                    </Box>
                </Box>

                {/* Menu Button */}
                {!isSelectionMode && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onMenuPress?.();
                        }}
                        style={{ padding: 8, marginLeft: 8 }}
                        hitSlop={hitSlop}
                    >
                        <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color={theme.colors.textTertiary}
                        />
                    </TouchableOpacity>
                )}
            </Card>
        </TouchableOpacity>
    );
};

export default BookItem;
