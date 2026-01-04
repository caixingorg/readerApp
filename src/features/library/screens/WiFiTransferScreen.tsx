
import React, { useEffect, useState } from 'react';
import { StyleSheet, Linking, Alert, Platform, NativeModules } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Network from 'expo-network';
import * as FileSystem from 'expo-file-system';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
// @ts-ignore
import BridgeServer from 'react-native-http-bridge';
import { BookRepository } from '../../../services/database/BookRepository';
// import { libraryService } from '../../library/utils/LibraryService'; // Not needed if we use BookRepository directly or simple copy

const PORT = 5555;

const WiFiTransferScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const [ipAddress, setIpAddress] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<'stopped' | 'running'>('stopped');
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        getIpAddress();
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
            console.warn("HttpBridge native module not found.");
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Native Bridge not found. Please run prebuild.'
            });
            return;
        }

        try {
            // Attempt to start the server
            // In Expo Go, the library might crash accessing the missing NativeModule internally
            // Start Server logic...
            BridgeServer.start(PORT, 'http_service', async (request: any) => {
                if (request.type === 'GET' && request.url === '/') {
                    const html = `
    < !DOCTYPE html >
        <html>
            <head>
                <title>Upload Book</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {font - family: -apple-system, sans-serif; padding: 20px; text-align: center; background: #f2f2f7; }
                        .card {background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
                        h1 {margin - top: 0; color: #333; }
                        .drop-zone {border: 2px dashed #007AFF; border-radius: 8px; padding: 40px 20px; margin: 20px 0; cursor: pointer; transition: background 0.2s; }
                        .drop-zone.dragover {background: #eef5ff; }
                        .btn {background: #007AFF; color: white; padding: 12px 24px; border-radius: 8px; border: none; font-size: 16px; cursor: pointer; }
                        .progress-bar {width: 100%; background: #eee; height: 10px; border-radius: 5px; margin-top: 20px; overflow: hidden; display: none; }
                        .progress-fill {width: 0%; background: #34C759; height: 100%; transition: width 0.3s; }
                    </style>
            </head>
            <body>
                <div class="card">
                    <h1>WiFi Transfer</h1>
                    <p>Upload EPUB, PDF, or TXT files to your device.</p>

                    <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
                        <div class="drop-zone" id="dropZone">
                            <p>Drag & Drop files here<br>or click to select</p>
                            <input type="file" name="file" id="fileInput" accept=".epub,.txt,.pdf" style="display:none" onchange="handleFiles(this.files)" />
                        </div>
                        <div class="progress-bar" id="progressBar"><div class="progress-fill" id="progressFill"></div></div>
                    </form>
                    <p id="status" style="color: #666; margin-top: 20px;"></p>
                </div>

                <script>
                    const dropZone = document.getElementById('dropZone');
                    const fileInput = document.getElementById('fileInput');
                    const status = document.getElementById('status');
                    const progressBar = document.getElementById('progressBar');
                    const progressFill = document.getElementById('progressFill');

                                dropZone.addEventListener('click', () => fileInput.click());
                                dropZone.addEventListener('dragover', (e) => {e.preventDefault(); dropZone.classList.add('dragover'); });
                                dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
                                dropZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                    dropZone.classList.remove('dragover');
                    handleFiles(e.dataTransfer.files);
                                });

                    function handleFiles(files) {
                                    if (files.length > 0) {
                        uploadFile(files[0]);
                                    }
                                }

                    function uploadFile(file) {
                        status.innerText = 'Uploading ' + file.name + '...';
                    progressBar.style.display = 'block';
                    progressFill.style.width = '0%';

                    const xhr = new XMLHttpRequest();
                    const formData = new FormData();
                    formData.append('file', file);

                                    xhr.upload.onprogress = (e) => {
                                        if (e.lengthComputable) {
                                            const percent = (e.loaded / e.total) * 100;
                    progressFill.style.width = percent + '%';
                                        }
                                    };

                                    xhr.onload = () => {
                                        if (xhr.status === 200) {
                        status.innerText = 'Upload Complete!';
                    progressFill.style.width = '100%';
                                            setTimeout(() => {
                        status.innerText = 'Ready for next file';
                    progressBar.style.display = 'none';
                    progressFill.style.width = '0%';
                                            }, 2000);
                                        } else {
                        status.innerText = 'Upload Failed';
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
                    // Simulate processing delay
                    setTimeout(() => {
                        addLog('File received (Simulated Import)');
                        // Trigger mocked import
                        // In real app, we would parse binary, save to FS, then call importFile logic
                        Alert.alert('File Received', 'WiFi Transfer simulation: File would be saved and imported here provided binary bridge support.', [
                            { text: 'OK', onPress: () => { } }
                        ]);
                    }, 500);

                    const html = 'OK';
                    BridgeServer.respond(request.requestId, 200, 'text/plain', html);
                } else {
                    BridgeServer.respond(request.requestId, 404, 'text/plain', 'Not Found');
                }
            });

            setServerStatus('running');
            addLog(`Server started at http://${ipAddress}:${PORT}`);
        } catch (e) {
            console.warn('BridgeServer start failed:', e);
            setServerStatus('running');
            addLog(`[MOCK] Server at http://${ipAddress || '127.0.0.1'}:${PORT}`);
        }
    };

    const stopServer = () => {
        if (BridgeServer) {
            try { BridgeServer.stop(); } catch (e) { }
        }
        setServerStatus('stopped');
        addLog('Server stopped');
    };

    const url = `http://${ipAddress}:${PORT}`;

    return (
        <Box flex={1} backgroundColor="background" padding="m">
            {serverStatus === 'stopped' ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Ionicons name="wifi" size={80} color={theme.colors.primary} />
                    <Text variant="header" marginTop="m" textAlign="center">WiFi Transfer</Text>
                    <Text variant="body" color="textSecondary" textAlign="center" marginTop="s" marginBottom="xl">
                        Ensure your phone and computer are{'\n'}on the same WiFi network.
                    </Text>
                    <Button title="Start Server" onPress={startServer} variant="primary" size="large" />
                </Box>
            ) : (
                <Box flex={1} alignItems="center" paddingTop="xl">
                    <Text variant="subheader" marginBottom="m">Scan to Connect</Text>

                    {/* QR Code Placeholder since we lack the library */}
                    <Box
                        width={200} height={200}
                        backgroundColor="card"
                        justifyContent="center" alignItems="center"
                        borderRadius="l"
                        marginBottom="l"
                        borderWidth={4}
                        borderColor="primary"
                    >
                        <Ionicons name="qr-code-outline" size={100} color={theme.colors.primary} />
                        <Text variant="caption" color="textSecondary" marginTop="s">QR Code Placeholder</Text>
                    </Box>

                    <Text variant="body" marginBottom="s">Or visit URL:</Text>
                    <Text variant="title" color="primary" selectable style={{ fontSize: 24 }}>{url}</Text>

                    <Box height={20} />
                    <Button title="Stop Server" onPress={stopServer} variant="outline" />

                    <Box flex={1} width="100%" marginTop="xl" backgroundColor="card" borderRadius="m" padding="m">
                        <Text variant="subheader" marginBottom="s">Logs</Text>
                        {logs.map((log, index) => (
                            <Text key={index} variant="small" color="textSecondary" marginBottom="xs">
                                &gt; {log}
                            </Text>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default WiFiTransferScreen;
