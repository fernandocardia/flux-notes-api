import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ maxLength: 120, example: 'Dinner ideas' })
  @IsString()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Steak, pasta, burguer, salad and wine!' })
  @IsString()
  text!: string;
}