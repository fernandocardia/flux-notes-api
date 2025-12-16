import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Note } from '../entities/note.entity';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { ListNotesDto } from '../dto/list-notes.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InMemoryRepository {
  private readonly maxNotes: number;
  private readonly notes = new Map<number, Note>();
  private nextId = 1;

  constructor(private readonly config: ConfigService) {
    this.maxNotes = this.config.get<number>('app.maxNotes', 1000);
  }

  list(page: number): ListNotesDto {
    try {
      const ids = Array.from(this.notes.keys()).sort((a, b) => b - a);

      const out: Note[] = [];
      for (const id of ids) {
        const note = this.notes.get(id)!;
        out.push(note);
      }

      return {
        pages: Math.ceil(out.length / 50),
        notesCount: out.length,
        notes: out.slice((page - 1) * 50, page * 50),
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to list notes');
    }
  }

  get(id: number): Note {
    const n = this.notes.get(id);
    if (!n) throw new NotFoundException('Note not found');
    return n;
  }

  create(dto: CreateNoteDto): Note {
    try {
      if (this.notes.size >= this.maxNotes) {
        throw new BadRequestException(
          `Maximum number of notes reached: ${this.maxNotes}`,
        );
      }
      const now = new Date();
      const note: Note = {
        id: this.nextId++,
        title: dto.title,
        text: dto.text,
        createdAt: now,
        updatedAt: now,
      };
      this.notes.set(note.id, note);
      return note;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to create note');
    }
  }

  update(id: number, dto: UpdateNoteDto): Note {
    try {
      const prev = this.get(id);

      const updated: Note = {
        ...prev,
        title: dto.title ?? prev.title,
        text: dto.text ?? prev.text,
        updatedAt: new Date(),
      };
      this.notes.set(id, updated);
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error(err);
      throw new InternalServerErrorException('Failed to update note');
    }
  }

  delete(id: number): void {
    if (!this.notes.delete(id)) {
      throw new NotFoundException('Note not found');
    }
  }

  flushAll(): void {
    try {
      this.notes.clear();
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to flush all notes');
    }
  }
}
