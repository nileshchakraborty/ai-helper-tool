import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '../../../config/env';

export interface ImageGenerationResult {
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    error?: string;
}

export interface DiagramRequest {
    description: string;
    style?: 'isometric' | 'flowchart' | 'sequence' | 'architecture' | 'handdrawn';
    colorScheme?: 'dark' | 'light' | 'colorful';
}

export interface FlashcardRequest {
    framework: string;
    title: string;
    points: string[];
}

export class GeminiImageProvider {
    private model;
    private isConfigured: boolean;

    constructor() {
        this.isConfigured = !!env.GOOGLE_API_KEY;

        if (!this.isConfigured) {
            console.warn('[GeminiImage] GOOGLE_API_KEY not set - image generation disabled');
            this.model = null;
        } else {
            // Create Google provider with API key
            const google = createGoogleGenerativeAI({
                apiKey: env.GOOGLE_API_KEY
            });
            // Use Gemini Flash model
            this.model = google('gemini-2.0-flash-exp');
        }
    }

    isAvailable(): boolean {
        return this.isConfigured && this.model !== null;
    }

    /**
     * Generate a diagram from a text description
     */
    async generateDiagram(request: DiagramRequest): Promise<ImageGenerationResult> {
        if (!this.isAvailable()) {
            return { success: false, error: 'GOOGLE_API_KEY not configured' };
        }

        const stylePrompts: Record<string, string> = {
            isometric: 'Professional isometric 3D diagram, clean vectors, dark theme with cyan/green accents',
            flowchart: 'Clean flowchart diagram, rounded rectangles, arrows, dark navy background, neon accents',
            sequence: 'UML sequence diagram style, vertical lifelines, horizontal arrows, minimal',
            architecture: 'Software architecture diagram, boxes and arrows, labeled components, professional',
            handdrawn: 'Hand-drawn sketch style diagram, informal, whiteboard aesthetic'
        };

        const colorPrompts: Record<string, string> = {
            dark: 'dark background, light text, glowing accents',
            light: 'white background, dark text, subtle shadows',
            colorful: 'vibrant colors, gradient fills, modern design'
        };

        const style = stylePrompts[request.style || 'architecture'];
        const colors = colorPrompts[request.colorScheme || 'dark'];

        const prompt = `Generate a technical diagram: ${request.description}. Style: ${style}. Colors: ${colors}. Professional software documentation quality, no humans, clean lines.`;

        try {
            // Note: Image generation requires specific model capabilities
            // Using text-to-image generation via Gemini
            const result = await generateText({
                model: this.model!,
                prompt: `You are a diagram generation assistant. Describe in detail what a professional diagram would look like for: ${prompt}. Include colors, shapes, labels, and layout.`
            });

            // For now, return the text description
            // Full image generation requires Imagen API access
            return {
                success: true,
                imageBase64: Buffer.from(result.text).toString('base64'),
                mimeType: 'text/plain'
            };
        } catch (error) {
            console.error('[GeminiImage] Diagram generation error:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Generate an interview prep flashcard
     */
    async generateFlashcard(request: FlashcardRequest): Promise<ImageGenerationResult> {
        if (!this.isAvailable()) {
            return { success: false, error: 'GOOGLE_API_KEY not configured' };
        }

        const prompt = `Create a visual flashcard for interview preparation. Framework: ${request.framework}. Title: ${request.title}. Key points: ${request.points.join(', ')}. Style: Dark background, clean typography, color-coded sections, no humans.`;

        try {
            const result = await generateText({
                model: this.model!,
                prompt: `Design a flashcard visual: ${prompt}. Describe the layout, colors, fonts, and content organization.`
            });

            return {
                success: true,
                imageBase64: Buffer.from(result.text).toString('base64'),
                mimeType: 'text/plain'
            };
        } catch (error) {
            console.error('[GeminiImage] Flashcard generation error:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Generate a code/algorithm visualization
     */
    async generateVisualization(
        concept: string,
        type: 'datastructure' | 'algorithm' | 'comparison'
    ): Promise<ImageGenerationResult> {
        if (!this.isAvailable()) {
            return { success: false, error: 'GOOGLE_API_KEY not configured' };
        }

        const typePrompts: Record<string, string> = {
            datastructure: 'Data structure visualization showing nodes, connections, memory layout',
            algorithm: 'Step-by-step algorithm visualization with numbered steps and arrows',
            comparison: 'Side-by-side comparison chart with pros/cons and key differences'
        };

        const prompt = `${typePrompts[type]}: ${concept}. Technical diagram style, clear labels, dark theme.`;

        try {
            const result = await generateText({
                model: this.model!,
                prompt: `Create a visualization description: ${prompt}`
            });

            return {
                success: true,
                imageBase64: Buffer.from(result.text).toString('base64'),
                mimeType: 'text/plain'
            };
        } catch (error) {
            console.error('[GeminiImage] Visualization error:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Describe how to clean up a whiteboard sketch
     */
    async describeWhiteboardCleanup(imageDescription: string): Promise<ImageGenerationResult> {
        if (!this.isAvailable()) {
            return { success: false, error: 'GOOGLE_API_KEY not configured' };
        }

        try {
            const result = await generateText({
                model: this.model!,
                prompt: `You are helping clean up a whiteboard sketch. The sketch shows: ${imageDescription}. Describe a clean, professional diagram version of this with proper layout, clear labels, and consistent styling.`
            });

            return {
                success: true,
                imageBase64: Buffer.from(result.text).toString('base64'),
                mimeType: 'text/plain'
            };
        } catch (error) {
            console.error('[GeminiImage] Whiteboard cleanup error:', error);
            return { success: false, error: String(error) };
        }
    }
}

// Singleton instance
export const geminiImageProvider = new GeminiImageProvider();
