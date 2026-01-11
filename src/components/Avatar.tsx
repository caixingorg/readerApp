import React from 'react';
import { Image } from 'react-native';
import Box from './Box';
import Text from './Text';

interface AvatarProps {
    source?: any;
    name?: string;
    size?: number;
    showOnlineIndicator?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
    source,
    name,
    size = 40,
    showOnlineIndicator = false,
}) => {
    const initials = name
        ? name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
        : '?';

    return (
        <Box position="relative" width={size} height={size}>
            <Box
                width="100%"
                height="100%"
                borderRadius="full"
                overflow="hidden"
                backgroundColor="secondary" // Was orange-200
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor="cardPrimary" // Was white
            >
                {source ? (
                    <Image
                        source={source}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <Text
                        variant="body"
                        fontWeight="bold"
                        color="primary" // Was orange-900
                        style={{ fontSize: size * 0.4 }}
                    >
                        {initials}
                    </Text>
                )}
            </Box>
            {showOnlineIndicator && (
                <Box
                    position="absolute"
                    bottom={0}
                    right={0}
                    width={12}
                    height={12}
                    backgroundColor="success" // Was green-500
                    borderRadius="full"
                    borderWidth={2}
                    borderColor="cardPrimary"
                />
            )}
        </Box>
    );
};

export default Avatar;
