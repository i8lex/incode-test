import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @Prop({ required: true, unique: true })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Password123', description: 'User password' })
  password: string;

  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @ApiProperty({ example: 'Joe354', description: 'User nickname' })
  username: string;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  @ApiProperty({
    example: ['user-id-1', 'user-id-2'],
    description: 'Array of User IDs',
  })
  subordinates: Types.ObjectId[];

  @Prop({ default: 'user' })
  @ApiProperty({ example: 'user', description: 'Is role of user' })
  role: 'admin' | 'boss' | 'user';
}
export const UserSchema = SchemaFactory.createForClass(User);
