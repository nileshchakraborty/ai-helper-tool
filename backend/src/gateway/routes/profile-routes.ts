import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MCPClientService } from '../../services/mcp/client';

const preferencesSchema = z.object({
    privacyMode: z.boolean().optional(),
    modelProvider: z.enum(['openai', 'anthropic', 'ollama']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
});

const mcpClient = new MCPClientService();
let mcpInitialized = false;

async function ensureMcpConnected() {
    if (!mcpInitialized) {
        await mcpClient.connect();
        mcpInitialized = true;
    }
}

const profileRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/profile', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const profile = await mcpClient.getProfile(user.id);
        if (!profile) return reply.code(404).send({ message: 'Profile not found' });
        return profile;
    });

    fastify.patch('/profile/preferences', async (request, reply) => {
        await ensureMcpConnected();
        const user = request.user as { id: string };
        const body = preferencesSchema.parse(request.body);

        const updated = await mcpClient.updatePreferences(user.id, body);
        return updated;
    });
};

export default profileRoutes;
