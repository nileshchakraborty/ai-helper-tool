import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SessionRepository } from "../../services/session/session-repository";
import { ProfileRepository } from "../../services/profile/profile-repository";

const sessionRepo = new SessionRepository();
const profileRepo = new ProfileRepository();

export function registerSessionTools(server: McpServer) {
    server.tool(
        "start_session",
        "Start a new interview session",
        {
            userId: z.string().describe("The user's unique identifier"),
            type: z.enum(["behavioral", "coding"]).describe("Type of interview session"),
            title: z.string().describe("Title for the session")
        },
        async ({ userId, type, title }) => {
            const session = await sessionRepo.createSession(userId, type, title);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(session, null, 2)
                }]
            };
        }
    );

    server.tool(
        "add_message",
        "Add a message to a session",
        {
            userId: z.string().describe("The user's unique identifier"),
            sessionId: z.string().describe("The session's unique identifier"),
            role: z.enum(["user", "assistant", "system"]).describe("Message role"),
            content: z.string().describe("Message content")
        },
        async ({ userId, sessionId, role, content }) => {
            // Check privacy mode - if enabled, return transient message without persisting
            const profile = await profileRepo.findById(userId);
            if (profile?.preferences.privacyMode) {
                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify({
                            id: "transient",
                            sessionId,
                            role,
                            content,
                            createdAt: new Date()
                        }, null, 2)
                    }]
                };
            }

            const message = await sessionRepo.addMessage(sessionId, role, content);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(message, null, 2)
                }]
            };
        }
    );

    server.tool(
        "get_history",
        "Get user's session history",
        {
            userId: z.string().describe("The user's unique identifier")
        },
        async ({ userId }) => {
            const sessions = await sessionRepo.getHistory(userId);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(sessions, null, 2)
                }]
            };
        }
    );

    server.tool(
        "get_session_messages",
        "Get all messages for a session",
        {
            sessionId: z.string().describe("The session's unique identifier")
        },
        async ({ sessionId }) => {
            const messages = await sessionRepo.getMessages(sessionId);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(messages, null, 2)
                }]
            };
        }
    );
}
