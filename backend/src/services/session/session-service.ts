import { SessionRepository, Session, Message } from './session-repository';
import { ProfileService } from '../profile/profile-service';

export class SessionService {
    private repo: SessionRepository;
    private profileService: ProfileService;

    constructor() {
        this.repo = new SessionRepository();
        this.profileService = new ProfileService();
    }

    async startSession(userId: string, type: 'behavioral' | 'coding', title: string): Promise<Session | null> {
        // Privacy Check: If user desires no history, we might still create a transient session
        // but mark it differently or treat it as ephemeral. 
        // For v1, we always create a record so we can route messages, but we might delete it later
        // if privacy is enabled, OR we flag it. 
        // Simplest V1 approach: Check preferences. If privacyMode is on, we don't save to DB at all?
        // But we need a session ID for the context. 
        // Let's create it, but we can implement a cleanup job or just not persist messages.

        // Actually, better approach for privacy: 
        // If privacyMode=true, we return a mock session ID or a temporary one that isn't in DB?
        // Or we create it in DB but with a 'transient' flag. 
        // Let's stick to standard creation for now, and handle Message persistence conditionally.

        return this.repo.createSession(userId, type, title);
    }

    async addMessage(userId: string, sessionId: string, role: 'user' | 'assistant' | 'system', content: string) {
        const profile = await this.profileService.getProfile(userId);
        if (profile?.preferences.privacyMode) {
            // If privacy mode is ON, do NOT persist messages to DB.
            // Just return a transient object so the UI flow doesn't break.
            return {
                id: 'transient',
                sessionId,
                role,
                content,
                createdAt: new Date()
            } as Message;
        }

        return this.repo.addMessage(sessionId, role, content);
    }

    async getUserHistory(userId: string) {
        return this.repo.getHistory(userId);
    }

    async getSessionMessages(sessionId: string) {
        return this.repo.getMessages(sessionId);
    }
}
