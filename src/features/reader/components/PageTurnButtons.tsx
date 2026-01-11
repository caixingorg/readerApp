import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

interface PageTurnButtonsProps {
    flow: 'paginated' | 'scrolled';
    onPrev: () => void;
    onNext: () => void;
    visible: boolean; // Hide when controls are shown
}

const PageTurnButtons: React.FC<PageTurnButtonsProps> = ({ flow, onPrev, onNext, visible }) => {
    const theme = useTheme<Theme>();

    if (!visible) return null;

    if (flow === 'paginated') {
        return (
            <View style={styles.container} pointerEvents="box-none">
                {/* Left Button */}
                <TouchableOpacity
                    style={[styles.sideButton, { left: 0, alignItems: 'flex-start', paddingLeft: 10 }]}
                    onPress={onPrev}
                    activeOpacity={0.5}
                >
                    <Ionicons name="chevron-back" size={32} color={theme.colors.textPrimary} style={styles.iconShadow} />
                </TouchableOpacity>

                {/* Right Button */}
                <TouchableOpacity
                    style={[styles.sideButton, { right: 0, alignItems: 'flex-end', paddingRight: 10 }]}
                    onPress={onNext}
                    activeOpacity={0.5}
                >
                    <Ionicons name="chevron-forward" size={32} color={theme.colors.textPrimary} style={styles.iconShadow} />
                </TouchableOpacity>
            </View>
        );
    }

    // Vertical Scrolled Mode
    return (
        <View style={styles.verticalContainer} pointerEvents="box-none">
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.cardPrimary }]} onPress={onPrev}>
                <Ionicons name="chevron-up" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.cardPrimary }]} onPress={onNext}>
                <Ionicons name="chevron-down" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    sideButton: {
        position: 'absolute',
        width: 80, // Larger width for easier tapping
        height: '60%', // tall tap zone
        top: '20%', // centered vertically
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    iconShadow: {
        opacity: 0.7,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    verticalContainer: {
        position: 'absolute',
        bottom: 80, // Higher than bottom bar
        right: 20,
        gap: 12,
    },
    fab: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default PageTurnButtons;
