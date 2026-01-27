import { useState, useEffect, useCallback, useRef } from 'react';
import { Clipboard } from 'react-native';
import * as Network from 'expo-network';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { SimpleHttpServer } from '@/utils/SimpleHttpServer';
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

export const useWiFiTransferLogic = () => {
    const { t } = useTranslation();
    const { importFile } = useFileImport();
    const [ipAddress, setIpAddress] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<'stopped' | 'running'>('stopped');
    const [logs, setLogs] = useState<string[]>([]);

    // Use ref to hold the server instance so it persists across renders
    const serverRef = useRef<SimpleHttpServer | null>(null);

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
        if (serverRef.current) {
            try {
                serverRef.current.stop();
            } catch (e) {
                console.warn('Server stop failed:', e);
            }
            serverRef.current = null;
        }
        setServerStatus('stopped');
        addLog('Server stopped');
    }, [addLog]);

    const handleUpload = useCallback(
        async (method: string, url: string, body: string, respond: (statusCode: number, contentType: string, body: string) => void) => {
            // TS Fix: handleUpload signature must match RequestHandler or be called correctly
            // SimpleHttpServer expects (method, url, body, respond)
            // But here we might just want to handle the POST /upload logic
            try {
                const data = JSON.parse(body);

                if (!data || !data.fileName || !data.fileData) {
                    respond(400, 'text/plain', 'Missing file data');
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

                respond(200, 'text/plain', 'OK');
            } catch (e) {
                console.error('Upload handling failed:', e);
                addLog('Upload failed');
                respond(500, 'text/plain', 'Internal Server Error');
            }
        },
        [addLog, importFile, t],
    );

    const startServer = useCallback(() => {
        if (serverRef.current) {
            return; // Already running
        }

        try {
            const server = new SimpleHttpServer();
            serverRef.current = server;

            server.start(PORT, async (method, url, body, respond) => {
                if (method === 'GET' && url === '/') {
                    respond(200, 'text/html', SERVER_HTML);
                } else if (method === 'POST' && url === '/upload') {
                    // We call handleUpload directly here
                    // But wait, handleUpload was defined above with specific signature?
                    // Let's just inline the logic or make handleUpload accept (body, respond)
                    await handleUpload(method, url, body, respond);
                } else {
                    respond(404, 'text/plain', 'Not Found');
                }
            });

            setServerStatus('running');
            addLog(`Server started on port ${PORT}`);
        } catch (e) {
            console.warn('Server start failed:', e);
            setServerStatus('stopped');
        }
    }, [addLog, handleUpload]);

    useEffect(() => {
        getIpAddress();
        return () => {
            if (serverRef.current) {
                serverRef.current.stop();
            }
        };
    }, []);

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
