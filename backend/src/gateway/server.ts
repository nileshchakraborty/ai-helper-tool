import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/env';

import { aiRoutes } from './routes/ai-routes';
import authRoutes from './routes/auth-routes';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { policyMiddleware } from './middleware/policy';
import profileRoutes from './routes/profile-routes';
import sessionRoutes from './routes/session-routes';
import { imageRoutes } from './routes/image-routes';
import { checkServicesHealth } from './startup-health';
import { initSocket } from './socket';

const buildServer = async () => {
    const server = Fastify({
        logger: env.NODE_ENV === 'development',
    });

    server.register(cors);
    server.register(require('@fastify/jwt'), {
        secret: env.JWT_SECRET,
    });

    server.register(rateLimitMiddleware);
    server.register(policyMiddleware);  // Policy enforcement
    server.register(authMiddleware);
    server.register(authRoutes, { prefix: '/v1' });
    server.register(profileRoutes, { prefix: '/v1' });
    server.register(sessionRoutes, { prefix: '/v1' });
    server.register(aiRoutes, { prefix: '/v1' });
    server.register(imageRoutes, { prefix: '/v1/ai' });

    server.get('/health', async () => {
        return { status: 'ok' };
    });

    return server;
};

export const startServer = async () => {
    try {
        const server = await buildServer();

        // Initialize Socket.IO
        initSocket(server);

        await server.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${env.PORT}`);

        // Check services health after startup
        await checkServicesHealth();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

export { buildServer };

