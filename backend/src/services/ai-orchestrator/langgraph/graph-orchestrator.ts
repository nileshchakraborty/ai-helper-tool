/**
 * LangGraph Multi-Agent Orchestrator
 * State machine for routing requests to specialized agents
 */
import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { getLLM, getClassifierLLM, ProviderType } from '../langchain/providers';
import {
    BEHAVIORAL_SYSTEM_PROMPT,
    CODING_SYSTEM_PROMPT,
    CASE_INTERVIEW_SYSTEM_PROMPT,
    SYSTEM_DESIGN_SYSTEM_PROMPT,
    MEETING_SYSTEM_PROMPT,
} from '../prompts/templates';

// Agent types matching SupervisorAgent
export enum AgentType {
    CODING = 'CODING',
    BEHAVIORAL = 'BEHAVIORAL',
    SYSTEM_DESIGN = 'SYSTEM_DESIGN',
    MEETING = 'MEETING',
    CHAT = 'CHAT',
}

// State definition using LangGraph Annotation
const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (current, update) => [...current, ...update],
        default: () => [],
    }),
    agentType: Annotation<AgentType>({
        reducer: (_, update) => update,
        default: () => AgentType.CHAT,
    }),
    context: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
    providerId: Annotation<ProviderType>({
        reducer: (_, update) => update,
        default: () => 'ollama',
    }),
    finalResponse: Annotation<string>({
        reducer: (_, update) => update,
        default: () => '',
    }),
});

type GraphStateType = typeof GraphState.State;

// Supervisor prompt for classification
const SUPERVISOR_PROMPT = `You are a routing agent. Analyze the user's message and determine which specialist should handle it.

Output ONLY a JSON object:
{"agent": "CODING" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "MEETING" | "CHAT", "reasoning": "brief reason"}

Rules:
- CODING: Code, algorithms, LeetCode, debugging, "how do I implement..."
- BEHAVIORAL: "Tell me about a time...", STAR method, soft skills, resume
- SYSTEM_DESIGN: Architecture, scaling, databases, distributed systems
- MEETING: Video calls, slides, transcripts, "what did they say"
- CHAT: Greetings, general questions, unclear requests`;

/**
 * Supervisor node - classifies and routes requests
 */
async function supervisorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const llm = getClassifierLLM();
    const lastMessage = state.messages[state.messages.length - 1];

    const response = await llm.invoke([
        new SystemMessage(SUPERVISOR_PROMPT),
        new HumanMessage(lastMessage.content as string),
    ]);

    // Parse JSON from response
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    let agentType = AgentType.CHAT;
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            agentType = parsed.agent as AgentType;
        } catch {
            console.warn('[LangGraph] Failed to parse supervisor response');
        }
    }

    return { agentType };
}

/**
 * Generic agent node factory
 */
function createAgentNode(systemPrompt: string) {
    return async (state: GraphStateType): Promise<Partial<GraphStateType>> => {
        const llm = getLLM(state.providerId);
        const lastMessage = state.messages[state.messages.length - 1];

        // Fill in template variables
        const filledPrompt = systemPrompt
            .replace('{{context}}', state.context)
            .replace('{{screenContext}}', state.context)
            .replace('{{problem}}', lastMessage.content as string);

        const response = await llm.invoke([
            new SystemMessage(filledPrompt),
            new HumanMessage(lastMessage.content as string),
        ]);

        return {
            messages: [new AIMessage(response.content as string)],
            finalResponse: response.content as string,
        };
    };
}

// Create specialized agent nodes
const codingNode = createAgentNode(CODING_SYSTEM_PROMPT);
const behavioralNode = createAgentNode(BEHAVIORAL_SYSTEM_PROMPT);
const systemDesignNode = createAgentNode(SYSTEM_DESIGN_SYSTEM_PROMPT);
const meetingNode = createAgentNode(MEETING_SYSTEM_PROMPT);
const chatNode = createAgentNode('You are a helpful AI assistant. Be concise and friendly.');

/**
 * Router function for conditional edges
 */
function routeToAgent(state: GraphStateType): string {
    switch (state.agentType) {
        case AgentType.CODING:
            return 'coding';
        case AgentType.BEHAVIORAL:
            return 'behavioral';
        case AgentType.SYSTEM_DESIGN:
            return 'systemDesign';
        case AgentType.MEETING:
            return 'meeting';
        default:
            return 'chat';
    }
}

/**
 * Build and compile the agent graph
 */
export function createAgentGraph() {
    const workflow = new StateGraph(GraphState)
        .addNode('supervisor', supervisorNode)
        .addNode('coding', codingNode)
        .addNode('behavioral', behavioralNode)
        .addNode('systemDesign', systemDesignNode)
        .addNode('meeting', meetingNode)
        .addNode('chat', chatNode)
        .addEdge(START, 'supervisor')
        .addConditionalEdges('supervisor', routeToAgent, {
            coding: 'coding',
            behavioral: 'behavioral',
            systemDesign: 'systemDesign',
            meeting: 'meeting',
            chat: 'chat',
        })
        .addEdge('coding', END)
        .addEdge('behavioral', END)
        .addEdge('systemDesign', END)
        .addEdge('meeting', END)
        .addEdge('chat', END);

    return workflow.compile();
}

/**
 * High-level function to route a request through the graph
 */
export async function routeWithGraph(
    message: string,
    context: string = '',
    providerId: ProviderType = 'ollama'
): Promise<string> {
    const graph = createAgentGraph();

    const result = await graph.invoke({
        messages: [new HumanMessage(message)],
        context,
        providerId,
    });

    return result.finalResponse;
}

/**
 * Streaming version - returns async generator for SSE
 */
export async function* streamWithGraph(
    message: string,
    context: string = '',
    providerId: ProviderType = 'ollama'
): AsyncGenerator<string, void, unknown> {
    const graph = createAgentGraph();

    const stream = await graph.stream({
        messages: [new HumanMessage(message)],
        context,
        providerId,
    });

    for await (const event of stream) {
        // Extract content from the last node's output
        const nodeOutput = Object.values(event)[0] as Partial<GraphStateType>;
        if (nodeOutput?.finalResponse) {
            yield nodeOutput.finalResponse;
        }
    }
}

// Export state type for testing
export type { GraphStateType };
