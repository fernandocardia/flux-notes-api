import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesDiskController } from './disk.controller';
import { DiskRepository } from '../repositories/disk.repository';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../app.config';

describe('NotesDiskController', () => {
  let controller: NotesDiskController;

  const repoMock = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const mod = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
      ],
      controllers: [NotesDiskController],
      providers: [{ provide: DiskRepository, useValue: repoMock }],
    }).compile();

    controller = mod.get(NotesDiskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('list', async () => {
    repoMock.list.mockResolvedValue({
      pages: 1,
      notesCount: 2,
      notes: [
        {
          id: 2,
          title: 'B',
          text: 'two',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          title: 'A',
          text: 'one',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    await expect(controller.list(1)).resolves.toMatchObject({
      pages: 1,
      notesCount: 2,
      notes: [{ id: 2 }, { id: 1 }],
    });

    expect(repoMock.list).toHaveBeenCalledWith(1);
  });

  it('get (success)', async () => {
    const note = {
      id: 1,
      title: 'A',
      text: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repoMock.get.mockResolvedValue(note);

    await expect(controller.get(1)).resolves.toMatchObject({
      id: 1,
      title: 'A',
    });
    expect(repoMock.get).toHaveBeenCalledWith(1);
  });

  it('get (not found)', async () => {
    repoMock.get.mockRejectedValue(new NotFoundException('Note not found'));
    await expect(controller.get(999)).rejects.toThrow(NotFoundException);
    expect(repoMock.get).toHaveBeenCalledWith(999);
  });

  it('create', async () => {
    repoMock.create.mockResolvedValue({
      id: 1,
      title: 'A',
      text: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      controller.create({ title: 'A', text: 'x' }),
    ).resolves.toMatchObject({
      id: 1,
      title: 'A',
      text: 'x',
    });

    expect(repoMock.create).toHaveBeenCalledWith({ title: 'A', text: 'x' });
  });

  it('update (success)', async () => {
    const updated = {
      id: 1,
      title: 'New',
      text: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repoMock.update.mockResolvedValue(updated);

    await expect(controller.update(1, { title: 'New' })).resolves.toMatchObject(
      {
        id: 1,
        title: 'New',
        text: 'x',
      },
    );

    expect(repoMock.update).toHaveBeenCalledWith(1, { title: 'New' });
  });

  it('update (not found)', async () => {
    repoMock.update.mockRejectedValue(new NotFoundException('Note not found'));

    await expect(controller.update(123, { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
    expect(repoMock.update).toHaveBeenCalledWith(123, { title: 'x' });
  });

  it('delete (success)', async () => {
    // delete em geral resolve void
    repoMock.delete.mockResolvedValue(undefined);

    await expect(controller.delete(1)).resolves.toBeUndefined();
    expect(repoMock.delete).toHaveBeenCalledWith(1);
  });

  it('delete (not found)', async () => {
    repoMock.delete.mockRejectedValue(new NotFoundException('Note not found'));

    await expect(controller.delete(777)).rejects.toThrow(NotFoundException);
    expect(repoMock.delete).toHaveBeenCalledWith(777);
  });
});
