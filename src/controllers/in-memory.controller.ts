import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { InMemoryRepository } from '../repositories/in-memory.repository';
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { Note } from '../entities/note.entity';
import { ListNotesDto } from '../dto/list-notes.dto';

@ApiTags('in-memory')
@Controller('notes/mem')
export class NotesInMemoryController {
  constructor(private readonly repo: InMemoryRepository) {}

  @Get('list/:page')
  @ApiOperation({ summary: 'List up to 50 notes per page.' })
  @ApiParam({ name: 'page', type: Number, example: 1 })
  @ApiOkResponse({ type: ListNotesDto })
  list(@Param('page', ParseIntPipe) page: number): ListNotesDto {
    return this.repo.list(page ?? 1);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: Note })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  get(@Param('id', ParseIntPipe) id: number): Note {
    return this.repo.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'New note.' })
  @ApiBody({ type: CreateNoteDto })
  @ApiCreatedResponse({ type: Note })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateNoteDto): Note {
    return this.repo.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateNoteDto })
  @ApiOkResponse({ type: Note })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Note {
    return this.repo.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Note deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  delete(@Param('id', ParseIntPipe) id: number): void {
    this.repo.delete(id);
  }

  @Post('flush')
  @ApiOperation({ summary: 'Flush all notes.' })
  @ApiResponse({ status: 200, description: 'All notes flushed successfully.' })
  flush(): void {
    this.repo.flushAll();
  }
}
