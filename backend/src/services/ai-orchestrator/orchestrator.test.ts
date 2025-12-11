import { AIOrchestrator } from './orchestrator';

// Mock dependencies
jest.mock('./ai-router', () => {
    return {
        AIRouter: jest.fn().mockImplementation(() => ({
            getProvider: jest.fn().mockReturnValue({
                stream: jest.fn().mockImplementation(async function* () {
                    yield 'Chunk 1';
                    yield 'Chunk 2';
                }),
            }),
        })),
    };
});

describe('AIOrchestrator', () => {
    test('streams behavioral answer', async () => {
        const orchestrator = new AIOrchestrator();
        const stream = await orchestrator.streamBehavioralAnswer('Question', 'Context');

        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        expect(chunks).toEqual(['Chunk 1', 'Chunk 2']);
    });
});
