import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './ai-provider.interface';
import { env } from '../../../config/env';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;

    constructor() {
        this.client = new Anthropic({
            apiKey: env.ANTHROPIC_API_KEY,
        });
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string): Promise<AsyncIterable<string>> {
        const stream = await this.client.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }],
            stream: true,
        });

        async function* generator() {
            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        }
        return generator();
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string): Promise<AsyncIterable<string>> {
        // TODO: Handle image input
        const stream = await this.client.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Problem: ${question}\n\nCurrent Code:\n${code}` }],
            stream: true,
        });

        async function* generator() {
            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield chunk.delta.text;
                }
            }
        }
        return generator();
    }
}
