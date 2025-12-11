import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SessionService } from '../../services/session/session-service';

const createSessionSchema = z.object({
    title: z.string(),
    type: z.enum(['behavioral', 'coding']),
});

const sessionRoutes: FastifyPluginAsync = async (fastify) => {
    const sessionService = new SessionService();

    fastify.post('/sessions', async (request, reply) => {
        const user = request.user as { id: string };
        const body = createSessionSchema.parse(request.body);

        const session = await sessionService.startSession(user.id, body.type, body.title);
        return session;
    });

    fastify.get('/sessions', async (request, reply) => {
        const user = request.user as { id: string };
        const history = await sessionService.getUserHistory(user.id);
        return history;
    });

    fastify.get('/sessions/:id/messages', async (request, reply) => {
        const { id } = request.params as { id: string };
        // TODO: Verify ownership? Yes, usually.
        const messages = await sessionService.getSessionMessages(id);
        return messages;
    });
};

export default sessionRoutes;
