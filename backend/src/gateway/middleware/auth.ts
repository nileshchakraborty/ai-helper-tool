import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface AuthUser {
    id: string;
    email: string;
}

// fastify-jwt adds user to FastifyRequest, so we don't need manual augmentation here
// if we stick to standard fastify-jwt types without custom AuthUser interface


export const authMiddleware = fp(async (fastify, opts) => {

    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const url = request.url;
        // Public routes that don't require authentication
        const publicPaths = [
            '/auth/login',
            '/auth/signup',
            '/health',
            '/behavioral/answer',  // AI endpoints are public for easier testing
            '/coding/assist',
            '/case/analyze',       // MBA consulting case interviews
            '/coach/natural',      // Natural conversational coaching
            '/listen/assist',      // Live audio transcription assist
        ];

        if (publicPaths.some(path => url.includes(path))) {
            return;
        }

        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
