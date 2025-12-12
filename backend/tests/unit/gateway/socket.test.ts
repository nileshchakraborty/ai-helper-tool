/**
 * Socket Service Unit Tests
 * Tests for WebSocket functionality (Socket.IO)
 */

// Mock socket.io before imports
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockServerInstance = {
    on: mockOn,
    emit: mockEmit
};

jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => mockServerInstance)
}));

import { Server } from 'socket.io';
import { initSocket, broadcastToMobile } from '../../../src/gateway/socket';

describe('Socket Service', () => {
    let mockFastify: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFastify = {
            server: {} // Mock HTTP server
        };
    });

    describe('initSocket', () => {
        it('should initialize Socket.IO server with CORS config', () => {
            initSocket(mockFastify);

            expect(Server).toHaveBeenCalledWith(mockFastify.server, expect.objectContaining({
                cors: expect.objectContaining({
                    origin: '*',
                    methods: ['GET', 'POST']
                })
            }));
        });

        it('should set up connection handler', () => {
            initSocket(mockFastify);

            expect(mockOn).toHaveBeenCalledWith('connection', expect.any(Function));
        });

        it('should handle client connections', () => {
            initSocket(mockFastify);

            // Get the connection handler
            const connectionHandler = mockOn.mock.calls.find(
                (call: any[]) => call[0] === 'connection'
            )?.[1];

            expect(connectionHandler).toBeDefined();

            // Simulate a connection
            const mockSocket = {
                id: 'test-socket-123',
                on: jest.fn(),
                emit: jest.fn()
            };

            // Should not throw
            connectionHandler(mockSocket);

            // Socket should have disconnect handler
            expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });
    });

    describe('broadcastToMobile', () => {
        it('should emit ai:stream event to all clients', () => {
            initSocket(mockFastify);

            const testData = { text: 'Hello from AI' };
            broadcastToMobile('ai:stream', testData);

            expect(mockEmit).toHaveBeenCalledWith('ai:stream', testData);
        });

        it('should emit ai:stream:done event', () => {
            initSocket(mockFastify);

            broadcastToMobile('ai:stream:done', {});

            expect(mockEmit).toHaveBeenCalledWith('ai:stream:done', {});
        });

        it('should handle multiple broadcasts', () => {
            initSocket(mockFastify);

            broadcastToMobile('ai:stream', { text: 'chunk1' });
            broadcastToMobile('ai:stream', { text: 'chunk2' });
            broadcastToMobile('ai:stream:done', {});

            expect(mockEmit).toHaveBeenCalledTimes(3);
        });
    });
});
