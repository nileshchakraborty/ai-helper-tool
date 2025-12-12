import { geminiImageProvider, ImageGenerationResult, DiagramRequest, FlashcardRequest } from './gemini-image';
import { mlxProvider } from './mlx';

// Re-export types needed by other modules
export interface SDPromptRequest {
    prompt: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
    negativePrompt?: string;
}

export interface UnifiedImageResult {
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    error?: string;
    provider: 'mlx' | 'gemini' | 'none';
    fallbackUsed: boolean;
}

/**
 * Unified Image Provider
 * 
 * Priority: MLX (Metal GPU) → Gemini (cloud)
 * 
 * MLX is the default for M-series Macs (8-25 sec).
 * Gemini is the cloud fallback when MLX is not available.
 * 
 * ComfyUI was removed as it's too slow on CPU (10+ min per image).
 */
export class UnifiedImageProvider {

    /**
     * Check which providers are available
     */
    async getAvailableProviders(): Promise<{ mlx: boolean; gemini: boolean }> {
        const [mlxAvailable, geminiAvailable] = await Promise.all([
            mlxProvider.isAvailable(),
            Promise.resolve(geminiImageProvider.isAvailable())
        ]);

        return { mlx: mlxAvailable, gemini: geminiAvailable };
    }

    /**
     * Generate an image with fallback
     * Priority: MLX (local, fast) → Gemini (cloud)
     */
    async generateImage(prompt: string, options?: Partial<SDPromptRequest>): Promise<UnifiedImageResult> {
        // Try MLX first (fastest on M-series Mac)
        const mlxAvailable = await mlxProvider.isAvailable();

        if (mlxAvailable) {
            console.log('[UnifiedImage] Using MLX (Metal GPU acceleration)');
            const result = await mlxProvider.generateImage({
                prompt,
                width: options?.width || 512,
                height: options?.height || 512,
                steps: options?.steps || 4
            });

            if (result.success) {
                return {
                    success: true,
                    imageBase64: result.imageBase64,
                    mimeType: result.mimeType,
                    provider: 'mlx',
                    fallbackUsed: false
                };
            }

            console.warn('[UnifiedImage] MLX failed, trying Gemini:', result.error);
        }

        // Fallback to Gemini (cloud)
        if (geminiImageProvider.isAvailable()) {
            console.log('[UnifiedImage] Using Gemini (cloud)');
            const geminiResult = await geminiImageProvider.generateDiagram({
                description: prompt,
                style: 'architecture',
                colorScheme: 'dark'
            });

            return {
                success: geminiResult.success,
                imageBase64: geminiResult.imageBase64,
                mimeType: geminiResult.mimeType,
                error: geminiResult.error,
                provider: 'gemini',
                fallbackUsed: mlxAvailable
            };
        }

        // Final fallback: Use local LLM to generate text-based diagram description
        console.warn('[UnifiedImage] No image providers available, trying LLM text fallback');
        const llmResult = await this.generateTextDiagramFallback(prompt);
        if (llmResult) {
            return {
                success: true,
                imageBase64: Buffer.from(llmResult).toString('base64'),
                mimeType: 'text/plain',
                provider: 'none',
                fallbackUsed: true,
                error: 'Generated as text (no image providers). Start MLX for actual images.'
            };
        }

        return {
            success: false,
            error: 'No image providers available. Start MLX: cd mlx-image-service && python server.py',
            provider: 'none',
            fallbackUsed: false
        };
    }

    /**
     * Fallback: Generate a text-based diagram description using local LLM
     * Used when no image providers (MLX/Gemini) are available
     */
    private async generateTextDiagramFallback(prompt: string): Promise<string | null> {
        try {
            const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
            const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';

            const response = await fetch(`${ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: ollamaModel,
                    prompt: `Create a simple ASCII art diagram for: ${prompt}. 
Keep it clear and use box drawing characters. Include labels.
Only output the ASCII diagram, no explanations.`,
                    stream: false
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                console.warn('[UnifiedImage] LLM fallback failed:', response.statusText);
                return null;
            }

            const data = await response.json();
            return data.response || null;
        } catch (error) {
            console.warn('[UnifiedImage] LLM fallback error:', error);
            return null;
        }
    }

    /**
     * Generate a diagram (uses best available provider)
     */
    async generateDiagram(request: DiagramRequest): Promise<UnifiedImageResult> {
        // Build a detailed prompt for SD
        const sdPrompt = `professional technical diagram, ${request.description}, ${request.style || 'architecture'} style, ${request.colorScheme || 'dark'} theme, clean lines, labeled components, no humans, high quality`;

        return this.generateImage(sdPrompt, {
            width: 1024,
            height: 768,
            steps: 4,  // MLX/FLUX works well with 4 steps
            negativePrompt: 'blurry, low quality, distorted, text errors, watermark'
        });
    }

    /**
     * Generate a flashcard
     */
    async generateFlashcard(request: FlashcardRequest): Promise<UnifiedImageResult> {
        const sdPrompt = `interview preparation flashcard, title: ${request.title}, framework: ${request.framework}, key points: ${request.points.join(', ')}, clean typography, dark background, color-coded sections, professional design`;

        return this.generateImage(sdPrompt, {
            width: 1024,
            height: 768,
            steps: 4,
            negativePrompt: 'blurry, messy, unclear text, low quality'
        });
    }

    /**
     * Generate a data structure/algorithm visualization
     */
    async generateVisualization(
        concept: string,
        type: 'datastructure' | 'algorithm' | 'comparison'
    ): Promise<UnifiedImageResult> {
        const typeDescriptions = {
            datastructure: 'data structure visualization with nodes and connections',
            algorithm: 'step-by-step algorithm flowchart with numbered steps',
            comparison: 'side-by-side comparison chart'
        };

        const sdPrompt = `${typeDescriptions[type]}, ${concept}, technical diagram, clean labels, dark theme, professional documentation style`;

        return this.generateImage(sdPrompt, {
            width: 1024,
            height: 1024,
            steps: 4
        });
    }
}

// Singleton instance
export const unifiedImageProvider = new UnifiedImageProvider();
