import { AIRouter } from './ai-router';
import { BEHAVIORAL_SYSTEM_PROMPT, CODING_SYSTEM_PROMPT, CASE_INTERVIEW_SYSTEM_PROMPT } from './prompts/templates';

import { MCPClientService } from '../mcp/client';

export class AIOrchestrator {
    private router: AIRouter;
    private mcpClient: MCPClientService;
    private mcpInitialized = false;
    private mcpInitPromise: Promise<void> | null = null;

    constructor() {
        this.router = new AIRouter();
        this.mcpClient = new MCPClientService();
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

    async streamBehavioralAnswer(question: string, context: string, providerId: string = 'openai') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);
        const systemPrompt = BEHAVIORAL_SYSTEM_PROMPT.replace('{{context}}', context);

        let tools: any[] = [];
        try {
            const toolList = await this.mcpClient.listTools();
            tools = toolList.tools;
        } catch (e) {
            console.warn('Failed to list tools', e);
        }

        return provider.streamBehavioralAnswer(question, context, systemPrompt, {
            tools,
            toolExecutor: async (name, args) => {
                const res = await this.mcpClient.callTool(name, args);
                return res.content;
            }
        });
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string, providerId: string = 'openai') {
        await this.ensureMcpConnected();
        const provider = this.router.getProvider(providerId);
        const systemPrompt = CODING_SYSTEM_PROMPT.replace('{{screenContext}}', screenSnapshot ? 'Image attached.' : 'No screen context.');

        let tools: any[] = [];
        try {
            const toolList = await this.mcpClient.listTools();
            tools = toolList.tools;
        } catch (e) {
            console.warn('Failed to list tools', e);
        }

        return provider.streamCodingAssist(question, code, screenSnapshot, systemPrompt, {
            tools,
            toolExecutor: async (name, args) => {
                const res = await this.mcpClient.callTool(name, args);
                return res.content;
            }
        });
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

        return provider.streamBehavioralAnswer(transcription, interviewType, systemPrompt, {
            tools: [],
            toolExecutor: async () => ''
        });
    }

    async close() {
        if (this.mcpInitialized) {
            await this.mcpClient.close();
            this.mcpInitialized = false;
            this.mcpInitPromise = null;
        }
    }
}
