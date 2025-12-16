import { Module } from '@nestjs/common';
import { NotesInMemoryController } from './controllers/in-memory.controller';
import { InMemoryRepository } from './repositories/in-memory.repository';
import { NotesDiskController } from './controllers/disk.controller';
import { DiskRepository } from './repositories/disk.repository';
import { ConfigModule } from '@nestjs/config';
import appConfig from './app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
  ],
  controllers: [NotesDiskController, NotesInMemoryController],
  providers: [DiskRepository, InMemoryRepository],
})
export class AppModule {}
