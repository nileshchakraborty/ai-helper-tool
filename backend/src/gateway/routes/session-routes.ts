import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MCPClientService } from '../../services/mcp/client';

const createSessionSchema = z.object({
    title: z.string(),
    type: z.enum(['behavioral', 'coding']),
});

const mcpClient = new MCPClientService();
let mcpInitialized = false;

async function ensureMcpConnected() {
    if (!mcpInitialized) {
        await mcpClient.connect();
        mcpInitialized = true;
    }
}

const sessionRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post('/sessions', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const body = createSessionSchema.parse(request.body);

        const session = await mcpClient.startSession(user.id, body.type, body.title);
        return session;
    });

    fastify.get('/sessions', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const history = await mcpClient.getHistory(user.id);
        return history;
    });

    fastify.get('/sessions/:id/messages', async (request, reply) => {
        await ensureMcpConnected();
        const { id } = request.params as { id: string };
        const messages = await mcpClient.getSessionMessages(id);
        return messages;
    });
};

export default sessionRoutes;
