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
});
