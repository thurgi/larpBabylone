import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TestContext } from './helpers/test-setup';

describe('Objects (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(ctx);
  });

  describe('CRUD /objects', () => {
    let objectId: string;

    it('GET /objects should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .get('/objects')
        .expect(401);
    });

    it('GET /objects should return empty array', () => {
      return request(ctx.app.getHttpServer())
        .get('/objects')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /objects should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .post('/objects')
        .send({ name: 'Épée', description: 'Une épée en mousse' })
        .expect(401);
    });

    it('POST /objects should return 400 with invalid body', () => {
      return request(ctx.app.getHttpServer())
        .post('/objects')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({})
        .expect(400);
    });

    it('POST /objects should return 400 without description', () => {
      return request(ctx.app.getHttpServer())
        .post('/objects')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Épée' })
        .expect(400);
    });

    it('POST /objects should create an object', () => {
      return request(ctx.app.getHttpServer())
        .post('/objects')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Épée', description: 'Une épée en mousse' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Épée');
          expect(res.body).toHaveProperty('description', 'Une épée en mousse');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          objectId = res.body.id;
        });
    });

    it('GET /objects should return one object', () => {
      return request(ctx.app.getHttpServer())
        .get('/objects')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('id', objectId);
          expect(res.body[0]).toHaveProperty('name', 'Épée');
        });
    });

    it('GET /objects/:id should return the object', () => {
      return request(ctx.app.getHttpServer())
        .get(`/objects/${objectId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', objectId);
          expect(res.body).toHaveProperty('name', 'Épée');
          expect(res.body).toHaveProperty('description', 'Une épée en mousse');
        });
    });

    it('GET /objects/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .get('/objects/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('PUT /objects/:id should update the object', () => {
      return request(ctx.app.getHttpServer())
        .put(`/objects/${objectId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Bouclier', description: 'Un bouclier en bois' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Bouclier');
          expect(res.body).toHaveProperty('description', 'Un bouclier en bois');
        });
    });

    it('PUT /objects/:id should allow partial update', () => {
      return request(ctx.app.getHttpServer())
        .put(`/objects/${objectId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Bouclier rond' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Bouclier rond');
          expect(res.body).toHaveProperty('description', 'Un bouclier en bois');
        });
    });

    it('PUT /objects/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .put('/objects/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('DELETE /objects/:id should return 401 without token', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/objects/${objectId}`)
        .expect(401);
    });

    it('DELETE /objects/:id should delete the object', () => {
      return request(ctx.app.getHttpServer())
        .delete(`/objects/${objectId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(204);
    });

    it('GET /objects/:id should return 404 after deletion', () => {
      return request(ctx.app.getHttpServer())
        .get(`/objects/${objectId}`)
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });

    it('DELETE /objects/:id should return 404 for unknown id', () => {
      return request(ctx.app.getHttpServer())
        .delete('/objects/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `jwt=${ctx.userToken}`)
        .expect(404);
    });
  });
});
