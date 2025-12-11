import supertest from 'supertest';
import { buildServer } from '../src/gateway/server';
import db from '../src/infra/db/db';

let app: any;
let client: supertest.SuperTest<supertest.Test>;
let authToken: string;
let userId: string;
let sessionId: string;

describe('E2E Tests', () => {
    beforeAll(async () => {
        // Migrate DB to ensure fresh state
        await db.migrate.latest();

        const server = await buildServer();
        await server.ready();
        app = server.server;
        client = supertest(app) as unknown as supertest.SuperTest<supertest.Test>;
    });

    afterAll(async () => {
        await db.destroy();
        if (app) await app.close();
    });

    describe('Auth Flow', () => {
        const email = `test-${Date.now()}@example.com`;
        const password = 'password123';

        it('should signup a new user', async () => {
            const res = await client.post('/v1/auth/signup')
                .send({ email, password, fullName: 'Test User' });
            expect(res.status).toBe(201);
            expect(res.body.accessToken).toBeDefined();
            expect(res.body.user).toBeDefined();
            userId = res.body.user.id;
            authToken = res.body.accessToken;
        });

        it('should login', async () => {
            const res = await client.post('/v1/auth/login')
                .send({ email, password });
            expect(res.status).toBe(200);
            expect(res.body.accessToken).toBeDefined();
            authToken = res.body.accessToken; // Refresh token
        });
    });

    describe('Profile Flow', () => {
        it('should get profile', async () => {
            const res = await client.get('/v1/profile')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(userId);
        });

        it('should update preferences', async () => {
            const res = await client.patch('/v1/profile/preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ privacyMode: true });
            expect(res.status).toBe(200);
            expect(res.body.preferences.privacyMode).toBe(true);
        });
    });

    describe('Session Flow', () => {
        it('should create a session', async () => {
            const res = await client.post('/v1/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Test Session', type: 'behavioral' });
            expect(res.status).toBe(200);
            expect(res.body.id).toBeDefined();
            sessionId = res.body.id;
        });

        it('should list sessions', async () => {
            const res = await client.get('/v1/sessions')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find((s: any) => s.id === sessionId);
            expect(found).toBeDefined();
        });

        it('should get empty messages', async () => {
            const res = await client.get(`/v1/sessions/${sessionId}/messages`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(0);
        });
    });

    describe('AI Flow', () => {
        // Note: We expect LLM calls to potentially fail if no API key is set in test env,
        // but the validation and route handler entry should work.
        // Or we can mock the AIOrchestrator if we want strict unit tests.
        // For E2E, we check basic inputs.

        it('should accept coach natural request', async () => {
            // This might fail if no LLM configured, but let's see.
            // If it returns 500 from LLM error, that means route is reached.
            const res = await client.post('/v1/ai/coach/natural')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    text: "Tell me about yourself",
                    session_id: sessionId
                });

            // We accept 200 (success) or 500 (LLM error)
            expect([200, 500]).toContain(res.status);
        });

        // Listen/assist is a streaming endpoint, hard to test with supertest fully waiting?
        // But we can check if it accepts connection or sends headers.
    });
});
