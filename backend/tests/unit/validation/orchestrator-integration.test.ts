
import { streamBehavioral } from '../../../src/services/ai-orchestrator/unified-orchestrator';

// Mock dependencies
jest.mock('../../../src/services/ai-orchestrator/orchestrator', () => {
    return {
        AIOrchestrator: jest.fn().mockImplementation(() => {
            return {
                streamBehavioralAnswer: jest.fn().mockImplementation(async function* () {
                    // Simulate garbage stream: >100 chars with no spaces
                    yield 'This is start. ';
                    yield 'abcdefghijklmnopqrstuvwxyz'.repeat(5); // 130 chars garbage
                    yield 'Should not be seen';
                }),
                close: jest.fn()
            }
        })
    }
});

jest.mock('../../../src/config/env', () => ({
    env: {
        USE_LANGGRAPH: false,
        USE_CHROMADB: false
    }
}));

// Mock Chroma service to avoid errors
jest.mock('../../../src/services/chroma-service', () => ({
    getChromaService: () => ({ search: jest.fn().mockResolvedValue([]) })
}));

describe('Validation Integration', () => {
    it('should halt stream when garbage is detected', async () => {
        const generator = streamBehavioral('test question');
        const chunks: string[] = [];

        for await (const chunk of generator) {
            chunks.push(chunk);
        }

        const fullText = chunks.join('');

        // It should contain the start
        expect(fullText).toContain('This is start.');

        // It should contain the Error Alert
        expect(fullText).toContain('[System Alert: AI Output Halted - Gibberish/High entropy detected]');

        // It should NOT contain "Should not be seen" (because loop breaks)
        expect(fullText).not.toContain('Should not be seen');
    });
});
