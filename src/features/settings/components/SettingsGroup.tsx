import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface SettingsGroupProps {
    title?: string;
    children: ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, children }) => {
    return (
        <Box marginBottom="l">
            {title && (
                <Text
                    variant="caption"
                    color="textSecondary"
                    textTransform="uppercase"
                    paddingHorizontal="m"
                    marginBottom="s"
                    fontWeight="600"
                    letterSpacing={0.5}
                >
                    {title}
                </Text>
            )}
            <Box
                backgroundColor="cardPrimary"
                borderRadius="l"
                overflow="hidden"
                style={styles.container}
            >
                {children}
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    container: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    }
});

export default SettingsGroup;
