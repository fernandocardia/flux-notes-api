import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { ListNotesDto } from '../dto/list-notes.dto';

import { NotesInMemoryController } from './in-memory.controller';
import { InMemoryRepository } from '../repositories/in-memory.repository';
import appConfig from '../app.config';

describe('NotesInMemoryController', () => {
  let controller: NotesInMemoryController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
      ],
      controllers: [NotesInMemoryController],
      providers: [InMemoryRepository],
    }).compile();

    controller = app.get<NotesInMemoryController>(NotesInMemoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create and list notes', () => {
    const dto: CreateNoteDto = { title: 'First', text: 'Hello' };
    const created = controller.create(dto);

    expect(typeof created.id).toBe('number');
    expect(created.title).toBe('First');
    expect(created.text).toBe('Hello');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);

    const notesList: ListNotesDto = controller.list(1);
    expect(notesList.notes).toHaveLength(1);
    expect(notesList.notes[0].id).toBe(created.id);
  });

  it('should retrieve a note by ID', () => {
    const a = controller.create({ title: 'A', text: 'one' });
    const b = controller.create({ title: 'B', text: 'two' });

    const gotA = controller.get(a.id);
    const gotB = controller.get(b.id);

    expect(gotA.title).toBe('A');
    expect(gotB.text).toBe('two');
  });

  it('should throw NotFoundException when retrieving a non-existing ID', () => {
    expect(() => controller.get(999)).toThrow(NotFoundException);
  });

  it('should update a note', () => {
    const created = controller.create({ title: 'Old', text: 'text' });

    const dto: UpdateNoteDto = { title: 'New' };
    const updated = controller.update(created.id, dto);

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('New');
    expect(updated.text).toBe('text');
    expect(updated.updatedAt).toBeInstanceOf(Date);

    expect(
      updated.updatedAt.getTime() - created.updatedAt.getTime(),
    ).toBeGreaterThanOrEqual(0);
  });

  it('should throw NotFoundException when updating a non-existing ID', () => {
    expect(() => controller.update(12345, { title: 'x' })).toThrow(
      NotFoundException,
    );
  });

  it('should delete a note', () => {
    const created = controller.create({ title: 'TBD', text: '...' });

    // delete retorna void/undefined
    expect(() => controller.delete(created.id)).not.toThrow();

    // agora deve lançar
    expect(() => controller.get(created.id)).toThrow(NotFoundException);
  });

  it('should throw NotFoundException when deleting a non-existing ID', () => {
    expect(() => controller.delete(777)).toThrow(NotFoundException);
  });
});
