export interface AIStreamChunk {
    text?: string;
    toolCall?: any;
}

export interface AIStreamOptions {
    tools?: any[];
    toolExecutor?: (name: string, args: any) => Promise<any>;
}

export interface AIProvider {
    streamBehavioralAnswer(question: string, context: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>>;
    streamCodingAssist(question: string, code: string, screenSnapshot: string | undefined, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>>;
    streamVisionAnswer?(prompt: string, imageBase64: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>>;
    streamChat(message: string, systemPrompt: string, options?: AIStreamOptions): Promise<AsyncIterable<string>>;
}
