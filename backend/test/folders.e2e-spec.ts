import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Folders (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('CRUD /folders', () => {
    let folderId: string;

    it('GET /folders should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get('/folders')
        .expect(401);
    });

    it('GET /folders should return empty array', () => {
      return request(ctx.app.getHttpServer())
        .get('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /folders should return 400 with invalid body', () => {
      return request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({})
        .expect(400);
    });

    it('POST /folders should create a folder', () => {
      return request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Mon dossier' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Mon dossier');
          expect(res.body).toHaveProperty('parentId', null);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          folderId = res.body.id;
        });
    });

    it('GET /folders should return one folder', () => {
      return request(ctx.app.getHttpServer())
        .get('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', folderId);
        });
    });

    it('GET /folders/:id should return the folder', () => {
      return request(ctx.app.getHttpServer())
        .get(`/folders/${folderId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', folderId);
          expect(res.body).toHaveProperty('name', 'Mon dossier');
        });
    });

    it('GET /folders/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get('/folders/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('PUT /folders/:id should update the folder name', () => {
      return request(ctx.app.getHttpServer())
        .put(`/folders/${folderId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Dossier renommé' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Dossier renommé');
        });
    });

    it('PUT /folders/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .put('/folders/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Nope' })
        .expect(404);
    });

    it('DELETE /folders/:id should delete the folder', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/folders/${folderId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });

    it('GET /folders/:id should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/folders/${folderId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });

  describe('Nested folders', () => {
    let parentId: string;
    let childId: string;
    let grandchildId: string;

    beforeAll(async () => {
      const parent = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Parent' });
      parentId = parent.body.id;

      const child = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Enfant', parentId });
      childId = child.body.id;

      const grandchild = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Petit-enfant', parentId: childId });
      grandchildId = grandchild.body.id;
    });

    it('should create a folder with parentId', () => {
      return request(ctx.app.getHttpServer())
        .get(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('parentId', parentId);
        });
    });

    it('should return 404 when creating folder with unknown parentId', () => {
      return request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Orphelin', parentId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('should move a folder to another parent', async () => {
      // Create a new target folder
      const target = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Nouvelle cible' });

      // Move child to target
      await request(ctx.app.getHttpServer())
        .put(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ parentId: target.body.id })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('parentId', target.body.id);
        });

      // Grandchild still has child as parent (unchanged)
      const gc = await request(ctx.app.getHttpServer())
        .get(`/folders/${grandchildId}`)
        .set('Cookie', `jwt=${ctx.userToken}`);
      expect(gc.body.parentId).toBe(childId);
    });

    it('should move a folder to root (parentId = null)', () => {
      return request(ctx.app.getHttpServer())
        .put(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ parentId: null })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('parentId', null);
        });
    });

    it('should reject moving a folder into itself', () => {
      return request(ctx.app.getHttpServer())
        .put(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ parentId: childId })
        .expect(400);
    });

    it('should reject circular reference', () => {
      // grandchild is under child; moving child under grandchild would be circular
      return request(ctx.app.getHttpServer())
        .put(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ parentId: grandchildId })
        .expect(400);
    });

    it('should delete folder and all descendants', async () => {
      // Put child back under parent for the test
      await request(ctx.app.getHttpServer())
        .put(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ parentId: parentId });

      // Delete parent → should delete child and grandchild
      await request(ctx.app.getHttpServer())
        .delete(`/folders/${parentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);

      // All three should be 404
      await request(ctx.app.getHttpServer())
        .get(`/folders/${parentId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);

      await request(ctx.app.getHttpServer())
        .get(`/folders/${childId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);

      await request(ctx.app.getHttpServer())
        .get(`/folders/${grandchildId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });

  describe('Move document between folders', () => {
    let folder1Id: string;
    let folder2Id: string;
    let docId: string;

    beforeAll(async () => {
      const f1 = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Dossier A' });
      folder1Id = f1.body.id;

      const f2 = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Dossier B' });
      folder2Id = f2.body.id;

      const doc = await request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Doc à déplacer', folderId: folder1Id });
      docId = doc.body.id;
    });

    it('should create document with folderId', () => {
      return request(ctx.app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('folderId', folder1Id);
        });
    });

    it('should move document to another folder', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/folders/move-document/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ folderId: folder2Id })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('folderId', folder2Id);
        });
    });

    it('should move document to root (no folder)', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/folders/move-document/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ folderId: null })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('folderId', null);
        });
    });

    it('should return 404 when moving to unknown folder', () => {
      return request(ctx.app.getHttpServer())
        .patch(`/folders/move-document/${docId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ folderId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('should return 404 when moving unknown document', () => {
      return request(ctx.app.getHttpServer())
        .patch('/folders/move-document/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ folderId: folder1Id })
        .expect(404);
    });
  });

  describe('Document folderId in CRUD', () => {
    it('document without folderId should have folderId null', () => {
      return request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Sans dossier' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('folderId', null);
        });
    });

    it('document can be created with folderId', async () => {
      const folder = await request(ctx.app.getHttpServer())
        .post('/folders')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Dossier pour doc' });

      return request(ctx.app.getHttpServer())
        .post('/documents')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ title: 'Avec dossier', folderId: folder.body.id })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('folderId', folder.body.id);
        });
    });
  });
});
