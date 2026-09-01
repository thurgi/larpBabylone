import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Permissions (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('publicRead: document with group having publicRead=true', () => {
    let docId: string;

    beforeAll(async () => {
      // Create a group with publicRead and read on documents/versions, user is test-user
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Public Readers',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
            publicRead: true,
          },
          userIds: [ctx.userId],
        });

      // Create a document associated with this group
      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Document public', groupIds: [groupRes.body.id] });
      docId = docRes.body.id;

      // Create a version in the document
      await request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ content: 'Contenu public' });
    });

    it('should allow reading document without authentication (publicRead)', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Document public');
        });
    });

    it('should allow reading versions without authentication (publicRead)', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/versions`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
        });
    });

    it('should deny updating document without authentication', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .send({ title: 'Hacked' })
        .expect(401);
    });

    it('should deny deleting document without authentication', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${docId}`)
        .expect(401);
    });

    it('should deny creating version without authentication', () => {
      return request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .send({ content: 'hack' })
        .expect(401);
    });
  });

  describe('publicRead: document without publicRead should require auth', () => {
    let docId: string;

    beforeAll(async () => {
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Private Group',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
            publicRead: false,
          },
          userIds: [ctx.userId],
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Document privé', groupIds: [groupRes.body.id] });
      docId = docRes.body.id;
    });

    it('should deny reading document without authentication', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .expect(401);
    });

    it('should allow reading with authenticated user in the group', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);
    });
  });

  describe('User not in any group denied access to grouped document', () => {
    let docId: string;

    beforeAll(async () => {
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Exclusive Group',
          permissions: {
            documents: { create: true, read: true, update: true, delete: true },
            versions: { create: true, read: true, update: true, delete: true },
          },
          userIds: [ctx.userId], // only test-user
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Doc exclusif', groupIds: [groupRes.body.id] });
      docId = docRes.body.id;
    });

    it('should deny otherUser from reading the document', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(403);
    });

    it('should deny otherUser from updating the document', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should deny otherUser from deleting the document', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(403);
    });

    it('should allow test-user (in group) to read the document', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);
    });

    it('admin should bypass and access the document', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200);
    });
  });

  describe('Multiple groups: at least one grants access', () => {
    let docId: string;

    beforeAll(async () => {
      // Group 1: only test-user, read-only
      const group1Res = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Group Read Only',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
          },
          userIds: [ctx.userId],
        });

      // Group 2: only otherUser, full CRUD
      const group2Res = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Group Full Access',
          permissions: {
            documents: { create: true, read: true, update: true, delete: true },
            versions: { create: true, read: true, update: true, delete: true },
          },
          userIds: [ctx.otherUserId],
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Multi-group doc', groupIds: [group1Res.body.id, group2Res.body.id] });
      docId = docRes.body.id;
    });

    it('test-user can read but not update', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200);

      await request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Nope' })
        .expect(403);
    });

    it('otherUser can read and update', async () => {
      await request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(200);

      await request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .send({ title: 'Updated by other' })
        .expect(200);
    });
  });

  describe('Version permissions enforcement', () => {
    let docId: string;

    beforeAll(async () => {
      // Group: read docs, read versions, no write versions
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Doc Reader No Version Write',
          permissions: {
            documents: { create: false, read: true, update: false, delete: false },
            versions: { create: false, read: true, update: false, delete: false },
          },
          userIds: [ctx.userId],
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Doc version test', groupIds: [groupRes.body.id] });
      docId = docRes.body.id;

      // Create a version as admin
      await request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ content: 'Admin content' });
    });

    it('should allow reading versions', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
        });
    });

    it('should deny creating versions', () => {
      return request(ctx.app.getHttpServer())
        .post(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ content: 'Should fail' })
        .expect(403);
    });

    it('should deny deleting versions', async () => {
      const versions = await request(ctx.app.getHttpServer())
        .get(`/documents/${docId}/versions`)
        .set('Cookie', `jwt=${ctx.userToken}`);
      const versionId = versions.body[0].id;

      return request(ctx.app.getHttpServer())
        .delete(`/documents/${docId}/versions/${versionId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(403);
    });
  });

  describe('Document without groups: open access for any authenticated user', () => {
    let docId: string;

    beforeAll(async () => {
      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Open doc' });
      docId = docRes.body.id;
    });

    it('any authenticated user can read', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .expect(200);
    });

    it('any authenticated user can update', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.otherUserToken}`)
        .send({ title: 'Updated by anyone' })
        .expect(200);
    });

    it('unauthenticated user cannot read document without groups', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .expect(401);
    });
  });

  describe('Superadmin bypasses all permissions', () => {
    let docId: string;

    beforeAll(async () => {
      // Create group that denies everything
      const groupRes = await request(ctx.app.getHttpServer())
        .post('/groups')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({
          name: 'Deny All',
          permissions: {
            documents: { create: false, read: false, update: false, delete: false },
            versions: { create: false, read: false, update: false, delete: false },
          },
          userIds: [ctx.adminId],
        });

      const docRes = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Admin bypass doc', groupIds: [groupRes.body.id] });
      docId = docRes.body.id;
    });

    it('admin can read despite deny-all group', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(200);
    });

    it('admin can update despite deny-all group', () => {
      return request(ctx.app.getHttpServer())
        .put(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .send({ title: 'Admin override' })
        .expect(200);
    });

    it('admin can delete despite deny-all group', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.adminToken}`)
        .expect(204);
    });
  });
});
