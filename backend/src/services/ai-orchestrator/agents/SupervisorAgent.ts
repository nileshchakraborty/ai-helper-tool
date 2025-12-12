import { AIRouter } from '../ai-router';

export enum AgentType {
    CODING = 'CODING',
    KNOWLEDGE = 'KNOWLEDGE', // Behavioral / RAG
    CHAT = 'CHAT',           // General / Conversational
    SYSTEM_DESIGN = 'SYSTEM_DESIGN',
    MEETING = 'MEETING'      // Teams, Meet, Chime, Zoom
}

const SUPERVISOR_PROMPT = `
You are the Supervisor of an AI Agent Swarm.
Your job is to analyze the User's Request and delegate it to the best specialist Agent.

**Agents**:
1. **CODING**: For writing code, debugging, algorithms, LeetCode, "how do I implement...", or technical analysis.
2. **KNOWLEDGE**: For behavioral questions ("Tell me about a time"), resume help, soft skills, or questions about specific companies/processes.
3. **SYSTEM_DESIGN**: For high-level architecture, database choice, scaling, or distributed systems.
4. **MEETING**: For assistance during video calls (Teams/Meet/Zoom/Chime). Use this if the user asks for help with a "meeting", "slide", "transcript", or "what did they say?".
5. **CHAT**: For general greetings, "hello", or requests that don't fit above.

**Output Format**:
Return ONLY a valid JSON object:
{
  "agent": "CODING" | "KNOWLEDGE" | "SYSTEM_DESIGN" | "MEETING" | "CHAT",
  "reasoning": "User asked for Python implementation of bubble sort"
}
`;

export class SupervisorAgent {
    private router: AIRouter;

    constructor() {
        this.router = new AIRouter();
    }

    async classify(message: string, providerId: string = 'ollama'): Promise<{ agent: AgentType, reasoning: string }> {
        const provider = this.router.getProvider(providerId);

        // We use a non-streaming call for classification to get the full JSON
        // Since AIProvider interface is stream-heavy, we might need to collect the stream or use a specialized method.
        // For simplicity/speed in MVP, we can assume a short response and collect the stream.

        const stream = await provider.streamChat(message, SUPERVISOR_PROMPT);
        let fullResponse = "";

        for await (const chunk of stream) {
            fullResponse += chunk;
        }

        // Parse JSON from response (handle markdown blocks if any)
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    agent: parsed.agent as AgentType,
                    reasoning: parsed.reasoning
                };
            } catch (e) {
                console.warn("[Supervisor] Failed to parse JSON, defaulting to CHAT", e);
            }
        }

        return { agent: AgentType.CHAT, reasoning: "Fallback" };
    }
}
