import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { User } from '../user/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/api/user/user.service';
import { LoginUserDTO } from './dto/login.dto';
import { UserLoginResponseDTO } from './dto/userLoginResponse.dto';
import { RegisterUserDTO } from './dto/register.dto';
import { UserRegisterResponseDTO } from './dto/userRegisterResponse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async register(
    cred: RegisterUserDTO,
    userId,
  ): Promise<UserRegisterResponseDTO> {
    const { username, email, password } = cred;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    const users = await this.userModel.find().exec();

    const existingEmail = await this.userService.findUserByEmail(email);
    const existingUsername = await this.userService.findUserByName(username);

    if (existingUsername) {
      throw new BadRequestException('User with this name already exists');
    }
    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }
    if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one digit, one lowercase and one uppercase letter, and be at least 8 characters long',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      role: users.length === 0 ? 'admin' : 'user',
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    if (userId) {
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        { role: 'boss', $push: { subordinates: newUser._id } },
      );
    } else if (!userId && users.length > 0) {
      await this.userModel.findOneAndUpdate(
        { role: 'admin' },
        { $push: { subordinates: newUser._id } },
      );
    }
    return {
      username,
      email: newUser.email,
      message: 'User successfully registered',
    };
  }
  async login(cred: LoginUserDTO): Promise<UserLoginResponseDTO | Error> {
    const user = await this.validateUser(cred.email, cred.password);
    if (!user) {
      throw new HttpException(
        'Wrong email or password',
        HttpStatus.UNAUTHORIZED,
      );
    } else {
      const token = this.jwtService.sign(
        { id: user._id },
        { expiresIn: '24h' },
      );
      return {
        _id: user._id,
        email: user.email,
        token: token,
      };
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new HttpException(
        'Wrong email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const passwordIsMatch = await bcrypt.compare(password, user.password);

    if (user && passwordIsMatch) {
      return user;
    }

    throw new HttpException('Wrong email or password', HttpStatus.UNAUTHORIZED);
  }
}
