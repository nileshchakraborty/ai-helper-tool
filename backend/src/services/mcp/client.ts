import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

export class MCPClientService {
    private client: Client;
    private transport: StdioClientTransport | null = null;
    private isConnected = false;

    constructor() {
        this.client = new Client({
            name: "BackendOrchestratorClient",
            version: "1.0.0"
        }, {
            capabilities: {
                sampling: {}
            }
        });
    }

    async connect() {
        if (this.isConnected) return;

        // Path to the server script. 
        // We assume the project is built and we use the dist version for stability.
        // Adjust relative path based on where this file is: src/services/mcp/client.ts
        // In dist: dist/services/mcp/client.js -> ../../mcp-server/index.js
        // In src (during dev, but pointing to dist): ../../../dist/mcp-server/index.js

        // This path resolution is tricky depending on execution context.
        // Safer to rely on process.cwd() if we know we run from root.
        const serverPath = path.resolve(process.cwd(), 'dist/mcp-server/index.js');

        this.transport = new StdioClientTransport({
            command: "node",
            args: [serverPath]
        });

        await this.client.connect(this.transport);
        this.isConnected = true;
        console.log(`[MCP] Connected to server at ${serverPath}`);
    }

    async listTools() {
        return this.client.listTools();
    }

    async callTool(name: string, args: any) {
        return this.client.callTool({
            name,
            arguments: args
        });
    }

    async close() {
        if (this.client && this.isConnected) {
            await this.client.close();
            this.isConnected = false;
        }
    }
}
