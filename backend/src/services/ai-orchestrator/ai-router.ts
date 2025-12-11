import { AIProvider } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

import { env } from '../../config/env';

export class AIRouter {
    private providers: Map<string, AIProvider>;

    constructor() {
        this.providers = new Map();

        if (env.OPENAI_API_KEY) {
            this.registerProvider('openai', new OpenAIProvider());
        } else {
            console.warn('[AIRouter] OpenAI key missing. Skipping provider.');
        }

        if (env.ANTHROPIC_API_KEY) {
            this.registerProvider('anthropic', new AnthropicProvider());
        }

        this.registerProvider('local', new OllamaProvider());
    }

    registerProvider(id: string, provider: AIProvider) {
        this.providers.set(id, provider);
    }

    getProvider(id: string): AIProvider {
        const provider = this.providers.get(id);
        if (!provider) {
            const fallback = this.providers.get('openai');
            if (fallback) return fallback;
            // Last resort fallback
            const local = this.providers.get('local');
            if (local) return local;

            throw new Error(`Provider ${id} not found and no fallback available`);
        }
        return provider;
    }
}
