import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// Simple in-memory rate limiter for MVP. Replace with Redis for production.
const rateLimitMap = new Map<string, number>();
const authRateLimitMap = new Map<string, number>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;
const AUTH_MAX_REQUESTS = 5; // Stricter limit for auth endpoints

// Auth paths that need stricter rate limiting
const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/signup'];

export const rateLimitMiddleware = fp(async (fastify, opts) => {
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const ip = request.ip;
        const path = request.url.split('?')[0]; // Remove query params
        const isAuthPath = AUTH_PATHS.includes(path);

        if (isAuthPath) {
            // Stricter rate limiting for auth endpoints
            const authCount = authRateLimitMap.get(ip) || 0;

            if (authCount >= AUTH_MAX_REQUESTS) {
                reply.code(429).send({
                    error: 'Too Many Authentication Attempts',
                    retryAfter: 60
                });
                return;
            }

            authRateLimitMap.set(ip, authCount + 1);
            setTimeout(() => authRateLimitMap.delete(ip), WINDOW_MS);
        } else {
            // Standard rate limiting for other endpoints
            const count = rateLimitMap.get(ip) || 0;

            if (count >= MAX_REQUESTS) {
                reply.code(429).send({ error: 'Too Many Requests' });
                return;
            }

            rateLimitMap.set(ip, count + 1);
            setTimeout(() => rateLimitMap.delete(ip), WINDOW_MS);
        }
    });
});
