import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProfileRepository, UserPreferences } from "../../services/profile/profile-repository";

const profileRepo = new ProfileRepository();

export function registerProfileTools(server: McpServer) {
    server.tool(
        "get_profile",
        "Get user profile by user ID",
        {
            userId: z.string().describe("The user's unique identifier")
        },
        async ({ userId }) => {
            const profile = await profileRepo.findById(userId);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(profile, null, 2)
                }]
            };
        }
    );

    server.tool(
        "update_preferences",
        "Update user preferences",
        {
            userId: z.string().describe("The user's unique identifier"),
            preferences: z.object({
                privacyMode: z.boolean().optional().describe("If true, session history is not saved"),
                modelProvider: z.enum(["openai", "anthropic", "ollama"]).optional().describe("Preferred AI model provider"),
                theme: z.enum(["light", "dark"]).optional().describe("UI theme preference")
            }).describe("User preferences object")
        },
        async ({ userId, preferences }) => {
            const updatedProfile = await profileRepo.updatePreferences(userId, preferences as UserPreferences);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(updatedProfile, null, 2)
                }]
            };
        }
    );
}
