import { AIRouter } from './ai-router';
import { BEHAVIORAL_SYSTEM_PROMPT, CODING_SYSTEM_PROMPT } from './prompts/templates';

import { MCPClientService } from '../mcp/client';

export class AIOrchestrator {
    private router: AIRouter;
    private mcpClient: MCPClientService;

    constructor() {
        this.router = new AIRouter();
        this.mcpClient = new MCPClientService();
        this.initMcp();
    }

    private async initMcp() {
        try {
            await this.mcpClient.connect();
            const tools = await this.mcpClient.listTools();
            console.log('[AIOrchestrator] MCP Tools available:', tools.tools.map((t: any) => t.name).join(', '));
        } catch (err) {
            console.error('[AIOrchestrator] Failed to connect to MCP:', err);
        }
    }

    async streamBehavioralAnswer(question: string, context: string, providerId: string = 'openai') {
        const provider = this.router.getProvider(providerId);
        const systemPrompt = BEHAVIORAL_SYSTEM_PROMPT.replace('{{context}}', context);

        return provider.streamBehavioralAnswer(question, context, systemPrompt);
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string, providerId: string = 'openai') {
        const provider = this.router.getProvider(providerId);
        // In a real app, screenSnapshot would be processed by Vision/OCR first
        const systemPrompt = CODING_SYSTEM_PROMPT.replace('{{screenContext}}', 'Image attached.');

        // Pass screenSnapshot as an image if it looks like base64 or url
        // const images = screenSnapshot && screenSnapshot.length > 50 ? [screenSnapshot] : undefined;

        return provider.streamCodingAssist(question, code, screenSnapshot, systemPrompt);
    }
}
