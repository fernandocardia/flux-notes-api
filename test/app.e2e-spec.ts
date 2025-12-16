import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

type NoteJson = {
  id: number;
  title: string;
  text: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type ListNotesJson = {
  pages: number;
  notesCount: number;
  notes: NoteJson[];
};

function assertRecord(x: unknown): asserts x is Record<string, unknown> {
  if (typeof x !== 'object' || x === null) {
    throw new Error('Body is not an object');
  }
}

function assertNoteJson(x: unknown): asserts x is NoteJson {
  assertRecord(x);

  if (typeof x.id !== 'number') throw new Error('id must be number');
  if (typeof x.title !== 'string') throw new Error('title must be string');
  if (typeof x.text !== 'string') throw new Error('text must be string');
  if (typeof x.createdAt !== 'string')
    throw new Error('createdAt must be string');
  if (typeof x.updatedAt !== 'string')
    throw new Error('updatedAt must be string');
}

function assertListNotesJson(x: unknown): asserts x is ListNotesJson {
  assertRecord(x);

  if (typeof x.pages !== 'number') throw new Error('pages must be number');
  if (typeof x.notesCount !== 'number')
    throw new Error('notesCount must be number');
  if (!Array.isArray(x.notes)) throw new Error('notes must be array');

  for (const n of x.notes) assertNoteJson(n);
}

describe('Notes e2e', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    server = app.getHttpServer() as unknown as Parameters<typeof request>[0];
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each(['mem', 'disk'] as const)('Notes %s', (storage) => {
    let createdId: number;

    const baseUrl = `/v1/notes/${storage}`;
    const listUrl = (page = 1) => `${baseUrl}/list/${page}`;

    it(`POST ${baseUrl} -> should create a valid note`, async () => {
      const res = await request(server)
        .post(baseUrl)
        .send({ title: 'First', text: 'Hello' })
        .expect(201);

      const body: unknown = res.body;
      assertNoteJson(body);

      expect(body.id).toBeGreaterThan(0);
      expect(body.title).toBe('First');
      expect(body.text).toBe('Hello');

      // ISO timestamps
      expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false);
      expect(Number.isNaN(Date.parse(body.updatedAt))).toBe(false);

      createdId = body.id;
    });

    it(`POST ${baseUrl} -> 400 when payload is invalid`, async () => {
      await request(server)
        .post(baseUrl)
        .send({ title: 'missing text' })
        .expect(400);

      await request(server)
        .post(baseUrl)
        .send({ text: 'ok', foo: 'bar' })
        .expect(400);
    });

    it(`GET ${listUrl(1)} -> list should contain the created note`, async () => {
      const res = await request(server).get(listUrl(1)).expect(200);

      const body: unknown = res.body;
      assertListNotesJson(body);

      expect(body.notes.some((n) => n.id === createdId)).toBe(true);
    });

    it(`GET ${baseUrl}/:id -> should return the note`, async () => {
      const res = await request(server)
        .get(`${baseUrl}/${createdId}`)
        .expect(200);

      const body: unknown = res.body;
      assertNoteJson(body);

      expect(body.id).toBe(createdId);
      expect(body.text).toBe('Hello');
    });

    it(`GET ${baseUrl}/:id -> 404 when note does not exist`, async () => {
      await request(server).get(`${baseUrl}/999999`).expect(404);
    });

    it(`PATCH ${baseUrl}/:id -> should update title`, async () => {
      const res = await request(server)
        .patch(`${baseUrl}/${createdId}`)
        .send({ title: 'New title' })
        .expect(200);

      const body: unknown = res.body;
      assertNoteJson(body);

      expect(body.title).toBe('New title');
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(body.createdAt).getTime(),
      );
    });

    it(`PATCH ${baseUrl}/:id -> 400 for payload with extra fields`, async () => {
      await request(server)
        .patch(`${baseUrl}/${createdId}`)
        .send({ text: 'ok', extra: 'nope' })
        .expect(400);
    });

    it(`DELETE ${baseUrl}/:id -> should delete and return empty response (204)`, async () => {
      const res = await request(server)
        .delete(`${baseUrl}/${createdId}`)
        .expect(204);

      // 204 - no content
      expect(res.text).toBe('');

      await request(server).get(`${baseUrl}/${createdId}`).expect(404);
    });

    it(`DELETE ${baseUrl}/:id -> 404 when note does not exist`, async () => {
      await request(server).delete(`${baseUrl}/123456`).expect(404);
    });
  });
});
