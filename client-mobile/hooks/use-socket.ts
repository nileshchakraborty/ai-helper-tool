import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseSocketReturn {
    socket: Socket | null;
    status: string;
    currentStream: string;
    lastImage: string | null;
    isConnected: boolean;
    connect: (url: string) => void;
    disconnect: () => void;
}

export function useSocket(): UseSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState<string>('Disconnected');
    const [currentStream, setCurrentStream] = useState<string>('');
    const [lastImage, setLastImage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    // Use ref to access latest stream state inside socket callbacks without dependency loops
    const streamRef = useRef<string>('');

    // Sync ref with state
    useEffect(() => {
        streamRef.current = currentStream;
    }, [currentStream]);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setStatus('Disconnected');
        }
    }, [socket]);

    const connect = useCallback((url: string) => {
        // If already connected to same URL, do nothing? (Simplification: always reconnect)
        if (socket) {
            socket.disconnect();
        }

        setStatus(`Connecting to ${url}...`);

        const newSocket = io(url, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            setStatus('Connected ✅');
            setIsConnected(true);
            setCurrentStream('Waiting for AI...');
            setLastImage(null);
        });

        newSocket.on('disconnect', () => {
            setStatus('Disconnected ❌');
            setIsConnected(false);
            // Don't nullify socket immediately on disconnect if we want auto-reconnect logic to work visible?
            // For now, let's keep socket object but update status.
        });

        newSocket.on('connect_error', (err) => {
            setStatus(`Error: ${err.message}`);
            setIsConnected(false);
        });

        newSocket.on('ai:stream', (data: { text: string }) => {
            setCurrentStream(prev => {
                if (prev === 'Waiting for AI...') return data.text;
                return prev + data.text;
            });
        });

        newSocket.on('ai:image', (data: { image: string, mimeType: string }) => {
            // Construct full data URI
            const dataUri = `data:${data.mimeType};base64,${data.image}`;
            setLastImage(dataUri);
            setCurrentStream(prev => prev + '\n[Image received]');
        });

        newSocket.on('ai:stream:done', () => {
            // Stream complete
        });

        setSocket(newSocket);
    }, [socket]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    return {
        socket,
        status,
        currentStream,
        lastImage,
        isConnected,
        connect,
        disconnect
    };
}
