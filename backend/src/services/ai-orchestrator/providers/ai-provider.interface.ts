export interface AIStreamChunk {
    text?: string;
    toolCall?: any;
}

export interface AIProvider {
    streamBehavioralAnswer(
        question: string,
        context: string,
        systemPrompt: string
    ): Promise<AsyncIterable<string>>;

    streamCodingAssist(
        question: string,
        code: string,
        screenSnapshot: string | undefined,
        systemPrompt: string
    ): Promise<AsyncIterable<string>>;
}
