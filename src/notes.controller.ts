// src/notes/notes.controller.ts
import {
  Controller, Get, Post, Body, Param, ParseIntPipe, Patch, Delete,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse,
  ApiBadRequestResponse, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { NotesRepository } from './notes.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './note.entity';

@ApiTags('notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly repo: NotesRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all notes.' })
  @ApiOkResponse({ type: Note, isArray: true })
  list(): Note[] {
    return this.repo.list();
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoteDto): Note {
    return this.repo.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    this.repo.delete(id);
    return { ok: true };
  }
}
