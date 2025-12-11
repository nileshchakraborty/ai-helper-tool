import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.string().default('3000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    DATABASE_URL: z.string().default('postgresql://dev:dev@localhost:5432/maccopilot'),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OLLAMA_HOST: z.string().default('http://127.0.0.1:11434'),
    JWT_SECRET: z.string().default('supersecret_dev_key_change_in_prod'),
});

export const env = envSchema.parse(process.env);
