import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Auth (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('GET /auth/me', () => {
    it('should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return current user with valid token', () => {
      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', ctx.userId);
          expect(res.body).toHaveProperty('username', 'test-user');
          expect(res.body).toHaveProperty('provider', 'discord');
        });
    });

    it('should return admin user with admin token', () => {
      return request(ctx.app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', ctx.adminId);
          expect(res.body).toHaveProperty('username', 'admin-user');
        });
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should return 204 with valid token', () => {
      return request(ctx.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });
  });
});
