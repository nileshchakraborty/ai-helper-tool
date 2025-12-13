/**
 * LangChain Chain Templates
 * Pre-built chains for different interview coaching scenarios
 */
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { getLLM, getVisionLLM, ProviderType } from './providers';
import {
    BEHAVIORAL_SYSTEM_PROMPT,
    CODING_SYSTEM_PROMPT,
    CASE_INTERVIEW_SYSTEM_PROMPT,
    CONVERSATIONAL_COACHING_PROMPT,
    LIVE_ASSIST_PROMPT,
    SYSTEM_DESIGN_SYSTEM_PROMPT,
    MEETING_SYSTEM_PROMPT,
} from '../prompts/templates';

/**
 * Create a streaming chain for behavioral interview coaching
 */
export function createBehavioralChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', BEHAVIORAL_SYSTEM_PROMPT.replace('{{context}}', '{context}')],
        ['human', '{question}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for coding assistance
 */
export function createCodingChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', CODING_SYSTEM_PROMPT.replace('{{screenContext}}', '{screenContext}')],
        ['human', 'Question: {question}\n\nCode:\n```\n{code}\n```'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for case interview coaching
 */
export function createCaseChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', CASE_INTERVIEW_SYSTEM_PROMPT.replace('{{context}}', '{context}')],
        ['human', '{caseDescription}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for system design coaching
 */
export function createSystemDesignChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', SYSTEM_DESIGN_SYSTEM_PROMPT
            .replace('{{problem}}', '{problem}')
            .replace('{{context}}', '{context}')],
        ['human', '{problem}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for conversational coaching (natural talking points)
 */
export function createConversationalChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', CONVERSATIONAL_COACHING_PROMPT
            .replace('{{question}}', '{question}')
            .replace('{{context}}', '{context}')],
        ['human', '{question}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for live interview assistance
 */
export function createLiveAssistChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', LIVE_ASSIST_PROMPT
            .replace('{{transcription}}', '{transcription}')
            .replace('{{interviewType}}', '{interviewType}')],
        ['human', '{transcription}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Create a streaming chain for meeting assistance
 */
export function createMeetingChain(providerId: ProviderType = 'ollama') {
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', MEETING_SYSTEM_PROMPT.replace('{{context}}', '{context}')],
        ['human', '{message}'],
    ]);

    return RunnableSequence.from([
        prompt,
        getLLM(providerId),
        new StringOutputParser(),
    ]);
}

/**
 * Helper to convert chain stream to async generator (for SSE compatibility)
 */
export async function* streamChain<T extends Record<string, unknown>>(
    chain: RunnableSequence,
    input: T
): AsyncGenerator<string, void, unknown> {
    const stream = await chain.stream(input);
    for await (const chunk of stream) {
        yield chunk;
    }
}
