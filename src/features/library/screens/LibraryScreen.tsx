import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Box from '@/components/Box';
import ScreenLayout from '@/components/ScreenLayout';
import ActionSheetModal from '@/components/ActionSheetModal';
import EditBookModal from '@/features/library/components/EditBookModal';
import LibraryEditorialHeader from '@/features/library/components/LibraryEditorialHeader';
import LibraryList from '@/features/library/components/LibraryList';
import { useLibraryLogic } from '@/features/library/hooks/useLibraryLogic';

const LibraryScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const logic = useLibraryLogic();

    return (
        <ScreenLayout>
            <LibraryEditorialHeader streak={logic.streak} onSearchPress={logic.handleSearchPress} />

            <Box flex={1}>
                <LibraryList
                    books={logic.books}
                    refreshing={logic.refreshing}
                    onRefresh={logic.onRefresh}
                    onBookPress={logic.handleBookPress}
                    onMenuAction={logic.handleMenuAction}
                    onFilterPress={logic.handleFilterPress}
                    onImportPress={logic.handleImportPress}
                    theme={logic.theme}
                />
            </Box>

            {/* Import FAB */}
            <Box position="absolute" bottom={insets.bottom + 80} right={24}>
                <TouchableOpacity onPress={logic.handleImportPress} activeOpacity={0.8}>
                    <Box
                        width={56}
                        height={56}
                        borderRadius="full"
                        backgroundColor="primary"
                        justifyContent="center"
                        alignItems="center"
                        style={{
                            shadowColor: 'black',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </Box>
                </TouchableOpacity>
            </Box>

            <EditBookModal
                key={logic.editingBook?.id}
                visible={!!logic.editingBook}
                book={logic.editingBook}
                onClose={() => logic.setEditingBook(null)}
                onSave={logic.handleSaveBook}
            />

            <ActionSheetModal
                visible={logic.actionSheet.visible}
                title={logic.actionSheet.title}
                actions={logic.actionSheet.actions}
                onClose={logic.actionSheet.close}
            />
        </ScreenLayout>
    );
};

export default LibraryScreen;
