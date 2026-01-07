import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Determine socket URL based on env or window location
        const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

        const socketInstance = io(url, {
            path: '/socket.io',
            withCredentials: true,
            transports: ['websocket', 'polling'], // Allow fallback
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        // Global Listeners
        socketInstance.on('notification:new_order', (data: any) => {
            console.log('Valid notification received:', data);
            toast.success(data.message || 'Yeni Sipariş!', {
                description: `${data.orderId} - ${data.total}`,
                duration: 5000,
                action: {
                    label: 'Görüntüle',
                    onClick: () => window.location.href = '/orders'
                }
            });
            // Optionally play a sound
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(() => { }); // IOS/Chrome autoplay policy might block
            } catch (e) { }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
