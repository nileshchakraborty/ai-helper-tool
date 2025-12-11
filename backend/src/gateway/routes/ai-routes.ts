import { FastifyInstance } from 'fastify';
import { AIOrchestrator } from '../../services/ai-orchestrator/orchestrator';
import { SessionService } from '../../services/session/session-service';

const orchestrator = new AIOrchestrator();

export async function aiRoutes(fastify: FastifyInstance) {
    const sessionService = new SessionService();

    fastify.post('/behavioral/answer', async (request, reply) => {
        const user = request.user as { id: string };
        const { question, context, provider = 'openai', sessionId } = request.body as any;

        if (sessionId) {
            await sessionService.addMessage(user.id, sessionId, 'user', `Context: ${context}\nQuestion: ${question}`);
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
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && fullResponse) {
                await sessionService.addMessage(user.id, sessionId, 'assistant', fullResponse);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });

    fastify.post('/coding/assist', async (request, reply) => {
        const user = request.user as { id: string };
        const { question, code, screenSnapshot, provider = 'openai', sessionId } = request.body as any;

        if (sessionId) {
            await sessionService.addMessage(user.id, sessionId, 'user', `Question: ${question}\nCode:\n${code}`);
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
            reply.raw.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        } finally {
            if (sessionId && fullResponse) {
                await sessionService.addMessage(user.id, sessionId, 'assistant', fullResponse);
            }
            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        }
    });
}
