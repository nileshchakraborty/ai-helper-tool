import { env } from '../../../config/env';

export interface SDImageResult {
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    error?: string;
    provider?: 'comfyui' | 'gemini';
}

export interface SDPromptRequest {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
}

/**
 * Local Stable Diffusion provider using ComfyUI API
 * 
 * ComfyUI runs locally (default: http://127.0.0.1:8188)
 * Ensure ComfyUI is running with --listen flag for API access
 */
export class ComfyUIProvider {
    private baseUrl: string;
    private clientId: string;

    constructor() {
        // ComfyUI default port is 8188
        this.baseUrl = process.env.COMFYUI_HOST || 'http://127.0.0.1:8188';
        this.clientId = `backend-${Date.now()}`;
    }

    /**
     * Check if ComfyUI is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/system_stats`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Generate an image using a simple text-to-image workflow
     */
    async generateImage(request: SDPromptRequest): Promise<SDImageResult> {
        const available = await this.isAvailable();
        if (!available) {
            return {
                success: false,
                error: 'ComfyUI not available. Start ComfyUI with: python main.py --listen',
                provider: 'comfyui'
            };
        }

        // Simple SDXL workflow for text-to-image
        const workflow = this.buildTextToImageWorkflow(request);

        try {
            // Queue the prompt
            const queueResponse = await fetch(`${this.baseUrl}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: workflow,
                    client_id: this.clientId
                })
            });

            if (!queueResponse.ok) {
                const error = await queueResponse.text();
                return { success: false, error: `Queue failed: ${error}`, provider: 'comfyui' };
            }

            const { prompt_id } = await queueResponse.json();

            // Poll for completion (with timeout)
            const result = await this.waitForResult(prompt_id, 300000); // 300 second timeout for CPU
            return result;

        } catch (error) {
            return {
                success: false,
                error: `ComfyUI error: ${String(error)}`,
                provider: 'comfyui'
            };
        }
    }

    /**
     * Build a simple SD 1.5 text-to-image workflow
     * Optimized for LCM (fewer steps, lower CFG for faster CPU inference)
     */
    private buildTextToImageWorkflow(request: SDPromptRequest): Record<string, any> {
        const seed = request.seed ?? Math.floor(Math.random() * 1000000000);
        const width = request.width ?? 512;  // SD 1.5 optimal
        const height = request.height ?? 512;
        const steps = request.steps ?? 8;  // LCM: 4-8 steps

        // SD 1.5 workflow optimized for CPU
        return {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": 7,
                    "sampler_name": "euler",  // Built-in sampler
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": "v1-5-pruned-emaonly.safetensors"
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": request.prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": request.negativePrompt || "blurry, low quality, distorted",
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "api_output",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        };
    }

    /**
     * Wait for the generation to complete and retrieve the image
     */
    private async waitForResult(promptId: string, timeoutMs: number): Promise<SDImageResult> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const historyResponse = await fetch(`${this.baseUrl}/history/${promptId}`);
                if (!historyResponse.ok) {
                    await this.sleep(500);
                    continue;
                }

                const history = await historyResponse.json();
                const promptHistory = history[promptId];

                if (!promptHistory) {
                    await this.sleep(500);
                    continue;
                }

                // Check if generation is complete
                if (promptHistory.outputs && Object.keys(promptHistory.outputs).length > 0) {
                    // Find the SaveImage node output
                    for (const nodeId of Object.keys(promptHistory.outputs)) {
                        const output = promptHistory.outputs[nodeId];
                        if (output.images && output.images.length > 0) {
                            const imageInfo = output.images[0];

                            // Fetch the actual image
                            const imageUrl = `${this.baseUrl}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}&type=${imageInfo.type || 'output'}`;
                            const imageResponse = await fetch(imageUrl);

                            if (imageResponse.ok) {
                                const imageBuffer = await imageResponse.arrayBuffer();
                                return {
                                    success: true,
                                    imageBase64: Buffer.from(imageBuffer).toString('base64'),
                                    mimeType: 'image/png',
                                    provider: 'comfyui'
                                };
                            }
                        }
                    }
                }

                await this.sleep(500);
            } catch (error) {
                await this.sleep(500);
            }
        }

        return {
            success: false,
            error: 'Generation timeout',
            provider: 'comfyui'
        };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
export const comfyUIProvider = new ComfyUIProvider();
