/**
 * LangChain Provider Factory
 * Unified interface for creating LangChain-compatible LLM instances
 */
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { env } from '../../../config/env';

export type ProviderType = 'ollama' | 'openai' | 'anthropic';

/**
 * Factory for creating LangChain-compatible LLM instances
 * Supports streaming by default
 */
export function getLLM(providerId: ProviderType = 'ollama'): BaseChatModel {
    switch (providerId) {
        case 'ollama':
            return new ChatOllama({
                model: env.OLLAMA_MODEL || 'llama3.2',
                baseUrl: env.OLLAMA_HOST || 'http://localhost:11434',
                streaming: true,
            });

        case 'openai':
            // Lazy import to avoid loading if not needed
            // Will be enabled when @langchain/openai is installed
            throw new Error('OpenAI LangChain provider not yet installed. Run: npm install @langchain/openai');

        case 'anthropic':
            // Lazy import to avoid loading if not needed
            // Will be enabled when @langchain/anthropic is installed
            throw new Error('Anthropic LangChain provider not yet installed. Run: npm install @langchain/anthropic');

        default:
            console.warn(`[LangChain] Unknown provider ${providerId}, falling back to Ollama`);
            return getLLM('ollama');
    }
}

/**
 * Get a vision-capable LLM for image analysis
 */
export function getVisionLLM(providerId: ProviderType = 'ollama'): BaseChatModel {
    switch (providerId) {
        case 'ollama':
            return new ChatOllama({
                model: 'llama3.2-vision',
                baseUrl: env.OLLAMA_HOST || 'http://localhost:11434',
                streaming: true,
            });
        default:
            return getLLM(providerId);
    }
}

/**
 * Get a fast LLM optimized for classification/routing (smaller model)
 */
export function getClassifierLLM(): BaseChatModel {
    return new ChatOllama({
        model: 'llama3.2:1b', // Smaller, faster model for routing
        baseUrl: env.OLLAMA_HOST || 'http://localhost:11434',
        streaming: false, // No streaming needed for classification
    });
}
