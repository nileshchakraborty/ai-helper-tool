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
        const publicRoutes = ['/v1/health', '/v1/auth/login', '/v1/auth/signup'];
        if (publicRoutes.includes(request.routeOptions.url || '')) {
            return;
        }

        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});
