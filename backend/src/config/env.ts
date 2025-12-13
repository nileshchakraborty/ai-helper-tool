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
    GOOGLE_API_KEY: z.string().optional(),
    OLLAMA_HOST: z.string().default('http://127.0.0.1:11434'),
    OLLAMA_MODEL: z.string().default('llama3.2'),
    OLLAMA_API_KEY: z.string().optional(),
    JWT_SECRET: z.string().default('supersecret_dev_key_change_in_prod'),

    // Feature Flags
    USE_LANGGRAPH: z.string().default('false').transform(v => v === 'true'),
    USE_CHROMADB: z.string().default('false').transform(v => v === 'true'),
    USE_NEO4J: z.string().default('false').transform(v => v === 'true'),

    // Data Services
    CHROMA_URL: z.string().default('http://localhost:8000'),
    NEO4J_URI: z.string().default('bolt://localhost:7687'),
    NEO4J_USER: z.string().default('neo4j'),
    NEO4J_PASSWORD: z.string().default('interview123'),
});

export const env = envSchema.parse(process.env);
