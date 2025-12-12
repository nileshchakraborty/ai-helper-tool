import { env } from '../../../config/env';

export interface MLXImageResult {
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    error?: string;
    width?: number;
    height?: number;
}

export interface MLXImageRequest {
    prompt: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
}

/**
 * MLX Image Provider
 * 
 * Uses Apple MLX framework for Metal GPU-accelerated Stable Diffusion.
 * Runs as a separate Python service (mlx-image-service).
 * 
 * Performance on M4 Max:
 * - 512x512: ~8 seconds (vs 10-15 minutes on CPU)
 * - 1024x1024: ~25 seconds
 */
export class MLXProvider {
    private baseUrl: string;

    constructor() {
        // MLX service runs locally on port 8189
        this.baseUrl = process.env.MLX_IMAGE_HOST || 'http://127.0.0.1:8189';
    }

    /**
     * Check if MLX service is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Generate an image using FLUX.1-schnell model
     */
    async generateImage(request: MLXImageRequest): Promise<MLXImageResult> {
        const available = await this.isAvailable();
        if (!available) {
            return {
                success: false,
                error: 'MLX service not available. Start with: cd mlx-image-service && python server.py'
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: request.prompt,
                    width: request.width || 512,
                    height: request.height || 512,
                    steps: request.steps || 4,
                    seed: request.seed
                }),
                signal: AbortSignal.timeout(300000) // 5 minute timeout
            });

            if (!response.ok) {
                const error = await response.text();
                return { success: false, error: `MLX error: ${error}` };
            }

            const result = await response.json();

            if (result.success) {
                return {
                    success: true,
                    imageBase64: result.image,
                    mimeType: result.mimeType || 'image/png',
                    width: result.width,
                    height: result.height
                };
            } else {
                return { success: false, error: result.error };
            }

        } catch (error) {
            return {
                success: false,
                error: `MLX error: ${String(error)}`
            };
        }
    }
}

// Singleton instance
export const mlxProvider = new MLXProvider();
