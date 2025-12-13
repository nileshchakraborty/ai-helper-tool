/**
 * Unified AI Orchestrator
 * Routes requests through either legacy AIOrchestrator or LangGraph based on feature flag
 */
import { env } from '../../config/env';
import { AIOrchestrator } from './orchestrator';
import { routeWithGraph, streamWithGraph, AgentType } from './langgraph';
import { getChromaService } from '../chroma-service';

// Singleton instances
let legacyOrchestrator: AIOrchestrator | null = null;

/**
 * Get the appropriate orchestrator based on feature flag
 */
function getOrchestrator(): AIOrchestrator {
    if (!legacyOrchestrator) {
        legacyOrchestrator = new AIOrchestrator();
    }
    return legacyOrchestrator;
}

/**
 * Enhance prompt with RAG context from ChromaDB if enabled
 */
async function enhanceWithRAG(message: string, type: 'behavioral' | 'coding'): Promise<string> {
    if (!env.USE_CHROMADB) {
        return message;
    }

    try {
        const chromaService = getChromaService();
        const collection = type === 'behavioral' ? 'interview_questions' : 'coding_patterns';
        const results = await chromaService.search(collection, message, 3);

        if (results.length === 0) {
            return message;
        }

        const context = results.map(r => r.content).join('\n\n---\n\n');
        return `## Relevant Examples:\n${context}\n\n## User Question:\n${message}`;
    } catch (error) {
        console.warn('[UnifiedOrchestrator] RAG enhancement failed:', error);
        return message;
    }
}

/**
 * Route a request through the appropriate orchestrator
 */
export async function routeRequest(
    message: string,
    context: string = '',
    providerId: string = 'ollama'
): Promise<string> {
    if (env.USE_LANGGRAPH) {
        console.log('[UnifiedOrchestrator] Using LangGraph');
        return routeWithGraph(message, context, providerId as 'ollama');
    }

    console.log('[UnifiedOrchestrator] Using legacy orchestrator');
    const orchestrator = getOrchestrator();

    // Collect stream into string for non-streaming endpoint
    let result = '';
    const stream = await orchestrator.routeRequest(message, context, providerId);
    for await (const chunk of stream) {
        result += chunk;
    }
    return result;
}

/**
 * Stream a behavioral answer
 */
export async function* streamBehavioral(
    question: string,
    context: string = '',
    providerId: string = 'ollama'
): AsyncGenerator<string, void, unknown> {
    const enhancedQuestion = await enhanceWithRAG(question, 'behavioral');

    if (env.USE_LANGGRAPH) {
        for await (const chunk of streamWithGraph(enhancedQuestion, context, providerId as 'ollama')) {
            yield chunk;
        }
    } else {
        const orchestrator = getOrchestrator();
        const stream = await orchestrator.streamBehavioralAnswer(enhancedQuestion, context, providerId);
        for await (const chunk of stream) {
            yield chunk;
        }
    }
}

/**
 * Stream coding assistance
 */
export async function* streamCoding(
    question: string,
    code: string = '',
    screenContext: string = '',
    providerId: string = 'ollama'
): AsyncGenerator<string, void, unknown> {
    const enhancedQuestion = await enhanceWithRAG(question, 'coding');

    if (env.USE_LANGGRAPH) {
        const fullContext = code ? `Code:\n${code}\n\nContext: ${screenContext}` : screenContext;
        for await (const chunk of streamWithGraph(enhancedQuestion, fullContext, providerId as 'ollama')) {
            yield chunk;
        }
    } else {
        const orchestrator = getOrchestrator();
        const stream = await orchestrator.streamCodingAssist(enhancedQuestion, code, screenContext, providerId);
        for await (const chunk of stream) {
            yield chunk;
        }
    }
}

/**
 * Close orchestrator connections
 */
export async function closeOrchestrator(): Promise<void> {
    if (legacyOrchestrator) {
        await legacyOrchestrator.close();
        legacyOrchestrator = null;
    }
}
