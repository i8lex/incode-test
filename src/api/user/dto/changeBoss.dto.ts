import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeBossDTO {
  @ApiProperty({ example: 2, description: 'Boss ID' })
  @IsNumber()
  @IsNotEmpty()
  bossId: number;

  @ApiProperty({ example: 4, description: 'User ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
