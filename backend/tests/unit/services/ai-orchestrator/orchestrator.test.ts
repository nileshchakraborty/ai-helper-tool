import { AIOrchestrator } from 'src/services/ai-orchestrator/orchestrator';

// Mock dependencies
jest.mock('src/services/ai-orchestrator/ai-router', () => {
    return {
        AIRouter: jest.fn().mockImplementation(() => ({
            getProvider: jest.fn().mockReturnValue({
                streamBehavioralAnswer: jest.fn().mockImplementation(async function* () {
                    yield 'Chunk 1';
                    yield 'Chunk 2';
                }),
                streamCodingAssist: jest.fn(),
            }),
        })),
    };
});

describe('AIOrchestrator', () => {
    let orchestrator: AIOrchestrator;

    afterEach(async () => {
        if (orchestrator) {
            await orchestrator.close();
        }
    });

    test('streams behavioral answer', async () => {
        orchestrator = new AIOrchestrator();
        const stream = await orchestrator.streamBehavioralAnswer('Question', 'Context');

        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        expect(chunks).toEqual(['Chunk 1', 'Chunk 2']);
    });
});

