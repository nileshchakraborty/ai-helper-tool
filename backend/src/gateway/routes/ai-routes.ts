import { FastifyInstance } from 'fastify';
import { AIOrchestrator } from '../../services/ai-orchestrator/orchestrator';
import { MCPClientService } from '../../services/mcp/client';

const orchestrator = new AIOrchestrator();
const mcpClient = new MCPClientService();
let mcpInitialized = false;

async function ensureMcpConnected() {
    if (!mcpInitialized) {
        await mcpClient.connect();
        mcpInitialized = true;
    }
}

export async function aiRoutes(fastify: FastifyInstance) {
    fastify.post('/behavioral/answer', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const { question, context, provider = 'openai', sessionId } = request.body as any;

        if (sessionId) {
            await mcpClient.addMessage(user.id, sessionId, 'user', `Context: ${context}\nQuestion: ${question}`);
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            // Use direct streaming for performance
            const stream = await orchestrator.streamBehavioralAnswer(question, context, provider);

            for await (const chunk of stream) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && fullResponse) {
                await mcpClient.addMessage(user.id, sessionId, 'assistant', fullResponse);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    fastify.post('/coding/assist', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const body = request.body as any;
        const { question, code, provider = 'openai', sessionId } = body;
        const screenSnapshot = body.screenSnapshot || body.screenContext;

        if (sessionId) {
            await mcpClient.addMessage(user.id, sessionId, 'user', `Question: ${question}\nCode:\n${code}`);
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            // Use direct streaming for performance
            const stream = await orchestrator.streamCodingAssist(question, code, screenSnapshot, provider);

            for await (const chunk of stream) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && fullResponse) {
                await mcpClient.addMessage(user.id, sessionId, 'assistant', fullResponse);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });
}

