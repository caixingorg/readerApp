import React from 'react';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

/*
  Custom Toast Config
  Usage: <Toast config={toastConfig} /> in App.tsx
*/

import Box from './Box';
import AppText from './Text';

const ToastLayout = ({ text1, text2, icon, color, bgColor, borderColor }: any) => (
    <Box
        width="90%"
        flexDirection="row"
        alignItems="center"
        padding="m"
        borderRadius="xl"
        backgroundColor="cardPrimary"
        borderWidth={1}
        style={{
            borderColor,
            shadowColor: color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
        }}
    >
        <Box
            width={40}
            height={40}
            borderRadius="full"
            alignItems="center"
            justifyContent="center"
            marginRight="s"
            style={{ backgroundColor: bgColor }}
        >
            <Ionicons name={icon} size={24} color={color} />
        </Box>
        <Box flex={1}>
            <AppText variant="body" fontWeight="bold" color="textPrimary">
                {text1}
            </AppText>
            {text2 && (
                <AppText variant="small" color="textSecondary" marginTop="xs">
                    {text2}
                </AppText>
            )}
        </Box>
    </Box>
);

export const toastConfig: ToastConfig = {
    success: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="checkmark"
            color="#16A34A" // green-600
            bgColor="#DCFCE7" // green-100
            borderColor="#86EFAC" // green-300
        />
    ),
    error: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="alert"
            color="#DC2626" // red-600
            bgColor="#FEE2E2" // red-100
            borderColor="#FCA5A5" // red-300
        />
    ),
    info: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="information"
            color="#2563EB" // blue-600
            bgColor="#DBEAFE" // blue-100
            borderColor="#93C5FD" // blue-300
        />
    ),
};
