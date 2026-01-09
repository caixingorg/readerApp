import React from 'react';
import { View, Image, Text } from 'react-native';
import clsx from 'clsx';

interface AvatarProps {
    source?: any;
    name?: string;
    size?: number;
    className?: string;
    showOnlineIndicator?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
    source,
    name,
    size = 40,
    className,
    showOnlineIndicator = false
}) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?';

    return (
        <View className={clsx("relative", className)} style={{ width: size, height: size }}>
            <View
                className="w-full h-full rounded-full overflow-hidden bg-orange-200 items-center justify-center border-2 border-white dark:border-gray-800"
            >
                {source ? (
                    <Image source={source} className="w-full h-full" />
                ) : (
                    <Text className="text-orange-900 font-bold" style={{ fontSize: size * 0.4 }}>
                        {initials}
                    </Text>
                )}
            </View>
            {showOnlineIndicator && (
                <View
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
                />
            )}
        </View>
    );
};

export default Avatar;
