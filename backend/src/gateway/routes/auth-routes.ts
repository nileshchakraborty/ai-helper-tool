import { FastifyInstance } from 'fastify';
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { ProfileRepository } from '../../services/profile/profile-repository';

const BCRYPT_ROUNDS = 12;

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Check if a stored password is a bcrypt hash
function isBcryptHash(stored: string): boolean {
    return stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
    const profileRepo = new ProfileRepository();

    fastify.post('/auth/signup', async (request, reply) => {
        const body = signupSchema.parse(request.body);

        const existing = await profileRepo.findByEmail(body.email);
        if (existing) {
            return reply.code(409).send({ message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
        const user = await profileRepo.create(body.email, body.fullName, passwordHash);
        const token = fastify.jwt.sign({ id: user.id, email: user.email });

        return { user, accessToken: token };
    });

    fastify.post('/auth/login', async (request, reply) => {
        const body = loginSchema.parse(request.body);

        const user = await profileRepo.findByEmailForAuth(body.email);
        if (!user) {
            // Consistent error message to prevent account enumeration
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        let validPassword = false;

        if (isBcryptHash(user.password_hash)) {
            // Modern: compare with bcrypt
            validPassword = await bcrypt.compare(body.password, user.password_hash);
        } else {
            // Legacy: plaintext comparison, then migrate
            validPassword = user.password_hash === body.password;
            if (validPassword) {
                // Migrate legacy password to bcrypt hash
                const newHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
                await profileRepo.updatePasswordHash(user.id, newHash);
            }
        }

        if (!validPassword) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({ id: user.id, email: user.email });
        return { user: { id: user.id, email: user.email, fullName: user.fullName, preferences: user.preferences }, accessToken: token };
    });

    // Refresh token endpoint - exchange valid token for new token
    fastify.post('/auth/refresh', async (request, reply) => {
        try {
            // Verify the current token
            await request.jwtVerify();
            const decoded = request.user as { id: string; email: string };

            // Issue a new token with fresh expiry
            const newToken = fastify.jwt.sign({ id: decoded.id, email: decoded.email });

            return { accessToken: newToken };
        } catch (error) {
            return reply.code(401).send({ message: 'Invalid or expired token' });
        }
    });
};

export default authRoutes;



