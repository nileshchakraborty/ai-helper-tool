import { Ollama } from 'ollama';
import { AIProvider, AIStreamOptions } from './ai-provider.interface';
import { env } from '../../../config/env';

export class OllamaProvider implements AIProvider {
    private client: Ollama;

    constructor() {
        const config: any = { host: env.OLLAMA_HOST };

        // Add API key authentication if provided (for remote Ollama servers)
        if (env.OLLAMA_API_KEY) {
            config.fetch = (url: string, options: RequestInit = {}) => {
                return fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${env.OLLAMA_API_KEY}`,
                    },
                });
            };
        }

        this.client = new Ollama(config);
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const response = await this.client.chat({
            model: env.OLLAMA_MODEL,
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

    async streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        // Ollama supports images in 'images' field (base64)
        const userMessage: any = {
            role: 'user',
            content: `Problem: ${question}\n\nCurrent Code:\n${code}`
        };

        if (screenSnapshot) {
            userMessage.images = [screenSnapshot];
        }

        const response = await this.client.chat({
            model: env.OLLAMA_MODEL, // Can use vision model like llava by setting OLLAMA_MODEL=llava
            messages: [
                { role: 'system', content: systemPrompt },
                userMessage
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
