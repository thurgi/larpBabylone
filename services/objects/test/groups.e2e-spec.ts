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

    it('GET /groups should return 403 for non-admin user', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(403);
    });

    it('GET /groups should return empty array for admin', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /groups should return 400 with invalid body', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({})
        .expect(400);
    });

    it('POST /groups should return 403 for non-admin user', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .send({
          name: 'Hack',
          permissions: validPermissions,
          userIds: [],
        })
        .expect(403);
    });

    it('POST /groups should create a group (admin)', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
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
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', groupId);
        });
    });

    it('GET /groups/:id should return the group', () => {
      return request(ctx.app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', groupId);
          expect(res.body).toHaveProperty('name', 'Éditeurs');
        });
    });

    it('GET /groups/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get('/groups/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(404);
    });

    it('PUT /groups/:id should update the group', () => {
      return request(ctx.app.getHttpServer())
        .put(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ name: 'Lecteurs' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Lecteurs');
          expect(res.body.permissions.documents.read).toBe(true);
        });
    });

    it('PUT /groups/:id should return 403 for non-admin user', () => {
      return request(ctx.app.getHttpServer())
        .put(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .send({ name: 'Hack' })
        .expect(403);
    });

    it('DELETE /groups/:id should return 403 for non-admin user', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(403);
    });

    it('DELETE /groups/:id should delete the group', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(204);
    });

    it('GET /groups/:id should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(404);
    });
  });

  describe('Group admin access', () => {
    it('user with admin permission in a group can access groups', async () => {
      // Create a group with admin permission and test-user as member
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Admin Group',
          permissions: {
            documents: { create: true, read: true, update: true, delete: true },
            versions: { create: true, read: true, update: true, delete: true },
            admin: true,
          },
          userIds: [ctx.userId],
        });
      expect(groupRes.status).toBe(201);

      // test-user (group admin) should now be able to access groups
      const listRes = await request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);

      // test-user can create a group
      const newGroupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({
          name: 'Created by group admin',
          permissions: {
            documents: { read: true },
            versions: { read: true },
          },
          userIds: [],
        });
      expect(newGroupRes.status).toBe(201);

      // otherUser still denied
      await request(ctx.app.getHttpServer())
        .get('/groups')
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(403);
    });
  });

  describe('Groups with groups CRUD permissions', () => {
    it('should accept groups permissions in DTO', () => {
      return request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Group Manager',
          permissions: {
            documents: { create: true, read: true, update: true, delete: true },
            versions: { create: true, read: true, update: true, delete: true },
            groups: { create: true, read: true, update: true, delete: false },
            admin: true,
          },
          userIds: [ctx.userId],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.permissions.groups).toEqual({
            create: true,
            read: true,
            update: true,
            delete: false,
          });
        });
    });
  });

  describe('Permissions enforcement', () => {
    let restrictedDocId: string;

    beforeAll(async () => {
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Lecture seule',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
          },
          userIds: [ctx.userId],
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Document restreint', groupIds: [groupRes.body.id] });
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
