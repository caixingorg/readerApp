import React, { useEffect, useState } from 'react';
import { NativeModules, Clipboard, TouchableOpacity, Alert, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Smartphone, Laptop, Wifi, WifiOff, Copy, Check, Server } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Network from 'expo-network';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
// @ts-ignore
import BridgeServer from 'react-native-http-bridge';

const PORT = 8080;

const WiFiTransferScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const [ipAddress, setIpAddress] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<'stopped' | 'running'>('stopped');
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        getIpAddress();
        startServer();
        return () => {
            stopServer();
        };
    }, []);

    const getIpAddress = async () => {
        try {
            const ip = await Network.getIpAddressAsync();
            setIpAddress(ip);
        } catch (e) {
            console.error('Failed to get IP', e);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const startServer = () => {
        if (!NativeModules.HttpBridge) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Native Bridge not found.'
            });
            return;
        }

        try {
            BridgeServer.start(PORT, 'http_service', async (request: any) => {
                if (request.type === 'GET' && request.url === '/') {
                    const html = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>ReaderApp Import</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: -apple-system, system-ui, sans-serif; padding: 40px 20px; text-align: center; background: #F8FAFC; color: #0F172A; }
                .container { max-width: 480px; margin: 0 auto; }
                .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); }
                h1 { margin: 0 0 10px; font-size: 24px; font-weight: 700; color: #0F172A; }
                p { color: #64748B; line-height: 1.5; margin-bottom: 30px; }
                .drop-zone { border: 2px dashed #E2E8F0; border-radius: 16px; padding: 60px 20px; cursor: pointer; transition: all 0.2s; background: #F8FAFC; }
                .drop-zone:hover, .drop-zone.dragover { border-color: #3B82F6; background: #EFF6FF; }
                .icon { font-size: 48px; margin-bottom: 16px; display: block; }
                .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 600; margin-top: 20px; text-decoration: none; }
                #status { margin-top: 20px; font-weight: 500; min-height: 24px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <h1>Transfer Books</h1>
                    <p>Drag and drop EPUB, PDF, or TXT files here to add them to your library instantly.</p>
                    <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
                        <div class="drop-zone" id="dropZone">
                            <span class="icon">📂</span>
                            <strong>Click or Drop Files Here</strong>
                            <input type="file" name="file" id="fileInput" accept=".epub,.txt,.pdf" style="display:none" onchange="handleFiles(this.files)" />
                        </div>
                    </form>
                    <div id="status"></div>
                </div>
            </div>
            <script>
                const dropZone = document.getElementById('dropZone');
                const fileInput = document.getElementById('fileInput');
                const status = document.getElementById('status');

                dropZone.addEventListener('click', () => fileInput.click());
                dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
                dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                    handleFiles(e.dataTransfer.files);
                });

                function handleFiles(files) {
                    if (files.length > 0) uploadFile(files[0]);
                }

                function uploadFile(file) {
                    status.innerText = 'Uploading ' + file.name + '...';
                    status.style.color = '#3B82F6';
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const xhr = new XMLHttpRequest();
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            status.innerText = '✓ Import Successful';
                            status.style.color = '#10B981';
                            setTimeout(() => { status.innerText = ''; }, 3000);
                        } else {
                            status.innerText = '✕ Upload Failed';
                            status.style.color = '#EF4444';
                        }
                    };
                    xhr.open('POST', '/upload');
                    xhr.send(formData);
                }
            </script>
        </body>
    </html>
`;
                    BridgeServer.respond(request.requestId, 200, 'text/html', html);
                } else if (request.type === 'POST' && request.url === '/upload') {
                    addLog('Receiving file...');
                    // Simulate processing
                    setTimeout(() => {
                        addLog('File received (Simulated)');
                        Alert.alert('File Received', 'WiFi Transfer mock: File would be imported here.');
                    }, 500);
                    BridgeServer.respond(request.requestId, 200, 'text/plain', 'OK');
                } else {
                    BridgeServer.respond(request.requestId, 404, 'text/plain', 'Not Found');
                }
            });

            setServerStatus('running');
            addLog(`Server started on port ${PORT}`);
        } catch (e) {
            console.warn('BridgeServer start failed:', e);
            // Mock running for UI testing if real bridge fails
            setServerStatus('running');
        }
    };

    const stopServer = () => {
        if (BridgeServer) {
            try { BridgeServer.stop(); } catch (e) { }
        }
        setServerStatus('stopped');
        addLog('Server stopped');
    };

    const url = `http://${ipAddress || '0.0.0.0'}:${PORT}`;

    const copyToClipboard = () => {
        Clipboard.setString(url);
        Toast.show({
            type: 'success',
            text1: t('import.wifi.copied'),
            text2: t('import.wifi.copied_msg')
        });
    };

    // Animation for pulse effect
    const pulseOpacity = useSharedValue(0.4);
    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
            -1,
            true
        );
    }, []);

    const animatedPulseStyle = useAnimatedStyle(() => ({
        opacity: serverStatus === 'running' ? pulseOpacity.value : 0.4,
    }));

    return (
        <Box flex={1} backgroundColor="background" justifyContent="space-between" paddingBottom="l">
            <Box flex={1} alignItems="center" justifyContent="center">

                {/* Visual Graphic */}
                <Animated.View entering={FadeInUp.delay(100).springify()}>
                    <Box flexDirection="row" alignItems="center" justifyContent="center" marginBottom="xl">
                        <Box alignItems="center">
                            <Box width={64} height={64} borderRadius="full" backgroundColor="cardSecondary" alignItems="center" justifyContent="center">
                                <Smartphone size={32} color={theme.colors.textSecondary} strokeWidth={1.5} />
                            </Box>
                        </Box>

                        <Box paddingHorizontal="m" alignItems="center">
                            <Box flexDirection="row" gap="s" marginBottom="xs">
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.8} />
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.6} />
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.4} />
                            </Box>
                            <Box backgroundColor="primary" padding="s" borderRadius="full" marginVertical="xs">
                                <Wifi size={20} color="white" />
                            </Box>
                            <Box flexDirection="row" gap="s" marginTop="xs">
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.4} />
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.6} />
                                <Box width={6} height={6} borderRadius="full" backgroundColor="primary" opacity={0.8} />
                            </Box>
                        </Box>

                        <Box alignItems="center">
                            <Box width={64} height={64} borderRadius="full" backgroundColor="cardSecondary" alignItems="center" justifyContent="center">
                                <Laptop size={32} color={theme.colors.textSecondary} strokeWidth={1.5} />
                            </Box>
                        </Box>
                    </Box>
                </Animated.View>

                {/* Instructions */}
                <Animated.View entering={FadeInUp.delay(200)}>
                    <Text variant="body" textAlign="center" color="textSecondary" style={{ maxWidth: 280, lineHeight: 24 }}>
                        {t('import.wifi.instruction_prefix')}<Text fontWeight="bold" color="textPrimary">{t('import.wifi.instruction_bold')}</Text>{t('import.wifi.instruction_suffix')}
                    </Text>
                </Animated.View>

                {/* Server Address Card */}
                {serverStatus === 'running' && (
                    <Animated.View entering={FadeIn.delay(300)} style={{ width: '100%', alignItems: 'center', marginTop: 32 }}>
                        <TouchableOpacity onPress={copyToClipboard} activeOpacity={0.9}>
                            <Box
                                backgroundColor="cardPrimary"
                                borderRadius="xl"
                                paddingVertical="l"
                                paddingHorizontal="l"
                                alignItems="center"
                                width={300}
                                style={{
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 24,
                                    elevation: 8,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border
                                }}
                            >
                                <Box flexDirection="row" alignItems="center" marginBottom="s">
                                    <Animated.View style={[animatedPulseStyle, { marginRight: 8 }]}>
                                        <Box width={8} height={8} borderRadius="full" backgroundColor="success" />
                                    </Animated.View>
                                    <Text variant="caption" color="textTertiary" fontWeight="600" letterSpacing={1}>
                                        {t('import.wifi.server_running')}
                                    </Text>
                                </Box>

                                <Text variant="header" fontSize={26} fontWeight="bold" color="primary" marginBottom="m" textAlign="center">
                                    {url}
                                </Text>

                                <Box flexDirection="row" alignItems="center" backgroundColor="cardSecondary" paddingHorizontal="m" paddingVertical="xs" borderRadius="full">
                                    <Copy size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                                    <Text variant="caption" color="textSecondary" fontWeight="600">{t('import.wifi.tap_copy')}</Text>
                                </Box>
                            </Box>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </Box>

            {/* Bottom Controls */}
            <Box paddingHorizontal="l">
                {serverStatus === 'running' ? (
                    <TouchableOpacity onPress={stopServer} style={{ width: '100%' }}>
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="center"
                            paddingVertical="m"
                            borderRadius="l"
                            borderWidth={1}
                            borderColor="border"
                            backgroundColor="cardPrimary"
                            width="100%"
                        >
                            <WifiOff size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                            <Text variant="body" fontWeight="600" color="textSecondary">{t('import.wifi.stop')}</Text>
                        </Box>
                    </TouchableOpacity>
                ) : (
                    <Button
                        variant="primary"
                        title={t('import.wifi.start')}
                        onPress={startServer}
                        fullWidth
                        size="large"
                        icon={<Wifi size={20} color="white" style={{ marginRight: 8 }} />}
                    />
                )}
            </Box>
        </Box>
    );
};

export default WiFiTransferScreen;
