import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Documents (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('CRUD /documents', () => {
    let documentId: string;

    it('GET /documents should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get('/documents')
        .expect(401);
    });

    it('GET /documents should return empty array', () => {
      return request(ctx.app.getHttpServer())
        .get('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /documents should return 400 with invalid body', () => {
      return request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({})
        .expect(400);
    });

    it('POST /documents should create a document', () => {
      return request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Mon premier document' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'Mon premier document');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          expect(res.body).toHaveProperty('groupIds');
          expect(res.body.groupIds).toEqual([]);
          documentId = res.body.id;
        });
    });

    it('GET /documents should return one document', () => {
      return request(ctx.app.getHttpServer())
        .get('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', documentId);
        });
    });

    it('GET /documents/:id should return the document', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', documentId);
          expect(res.body).toHaveProperty('title', 'Mon premier document');
        });
    });

    it('GET /documents/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get('/documents/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('PUT /documents/:id should update the document', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${documentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Titre modifié' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Titre modifié');
        });
    });

    it('PUT /documents/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .put('/documents/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Nope' })
        .expect(404);
    });

    it('DELETE /documents/:id should delete the document', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });

    it('GET /documents/:id should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('DELETE /documents/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .delete('/documents/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });

  describe('Documents with groupIds', () => {
    it('POST /documents should create a document with groupIds', () => {
      const groupId = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa';
      return request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Doc avec groupes', groupIds: [groupId] })
        .expect(201)
        .expect((res) => {
          expect(res.body.groupIds).toEqual([groupId]);
        });
    });
  });

  describe('GET /documents/:documentId/current', () => {
    let docId: string;
    let versionId: string;

    beforeAll(async () => {
      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Doc pour current' });
      docId = docRes.body.id;
    });

    it('should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/current`)
        .expect(401);
    });

    it('should return 404 when no versions exist', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/current`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('should return 404 when no version is validated', async () => {
      const vRes = await request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: '# Brouillon' });
      versionId = vRes.body.id;

      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/current`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('should return markdown content of the validated version', async () => {
      await request(ctx.app.getHttpServer())
        .patch(`/documents/${docId}/versions/${versionId}/validate`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);

      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/current`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect('Content-Type', /text\/markdown/)
        .expect((res) => {
          expect(res.text).toBe('# Brouillon');
        });
    });

    it('should return the latest validated version after switching', async () => {
      const v2Res = await request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: '# Version Deux' });

      await request(ctx.app.getHttpServer())
        .patch(`/documents/${docId}/versions/${v2Res.body.id}/validate`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);

      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/current`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.text).toBe('# Version Deux');
        });
    });

    it('should return 404 for unknown document', () => {
      return request(ctx.app.getHttpServer())
        .get('/documents/00000000-0000-0000-0000-000000000000/current')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });
});
