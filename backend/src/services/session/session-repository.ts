import { Knex } from 'knex';
import db from '../../infra/db/db';

export interface Session {
    id: string;
    userId: string;
    title: string;
    type: 'behavioral' | 'coding';
    status: 'active' | 'archived';
    createdAt: Date;
    endedAt?: Date;
}

export interface Message {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
}

export class SessionRepository {
    private db: Knex;

    constructor() {
        this.db = db;
    }

    async createSession(userId: string, type: 'behavioral' | 'coding', title: string): Promise<Session> {
        const [row] = await this.db('sessions').insert({
            user_id: userId,
            title,
            type,
            status: 'active'
        }).returning('*');
        return this.mapToSession(row);
    }

    async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<Message> {
        const [row] = await this.db('messages').insert({
            session_id: sessionId,
            role,
            content
        }).returning('*');
        return this.mapToMessage(row);
    }

    async getHistory(userId: string): Promise<Session[]> {
        const rows = await this.db('sessions').where({ user_id: userId }).orderBy('created_at', 'desc');
        return rows.map(this.mapToSession);
    }

    async getMessages(sessionId: string): Promise<Message[]> {
        const rows = await this.db('messages').where({ session_id: sessionId }).orderBy('created_at', 'asc');
        return rows.map(this.mapToMessage);
    }

    // Deletes session and cascade deletes messages (via DB constraint)
    async deleteSession(sessionId: string) {
        await this.db('sessions').where({ id: sessionId }).delete();
    }

    private mapToSession(row: any): Session {
        return {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            type: row.type,
            status: row.status,
            createdAt: row.created_at,
            endedAt: row.ended_at
        };
    }

    private mapToMessage(row: any): Message {
        return {
            id: row.id,
            sessionId: row.session_id,
            role: row.role,
            content: row.content,
            createdAt: row.created_at
        };
    }
}
