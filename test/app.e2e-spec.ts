import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Notes e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // mirror main.ts configuration
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notes CRUD', () => {
    let createdId: number;

    it('POST /v1/notes -> should create a valid note', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/notes')
        .send({ title: 'First', text: 'Hello' })
        .expect(201);

      // expected response body
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: 'First',
        text: 'Hello',
      });
      // timestamps as ISO strings
      expect(typeof res.body.createdAt).toBe('string');
      expect(typeof res.body.updatedAt).toBe('string');

      createdId = res.body.id;
    });

    it('POST /v1/notes -> 400 when payload is invalid', async () => {
      // missing "text"
      await request(app.getHttpServer())
        .post('/v1/notes')
        .send({ title: 'missing text' })
        .expect(400);

      // unknown field (forbidNonWhitelisted)
      await request(app.getHttpServer())
        .post('/v1/notes')
        .send({ text: 'ok', foo: 'bar' })
        .expect(400);
    });

    it('GET /v1/notes -> list should contain the created note', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/notes')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.find((n: any) => n.id === createdId)).toBeTruthy();
    });

    it('GET /v1/notes/:id -> should return the note', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/notes/${createdId}`)
        .expect(200);

      expect(res.body.id).toBe(createdId);
      expect(res.body.text).toBe('Hello');
    });

    it('GET /v1/notes/:id -> 404 when note does not exist', async () => {
      await request(app.getHttpServer())
        .get('/v1/notes/999999')
        .expect(404);
    });

    it('PATCH /v1/notes/:id -> should update title', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/notes/${createdId}`)
        .send({ title: 'New title' })
        .expect(200);

      expect(res.body.title).toBe('New title');
      // updatedAt should be newer
      expect(new Date(res.body.updatedAt).getTime())
        .toBeGreaterThan(new Date(res.body.createdAt).getTime());
    });

    it('PATCH /v1/notes/:id -> 400 for payload with extra fields', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/notes/${createdId}`)
        .send({ text: 'ok', extra: 'nope' })
        .expect(400);
    });

    it('DELETE /v1/notes/:id -> should delete and return { ok: true }', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/v1/notes/${createdId}`)
        .expect(200);

      expect(res.body).toEqual({ ok: true });

      // verify it is gone
      await request(app.getHttpServer())
        .get(`/v1/notes/${createdId}`)
        .expect(404);
    });

    it('DELETE /v1/notes/:id -> 404 when note does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/v1/notes/123456')
        .expect(404);
    });
  });
});
