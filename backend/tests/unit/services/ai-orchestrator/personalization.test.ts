import { AIOrchestrator } from '../../../../src/services/ai-orchestrator/orchestrator';
import { getGraphDBService } from '../../../../src/services/graph-db-service';
import { BEHAVIORAL_SYSTEM_PROMPT } from '../../../../src/services/ai-orchestrator/prompts/templates';

// Mock dependencies
jest.mock('../../../../src/services/graph-db-service');
jest.mock('../../../../src/services/mcp/client');
jest.mock('../../../../src/services/ai-orchestrator/ai-router');
jest.mock('../../../../src/gateway/socket');

describe('AIOrchestrator Personalization', () => {
    let orchestrator: AIOrchestrator;
    const mockGraphDB = {
        getWeakAreas: jest.fn(),
        initialize: jest.fn()
    };

    // Mock Router and Provider
    const mockProvider = {
        streamBehavioralAnswer: jest.fn().mockResolvedValue((async function* () { yield 'response'; })())
    };
    const mockRouter = {
        getProvider: jest.fn().mockReturnValue(mockProvider)
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getGraphDBService as jest.Mock).mockReturnValue(mockGraphDB);

        // We need to mock the internal router of the orchestrator
        // Since it's private, we can cast to any or mock the module if possible.
        // For simplicity, we'll assume the mock above handles the router logic if we mocked the module correctly.
        // However, I mocked the module path, so I need to ensure the class uses it.
        // Update: I mocked the dependency modules, so standard instantiation should use mocks.

        // We need to mock the router explicitly because it's instantiated inside constructor
        const { AIRouter } = require('../../../../src/services/ai-orchestrator/ai-router');
        (AIRouter as jest.Mock).mockImplementation(() => mockRouter);

        orchestrator = new AIOrchestrator();
    });

    it('should inject personalization context for user with weak areas', async () => {
        const userId = 'user-123';
        const weakAreas = [{ type: 'Dynamic Programming', averageScore: 0.4 }];
        mockGraphDB.getWeakAreas.mockResolvedValue(weakAreas);

        await orchestrator.streamBehavioralAnswer('Question', 'Context', 'ollama', userId);

        // Verify GraphDB was called
        expect(mockGraphDB.getWeakAreas).toHaveBeenCalledWith(userId);

        // Verify provider was called with modified prompt
        const expectedPersonalization = "\n\n**PERSONALIZATION**: The user has shown weakness in: Dynamic Programming. Please provide extra detailed explanations for these topics.";

        const callArgs = mockProvider.streamBehavioralAnswer.mock.calls[0];
        const systemPromptUsed = callArgs[2]; // 3rd argument is systemPrompt

        expect(systemPromptUsed).toContain(expectedPersonalization);
    });

    it('should NOT inject context if user has no weak areas', async () => {
        const userId = 'user-clean';
        mockGraphDB.getWeakAreas.mockResolvedValue([]);

        await orchestrator.streamBehavioralAnswer('Question', 'Context', 'ollama', userId);

        expect(mockGraphDB.getWeakAreas).toHaveBeenCalledWith(userId);

        const callArgs = mockProvider.streamBehavioralAnswer.mock.calls[0];
        const systemPromptUsed = callArgs[2];

        // Should contain empty string replacement or just not have the personalization text
        expect(systemPromptUsed).not.toContain("**PERSONALIZATION**");
    });

    it('should handle GraphDB errors gracefully', async () => {
        const userId = 'user-error';
        mockGraphDB.getWeakAreas.mockRejectedValue(new Error('DB Failed'));

        // Should not throw
        await orchestrator.streamBehavioralAnswer('Question', 'Context', 'ollama', userId);

        const callArgs = mockProvider.streamBehavioralAnswer.mock.calls[0];
        expect(callArgs).toBeDefined(); // Should still proceed
    });
});
