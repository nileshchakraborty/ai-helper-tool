import OpenAI from 'openai';
import { env } from '../../../config/env';
import { AIProvider, AIStreamOptions } from './ai-provider.interface';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    async streamBehavioralAnswer(question: string, context: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
        ];

        return this.createStream(messages, options);
    }

    async streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: 'text', text: `Problem: ${question}\n\nCurrent Code:\n${code}` }
        ];

        if (screenSnapshot) {
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${screenSnapshot}`
                }
            });
        }

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];

        return this.createStream(messages, options);
    }

    private async createStream(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], options?: AIStreamOptions): Promise<AsyncIterable<string>> {
        const tools = options?.tools?.map(t => ({
            type: 'function' as const,
            function: {
                name: t.name,
                description: t.description,
                parameters: t.inputSchema || {}
            }
        }));

        const stream = await this.client.chat.completions.create({
            model: 'gpt-4o', // Use gpt-4o for vision and speed
            messages,
            stream: true,
            tools: tools && tools.length > 0 ? tools : undefined,
        });

        const self = this;

        async function* generator() {
            let toolCallBuffer: any = null;

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                // Handle Content
                if (delta?.content) {
                    yield delta.content;
                }

                // Handle Tool Calls (Accumulate)
                if (delta?.tool_calls) {
                    const toolCall = delta.tool_calls[0];
                    if (toolCall.id) {
                        toolCallBuffer = {
                            id: toolCall.id,
                            name: toolCall.function?.name,
                            arguments: toolCall.function?.arguments || ''
                        };
                    } else if (toolCallBuffer && toolCall.function?.arguments) {
                        toolCallBuffer.arguments += toolCall.function.arguments;
                    }
                }
            }

            // If we have a complete tool call, execute it
            if (toolCallBuffer && options?.toolExecutor) {
                yield `\n\n[Calling Tool: ${toolCallBuffer.name}...]`;

                try {
                    const args = JSON.parse(toolCallBuffer.arguments);
                    const result = await options.toolExecutor(toolCallBuffer.name, args);

                    // Add tool result to history
                    const newMessages = [...messages];
                    newMessages.push({
                        role: 'assistant',
                        content: null,
                        tool_calls: [{
                            id: toolCallBuffer.id,
                            type: 'function',
                            function: {
                                name: toolCallBuffer.name,
                                arguments: toolCallBuffer.arguments
                            }
                        }]
                    });

                    newMessages.push({
                        role: 'tool',
                        tool_call_id: toolCallBuffer.id,
                        content: JSON.stringify(result)
                    });

                    // Recursive call!
                    const nextStream = await self.createStream(newMessages, options);
                    for await (const chunk of nextStream) {
                        yield chunk;
                    }

                } catch (e) {
                    yield `\n[Tool Error: ${e}]`;
                }
            }
        }

        return generator();
    }
}
