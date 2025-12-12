import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { unifiedImageProvider } from "../../services/ai-orchestrator/providers/unified-image";

export function registerImageTools(server: McpServer) {
    // Generate architecture/flow diagram
    server.tool(
        "generate_diagram",
        "Generate a professional architecture or flow diagram from a text description",
        {
            description: z.string().describe("Description of the diagram to generate"),
            style: z.enum(["isometric", "flowchart", "sequence", "architecture", "handdrawn"])
                .optional()
                .default("architecture")
                .describe("Visual style of the diagram"),
            colorScheme: z.enum(["dark", "light", "colorful"])
                .optional()
                .default("dark")
                .describe("Color scheme for the diagram")
        },
        async ({ description, style, colorScheme }) => {
            const result = await unifiedImageProvider.generateDiagram({
                description,
                style,
                colorScheme
            });

            if (!result.success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error generating diagram: ${result.error}`
                    }],
                    isError: true
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: result.imageBase64
                        ? Buffer.from(result.imageBase64, 'base64').toString('utf-8')
                        : 'Diagram generated successfully'
                }]
            };
        }
    );

    // Generate interview prep flashcard
    server.tool(
        "generate_flashcard",
        "Generate a visual flashcard for interview preparation frameworks",
        {
            framework: z.string().describe("The framework name (e.g., STAR, MECE, CIRCLES)"),
            title: z.string().describe("Title for the flashcard"),
            points: z.array(z.string()).describe("Key points to include on the flashcard")
        },
        async ({ framework, title, points }) => {
            const result = await unifiedImageProvider.generateFlashcard({
                framework,
                title,
                points
            });

            if (!result.success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error generating flashcard: ${result.error}`
                    }],
                    isError: true
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: result.imageBase64
                        ? Buffer.from(result.imageBase64, 'base64').toString('utf-8')
                        : 'Flashcard generated successfully'
                }]
            };
        }
    );

    // Generate code/algorithm visualization
    server.tool(
        "generate_visualization",
        "Generate a visualization for data structures, algorithms, or comparisons",
        {
            concept: z.string().describe("The concept to visualize (e.g., 'Binary Search Tree', 'Merge Sort')"),
            type: z.enum(["datastructure", "algorithm", "comparison"])
                .describe("Type of visualization")
        },
        async ({ concept, type }) => {
            const result = await unifiedImageProvider.generateVisualization(concept, type);

            if (!result.success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error generating visualization: ${result.error}`
                    }],
                    isError: true
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: result.imageBase64
                        ? Buffer.from(result.imageBase64, 'base64').toString('utf-8')
                        : 'Visualization generated successfully'
                }]
            };
        }
    );

    // Clean up whiteboard sketch
    server.tool(
        "convert_whiteboard",
        "Convert a rough whiteboard sketch description to a clean diagram description",
        {
            sketchDescription: z.string().describe("Description of the whiteboard sketch to clean up")
        },
        async ({ sketchDescription }) => {
            const result = await unifiedImageProvider.generateImage(`Clean up whiteboard sketch: ${sketchDescription}`);

            if (!result.success) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Error processing whiteboard: ${result.error}`
                    }],
                    isError: true
                };
            }

            return {
                content: [{
                    type: "text" as const,
                    text: result.imageBase64
                        ? Buffer.from(result.imageBase64, 'base64').toString('utf-8')
                        : 'Whiteboard cleaned up successfully'
                }]
            };
        }
    );
}
