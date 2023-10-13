import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/api/auth/guards/jwt-auth.guard';
import { User } from './user.entity';
import { ChangeBossDTO } from './dto/changeBoss.dto';
import { UserLoginResponseDTO } from '../auth/dto/userLoginResponse.dto';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'OK', type: User })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(@Request() request): Promise<User[] | User> {
    return this.userService.findAllUsers(request);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user boss' })
  @ApiResponse({ status: 200, description: 'OK', type: User })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async changeBoss(
    @Request() request,
    @Body() body: ChangeBossDTO,
  ): Promise<string | Error> {
    return this.userService.changeBoss(request, body);
  }
}
