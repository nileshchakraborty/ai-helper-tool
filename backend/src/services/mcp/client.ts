import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { UserProfile, UserPreferences } from "../profile/profile-repository";
import { Session, Message } from "../session/session-repository";

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
        const serverPath = path.resolve(process.cwd(), 'dist/src/mcp-server/index.js');

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

    // ====== Typed Wrapper Methods ======

    // Profile Tools
    async getProfile(userId: string): Promise<UserProfile | null> {
        const result = await this.callTool("get_profile", { userId });
        const textContent = (result.content as any)[0]?.text;
        return textContent ? JSON.parse(textContent) : null;
    }

    async updatePreferences(userId: string, preferences: UserPreferences): Promise<UserProfile> {
        const result = await this.callTool("update_preferences", { userId, preferences });
        const textContent = (result.content as any)[0]?.text;
        return JSON.parse(textContent);
    }

    // Session Tools
    async startSession(userId: string, type: 'behavioral' | 'coding', title: string): Promise<Session> {
        const result = await this.callTool("start_session", { userId, type, title });
        const textContent = (result.content as any)[0]?.text;
        return JSON.parse(textContent);
    }

    async addMessage(userId: string, sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<Message> {
        const result = await this.callTool("add_message", { userId, sessionId, role, content });
        const textContent = (result.content as any)[0]?.text;
        return JSON.parse(textContent);
    }

    async getHistory(userId: string): Promise<Session[]> {
        const result = await this.callTool("get_history", { userId });
        const textContent = (result.content as any)[0]?.text;
        return JSON.parse(textContent);
    }

    async getSessionMessages(sessionId: string): Promise<Message[]> {
        const result = await this.callTool("get_session_messages", { sessionId });
        const textContent = (result.content as any)[0]?.text;
        return JSON.parse(textContent);
    }

    // AI Tools (non-streaming - returns full response)
    async behavioralAnswer(question: string, context: string, provider: string = 'openai'): Promise<string> {
        const result = await this.callTool("behavioral_answer", { question, context, provider });
        return (result.content as any)[0]?.text || "";
    }

    async codingAssist(question: string, code: string, screenSnapshot?: string, provider: string = 'openai'): Promise<string> {
        const result = await this.callTool("coding_assist", { question, code, screenSnapshot, provider });
        return (result.content as any)[0]?.text || "";
    }
}

