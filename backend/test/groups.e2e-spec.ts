import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Groups (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  const validPermissions = {
    documents: { create: true, read: true, update: true, delete: false },
    versions: { create: true, read: true, update: true, delete: false },
    publicRead: false,
  };

  describe('CRUD /groups', () => {
    let groupId: string;

    it('GET /groups should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups')
        .expect(401);
    });

    it('GET /groups should return empty array', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /groups should return 400 with invalid body', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({})
        .expect(400);
    });

    it('POST /groups should create a group', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({
          name: 'Éditeurs',
          permissions: validPermissions,
          userIds: [ctx.userId],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Éditeurs');
          expect(res.body).toHaveProperty('permissions');
          expect(res.body.permissions.documents.read).toBe(true);
          expect(res.body.permissions.documents.delete).toBe(false);
          expect(res.body.userIds).toEqual([ctx.userId]);
          groupId = res.body.id;
        });
    });

    it('GET /groups should return one group', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', groupId);
        });
    });

    it('GET /groups/:id should return the group', () => {
      return request(ctx.app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', groupId);
          expect(res.body).toHaveProperty('name', 'Éditeurs');
        });
    });

    it('GET /groups/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('PUT /groups/:id should update the group', () => {
      return request(ctx.app.getHttpServer())
        .put(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Lecteurs' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Lecteurs');
          // Permissions should remain unchanged
          expect(res.body.permissions.documents.read).toBe(true);
        });
    });

    it('DELETE /groups/:id should delete the group', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });

    it('GET /groups/:id should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });

  describe('Permissions enforcement', () => {
    let restrictedDocId: string;
    let groupId: string;

    beforeAll(async () => {
      // Create a group with read-only on documents, no version access
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({
          name: 'Lecture seule',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
          },
          userIds: [ctx.userId],
        });
      groupId = groupRes.body.id;

      // Create a document associated with this group
      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Document restreint', groupIds: [groupId] });
      restrictedDocId = docRes.body.id;
    });

    it('should allow reading the restricted document', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${restrictedDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);
    });

    it('should deny updating the restricted document', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${restrictedDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Tentative' })
        .expect(403);
    });

    it('should deny deleting the restricted document', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${restrictedDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(403);
    });

    it('admin should bypass permissions and update', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${restrictedDocId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Modifié par admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Modifié par admin');
        });
    });

    it('admin should bypass permissions and delete', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${restrictedDocId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(204);
    });
  });

  describe('Document without groups (open access)', () => {
    let openDocId: string;

    beforeAll(async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Document ouvert' });
      openDocId = res.body.id;
    });

    it('should allow any authenticated user to read', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${openDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);
    });

    it('should allow any authenticated user to update', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${openDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Modifié librement' })
        .expect(200);
    });

    it('should allow any authenticated user to delete', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${openDocId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });
  });
});
