import { AIRouter } from './ai-router';
import { BEHAVIORAL_SYSTEM_PROMPT, CODING_SYSTEM_PROMPT, CASE_INTERVIEW_SYSTEM_PROMPT, MEETING_SYSTEM_PROMPT } from './prompts/templates';

import { MCPClientService } from '../mcp/client';
import { VectorService } from '../VectorService';
import { getGraphDBService } from '../graph-db-service';
import { SupervisorAgent, AgentType } from './agents/SupervisorAgent';
import { broadcastToMobile } from '../../gateway/socket';

export class AIOrchestrator {
    private router: AIRouter;
    private supervisor: SupervisorAgent;
    private mcpClient: MCPClientService;
    private mcpInitialized = false;
    private mcpInitPromise: Promise<void> | null = null;

    constructor() {
        this.router = new AIRouter();
        this.mcpClient = new MCPClientService();
        this.supervisor = new SupervisorAgent();
    }

    private async ensureMcpConnected() {
        if (this.mcpInitialized) return;

        // Use a single promise to prevent multiple init attempts
        if (!this.mcpInitPromise) {
            this.mcpInitPromise = this.initMcp();
        }
        await this.mcpInitPromise;
    }

    private async initMcp() {
        try {
            await this.mcpClient.connect();
            const tools = await this.mcpClient.listTools();
            console.log('[AIOrchestrator] MCP Tools available:', tools.tools.map((t: any) => t.name).join(', '));
            this.mcpInitialized = true;
        } catch (err) {
            console.error('[AIOrchestrator] Failed to connect to MCP:', err);
        }
    }

    private async getPersonalizationContext(userId: string): Promise<string> {
        if (!userId) return "";
        try {
            const graphDB = getGraphDBService();
            const weakAreas = await graphDB.getWeakAreas(userId);

            if (weakAreas.length === 0) return "";

            const areaNames = weakAreas.map(w => w.type).join(", ");
            return `\n\n**PERSONALIZATION**: The user has shown weakness in: ${areaNames}. Please provide extra detailed explanations for these topics.`;
        } catch (err) {
            console.warn('[AIOrchestrator] Failed to fetch graph context:', err);
            return "";
        }
    }

    async streamBehavioralAnswer(question: string, context: string, providerId: string = 'openai', userId?: string) {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);

        // RAG Retrieval
        const vectorService = VectorService.getInstance();
        const docs = await vectorService.search(question);
        let ragContext = "";
        if (docs.length > 0) {
            ragContext = "\n\nRelevant Knowledge Base:\n" + docs.map(d => `- ${d.text}`).join('\n');
            console.log(`[AIOrchestrator] Retrieved ${docs.length} chunks for context.`);
        }

        // Graph Context
        const personalizationContext = userId ? await this.getPersonalizationContext(userId) : "";

        const systemPrompt = BEHAVIORAL_SYSTEM_PROMPT
            .replace('{{context}}', context + ragContext)
            .replace('{{personalizationContext}}', personalizationContext);

        let tools: any[] = [];
        try {
            const toolList = await this.mcpClient.listTools();
            tools = toolList.tools;
        } catch (e) {
            console.warn('Failed to list tools', e);
        }

