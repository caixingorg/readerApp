import React, { useEffect } from 'react';
import DevMenuModal from './components/DevMenuModal';
import { useDevStore } from './stores/devStore';
import { Platform } from 'react-native';

/**
 * DevKit Entry Point
 * Mount this component at the root of your App (in App.tsx).
 * It handles:
 * 1. Rendering the DevMenu Modal
 * 2. Specialized triggers (e.g. shake, key combos - optional)
 */
export const DevKit: React.FC = () => {
    // We can add "Shake to show" logic here if needed
    // const { toggleMenu } = useDevStore();

    // Prevent rendering in production builds unless specifically enabled?
    // For now we rely on the parent to only mount this if __DEV__ is true, or keep it safe.
    // Ideally, DevKit code is bundled but entry point is guarded.

    if (!__DEV__) {
        // Double safety: don't render anything in actual production builds
        // You might want to remove this if you have a "Staging" release build.
        return null;
    }

    return (
        <>
            <DevMenuModal />
        </>
    );
};
