import { FastifyInstance } from 'fastify';
import { AIOrchestrator } from '../../services/ai-orchestrator/orchestrator';
import { MCPClientService } from '../../services/mcp/client';

const orchestrator = new AIOrchestrator();
const mcpClient = new MCPClientService();
let mcpInitialized = false;

async function ensureMcpConnected() {
    if (!mcpInitialized) {
        try {
            await mcpClient.connect();
            mcpInitialized = true;
        } catch (error) {
            console.error('[MCP] Connection failed:', error);
        }
    }
}

export async function aiRoutes(fastify: FastifyInstance) {
    fastify.post('/behavioral/answer', async (request, reply) => {
        await ensureMcpConnected();

        // Support both authenticated and anonymous users
        const user = request.user as { id: string } | undefined;
        const userId = user?.id || 'anonymous';

        // Default to ollama provider for local AI
        const { question, context, provider = 'ollama', sessionId } = request.body as any;

        // Only save to session if user is authenticated and sessionId provided
        if (sessionId && user?.id) {
            try {
                await mcpClient.addMessage(userId, sessionId, 'user', `Context: ${context}\nQuestion: ${question}`);
            } catch (e) {
                // Ignore session errors, continue with AI response
            }
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            const stream = await orchestrator.streamBehavioralAnswer(question, context, provider);

            for await (const chunk of stream) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            console.error('[AI] Behavioral error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && user?.id && fullResponse) {
                try {
                    await mcpClient.addMessage(userId, sessionId, 'assistant', fullResponse);
                } catch (e) {
                    // Ignore session save errors
                }
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    fastify.post('/coding/assist', async (request, reply) => {
        await ensureMcpConnected();

        // Support both authenticated and anonymous users
        const user = request.user as { id: string } | undefined;
        const userId = user?.id || 'anonymous';

        const body = request.body as any;
        // Default to ollama provider for local AI
        const { question, code, provider = 'ollama', sessionId } = body;
        const screenSnapshot = body.screenSnapshot || body.screenContext;

        if (sessionId && user?.id) {
            try {
                await mcpClient.addMessage(userId, sessionId, 'user', `Question: ${question}\nCode:\n${code}`);
            } catch (e) {
                // Ignore session errors
            }
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            const stream = await orchestrator.streamCodingAssist(question, code, screenSnapshot, provider);

            for await (const chunk of stream) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            console.error('[AI] Coding error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && user?.id && fullResponse) {
                try {
                    await mcpClient.addMessage(userId, sessionId, 'assistant', fullResponse);
                } catch (e) {
                    // Ignore session save errors
                }
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    // MBA Consulting Case Interview endpoint
    fastify.post('/case/analyze', async (request, reply) => {
        await ensureMcpConnected();

        const user = request.user as { id: string } | undefined;
        const userId = user?.id || 'anonymous';

        const { caseDescription, context = '', provider = 'ollama', sessionId } = request.body as any;

        if (sessionId && user?.id) {
            try {
                await mcpClient.addMessage(userId, sessionId, 'user', `Case: ${caseDescription}\nContext: ${context}`);
            } catch (e) {
                // Ignore session errors
            }
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        let fullResponse = '';

        try {
            const stream = await orchestrator.streamCaseAnalysis(caseDescription, context, provider);

            for await (const chunk of stream) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            console.error('[AI] Case analysis error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && user?.id && fullResponse) {
                try {
                    await mcpClient.addMessage(userId, sessionId, 'assistant', fullResponse);
                } catch (e) {
                    // Ignore session save errors
                }
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    // Natural conversational coaching - generates talking points that don't sound read
    fastify.post('/coach/natural', async (request, reply) => {
        await ensureMcpConnected();

        const { question, context = '', provider = 'ollama' } = request.body as any;

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        try {
            const stream = await orchestrator.streamConversationalCoaching(question, context, provider);

            for await (const chunk of stream) {
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            console.error('[AI] Coaching error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    // Live assist from audio transcription - real-time help during interview
    fastify.post('/listen/assist', async (request, reply) => {
        await ensureMcpConnected();

        const { transcription, interviewType = 'behavioral', provider = 'ollama' } = request.body as any;

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        try {
            const stream = await orchestrator.streamLiveAssist(transcription, interviewType, provider);

            for await (const chunk of stream) {
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }
        } catch (error) {
            console.error('[AI] Live assist error:', error);
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });
}
