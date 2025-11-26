import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesRepository } from './notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

describe('NotesController', () => {
  let notesController: NotesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [NotesRepository],
    }).compile();

    notesController = app.get<NotesController>(NotesController);
  });

  it('should be defined', () => {
    expect(notesController).toBeDefined();
  });

  it('should create and list notes', () => {
    const dto: CreateNoteDto = { title: 'First', text: 'Hello' };
    const created = notesController.create(dto);

    expect(created).toMatchObject({
      id: expect.any(Number),
      title: 'First',
      text: 'Hello',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    const list = notesController.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
  });

  it('should retrieve a note by ID', () => {
    const a = notesController.create({ title: 'A', text: 'one' });
    const b = notesController.create({ title: 'B', text: 'two' });

    const gotA = notesController.get(a.id);
    const gotB = notesController.get(b.id);

    expect(gotA.title).toBe('A');
    expect(gotB.text).toBe('two');
  });

  it('should throw NotFoundException when retrieving a non-existing ID', () => {
    expect(() => notesController.get(999)).toThrow(NotFoundException);
  });

  it('should update a note', () => {
    const created = notesController.create({ title: 'Old', text: 'text' });
    const dto: UpdateNoteDto = { title: 'New' };

    const updated = notesController.update(created.id, dto);

    expect(updated).toMatchObject({
      id: created.id,
      title: 'New',
      text: 'text',
      updatedAt: expect.any(Date),
    });

    expect(updated.updatedAt.getTime() - created.updatedAt.getTime())
    .toBeGreaterThanOrEqual(0);
  });

  it('should throw NotFoundException when updating a non-existing ID', () => {
    expect(() => notesController.update(12345, { title: 'x' })).toThrow(NotFoundException);
  });

  it('should delete a note', () => {
    const created = notesController.create({ title: 'TBD', text: '...' });

    const res = notesController.delete(created.id);
    expect(res).toEqual({ ok: true });

    expect(() => notesController.get(created.id)).toThrow(NotFoundException);
  });

  it('should throw NotFoundException when deleting a non-existing ID', () => {
    expect(() => notesController.delete(777)).toThrow(NotFoundException);
  });
});
