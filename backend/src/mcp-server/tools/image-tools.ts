import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { unifiedImageProvider } from "../../services/ai-orchestrator/providers/unified-image";
import { broadcastToMobile } from "../../gateway/socket";

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

            // OUT-OF-BAND DELIVERY: Broadcast to client, don't return heavy base64 to LLM
            if (result.imageBase64) {
                broadcastToMobile('ai:image', {
                    image: result.imageBase64,
                    mimeType: result.mimeType || 'image/png',
                    width: 1024,
                    height: 768
                });
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Diagram generated and sent to user screen. Description: architecture diagram of ${description}.`
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

            if (result.imageBase64) {
                broadcastToMobile('ai:image', {
                    image: result.imageBase64,
                    mimeType: result.mimeType || 'image/png',
                    title: title
                });
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Flashcard for '${title}' (${framework}) generated and displayed.`
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

            if (result.imageBase64) {
                broadcastToMobile('ai:image', {
                    image: result.imageBase64,
                    mimeType: result.mimeType || 'image/png',
                    caption: concept
                });
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Visualization of ${concept} generated and displayed.`
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

            if (result.imageBase64) {
                broadcastToMobile('ai:image', {
                    image: result.imageBase64,
                    mimeType: result.mimeType || 'image/png'
                });
            }

            return {
                content: [{
                    type: "text" as const,
                    text: `Whiteboard sketch cleaned up and converted to professional diagram.`
                }]
            };
        }
    );
}
