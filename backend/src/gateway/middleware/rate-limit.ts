import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// Simple in-memory rate limiter for MVP. Replace with Redis for production.
const rateLimitMap = new Map<string, number>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

export const rateLimitMiddleware = fp(async (fastify, opts) => {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const ip = request.ip;
        const now = Date.now();

        // Cleanup old entries (naive)
        // In real app, Redis TTL handles this

        const count = rateLimitMap.get(ip) || 0;

        if (count > MAX_REQUESTS) {
            reply.code(429).send({ error: 'Too Many Requests' });
            return;
        }

        rateLimitMap.set(ip, count + 1);

        // Reset after window (naive implementation for demo)
        setTimeout(() => rateLimitMap.delete(ip), WINDOW_MS);
    });
});
