import TcpSocket from 'react-native-tcp-socket';
import { Platform } from 'react-native';

type RequestHandler = (
    method: string,
    url: string,
    body: string,
    respond: (statusCode: number, contentType: string, body: string) => void
) => void;

export class SimpleHttpServer {
    private server: any;
    private port: number;
    private handler: RequestHandler;

    constructor() {
        this.server = null;
        this.port = 8080;
        this.handler = () => { };
    }

    start(port: number, handler: RequestHandler) {
        if (this.server) {
            this.stop();
        }

        this.port = port;
        this.handler = handler;

        this.server = TcpSocket.createServer((socket) => {
            let buffer = '';

            socket.on('data', (data) => {
                const chunk = typeof data === 'string' ? data : data.toString('utf8');
                buffer += chunk;

                // Simple HTTP parsing
                if (buffer.includes('\r\n\r\n')) {
                    const [headerPart, ...bodyParts] = buffer.split('\r\n\r\n');
                    const bodyPart = bodyParts.join('\r\n\r\n');
                    const headers = headerPart.split('\r\n');
                    const requestLine = headers[0].split(' ');
                    const method = requestLine[0];
                    const url = requestLine[1];

                    // Check for Content-Length to determine if we received the full body
                    const contentLengthHeader = headers.find((h) =>
                        h.toLowerCase().startsWith('content-length:')
                    );

                    let contentLength = 0;
                    if (contentLengthHeader) {
                        contentLength = parseInt(contentLengthHeader.split(':')[1].trim(), 10);
                    }

                    if (bodyPart.length >= contentLength) {
                        // Request complete
                        const actualBody = bodyPart.substring(0, contentLength);

                        this.handler(method, url, actualBody, (statusCode, contentType, responseBody) => {
                            const responseHeaders = [
                                `HTTP/1.1 ${statusCode} OK`,
                                `Content-Type: ${contentType}`,
                                `Content-Length: ${Platform.OS === 'android' ? Buffer.byteLength(responseBody) : responseBody.length}`, // Simple length check
                                'Access-Control-Allow-Origin: *',
                                'Connection: close',
                                '',
                                responseBody
                            ].join('\r\n');

                            socket.write(responseHeaders);
                            socket.end();
                        });

                        // Reset buffer for keep-alive (though we close connection above)
                        buffer = '';
                    }
                }
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        });

        this.server.listen({ port: this.port, host: '0.0.0.0' }, () => {
            console.log(`Server listening on ${this.port}`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}
