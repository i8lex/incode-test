import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
// import mongoose from 'mongoose';

export class UserLoginResponseDTO {
  @ApiResponseProperty({ example: 1 })
  id: number;

  @ApiProperty({
    description: 'The email of the user.',
    example: 'example@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'string',
  })
  token: string;
}
