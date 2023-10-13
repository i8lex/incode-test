import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/api/user/user.service';
import { LoginUserDTO } from './dto/login.dto';
import { UserLoginResponseDTO } from './dto/userLoginResponse.dto';
import { RegisterUserDTO } from './dto/register.dto';
import { UserRegisterResponseDTO } from './dto/userRegisterResponse.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}
  async register(
    cred: RegisterUserDTO,
    userId,
  ): Promise<UserRegisterResponseDTO> {
    const { email, password } = cred;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    const users = await this.userRepository.find();
    const existingEmail = await this.userService.findUserByEmail(email);

    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }
    if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one digit, one lowercase and one uppercase letter, and be at least 8 characters long',
      );
    }
    const admin = await this.userRepository.findOne({
      where: { role: 'admin' },
    });
    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = {
      id: null,
      subordinates: null,
      supervisor: userId ? userId : users.length === 0 ? null : admin.id,
      role: users.length === 0 ? 'admin' : 'user',
      email,
      password: hashedPassword,
    };
    await this.userService.create(user);

    if (userId) {
      await this.entityManager.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['boss', userId],
      );
    } else if (!userId && users.length > 0) {
      await this.entityManager.query(
        'UPDATE users SET supervisor = $1 WHERE supervisor IN (SELECT id FROM users WHERE role = $2)',
        [admin.id, 'admin'],
      );
    }
    return {
      email: user.email,
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
      const token = this.jwtService.sign({ id: user.id }, { expiresIn: '24h' });
      return {
        id: user.id,
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
