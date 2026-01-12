import React from 'react';
import ContentsModal from '@/features/reader/components/ContentsModal';
import FontSettingsPanel from '@/features/reader/components/FontSettingsPanel';
import ThemeSettingsPanel from '@/features/reader/components/ThemeSettingsPanel';
import TTSModal from '@/features/reader/components/TTSModal';
import NoteInputModal from '@/features/reader/components/NoteInputModal';
import TTSMiniPlayer from '@/features/reader/components/TTSMiniPlayer';

interface ReaderModalsProps {
    logic: any;
    ui: any;
    tts: any;
    settings: any;
    epubStructure: any;
    handleSelectChapter: (href: string) => void;
    handleSelectBookmark: (bookmark: any) => void;
    handleSaveNote: (content: string, color: string, text: string, cfi: string) => void;
    currentSectionHref: string;
    insets: any; // Using any to avoid importing extra types, or use EdgeInsets
}

const ReaderModals: React.FC<ReaderModalsProps> = ({
    logic,
    ui,
    tts,
    settings,
    epubStructure,
    handleSelectChapter,
    handleSelectBookmark,
    handleSaveNote,
    currentSectionHref,
    insets,
}) => {
    // Calculate dynamic bottom offset: Footer height (approx 60) + Safe Area Bottom
    // Ensuring panels sit tightly above the bottom navigation bar
    const bottomOffset = (insets?.bottom || 0) + 60;

    return (
        <>
            <ContentsModal
                visible={ui.contentsModal.visible}
                onClose={() => ui.setContentsModal((p: any) => ({ ...p, visible: false }))}
                bookId={logic.book?.id || ''}
                chapters={epubStructure?.toc || []}
                currentHref={currentSectionHref}
                initialTab={ui.contentsModal.initialTab}
                availableTabs={ui.contentsModal.tabs}
                onSelectChapter={handleSelectChapter}
                onSelectBookmark={handleSelectBookmark}
            />

            <FontSettingsPanel
                visible={ui.showFontPanel}
                fontSize={settings.fontSize}
                setFontSize={settings.setFontSize}
                lineHeight={settings.lineHeight}
                setLineHeight={settings.setLineHeight}
                bottomOffset={bottomOffset + 10} // Add slight buffer
            />

            <ThemeSettingsPanel
                visible={ui.showThemePanel}
                currentMode={settings.theme}
                onSelectMode={ui.handleThemeChange}
                brightness={ui.brightness}
                setBrightness={ui.handleBrightnessChange}
                bottomOffset={bottomOffset + 10}
            />

            <TTSModal
                visible={ui.showTTS}
                onClose={() => ui.setShowTTS(false)}
                content={logic.content}
                isPlaying={tts.isTTSPlaying}
                isPaused={tts.isTTSPaused}
                statusText={tts.ttsStatusText}
                onPlayPause={tts.handleTTSPlayPause}
                onStop={tts.handleTTSStop}
                onRateChange={tts.handleTTSRateChange}
                currentRate={settings.ttsRate}
            />

            <TTSMiniPlayer
                visible={tts.isTTSPlaying && !ui.showTTS}
                isPlaying={tts.isTTSPlaying}
                isPaused={tts.isTTSPaused}
                onPlayPause={tts.handleTTSPlayPause}
                onStop={tts.handleTTSStop}
                onExpand={() => ui.setShowTTS(true)}
                bottomOffset={ui.showControls ? bottomOffset : 20}
            />

            <NoteInputModal
                visible={ui.showNoteInput}
                onClose={() => ui.setShowNoteInput(false)}
                onSubmit={(content, color) => {
                    handleSaveNote(content, color, ui.selectedText, ui.selectedCfi);
                    ui.setShowNoteInput(false);
                    ui.setSelectedText('');
                    ui.setSelectedCfi('');
                }}
                selectedText={ui.selectedText}
            />
        </>
    );
};

export default ReaderModals;
