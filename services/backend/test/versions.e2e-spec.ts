import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Versions (e2e)', () => {
  let ctx: TestContext;
  let documentId: string;

  beforeAll(async () => {
    ctx = await setupTestApp();

    // Create a document to host versions
    const res = await request(ctx.app.getHttpServer())
      .post('/documents')
      .set('Cookie', `jwt=${ctx.userToken}`)
      .send({ title: 'Document pour versions' });
    documentId = res.body.id;
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('CRUD /documents/:documentId/versions', () => {
    let versionId: string;

    it('GET versions should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions`)
        .expect(401);
    });

    it('GET versions should return empty array', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST versions with empty body should create version with empty content', () => {
      return request(ctx.app.getHttpServer())
        .post(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({})
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', '1');
          expect(res.body).toHaveProperty('content', '');
        });
    });

    it('POST versions should create a version with auto-incremental number', () => {
      return request(ctx.app.getHttpServer())
        .post(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: '# Hello\nWorld' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('documentId', documentId);
          expect(res.body).toHaveProperty('title', '2');
          expect(res.body).toHaveProperty('isValid', false);
          expect(res.body).toHaveProperty('content', '# Hello\nWorld');
          expect(res.body).toHaveProperty('authorId', ctx.userId);
          versionId = res.body.id;
        });
    });

    it('GET versions should return created versions', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body.map((v: any) => v.title).sort()).toEqual(['1', '2']);
          // List endpoint returns metadata only (no content)
          expect(res.body[0]).not.toHaveProperty('content');
        });
    });

    it('GET version by id should return version with content', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions/${versionId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', versionId);
          expect(res.body).toHaveProperty('content', '# Hello\nWorld');
        });
    });

    it('GET version should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('PUT version should update content', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${documentId}/versions/${versionId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: '# Updated\nContent' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', '2');
          expect(res.body).toHaveProperty('content', '# Updated\nContent');
        });
    });

    it('PUT version should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${documentId}/versions/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Nope' })
        .expect(404);
    });

    it('DELETE version should return 204', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${documentId}/versions/${versionId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });

    it('GET version should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions/${versionId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });

  describe('POST versions on unknown document', () => {
    it('should return 404', () => {
      return request(ctx.app.getHttpServer())
        .post('/documents/00000000-0000-0000-0000-000000000000/versions')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: 'test' })
        .expect(404);
    });
  });

  describe('PATCH validate version', () => {
    let v1Id: string;
    let v2Id: string;

    beforeAll(async () => {
      const res1 = await request(ctx.app.getHttpServer())
        .post(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: 'Content V1' });
      v1Id = res1.body.id;

      const res2 = await request(ctx.app.getHttpServer())
        .post(`/documents/${documentId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: 'Content V2' });
      v2Id = res2.body.id;
    });

    it('PATCH validate should set version as valid', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/documents/${documentId}/versions/${v1Id}/validate`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', true);
          expect(res.body).toHaveProperty('id', v1Id);
        });
    });

    it('validating another version should invalidate the first', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/documents/${documentId}/versions/${v2Id}/validate`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', true);
          expect(res.body).toHaveProperty('id', v2Id);
        });

      // Check v1 is now invalid
      const res = await request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}/versions/${v1Id}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);

      expect(res.body.isValid).toBe(false);
    });

    it('PATCH validate should return 404 for unknown version', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/documents/${documentId}/versions/00000000-0000-0000-0000-000000000000/validate`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });
});
