import { MCPClientService } from './client';

describe('MCPClientService', () => {
    let mcpClient: MCPClientService;

    beforeAll(async () => {
        mcpClient = new MCPClientService();
        // Wait a bit to ensure potential build/startup latency isn't an issue, 
        // though stdio spawn is usually fast.
    });

    afterAll(async () => {
        await mcpClient.close();
    });

    it('should connect to the local MCP server', async () => {
        await mcpClient.connect();
    });

    it('should list tools', async () => {
        const tools = await mcpClient.listTools();
        expect(tools).toBeDefined();
        expect(tools.tools).toBeDefined();
        const toolNames = tools.tools.map((t: any) => t.name);
        expect(toolNames).toContain('get_system_info');
    });

    it('should call get_system_info tool', async () => {
        const result: any = await mcpClient.callTool('get_system_info', {});
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        const textContent = result.content[0].text;
        const info = JSON.parse(textContent);
        expect(info.platform).toBeDefined();
        expect(info.cpus).toBeDefined();
    });
});
