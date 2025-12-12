import { mlxProvider } from '../services/ai-orchestrator/providers/mlx';
import { unifiedImageProvider } from '../services/ai-orchestrator/providers/unified-image';

/**
 * Check MLX and other services on startup
 * Logs warnings if critical services are not available
 */
export async function checkServicesHealth(): Promise<void> {
    console.log('[Startup] Checking services health...');

    // Check MLX (image generation)
    const mlxAvailable = await mlxProvider.isAvailable();
    if (mlxAvailable) {
        console.log('[Startup] ✅ MLX image service is running (Metal GPU acceleration)');
    } else {
        console.warn('[Startup] ⚠️  MLX image service NOT running!');
        console.warn('[Startup] ⚠️  Image generation will use Gemini fallback or fail.');
        console.warn('[Startup] ⚠️  To start MLX: cd mlx-image-service && python server.py');
    }

    // Check all image providers
    const providers = await unifiedImageProvider.getAvailableProviders();
    console.log('[Startup] Image providers:', JSON.stringify(providers));

    if (!providers.mlx && !providers.gemini) {
        console.error('[Startup] ❌ NO image providers available!');
        console.error('[Startup] ❌ Start MLX or set GOOGLE_API_KEY for Gemini');
    }

    // Check Ollama (LLM)
    try {
        const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        const response = await fetch(`${ollamaHost}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            const data = await response.json();
            const models = data.models?.map((m: any) => m.name) || [];
            console.log(`[Startup] ✅ Ollama is running with models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}`);
        } else {
            console.warn('[Startup] ⚠️  Ollama responded but may have issues');
        }
    } catch {
        console.warn('[Startup] ⚠️  Ollama not reachable. LLM features may be limited.');
    }
}
