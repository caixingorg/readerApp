import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import ScreenLayout from '@/components/ScreenLayout';
import ActionSheetModal from '@/components/ActionSheetModal';
import EditBookModal from '@/features/library/components/EditBookModal';
import LibraryList from '@/features/library/components/LibraryList';
import { useLibraryLogic } from '@/features/library/hooks/useLibraryLogic';

const LibraryScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const logic = useLibraryLogic();
    const { t } = useTranslation();

    return (
        <ScreenLayout
            title={t('library.title')}
            subtitle={new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            })}
            headerRight={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: logic.theme.spacing.m,
                            paddingVertical: logic.theme.spacing.s,
                            borderRadius: 999, // full
                            marginRight: logic.theme.spacing.m,
                            backgroundColor: logic.theme.colors.cardSecondary,
                        }}
                    >
                        <Ionicons name="flame" size={16} color={logic.theme.colors.primary} />
                        <Text style={{
                            marginLeft: logic.theme.spacing.s,
                            color: logic.theme.colors.textPrimary,
                            fontSize: 12,
                            fontWeight: 'bold'
                        }}>
                            {logic.streak} {t('stats.streak')}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={logic.handleSearchPress}>
                        <Ionicons name="search" size={24} color={logic.theme.colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            }
        >

            <View style={{ flex: 1 }}>
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
            </View>

            {/* Import FAB */}
            <View style={{ position: 'absolute', bottom: insets.bottom + 80, right: 24 }}>
                <TouchableOpacity onPress={logic.handleImportPress} activeOpacity={0.8}>
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: logic.theme.colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: 'black',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </View>
                </TouchableOpacity>
            </View>

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
