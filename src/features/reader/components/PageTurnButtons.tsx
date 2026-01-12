import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Box from '@/components/Box';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

interface PageTurnButtonsProps {
    onPrev: () => void;
    onNext: () => void;
    visible: boolean; // Hide when controls are shown
}

const PageTurnButtons: React.FC<PageTurnButtonsProps> = ({ onPrev, onNext, visible }) => {
    const theme = useTheme<Theme>();

    if (!visible) return null;

    return (
        <Box
            position="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
            justifyContent="center"
            pointerEvents="box-none"
        >
            {/* Left Button */}
            <TouchableOpacity
                onPress={onPrev}
                activeOpacity={0.5}
                style={{
                    position: 'absolute',
                    width: 100,
                    height: '60%',
                    top: '20%',
                    left: 0,
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                    zIndex: 50,
                }}
            >
                <Ionicons
                    name="chevron-back"
                    size={32}
                    color={theme.colors.textPrimary}
                    style={{
                        opacity: 0.7,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                    }}
                />
            </TouchableOpacity>

            {/* Right Button */}
            <TouchableOpacity
                onPress={onNext}
                activeOpacity={0.5}
                style={{
                    position: 'absolute',
                    width: 100,
                    height: '60%',
                    top: '20%',
                    right: 0,
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    paddingRight: 10,
                    zIndex: 50,
                }}
            >
                <Ionicons
                    name="chevron-forward"
                    size={32}
                    color={theme.colors.textPrimary}
                    style={{
                        opacity: 0.7,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                    }}
                />
            </TouchableOpacity>
        </Box>
    );
};

export default PageTurnButtons;
