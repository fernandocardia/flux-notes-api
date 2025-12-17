import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Note } from '../entities/note.entity';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { ListNotesDto } from '../dto/list-notes.dto';
import { ConfigService } from '@nestjs/config';

class AsyncMutex {
  private chain = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.chain;
    let release!: () => void;
    this.chain = new Promise<void>((r) => (release = r));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

type DiskNoteLine = {
  id: number;
  title: string;
  text: string;
  createdAt: string; // ISO string
  updatedAt: string;
};

type IndexEntry = {
  id: number;
  offset: number;
  length: number;
  deleted?: boolean;
  ts: number;
};

@Injectable()
export class DiskRepository {
  private readonly storagePath: string;
  private readonly maxNotes: number;
  // index for quick lookups
  private readonly indexPath: string;
  // notes data
  private readonly dataPath: string;

  // fsp for async file operations
  private indexHandle!: fsp.FileHandle;
  private dataHandle!: fsp.FileHandle;

  // in-memory cache for index
  private indexMap = new Map<number, IndexEntry>();
  private nextId = 1;
  private ready: Promise<void> | null = null;
  private writeMutex = new AsyncMutex();

  constructor(private readonly config: ConfigService) {
    const defaultPath = path.resolve(process.cwd(), 'storage');

    this.maxNotes = this.config.get<number>('app.maxNotes', 1000);
    this.storagePath = this.config.get<string>('app.storagePath', defaultPath);
    // index for quick lookups
    this.indexPath = path.join(this.storagePath, 'notes.index.jsonl');
    // notes data
    this.dataPath = path.join(this.storagePath, 'notes.data.jsonl');
  }

  private async init(): Promise<void> {
    await fsp.mkdir(this.storagePath, { recursive: true });

    // opens for append and read
    this.dataHandle = await fsp.open(this.dataPath, 'a+');
    this.indexHandle = await fsp.open(this.indexPath, 'a+');

    // load index into memory
    await this.loadIndexFromDisk();
  }

  private async ensureReady(): Promise<void> {
    if (!this.ready) this.ready = this.init();
    return this.ready;
  }

  private async loadIndexFromDisk(): Promise<void> {
    this.indexMap.clear();
    let maxId = 0;

    const stream = fs.createReadStream(this.indexPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const entry = JSON.parse(trimmed) as IndexEntry;
        if (typeof entry?.id !== 'number') continue;

        if (
          typeof entry.offset === 'number' &&
          typeof entry.length === 'number'
        ) {
          this.indexMap.set(entry.id, entry);
        } else if (entry.deleted === true) {
          this.indexMap.set(entry.id, entry);
        }

        if (entry.id > maxId) maxId = entry.id;
      } catch {
        console.log(`Skipping invalid index line: ${trimmed}`);
      }
    }

    this.nextId = maxId + 1;
  }

  private isDeleted(e?: IndexEntry): boolean {
    return !e || e.deleted === true;
  }

  private serializeLine(obj: unknown): { line: string; bytes: number } {
    const line = JSON.stringify(obj) + '\n';
    const bytes = Buffer.byteLength(line, 'utf8');
    return { line, bytes };
  }

  private async readAt(offset: number, length: number): Promise<string> {
    const buf = Buffer.alloc(length);
    await this.dataHandle.read(buf, 0, length, offset);
    return buf.toString('utf8');
  }

  private hydrate(line: DiskNoteLine): Note {
    return {
      id: line.id,
      title: line.title,
      text: line.text,
      createdAt: new Date(line.createdAt),
      updatedAt: new Date(line.updatedAt),
    };
  }

  private async appendNoteLocked(note: Note): Promise<void> {
    const st = await this.dataHandle.stat();
    const offset = st.size;

    const diskLine: DiskNoteLine = {
      id: note.id,
      title: note.title,
      text: note.text,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };

    const { line: dataLine, bytes: dataBytes } = this.serializeLine(diskLine);
    await this.dataHandle.write(dataLine);

    const entry: IndexEntry = {
      id: note.id,
      offset,
      length: dataBytes,
      deleted: false,
      ts: Date.now(),
    };
    const { line: indexLine } = this.serializeLine(entry);
    await this.indexHandle.write(indexLine);

    this.indexMap.set(note.id, entry);
  }

  async list(page: number): Promise<ListNotesDto> {
    try {
      await this.ensureReady();

      const perPage = 50;
      const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

      const ids = Array.from(this.indexMap.keys())
        .filter((id) => {
          const entry = this.indexMap.get(id);
          return entry && !this.isDeleted(entry);
        })
        .sort((a, b) => b - a);

      const notesCount = ids.length;
      const pages = Math.ceil(notesCount / perPage);

      const start = (safePage - 1) * perPage;
      const end = start + perPage;
      const pageIds = ids.slice(start, end);

      const notes: Note[] = [];
      for (const id of pageIds) {
        const entry = this.indexMap.get(id)!;
        const raw = await this.readAt(entry.offset, entry.length);
        const jsonLine = raw.trimEnd();
        const disk = JSON.parse(jsonLine) as DiskNoteLine;
        notes.push(this.hydrate(disk));
      }

      return { pages, notesCount, notes };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to list notes');
    }
  }

  async get(id: number): Promise<Note> {
    try {
      await this.ensureReady();

      const entry = this.indexMap.get(id);
      if (this.isDeleted(entry) || !entry?.length) {
        throw new NotFoundException('Note not found');
      }

      const raw = await this.readAt(entry.offset, entry.length);
      const jsonLine = raw.trimEnd();
      const disk = JSON.parse(jsonLine) as DiskNoteLine;

      return this.hydrate(disk);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to get note');
    }
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    try {
      await this.ensureReady();

      if (this.indexMap.size >= this.maxNotes) {
        throw new BadRequestException(
          `Maximum number of notes reached: ${this.maxNotes}`,
        );
      }

      return this.writeMutex.runExclusive(async () => {
        const id = this.nextId++;
        const now = new Date();

        const note: Note = {
          id,
          title: dto.title,
          text: dto.text,
          createdAt: now,
          updatedAt: now,
        };

        await this.appendNoteLocked(note);
        return note;
      });
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to create note');
    }
  }

  async update(id: number, patch: UpdateNoteDto): Promise<Note> {
    try {
      await this.ensureReady();

      const note = await this.get(id);
      if (!note) {
        throw new NotFoundException('Note not found');
      }

      return this.writeMutex.runExclusive(async () => {
        const current = await this.get(id);
        const updated: Note = {
          ...current,
          ...patch,
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date(),
        };

        await this.appendNoteLocked(updated);
        return updated;
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to update note');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.ensureReady();

      const note = await this.get(id);
      if (!note) {
        throw new NotFoundException('Note not found');
      }

      await this.writeMutex.runExclusive(async () => {
        const entry: IndexEntry = {
          id,
          offset: 0,
          length: 0,
          deleted: true,
          ts: Date.now(),
        };
        const { line } = this.serializeLine(entry);
        await this.indexHandle.write(line);
        this.indexMap.set(id, entry);
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to delete note');
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.ensureReady();

      await this.writeMutex.runExclusive(async () => {
        await this.dataHandle.truncate(0);
        await this.indexHandle.truncate(0);
        this.indexMap.clear();
        this.nextId = 1;
      });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to flush all notes');
    }
  }
}
