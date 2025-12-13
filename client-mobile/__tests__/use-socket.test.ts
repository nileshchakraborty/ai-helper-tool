import { renderHook, act } from '@testing-library/react-native';
import { useSocket } from '../hooks/use-socket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe.skip('useSocket Hook', () => {
    let mockSocket: any;

    beforeEach(() => {
        // Setup mock socket with event handlers
        const handlers: Record<string, Function> = {};

        mockSocket = {
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            }),
            off: jest.fn(),
            disconnect: jest.fn(),
            emit: jest.fn(),
            // Helper to trigger events
            _trigger: (event: string, ...args: any[]) => {
                if (handlers[event]) {
                    handlers[event](...args);
                }
            }
        };

        (io as jest.Mock).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useSocket());

        expect(result.current.socket).toBeNull();
        expect(result.current.status).toBe('Disconnected');
        expect(result.current.isConnected).toBe(false);
        expect(result.current.currentStream).toBe('');
    });

    it('should connect to provided URL', () => {
        const { result } = renderHook(() => useSocket());

        act(() => {
            result.current.connect('http://localhost:3000');
        });

        expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
        expect(result.current.socket).toBe(mockSocket);
        expect(result.current.status).toContain('Connecting');
    });

    it('should handle successful connection', () => {
        const { result } = renderHook(() => useSocket());

        act(() => {
            result.current.connect('http://localhost:3000');
        });

        act(() => {
            mockSocket._trigger('connect');
        });

        expect(result.current.isConnected).toBe(true);
        expect(result.current.status).toContain('Connected');
        expect(result.current.currentStream).toBe('Waiting for AI...');
    });

    it('should handle disconnection', () => {
        const { result } = renderHook(() => useSocket());

        act(() => {
            result.current.connect('http://localhost:3000');
            mockSocket._trigger('connect');
        });

        act(() => {
            result.current.disconnect();
        });

        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.status).toBe('Disconnected');
        expect(result.current.socket).toBeNull();
    });

    it('should accumulate stream data', () => {
        const { result } = renderHook(() => useSocket());

        act(() => {
            result.current.connect('http://localhost:3000');
            mockSocket._trigger('connect');
        });

        // Initial state check
        expect(result.current.currentStream).toBe('Waiting for AI...');

        // Receive first chunk
        act(() => {
            mockSocket._trigger('ai:stream', { text: 'Hello ' });
        });

        expect(result.current.currentStream).toBe('Hello ');

        // Receive second chunk
        act(() => {
            mockSocket._trigger('ai:stream', { text: 'World' });
        });

        expect(result.current.currentStream).toBe('Hello World');
    });

    it('should handle connection errors', () => {
        const { result } = renderHook(() => useSocket());

        act(() => {
            result.current.connect('http://localhost:3000');
        });

        act(() => {
            mockSocket._trigger('connect_error', { message: 'Connection refused' });
        });

        expect(result.current.isConnected).toBe(false);
        expect(result.current.status).toContain('Error: Connection refused');
    });
});
