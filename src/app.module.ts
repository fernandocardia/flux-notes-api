import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { NotesController } from './notes.controller';
import { NotesRepository } from './notes.repository';

@Module({
  imports: [],
  controllers: [NotesController],
  providers: [NotesRepository],
})
export class AppModule {}
