import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AIRouter } from "../../services/ai-orchestrator/ai-router";
import { BEHAVIORAL_SYSTEM_PROMPT, CODING_SYSTEM_PROMPT } from "../../services/ai-orchestrator/prompts/templates";

const router = new AIRouter();

export function registerAITools(server: McpServer) {
    // Note: These tools return the full response (non-streaming) for MCP compatibility.
    // For streaming, the HTTP layer can call the AI providers directly or use SSE.

    server.tool(
        "behavioral_answer",
        "Get behavioral interview coaching answer",
        {
            question: z.string().describe("The behavioral interview question"),
            context: z.string().describe("Context about the user's experience or role"),
            provider: z.enum(["openai", "anthropic", "ollama"]).optional().default("openai").describe("AI provider to use")
        },
        async ({ question, context, provider }) => {
            const aiProvider = router.getProvider(provider);
            const systemPrompt = BEHAVIORAL_SYSTEM_PROMPT.replace("{{context}}", context);

            // Collect the full streamed response
            let fullResponse = "";
            const stream = await aiProvider.streamBehavioralAnswer(question, context, systemPrompt, {
                tools: [],
                toolExecutor: async () => []
            });

            for await (const chunk of stream) {
                fullResponse += chunk;
            }

            return {
                content: [{
                    type: "text" as const,
                    text: fullResponse
                }]
            };
        }
    );

    server.tool(
        "coding_assist",
        "Get coding interview assistance",
        {
            question: z.string().describe("The coding problem or question"),
            code: z.string().describe("Current code context"),
            screenSnapshot: z.string().optional().describe("Optional screen context or OCR text"),
            provider: z.enum(["openai", "anthropic", "ollama"]).optional().default("openai").describe("AI provider to use")
        },
        async ({ question, code, screenSnapshot, provider }) => {
            const aiProvider = router.getProvider(provider);
            const systemPrompt = CODING_SYSTEM_PROMPT.replace(
                "{{screenContext}}",
                screenSnapshot ? "Image attached." : "No screen context."
            );

            // Collect the full streamed response
            let fullResponse = "";
            const stream = await aiProvider.streamCodingAssist(
                question,
                code,
                screenSnapshot || "",
                systemPrompt,
                {
                    tools: [],
                    toolExecutor: async () => []
                }
            );

            for await (const chunk of stream) {
                fullResponse += chunk;
            }

            return {
                content: [{
                    type: "text" as const,
                    text: fullResponse
                }]
            };
        }
    );
}
