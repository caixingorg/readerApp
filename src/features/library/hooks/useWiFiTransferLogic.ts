import { useState, useEffect, useCallback } from 'react';
import { NativeModules, Clipboard } from 'react-native';
import * as Network from 'expo-network';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import BridgeServer from 'react-native-http-bridge';
import { useFileImport } from '@/features/library/hooks/useFileImport';

const PORT = 8080;

// Why: Moved HTML here to avoid circular dependency with Screen component
const SERVER_HTML = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>ReaderApp Transfer</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: -apple-system, system-ui, sans-serif; padding: 40px 20px; text-align: center; background: #F8FAFC; color: #0F172A; line-height: 1.5; }
                .container { max-width: 480px; margin: 0 auto; }
                .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); }
                h1 { margin: 0 0 10px; font-size: 24px; font-weight: 700; }
                p { color: #64748B; margin-bottom: 30px; }
                .drop-zone { border: 2px dashed #E2E8F0; border-radius: 16px; padding: 60px 20px; cursor: pointer; transition: all 0.2s; background: #F8FAFC; }
                .drop-zone:hover, .drop-zone.dragover { border-color: #3B82F6; background: #EFF6FF; }
                .icon { font-size: 48px; margin-bottom: 16px; display: block; }
                #status { margin-top: 24px; font-weight: 600; min-height: 24px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <h1>WiFi Transfer</h1>
                    <p>Select files to transfer to your Reader library.</p>
                    <div class="drop-zone" id="dropZone">
                        <span class="icon">📂</span>
                        <strong>Choose or Drag Files</strong>
                        <input type="file" id="file" accept=".epub,.txt,.pdf" style="display:none" onchange="handleFiles(this.files)" />
                    </div>
                    <div id="status"></div>
                </div>
            </div>
            <script>
                const dz = document.getElementById('dropZone');
                const fi = document.getElementById('file');
                const st = document.getElementById('status');

                dz.onclick = () => fi.click();
                dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
                dz.ondragleave = () => dz.classList.remove('dragover');
                dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('dragover'); handleFiles(e.dataTransfer.files); };

                function handleFiles(files) {
                    if (!files.length) return;
                    const file = files[0];
                    st.innerText = 'Preparing ' + file.name + '...';
                    st.style.color = '#3B82F6';
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const base64 = e.target.result.split(',')[1];
                        st.innerText = 'Transferring...';
                        upload(file.name, base64);
                    };
                    reader.readAsDataURL(file);
                }

                function upload(name, data) {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/upload');
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            st.innerText = '✓ Success: ' + name;
                            st.style.color = '#10B981';
                        } else {
                            st.innerText = '✕ Error: ' + xhr.responseText;
                            st.style.color = '#EF4444';
                        }
                    };
                    xhr.send(JSON.stringify({ fileName: name, fileData: data }));
                }
            </script>
        </body>
    </html>
`;

interface BridgeRequest {
    type: 'GET' | 'POST';
    url: string;
    requestId: string;
    postData?: any;
}

export const useWiFiTransferLogic = () => {
    const { t } = useTranslation();
    const { importFile } = useFileImport();
    const [ipAddress, setIpAddress] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<'stopped' | 'running'>('stopped');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLogs((prev) => [msg, ...prev].slice(0, 5));
    }, []);

    const getIpAddress = async () => {
        try {
            const ip = await Network.getIpAddressAsync();
            setIpAddress(ip);
        } catch (e) {
            console.error('Failed to get IP', e);
        }
    };

    const stopServer = useCallback(() => {
        if (BridgeServer) {
            try {
                BridgeServer.stop();
            } catch (e) {
                console.warn('BridgeServer stop failed:', e);
            }
        }
        setServerStatus('stopped');
        addLog('Server stopped');
    }, [addLog]);

    const handleUpload = useCallback(
        async (request: BridgeRequest) => {
            try {
                const data =
                    typeof request.postData === 'string'
                        ? JSON.parse(request.postData)
                        : request.postData;

                if (!data || !data.fileName || !data.fileData) {
                    BridgeServer.respond(request.requestId, 400, 'text/plain', 'Missing file data');
                    return;
                }

                addLog(`Receiving: ${data.fileName}`);

                const tempPath = `${FileSystem.cacheDirectory}${data.fileName}`;
                await FileSystem.writeAsStringAsync(tempPath, data.fileData, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Auto-import using existing file import logic
                await importFile(tempPath, data.fileName, false, () => {
                    addLog(`Success: ${data.fileName}`);
                    Toast.show({
                        type: 'success',
                        text1: t('import.wifi.file_received'),
                        text2: t('import.wifi.file_received_msg'),
                    });
                });

                BridgeServer.respond(request.requestId, 200, 'text/plain', 'OK');
            } catch (e) {
                console.error('Upload handling failed:', e);
                addLog('Upload failed');
                BridgeServer.respond(request.requestId, 500, 'text/plain', 'Internal Server Error');
            }
        },
        [addLog, importFile, t],
    );

    const startServer = useCallback(() => {
        const isBridgeAvailable = NativeModules.HttpServer || NativeModules.RCTHttpServer;

        if (!isBridgeAvailable) {
            Toast.show({
                type: 'error',
                text1: t('import.error'),
                text2: t('import.wifi.bridge_error'),
            });
            return;
        }

        try {
            BridgeServer.start(PORT, 'http_service', async (request: BridgeRequest) => {
                if (request.type === 'GET' && request.url === '/') {
                    BridgeServer.respond(request.requestId, 200, 'text/html', SERVER_HTML);
                } else if (request.type === 'POST' && request.url === '/upload') {
                    handleUpload(request);
                } else {
                    BridgeServer.respond(request.requestId, 404, 'text/plain', 'Not Found');
                }
            });

            setServerStatus('running');
            addLog(`Server started on port ${PORT}`);
        } catch (e) {
            console.warn('BridgeServer start failed:', e);
            setServerStatus('stopped');
        }
    }, [t, addLog, handleUpload]);

    useEffect(() => {
        getIpAddress();
        return () => {
            stopServer();
        };
    }, [stopServer]);

    const url = `http://${ipAddress || '0.0.0.0'}:${PORT}`;

    const copyToClipboard = () => {
        Clipboard.setString(url);
        Toast.show({
            type: 'success',
            text1: t('import.wifi.copied'),
            text2: t('import.wifi.copied_msg'),
        });
    };

    return {
        ipAddress,
        serverStatus,
        logs,
        url,
        startServer,
        stopServer,
        copyToClipboard,
        PORT,
    };
};
