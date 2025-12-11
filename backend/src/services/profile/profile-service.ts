import { ProfileRepository, UserPreferences, UserProfile } from './profile-repository';

export class ProfileService {
    private repo: ProfileRepository;

    constructor() {
        this.repo = new ProfileRepository();
    }

    async getProfile(userId: string): Promise<UserProfile | null> {
        return this.repo.findById(userId);
    }

    async updatePreferences(userId: string, preferences: UserPreferences): Promise<UserProfile> {
        // Here we could validate preferences
        // e.g. check if model provider is valid
        return this.repo.updatePreferences(userId, preferences);
    }
}
