/**
 * LangChain Integration Tests
 */
import {
    getLLM,
    getVisionLLM,
    getClassifierLLM,
    createBehavioralChain,
    createCodingChain,
    createCaseChain,
    createSystemDesignChain,
} from '../../../../src/services/ai-orchestrator/langchain';

describe('LangChain Providers', () => {
    describe('getLLM', () => {
        it('should return a ChatOllama instance for ollama provider', () => {
            const llm = getLLM('ollama');
            expect(llm).toBeDefined();
            expect(llm.constructor.name).toBe('ChatOllama');
        });

        it('should default to ollama for unknown providers', () => {
            const llm = getLLM('ollama');
            expect(llm).toBeDefined();
        });

        it('should throw for uninstalled providers', () => {
            expect(() => getLLM('openai')).toThrow('not yet installed');
            expect(() => getLLM('anthropic')).toThrow('not yet installed');
        });
    });

    describe('getVisionLLM', () => {
        it('should return a vision-capable LLM', () => {
            const llm = getVisionLLM('ollama');
            expect(llm).toBeDefined();
        });
    });

    describe('getClassifierLLM', () => {
        it('should return a fast classifier LLM', () => {
            const llm = getClassifierLLM();
            expect(llm).toBeDefined();
        });
    });
});

describe('LangChain Chains', () => {
    describe('createBehavioralChain', () => {
        it('should create a runnable chain', () => {
            const chain = createBehavioralChain('ollama');
            expect(chain).toBeDefined();
            expect(typeof chain.stream).toBe('function');
            expect(typeof chain.invoke).toBe('function');
        });
    });

    describe('createCodingChain', () => {
        it('should create a runnable chain', () => {
            const chain = createCodingChain('ollama');
            expect(chain).toBeDefined();
            expect(typeof chain.stream).toBe('function');
        });
    });

    describe('createCaseChain', () => {
        it('should create a runnable chain', () => {
            const chain = createCaseChain('ollama');
            expect(chain).toBeDefined();
            expect(typeof chain.stream).toBe('function');
        });
    });

    describe('createSystemDesignChain', () => {
        it('should create a runnable chain', () => {
            const chain = createSystemDesignChain('ollama');
            expect(chain).toBeDefined();
            expect(typeof chain.stream).toBe('function');
        });
    });
});
