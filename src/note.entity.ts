import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Note {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Shopping list' })
  title!: string;

  @ApiProperty({ example: 'Milk, eggs, bread' })
  text!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-10-16T19:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-10-16T19:30:00.000Z' })
  updatedAt!: Date;
}