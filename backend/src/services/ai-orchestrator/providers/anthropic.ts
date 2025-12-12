import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIStreamOptions } from './ai-provider.interface';
import { env } from '../../../config/env';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;

    constructor() {
        this.client = new Anthropic({
            apiKey: env.ANTHROPIC_API_KEY,
        });
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        // Mock implementation for interface compliance
        async function* generator() {
            yield "Anthropic provider not fully implemented yet.";
        }
        return generator();
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        // Mock implementation for interface compliance
        async function* generator() {
            yield "Anthropic provider not fully implemented yet.";
        }
        return generator();
    }
    async streamChat(message: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        // Mock implementation for interface compliance
        async function* generator() {
            yield "Anthropic provider not fully implemented yet.";
        }
        return generator();
    }
}
