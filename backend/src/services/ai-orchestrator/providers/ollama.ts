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
        // Use vision model when image is present
        const hasImage = !!screenSnapshot;
        const modelToUse = hasImage ? 'llama3.2-vision:latest' : env.OLLAMA_MODEL;

        // Enhanced prompt for optimal solutions when image is present
        const userContent = hasImage
            ? `You are a FAANG-level competitive programmer. Analyze this LeetCode/HackerRank screenshot and:

**CRITICAL: You MUST provide the OPTIMAL solution ONLY. Do NOT provide brute force or naive solutions.**

For example:
- "Median of Two Sorted Arrays" → Binary Search O(log(min(n,m))), NOT merge O(n+m)
- "Two Sum" → HashMap O(n), NOT O(n²) brute force
- "Linked List Cycle" → Floyd's Tortoise-Hare O(1) space, NOT HashSet O(n) space

**Required Format:**
1. **Problem**: One-line summary
2. **Optimal Approach**: Name the algorithm/pattern (Binary Search, Two Pointers, etc.)
3. **Complexity**: Time O(...), Space O(...) - MUST BE OPTIMAL
4. **Code**: Clean, production-ready Python. Include type hints.

Question: ${question}
${code ? `\nExisting Code (to improve):\n${code}` : ''}`
            : `Problem: ${question}\n\nCurrent Code:\n${code}`;

        const userMessage: any = {
            role: 'user',
            content: userContent
        };

        if (screenSnapshot) {
            userMessage.images = [screenSnapshot];
        }

        console.log(`[OllamaProvider] Using model: ${modelToUse} (hasImage: ${hasImage})`);

        const response = await this.client.chat({
            model: modelToUse,
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

    async streamVisionAnswer(prompt: string, imageBase64: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const response = await this.client.chat({
            model: 'llama3.2-vision', // Explicitly use vision model
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Analyze this image: ${prompt}`,
                    images: [imageBase64]
                }
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

    async streamChat(message: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const response = await this.client.chat({
            model: env.OLLAMA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            stream: true
        });

        async function* generator() {
            for await (const part of response) {
                yield part.message.content;
            }
        }
        return generator();
    }
}
