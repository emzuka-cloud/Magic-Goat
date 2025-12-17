import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Adjust if running on device/emulator

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current?.id);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return socketRef.current;
};
