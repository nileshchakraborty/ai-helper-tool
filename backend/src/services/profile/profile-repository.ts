import { Knex } from 'knex';
import db from '../../infra/db/db';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    preferences: UserPreferences;
}

export interface UserPreferences {
    privacyMode?: boolean; // If true, session history is not saved
    modelProvider?: 'openai' | 'anthropic' | 'ollama';
    theme?: 'light' | 'dark';
}

export class ProfileRepository {
    private db: Knex;

    constructor() {
        this.db = db;
    }

    async findByEmail(email: string): Promise<UserProfile | null> {
        const user = await this.db('users').where({ email }).first();
        if (!user) return null;
        return this.mapToProfile(user);
    }

    async findById(id: string): Promise<UserProfile | null> {
        const user = await this.db('users').where({ id }).first();
        if (!user) return null;
        return this.mapToProfile(user);
    }

    async create(email: string, fullName: string, passwordHash: string): Promise<UserProfile> {
        const [user] = await this.db('users').insert({
            email,
            full_name: fullName,
            password_hash: passwordHash, // In real app, hash this before passing or here
            preferences: {}
        }).returning('*');

        return this.mapToProfile(user);
    }

    async updatePreferences(userId: string, preferences: UserPreferences): Promise<UserProfile> {
        const [user] = await this.db('users')
            .where({ id: userId })
            .update({ preferences: JSON.stringify(preferences) })
            .returning('*');
        return this.mapToProfile(user);
    }

    async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
        await this.db('users')
            .where({ id: userId })
            .update({ password_hash: passwordHash });
    }

    async findByEmailForAuth(email: string): Promise<(UserProfile & { password_hash: string }) | null> {
        const user = await this.db('users').where({ email }).first();
        if (!user) return null;
        return {
            ...this.mapToProfile(user),
            password_hash: user.password_hash
        };
    }

    private mapToProfile(row: any): UserProfile {
        return {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences
        };
    }
}
