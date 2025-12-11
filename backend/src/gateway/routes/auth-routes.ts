import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProfileRepository } from '../../services/profile/profile-repository';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
    const profileRepo = new ProfileRepository();

    fastify.post('/auth/signup', async (request, reply) => {
        const body = signupSchema.parse(request.body);

        const existing = await profileRepo.findByEmail(body.email);
        if (existing) {
            return reply.code(409).send({ message: 'User already exists' });
        }

        // TODO: Hash password properly with bcrypt/argon2
        const user = await profileRepo.create(body.email, body.fullName, body.password);
        const token = fastify.jwt.sign({ id: user.id, email: user.email });

        return { user, accessToken: token };
    });

    fastify.post('/auth/login', async (request, reply) => {
        const body = loginSchema.parse(request.body);

        const user = await profileRepo.findByEmailForAuth(body.email);
        if (!user || user.password_hash !== body.password) { // TODO: Compare hash
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({ id: user.id, email: user.email });
        return { user: { id: user.id, email: user.email, fullName: user.fullName, preferences: user.preferences }, accessToken: token };
    });
};

export default authRoutes;
