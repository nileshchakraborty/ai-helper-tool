import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';

let io: Server | null = null;

export const initSocket = (fastify: FastifyInstance) => {
    // Attach Socket.IO to the existing Fastify HTTP server
    io = new Server(fastify.server, {
        cors: {
            origin: "*", // Allow all origins for local development (Mobile connection)
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });

        socket.on('register', (data) => {
            console.log(`[Socket] Device registered: ${JSON.stringify(data)}`);
            socket.emit('registered', { status: 'ok' });
        });
    });

    console.log('[Socket] Service initialized and ready for connections');
};

export const broadcastToMobile = (event: string, data: any) => {
    if (io) {
        io.emit(event, data);
        // console.log(`[Socket] Broadcast: ${event}`);
    } else {
        console.warn('[Socket] Warning: Broadcast attempted before Socket.IO init');
    }
};
