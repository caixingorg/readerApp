import { TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';

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

const BookItem: React.FC<BookItemProps> = ({
    book, viewMode, onPress, onLongPress, onMenuPress,
    isSelectionMode = false, isSelected = false,
    showFileSize = false, showFormatLabel = true
}) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(book.cover);
    const isGrid = viewMode === 'grid';

    // Helper to format size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Format Badge Color
    const getFormatColor = (type: string) => {
        switch (type) {
            case 'epub': return '#4CAF50'; // Green
            case 'pdf': return '#F44336';  // Red
            case 'txt': return '#2196F3';  // Blue
            default: return theme.colors.textSecondary;
        }
    };

    if (isGrid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={500}
                style={{ flex: 1, margin: 8 }}
                activeOpacity={0.8}
            >
                <Box
                    backgroundColor="card"
                    borderRadius="m"
                    overflow="hidden"
                    borderWidth={isSelected ? 2 : 1}
                    borderColor={isSelected ? 'primary' : 'border'}
                    elevation={2}
                    shadowOpacity={0.1}
                    shadowRadius={4}
                >
                    {/* Cover */}
                    <Box height={160} backgroundColor="foreground" alignItems="center" justifyContent="center">
                        {safeCover ? (
                            <Image
                                source={{ uri: safeCover }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="book" size={48} color={theme.colors.primary} />
                        )}
                        {/* Format Badge (Overlay) */}
                        {showFormatLabel && (
                            <Box position="absolute" top={4} right={4} backgroundColor="overlay" paddingHorizontal="s" borderRadius="s">
                                <Text variant="small" style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                    {book.fileType?.toUpperCase() || 'TXT'}
                                </Text>
                            </Box>
                        )}

                        {/* Selection Checkbox Overlay */}
                        {isSelectionMode && (
                            <Box
                                position="absolute"
                                top={0} left={0} right={0} bottom={0}
                                style={{ backgroundColor: isSelected ? 'rgba(0,0,0,0.1)' : 'transparent' }}
                                justifyContent="center"
                                alignItems="center"
                            >
                                <Box
                                    position="absolute"
                                    top={8} left={8}
                                    width={24} height={24}
                                    borderRadius="full"
                                    style={{
                                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.textSecondary
                                    }}
                                    borderWidth={2}
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Info */}
                    <Box padding="s">
                        <Text variant="body" numberOfLines={1} style={{ fontSize: 14, fontWeight: 'bold' }}>{book.title}</Text>
                        <Text variant="caption" numberOfLines={1} color="textSecondary" marginTop="xs">{book.author}</Text>
                        {book.progress > 0 && (
                            <Box height={3} backgroundColor="borderLight" borderRadius="full" marginTop="s">
                                <Box height={3} width={`${book.progress}%`} backgroundColor="primary" borderRadius="full" />
                            </Box>
                        )}
                    </Box>
                </Box>
            </TouchableOpacity>
        );
    }

    // List Layout (Existing refined)
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <Box
                backgroundColor="card"
                padding="m"
                marginBottom="s"
                borderRadius="m"
                borderWidth={isSelected ? 2 : 1}
                borderColor={isSelected ? 'primary' : 'border'}
                flexDirection="row"
                alignItems="center"
            >
                {/* Selection Checkbox (List) */}
                {isSelectionMode && (
                    <Box marginRight="m">
                        <Box
                            width={24} height={24}
                            borderRadius="full"
                            style={{
                                backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                                borderColor: isSelected ? theme.colors.primary : theme.colors.textSecondary
                            }}
                            borderWidth={2}
                            justifyContent="center"
                            alignItems="center"
                        >
                            {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                        </Box>
                    </Box>
                )}

                {/* Book Cover */}
                <Box
                    width={48}
                    height={64}
                    backgroundColor="foreground"
                    borderRadius="s"
                    marginRight="m"
                    justifyContent="center"
                    alignItems="center"
                    overflow="hidden"
                >
                    {safeCover ? (
                        <Image
                            source={{ uri: safeCover }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="book" size={24} color={theme.colors.primary} />
                    )}
                </Box>

                {/* Book info */}
                <Box flex={1}>
                    <Box flexDirection="row" alignItems="center" marginBottom="xs">
                        {showFormatLabel && (
                            <Box
                                backgroundColor="border"
                                paddingHorizontal="xs"
                                borderRadius="s"
                                marginRight="s"
                            >
                                <Text variant="small" style={{ fontSize: 10, fontWeight: 'bold' }}>
                                    {book.fileType?.toUpperCase() || 'TXT'}
                                </Text>
                            </Box>
                        )}
                        <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
                            {book.title}
                        </Text>
                    </Box>

                    <Text variant="caption" numberOfLines={1} marginBottom="xs">
                        {book.author}
                    </Text>

                    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                        {book.progress > 0 ? (
                            <Box flexDirection="row" alignItems="center" flex={1} marginRight="s">
                                <Box
                                    height={4}
                                    flex={1}
                                    backgroundColor="borderLight"
                                    borderRadius="full"
                                    marginRight="s"
                                >
                                    <Box
                                        height={4}
                                        width={`${book.progress}%`}
                                        backgroundColor="primary"
                                        borderRadius="full"
                                    />
                                </Box>
                                <Text variant="small" color="textTertiary">
                                    {Math.round(book.progress)}%
                                </Text>
                            </Box>
                        ) : <Box flex={1} />}

                        {showFileSize && book.size && (
                            <Text variant="small" color="textTertiary" marginLeft="s">
                                {formatSize(book.size)}
                            </Text>
                        )}
                    </Box>
                </Box>

                {/* Action buttons */}
                {!isSelectionMode && (
                    <Box flexDirection="row" alignItems="center" gap="m">
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                if (onMenuPress) onMenuPress();
                            }}
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </Box>
                )}
            </Box>
        </TouchableOpacity>
    );
};

export default BookItem;
