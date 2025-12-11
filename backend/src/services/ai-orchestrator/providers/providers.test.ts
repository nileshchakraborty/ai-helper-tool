import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';

// Mocking external SDKs
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'OpenAI Response' } }],
                }),
            },
        },
    }));
});

jest.mock('@anthropic-ai/sdk', () => {
    return jest.fn().mockImplementation(() => ({
        messages: {
            create: jest.fn().mockResolvedValue({
                content: [{ type: 'text', text: 'Anthropic Response' }],
            }),
        },
    }));
});

jest.mock('ollama', () => {
    return {
        Ollama: jest.fn().mockImplementation(() => ({
            chat: jest.fn().mockResolvedValue({
                message: { content: 'Ollama Response' }
            })
        }))
    }
});

describe('AI Providers', () => {
    test('OpenAIProvider returns content', async () => {
        const provider = new OpenAIProvider();
        const result = await provider.complete('Hello');
        expect(result).toBe('OpenAI Response');
    });

    test('AnthropicProvider returns content', async () => {
        const provider = new AnthropicProvider();
        const result = await provider.complete('Hello');
        expect(result).toBe('Anthropic Response');
    });

    test('OllamaProvider returns content', async () => {
        const provider = new OllamaProvider();
        const result = await provider.complete('Hello');
        expect(result).toBe('Ollama Response');
    });
});
