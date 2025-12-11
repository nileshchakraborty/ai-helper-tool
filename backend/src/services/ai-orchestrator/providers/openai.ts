import OpenAI from 'openai';
import { env } from '../../../config/env';
import { AIProvider } from './ai-provider.interface';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string): Promise<AsyncIterable<string>> {
        const stream = await this.client.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
            ],
            stream: true,
        });

        async function* generator() {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) yield content;
            }
        }

        return generator();
    }

    async streamCodingAssist(question: string, code: string, screenContext: string | undefined, systemPrompt: string): Promise<AsyncIterable<string>> {
        // TODO: Handle image input if screenContext is provided
        const stream = await this.client.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Problem: ${question}\n\nCurrent Code:\n${code}` }
            ],
            stream: true,
        });

        async function* generator() {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) yield content;
            }
        }
        return generator();
    }
}
