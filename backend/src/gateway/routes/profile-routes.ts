import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProfileService } from '../../services/profile/profile-service';

const preferencesSchema = z.object({
    privacyMode: z.boolean().optional(),
    modelProvider: z.enum(['openai', 'anthropic', 'ollama']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
});

const profileRoutes: FastifyPluginAsync = async (fastify) => {
    const profileService = new ProfileService();

    fastify.get('/profile', async (request, reply) => {
        const user = request.user as { id: string };
        const profile = await profileService.getProfile(user.id);
        if (!profile) return reply.code(404).send({ message: 'Profile not found' });
        return profile;
    });

    fastify.patch('/profile/preferences', async (request, reply) => {
        const user = request.user as { id: string };
        const body = preferencesSchema.parse(request.body);

        const updated = await profileService.updatePreferences(user.id, body);
        return updated;
    });
};

export default profileRoutes;
