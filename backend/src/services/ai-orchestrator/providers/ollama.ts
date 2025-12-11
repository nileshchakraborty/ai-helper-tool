import { Ollama } from 'ollama';
import { AIProvider } from './ai-provider.interface';
import { env } from '../../../config/env';

export class OllamaProvider implements AIProvider {
    private client: Ollama;

    constructor() {
        this.client = new Ollama({ host: env.OLLAMA_HOST });
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string): Promise<AsyncIterable<string>> {
        const response = await this.client.chat({
            model: 'llama3:latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
            ],
            stream: true,
        });

        async function* generator() {
            for await (const part of response) {
                yield part.message.content;
            }
        }
        return generator();
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string): Promise<AsyncIterable<string>> {
        const response = await this.client.chat({
            model: 'llama3:latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Problem: ${question}\n\nCurrent Code:\n${code}` }
            ],
            stream: true,
        });

        async function* generator() {
            for await (const part of response) {
                yield part.message.content;
            }
        }
        return generator();
    }
}
