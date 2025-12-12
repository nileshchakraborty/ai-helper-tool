import Fastify, { FastifyInstance } from 'fastify';

// Mock dependencies
const mockRouteRequest = jest.fn();
const mockStreamBehavioral = jest.fn();
jest.mock('src/services/ai-orchestrator/orchestrator', () => {
    return {
        AIOrchestrator: jest.fn().mockImplementation(() => ({
            routeRequest: mockRouteRequest,
            streamBehavioralAnswer: mockStreamBehavioral,
            close: jest.fn()
        }))
    };
});

jest.mock('src/services/mcp/client', () => {
    return {
        MCPClientService: jest.fn().mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue(undefined),
            addMessage: jest.fn().mockResolvedValue(undefined),
            close: jest.fn()
        }))
    };
});

describe('AI Routes', () => {
    let fastify: FastifyInstance;

    beforeEach(async () => {
        jest.clearAllMocks();
        fastify = Fastify();
        // Register route plugin
        fastify.decorateRequest('user', null as any);

        // Dynamic import to ensured mocks are used
        const { aiRoutes } = require('src/gateway/routes/ai-routes');
        await fastify.register(aiRoutes);
    });

    afterEach(async () => {
        await fastify.close();
    });

    test('POST /agent/chat should call orchestrator.routeRequest', async () => {
        // Mock stream return
        async function* mockGenerator() {
            yield 'Hello';
            yield 'World';
        }
        mockRouteRequest.mockResolvedValue(mockGenerator());

        const response = await fastify.inject({
            method: 'POST',
            url: '/agent/chat',
            payload: {
                message: 'Hello AI',
                provider: 'openai'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(mockRouteRequest).toHaveBeenCalledWith(
            'Hello AI',
            '', // default context
            'openai',
            undefined
        );
        expect(response.body).toContain('data: {"text":"Hello"}');
    });

    test('POST /behavioral/answer should call streamBehavioralAnswer', async () => {
        async function* mockGenerator() {
            yield 'STAR';
            yield 'Method';
        }
        mockStreamBehavioral.mockResolvedValue(mockGenerator());

        const response = await fastify.inject({
            method: 'POST',
            url: '/behavioral/answer',
            payload: {
                question: 'Tell me about a challenge',
                context: 'Role: Engineer'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(mockStreamBehavioral).toHaveBeenCalledWith(
            'Tell me about a challenge',
            'Role: Engineer',
            'ollama' // default
        );
        expect(response.body).toContain('data: [DONE]');
    });
});
