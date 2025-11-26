import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesRepository {
  private readonly items = new Map<number, Note>();
  private nextId = 1;

  list(): Note[] {
    return Array.from(this.items.values());
  }

  get(id: number): Note {
    const n = this.items.get(id);
    if (!n) throw new NotFoundException('Note not found');
    return n;
  }

  create(dto: CreateNoteDto): Note {
    const now = new Date();
    const note: Note = {
      id: this.nextId++,
      title: dto.title,
      text: dto.text,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(note.id, note);
    return note;
  }

  update(id: number, dto: UpdateNoteDto): Note {
    const prev = this.get(id);
    const updated: Note = {
      ...prev,
      ...dto,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  delete(id: number): void {
    if (!this.items.delete(id)) throw new NotFoundException('Note not found');
  }

}