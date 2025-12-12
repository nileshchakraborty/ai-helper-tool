import { AIOrchestrator } from 'src/services/ai-orchestrator/orchestrator';
import { AgentType } from 'src/services/ai-orchestrator/agents/SupervisorAgent';

// Mocks have to be hoisted or use doMock. Jest auto-hoists jest.mock calls.

const mockStreamBehavioral = jest.fn();
const mockStreamCoding = jest.fn();
const mockGetProvider = jest.fn().mockReturnValue({
    streamBehavioralAnswer: mockStreamBehavioral,
    streamCodingAssist: mockStreamCoding
});

jest.mock('src/services/ai-orchestrator/ai-router', () => {
    return {
        AIRouter: jest.fn().mockImplementation(() => ({
            getProvider: mockGetProvider
        }))
    };
});

const mockClassify = jest.fn();
jest.mock('src/services/ai-orchestrator/agents/SupervisorAgent', () => {
    return {
        SupervisorAgent: jest.fn().mockImplementation(() => ({
            classify: mockClassify
        })),
        AgentType: {
            CODING: 'coding',
            KNOWLEDGE: 'knowledge',
            SYSTEM_DESIGN: 'system_design',
            MEETING: 'meeting',
            CHAT: 'chat'
        }
    };
});

const mockVectorSearch = jest.fn();
jest.mock('src/services/VectorService', () => ({
    VectorService: {
        getInstance: jest.fn(() => ({
            search: mockVectorSearch.mockResolvedValue([])
        }))
    }
}));

const mockMcpConnect = jest.fn();
const mockListTools = jest.fn();
jest.mock('src/services/mcp/client', () => ({
    MCPClientService: jest.fn().mockImplementation(() => ({
        connect: mockMcpConnect.mockResolvedValue(undefined),
        listTools: mockListTools.mockResolvedValue({ tools: [] }),
        callTool: jest.fn(),
        close: jest.fn()
    }))
}));

describe('AIOrchestrator', () => {
    let orchestrator: AIOrchestrator;

    beforeEach(() => {
        jest.clearAllMocks();
        orchestrator = new AIOrchestrator();
    });

    test('should route image-only request to Coding Agent (Vision)', async () => {
        // Arrange
        mockStreamCoding.mockResolvedValue('Vision Response');

        // Act
        await orchestrator.routeRequest('', '', 'openai', { image: 'base64data' });

        // Assert
        expect(mockStreamCoding).toHaveBeenCalledWith(
            expect.stringContaining('Analyze this image'),
            '',
            'base64data',
            expect.any(String), // systemPrompt
            expect.anything()   // flags
        );
        expect(mockClassify).not.toHaveBeenCalled();
    });

    test('should route to KNOWLEDGE agent based on classification', async () => {
        mockClassify.mockResolvedValue({ agent: AgentType.KNOWLEDGE, reasoning: 'History question' });
        mockStreamBehavioral.mockResolvedValue('History Answer');

        await orchestrator.routeRequest('Who was Napoleon?', '', 'openai');

        expect(mockClassify).toHaveBeenCalledWith('Who was Napoleon?', 'openai');
        expect(mockStreamBehavioral).toHaveBeenCalledWith(
            'Who was Napoleon?',
            '',
            expect.anything(),
            expect.anything()
        );
    });

    test('should route to CODING agent based on classification', async () => {
        mockClassify.mockResolvedValue({ agent: AgentType.CODING, reasoning: 'Code question' });
        mockStreamCoding.mockResolvedValue('Code Answer');

        await orchestrator.routeRequest('Write binary search', '', 'openai');

        expect(mockStreamCoding).toHaveBeenCalled();
    });

    test('should use RAG context if found', async () => {
        // Mock Vector Service return
        mockVectorSearch.mockResolvedValueOnce([{ text: 'Relevant Info', id: '1' }]);
        mockStreamBehavioral.mockResolvedValue('Answer with Context');

        await orchestrator.streamBehavioralAnswer('Question', 'Context');

        expect(mockVectorSearch).toHaveBeenCalledWith('Question');
        // Check if system prompt contains "Relevant Knowledge Base"
        // The mock call arguments for streamBehavioralAnswer are (q, c, systemPrompt, flags)
        // arg[2] is systemPrompt
        const systemPrompt = mockStreamBehavioral.mock.calls[0][2];
        expect(systemPrompt).toContain('Relevant Knowledge Base');
        expect(systemPrompt).toContain('Relevant Info');
    });
});
