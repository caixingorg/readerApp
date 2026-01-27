import React from 'react';
import { RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ViewShot from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Input from '@/components/Input';
import ScreenLayout from '@/components/ScreenLayout';
import NotebookItem from '@/features/notebook/components/NotebookItem';
import NotebookFilterModal from '@/features/notebook/components/NotebookFilterModal';
import SharePreviewModal from '@/features/share/components/SharePreviewModal';
import ShareEditModal from '@/features/share/components/ShareEditModal';
import NoteShareCard from '@/features/share/components/NoteShareCard';
import NotebookHeader from '../components/NotebookHeader';
import NotebookFilterStrip from '../components/NotebookFilterStrip';
import { useNotebookLogic, AnnotationItem } from '../hooks/useNotebookLogic';

const NotebookScreen: React.FC = () => {
    const { t } = useTranslation();
    const logic = useNotebookLogic();
    const theme = useTheme<Theme>();

    return (
        <ScreenLayout title={t('notebook.title')}>
            <Box paddingHorizontal="m" paddingBottom="m" marginBottom="s">
                <Input
                    value={logic.searchQuery}
                    onChangeText={logic.setSearchQuery}
                    placeholder={t('notebook.search_placeholder')}
                    leftIcon="search-outline"
                    containerProps={{ borderWidth: 0 }}
                    style={{
                        borderRadius: 12,
                        paddingVertical: 12,
                        height: 44,
                        backgroundColor: theme.colors.cardSecondary,
                    }}
                />
            </Box>

            {/* Hidden Share Card */}
            {logic.sharingItem && (
                <Box position="absolute" left={-1000} top={0} opacity={0}>
                    <ViewShot ref={logic.viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                        <NoteShareCard
                            type={logic.sharingItem.type}
                            quote={logic.customQuote}
                            note={logic.customNote}
                            bookTitle={
                                logic.books[logic.sharingItem.data.bookId]?.title ||
                                t('common.unknown_book')
                            }
                            author={
                                logic.books[logic.sharingItem.data.bookId]?.author ||
                                t('common.unknown_author')
                            }
                            date={new Date(logic.sharingItem.date).toLocaleDateString()}
                        />
                    </ViewShot>
                </Box>
            )}

            {/* NotebookHeader removed to avoid duplication */}

            <NotebookFilterStrip
                activeTab={logic.activeTab}
                onTabChange={(tab) => logic.setFilters((prev) => ({ ...prev, type: tab as any }))}
                onOpenFilter={() => logic.setIsFilterVisible(true)}
            />

            <Box flex={1}>
                <FlashList<AnnotationItem>
                    data={logic.filteredItems}
                    keyExtractor={(item) => `${item.type}_${item.data.id}`}
                    estimatedItemSize={140}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: 80,
                        paddingTop: 8,
                    }}
                    renderItem={({ item }) => (
                        <NotebookItem
                            type={item.type}
                            data={item.data}
                            book={logic.books[item.data.bookId]}
                            onPress={() => {
                                // TODO: Implementation navigation to reader
                            }}
                            onDelete={() => logic.handleDelete(item)}
                            onShare={() => logic.handleShare(item)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={logic.loading} onRefresh={logic.fetchData} />
                    }
                    ListEmptyComponent={
                        !logic.loading ? (
                            <Box
                                flex={1}
                                justifyContent="center"
                                alignItems="center"
                                marginTop="xl"
                            >
                                <Text variant="subheader" color="textSecondary" marginBottom="s">
                                    {t('notebook.empty.title')}
                                </Text>
                                <Text variant="body" color="textSecondary" textAlign="center">
                                    {t('notebook.empty.subtitle')}
                                </Text>
                            </Box>
                        ) : null
                    }
                />
            </Box>

            <NotebookFilterModal
                visible={logic.isFilterVisible}
                onClose={() => logic.setIsFilterVisible(false)}
                books={Object.values(logic.books)}
                currentFilters={logic.filters as any}
                onApply={(newFilters) => {
                    logic.setFilters(newFilters as any);
                    logic.setIsFilterVisible(false);
                }}
            />

            <SharePreviewModal
                visible={logic.isPreviewVisible}
                imageUri={logic.previewUri}
                onClose={logic.handleClosePreview}
                onShare={logic.handleConfirmShare}
            />

            <ShareEditModal
                visible={logic.isEditVisible}
                initialQuote={logic.customQuote}
                initialNote={logic.customNote}
                onClose={() => {
                    logic.setIsEditVisible(false);
                    logic.setSharingItem(null);
                }}
                onConfirm={logic.handleConfirmEdit}
            />
        </ScreenLayout>
    );
};

export default NotebookScreen;
