import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import os from "os";

// Create server instance
const server = new McpServer({
    name: "LocalSystemServer",
    version: "1.0.0",
});

// Register a tool
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
