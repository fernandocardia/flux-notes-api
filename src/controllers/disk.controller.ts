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
import { CreateNoteDto } from '../dto/create-note.dto';
import { UpdateNoteDto } from '../dto/update-note.dto';
import { Note } from '../entities/note.entity';
import { DiskRepository } from '../repositories/disk.repository';
import { ListNotesDto } from '../dto/list-notes.dto';

@ApiTags('disk')
@Controller('notes/disk')
export class NotesDiskController {
  constructor(private readonly repo: DiskRepository) {}

  @Get('list/:page')
  @ApiOperation({ summary: 'List up to 50 notes per page.' })
  @ApiParam({ name: 'page', type: Number, example: 1 })
  @ApiOkResponse({ type: ListNotesDto })
  async list(@Param('page', ParseIntPipe) page: number): Promise<ListNotesDto> {
    return await this.repo.list(page ?? 1);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by id.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: Note })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  async get(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return await this.repo.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'New note.' })
  @ApiBody({ type: CreateNoteDto })
  @ApiCreatedResponse({ type: Note })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: CreateNoteDto): Promise<Note> {
    return await this.repo.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateNoteDto })
  @ApiOkResponse({ type: Note })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Promise<Note> {
    return await this.repo.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Note deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Note not found.' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.repo.delete(id);
  }

  @Post('flush')
  @ApiOperation({ summary: 'Flush all notes.' })
  @ApiResponse({ status: 200, description: 'All notes flushed successfully.' })
  async flush(): Promise<void> {
    await this.repo.flushAll();
  }
}
