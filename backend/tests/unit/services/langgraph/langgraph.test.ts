/**
 * LangGraph Multi-Agent Tests
 */
import {
    AgentType,
    createAgentGraph,
} from '../../../../src/services/ai-orchestrator/langgraph';

describe('LangGraph Multi-Agent', () => {
    describe('createAgentGraph', () => {
        it('should create a compiled graph', () => {
            const graph = createAgentGraph();
            expect(graph).toBeDefined();
            expect(typeof graph.invoke).toBe('function');
            expect(typeof graph.stream).toBe('function');
        });

        it('should have getGraph method for inspection', () => {
            const graph = createAgentGraph();
            // LangGraph compiled graphs have a getGraph method
            expect(graph).toHaveProperty('getGraph');
        });
    });

    describe('AgentType enum', () => {
        it('should have all agent types defined', () => {
            expect(AgentType.CODING).toBe('CODING');
            expect(AgentType.BEHAVIORAL).toBe('BEHAVIORAL');
            expect(AgentType.SYSTEM_DESIGN).toBe('SYSTEM_DESIGN');
            expect(AgentType.MEETING).toBe('MEETING');
            expect(AgentType.CHAT).toBe('CHAT');
        });
    });
});
