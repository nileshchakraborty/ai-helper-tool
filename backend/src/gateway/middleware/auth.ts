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
        // Simple check for public routes
        if (url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/health')) {
            return;
        }

        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
