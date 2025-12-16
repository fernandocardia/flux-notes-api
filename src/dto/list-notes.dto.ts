import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../entities/note.entity';

export class ListNotesDto {
  @ApiProperty({ example: 3, description: 'Total number of pages available.' })
  pages!: number;

  @ApiProperty({
    example: 125,
    description: 'Total number of notes available.',
  })
  notesCount!: number;

  @ApiProperty({
    type: [Note],
    description: 'Array of notes for the requested page.',
  })
  notes!: Note[];
}
