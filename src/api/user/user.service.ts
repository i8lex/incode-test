import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserDTO } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async findAllUsers(request: Request): Promise<User[]> {
    const token = request.headers['authorization'];
    const userId = await this.getUserIdFromToken(token);
    const currentUser = await this.userModel.findById(userId).exec();
    return await this.userModel
      .find({
        _id: { $ne: userId },
        isConfirmed: true,
      })
      .exec();
  }

  async getUserIdFromToken(token: string): Promise<Types.ObjectId> {
    try {
      const payload = this.jwtService.verify(token.split(' ')[1]);
      return new Types.ObjectId(payload.id);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async findUserByName(name: string): Promise<User | null> {
    return this.userModel.findOne({ name }).exec();
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
  async findUserByRole(role: string): Promise<User | null> {
    return this.userModel.findOne({ role }).exec();
  }
}
