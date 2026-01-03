import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shopify/restyle';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import theme, { darkTheme } from './src/theme/theme';
import RootNavigator from './src/app/RootNavigator';
import { initDatabase } from './src/services/database';
import { useThemeStore } from './src/stores/useThemeStore';

const queryClient = new QueryClient();

export default function App() {
  const colorScheme = useColorScheme();
  const { mode } = useThemeStore();

  const activeTheme = React.useMemo(() => {
    if (mode === 'system') {
      return colorScheme === 'dark' ? darkTheme : theme;
    }
    return mode === 'dark' ? darkTheme : theme;
  }, [mode, colorScheme]);

  React.useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={activeTheme}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