        const stream = await provider.streamBehavioralAnswer(question, context, systemPrompt, {
            tools,
            toolExecutor: async (name, args) => {
                const res = await this.mcpClient.callTool(name, args);
                return res.content;
            }
        });
        return this.broadcastStream(stream);
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string, providerId: string = 'openai', userId?: string) {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);


        // RAG Retrieval
        const vectorService = VectorService.getInstance();
        const docs = await vectorService.search(question);
        let ragContext = "";
        if (docs.length > 0) {
            ragContext = "\n\nRelevant Knowledge Base:\n" + docs.map(d => `- ${d.text}`).join('\n');
            console.log(`[AIOrchestrator] Retrieved ${docs.length} chunks for code.`);
        }

        // Graph Context
        const personalizationContext = userId ? await this.getPersonalizationContext(userId) : "";

        const systemPrompt = CODING_SYSTEM_PROMPT
            .replace('{{screenContext}}', (screenSnapshot ? 'Image attached.' : 'No screen context.') + ragContext)
            .replace('{{personalizationContext}}', personalizationContext);

        let tools: any[] = [];
        try {
            const toolList = await this.mcpClient.listTools();
            tools = toolList.tools;
        } catch (e) {
            console.warn('Failed to list tools', e);
        }

        const stream = await provider.streamCodingAssist(question, code, screenSnapshot, systemPrompt, {
            tools,
            toolExecutor: async (name, args) => {
                const res = await this.mcpClient.callTool(name, args);
                return res.content;
            }
        });
        return this.broadcastStream(stream);
    }

    async streamCaseAnalysis(caseDescription: string, context: string, providerId: string = 'ollama') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);
        const systemPrompt = CASE_INTERVIEW_SYSTEM_PROMPT.replace('{{context}}', context);

        return provider.streamBehavioralAnswer(caseDescription, context, systemPrompt, {
            tools: [],
            toolExecutor: async () => ''
        });
    }

    async streamConversationalCoaching(question: string, context: string, providerId: string = 'ollama') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);

        // Import the prompt (we'll need to add it to imports)
        const { CONVERSATIONAL_COACHING_PROMPT } = await import('./prompts/templates');
        const systemPrompt = CONVERSATIONAL_COACHING_PROMPT
            .replace('{{question}}', question)
            .replace('{{context}}', context);

        return provider.streamBehavioralAnswer(question, context, systemPrompt, {
            tools: [],
            toolExecutor: async () => ''
        });
    }

    async streamLiveAssist(transcription: string, interviewType: string, providerId: string = 'ollama') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);

        const { LIVE_ASSIST_PROMPT } = await import('./prompts/templates');
        const systemPrompt = LIVE_ASSIST_PROMPT
            .replace('{{transcription}}', transcription)
            .replace('{{interviewType}}', interviewType);

        const stream = await provider.streamBehavioralAnswer(transcription, interviewType, systemPrompt, {
            tools: [],
            toolExecutor: async () => ''
        });
        return this.broadcastStream(stream);
    }

    async streamSystemDesign(problem: string, context: string, providerId: string = 'ollama') {
        await this.ensureMcpConnected();
        // Reuse behavioral for now or create specific
        return this.streamBehavioralAnswer(problem, context, providerId);
    }

    async streamMeetingAssist(message: string, context: string, screenSnapshot: string, providerId: string = 'ollama') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);

        // System Prompt
        const systemPrompt = MEETING_SYSTEM_PROMPT.replace('{{context}}', context);

        // Reuse streamCodingAssist as generic multimodal handler
        return provider.streamCodingAssist(message, "", screenSnapshot, systemPrompt, {
            tools: [],
            toolExecutor: async () => ''
        });
    }

    /**
     * Agent Swarm Routing
     */
    async routeRequest(message: string, context: string, providerId: string = 'ollama', signals?: { image?: string }) {
        // 1. Silent / Stealth Mode with Image -> Auto-Route to Coding/Vision
        if ((!message || message.trim() === "") && signals?.image) {
            console.log(`[AIOrchestrator] Image-Only Request -> Routing to CODING (Vision)`);
            return this.streamCodingAssist("Analyze this image and provide insights.", "", signals.image, providerId);
        }

        console.log(`[AIOrchestrator] Supervisor analyzing: "${message.substring(0, 50)}..."`);
        const classification = await this.supervisor.classify(message, providerId);
        console.log(`[AIOrchestrator] Supervisor assigned: ${classification.agent} (${classification.reasoning})`);

        switch (classification.agent) {
            case AgentType.CODING:
                // Pass message as question, context as code? Or empty code.
                // Pass image signal if available
                return this.streamCodingAssist(message, "", signals?.image || "", providerId);
            case AgentType.KNOWLEDGE:
                return this.streamBehavioralAnswer(message, context, providerId);
            case AgentType.SYSTEM_DESIGN:
                return this.streamCaseAnalysis(message, context, providerId);
            case AgentType.MEETING:
                return this.streamMeetingAssist(message, context, signals?.image || "", providerId);
            case AgentType.CHAT:
            default:
                // Fallback to simple chat or behavioral
                return this.streamBehavioralAnswer(message, context, providerId);
        }
    }

    async close() {
        if (this.mcpInitialized) {
            await this.mcpClient.close();
            this.mcpInitialized = false;
            this.mcpInitPromise = null;
        }
    }
    private async *broadcastStream(stream: AsyncIterable<string>): AsyncGenerator<string, void, unknown> {
        for await (const chunk of stream) {
            broadcastToMobile('ai:stream', { text: chunk });
            yield chunk;
        }
        broadcastToMobile('ai:stream:done', {});
    }
}
