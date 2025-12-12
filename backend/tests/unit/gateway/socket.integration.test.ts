/**
 * Socket Integration Tests
 * Tests the interaction between Socket.IO and the AI orchestrator
 */

// Mock socket.io before imports
const mockEmit = jest.fn();
const mockOn = jest.fn((event, callback) => {
    if (event === 'connection') {
        // Simulate connection after delay
        const mockSocket = {
            id: 'integration-test-socket',
            on: jest.fn((evt, cb) => {
                if (evt === 'disconnect') {
                    // Store disconnect handler
                    mockSocket.disconnectHandler = cb;
                }
                if (evt === 'register') {
                    // Store register handler
                    mockSocket.registerHandler = cb;
                }
            }),
            emit: jest.fn(),
            disconnectHandler: null as any,
            registerHandler: null as any
        };
        callback(mockSocket);
        return mockSocket;
    }
});

const mockServerInstance = {
    on: mockOn,
    emit: mockEmit
};

jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => mockServerInstance)
}));

import { initSocket, broadcastToMobile } from '../../../src/gateway/socket';

describe('Socket Integration', () => {
    let mockFastify: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFastify = { server: {} };
    });

    describe('AI Stream Broadcasting', () => {
        it('should broadcast multiple chunks in sequence', () => {
            initSocket(mockFastify);

            const chunks = ['Hello ', 'World', '!'];
            chunks.forEach(chunk => {
                broadcastToMobile('ai:stream', { text: chunk });
            });

            expect(mockEmit).toHaveBeenCalledTimes(3);
            expect(mockEmit).toHaveBeenNthCalledWith(1, 'ai:stream', { text: 'Hello ' });
            expect(mockEmit).toHaveBeenNthCalledWith(2, 'ai:stream', { text: 'World' });
            expect(mockEmit).toHaveBeenNthCalledWith(3, 'ai:stream', { text: '!' });
        });

        it('should broadcast done event after stream completes', () => {
            initSocket(mockFastify);

            broadcastToMobile('ai:stream', { text: 'Complete response' });
            broadcastToMobile('ai:stream:done', {});

            expect(mockEmit).toHaveBeenLastCalledWith('ai:stream:done', {});
        });

        it('should handle large text chunks', () => {
            initSocket(mockFastify);

            const largeText = 'A'.repeat(10000);
            broadcastToMobile('ai:stream', { text: largeText });

            expect(mockEmit).toHaveBeenCalledWith('ai:stream', { text: largeText });
        });

        it('should handle special characters in text', () => {
            initSocket(mockFastify);

            const specialText = '```javascript\nconst x = 1;\n```\n\n**Bold** and _italic_';
            broadcastToMobile('ai:stream', { text: specialText });

            expect(mockEmit).toHaveBeenCalledWith('ai:stream', { text: specialText });
        });
    });

    describe('Event Ordering', () => {
        it('should maintain event order', () => {
            initSocket(mockFastify);

            const events: string[] = [];
            mockEmit.mockImplementation((event) => {
                events.push(event);
            });

            broadcastToMobile('ai:stream', { text: '1' });
            broadcastToMobile('ai:stream', { text: '2' });
            broadcastToMobile('ai:stream', { text: '3' });
            broadcastToMobile('ai:stream:done', {});

            expect(events).toEqual(['ai:stream', 'ai:stream', 'ai:stream', 'ai:stream:done']);
        });
    });

    describe('Connection Lifecycle', () => {
        it('should handle client registration event', () => {
            initSocket(mockFastify);

            // Find the connection callback
            const connectionCall = mockOn.mock.calls.find(
                (call: any[]) => call[0] === 'connection'
            );
            expect(connectionCall).toBeDefined();
        });

        it('should set up disconnect handler for connected clients', () => {
            initSocket(mockFastify);

            const connectionHandler = mockOn.mock.calls.find(
                (call: any[]) => call[0] === 'connection'
            )?.[1];

            const mockSocket = {
                id: 'test-id',
                on: jest.fn(),
                emit: jest.fn()
            };

            connectionHandler(mockSocket);
            expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });
    });
});
