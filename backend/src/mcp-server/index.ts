import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import os from "os";
import { registerProfileTools } from "./tools/profile-tools";
import { registerSessionTools } from "./tools/session-tools";
import { registerAITools } from "./tools/ai-tools";

// Create server instance
const server = new McpServer({
    name: "LocalSystemServer",
    version: "1.0.0",
});

// Register system tools
server.tool(
    "get_system_info",
    "Get basic system information (CPU, RAM, OS)",
    {}, // No args schema
    async () => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        platform: os.platform(),
                        arch: os.arch(),
                        cpus: os.cpus().length,
                        totalMemory: os.totalmem(),
                        freeMemory: os.freemem(),
                    }, null, 2)
                }
            ]
        };
    }
);

// Register all domain tools
registerProfileTools(server);
registerSessionTools(server);
registerAITools(server);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
    console.error("Registered tools: get_system_info, get_profile, update_preferences, start_session, add_message, get_history, get_session_messages, behavioral_answer, coding_assist");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
