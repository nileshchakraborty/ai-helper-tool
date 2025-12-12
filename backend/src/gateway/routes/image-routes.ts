import { FastifyInstance } from 'fastify';
import { unifiedImageProvider } from '../../services/ai-orchestrator/providers/unified-image';

export async function imageRoutes(fastify: FastifyInstance) {

    // Get available providers status
    fastify.get('/image/providers', async (request, reply) => {
        const providers = await unifiedImageProvider.getAvailableProviders();

        // MLX is always the default - it's the fastest local option
        const defaultProvider = 'mlx';
        let status: string;
        let note: string;

        if (providers.mlx) {
            status = 'active';
            note = 'MLX is running - Metal GPU acceleration active (~8-25 sec per image)';
        } else if (providers.gemini) {
            status = 'mlx_not_running';
            note = 'MLX not running. Using Gemini cloud fallback. Start MLX: cd mlx-image-service && python server.py';
        } else {
            status = 'no_providers';
            note = 'No providers available. Start MLX: cd mlx-image-service && python server.py';
        }

        return reply.send({
            providers,
            default: defaultProvider,
            status,
            note,
            activeProvider: providers.mlx ? 'mlx' : (providers.gemini ? 'gemini' : 'none'),
            howToStartMLX: 'cd mlx-image-service && ./setup.sh && source venv/bin/activate && python server.py'
        });
    });

    // Generate diagram from description
    fastify.post('/image/diagram', async (request, reply) => {
        const { description, style, colorScheme } = request.body as any;

        if (!description) {
            return reply.status(400).send({ error: 'description is required' });
        }

        const result = await unifiedImageProvider.generateDiagram({
            description,
            style: style || 'architecture',
            colorScheme: colorScheme || 'dark'
        });

        if (!result.success) {
            return reply.status(500).send({
                error: result.error,
                provider: result.provider,
                fallbackUsed: result.fallbackUsed
            });
        }

        return reply.send({
            success: true,
            imageBase64: result.imageBase64,
            mimeType: result.mimeType,
            provider: result.provider,
            fallbackUsed: result.fallbackUsed
        });
    });

    // Generate flashcard
    fastify.post('/image/flashcard', async (request, reply) => {
        const { framework, title, points } = request.body as any;

        if (!framework || !title || !points) {
            return reply.status(400).send({
                error: 'framework, title, and points are required'
            });
        }

        const result = await unifiedImageProvider.generateFlashcard({
            framework,
            title,
            points: Array.isArray(points) ? points : [points]
        });

        if (!result.success) {
            return reply.status(500).send({
                error: result.error,
                provider: result.provider
            });
        }

        return reply.send({
            success: true,
            imageBase64: result.imageBase64,
            mimeType: result.mimeType,
            provider: result.provider
        });
    });

    // Generate visualization
    fastify.post('/image/visualization', async (request, reply) => {
        const { concept, type } = request.body as any;

        if (!concept || !type) {
            return reply.status(400).send({
                error: 'concept and type are required'
            });
        }

        const result = await unifiedImageProvider.generateVisualization(
            concept,
            type as 'datastructure' | 'algorithm' | 'comparison'
        );

        if (!result.success) {
            return reply.status(500).send({
                error: result.error,
                provider: result.provider
            });
        }

        return reply.send({
            success: true,
            imageBase64: result.imageBase64,
            mimeType: result.mimeType,
            provider: result.provider
        });
    });

    // Generate any image with custom prompt
    fastify.post('/image/generate', async (request, reply) => {
        const { prompt, width, height, steps, seed, negativePrompt } = request.body as any;

        if (!prompt) {
            return reply.status(400).send({ error: 'prompt is required' });
        }

        const result = await unifiedImageProvider.generateImage(prompt, {
            width,
            height,
            steps,
            seed,
            negativePrompt
        });

        if (!result.success) {
            return reply.status(500).send({
                error: result.error,
                provider: result.provider
            });
        }

        return reply.send({
            success: true,
            imageBase64: result.imageBase64,
            mimeType: result.mimeType,
            provider: result.provider,
            fallbackUsed: result.fallbackUsed
        });
    });
}
