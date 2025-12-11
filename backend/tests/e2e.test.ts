// @ts-nocheck
import t from 'tap';
import supertest from 'supertest';
import { buildServer } from '../src/gateway/server';
import db from '../src/infra/db/db';

let app: any;
let client: supertest.SuperTest<supertest.Test>;
let authToken: string;
let userId: string;
let sessionId: string;

t.before(async () => {
    // Migrate DB to ensure fresh state
    await db.migrate.latest();

    const server = await buildServer();
    await server.ready();
    app = server.server;
    client = supertest(app) as unknown as supertest.SuperTest<supertest.Test>;
});

t.teardown(async () => {
    await db.destroy();
    if (app) app.close();
});

t.test('Auth Flow', async (t) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';

    await t.test('Signup', async (t) => {
        const res = await client.post('/v1/auth/signup')
            .send({ email, password, fullName: 'Test User' });
        t.equal(res.status, 201);
        t.ok(res.body.accessToken, 'Should return access token');
        t.ok(res.body.user, 'Should return user object');
        userId = res.body.user.id;
        authToken = res.body.accessToken;
    });

    await t.test('Login', async (t) => {
        const res = await client.post('/v1/auth/login')
            .send({ email, password });
        t.equal(res.status, 200);
        t.ok(res.body.accessToken);
        authToken = res.body.accessToken; // Refresh token
    });
});

t.test('Profile Flow', async (t) => {
    await t.test('Get Profile', async (t) => {
        const res = await client.get('/v1/profile')
            .set('Authorization', `Bearer ${authToken}`);
        t.equal(res.status, 200);
        t.equal(res.body.id, userId);
    });

    await t.test('Update Preferences', async (t) => {
        const res = await client.patch('/v1/profile/preferences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ privacyMode: true });
        t.equal(res.status, 200);
        t.equal(res.body.preferences.privacyMode, true);
    });
});

t.test('Session Flow', async (t) => {
    await t.test('Create Session', async (t) => {
        const res = await client.post('/v1/sessions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Test Session', type: 'behavioral' });
        t.equal(res.status, 200);
        t.ok(res.body.id);
        sessionId = res.body.id;
    });

    await t.test('List Sessions', async (t) => {
        const res = await client.get('/v1/sessions')
            .set('Authorization', `Bearer ${authToken}`);
        t.equal(res.status, 200);
        t.ok(Array.isArray(res.body));
        t.ok(res.body.find((s: any) => s.id === sessionId));
    });

    await t.test('Get Messages (Empty)', async (t) => {
        const res = await client.get(`/v1/sessions/${sessionId}/messages`)
            .set('Authorization', `Bearer ${authToken}`);
        t.equal(res.status, 200);
        t.equal(res.body.length, 0);
    });
});
