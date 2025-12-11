export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AICompletionRequest {
    prompt: string;
    systemPrompt?: string;
    model?: string;
    provider?: 'openai' | 'anthropic' | 'local';
}
