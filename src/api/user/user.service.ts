import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './user.entity';

const query = `
  WITH RECURSIVE user_hierarchy AS (
    SELECT id, email, supervisor
    FROM users
    WHERE id = $1
    UNION
    SELECT u.id, u.email, u.supervisor
    FROM users u
    JOIN user_hierarchy h ON u.supervisor = h.id
  )
  SELECT * FROM user_hierarchy;
`;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findAllUsers(request: Request): Promise<User[] | User> {
    const token = request.headers['authorization'];
    const userId = await this.getUserIdFromToken(token);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user.role === 'admin') {
      return await this.userRepository.find();
    } else if (user.role === 'boss') {
      // return await this.userRepository.findOne({
      //   where: { id: userId },
      // relations: ['subordinates.subordinates.subordinates'],
      // });

      return await this.entityManager.query(query, [userId]);
    } else {
      return user;
    }
  }

  async changeBoss(request: Request, body: { bossId: number; userId: number }) {
    const token = request.headers['authorization'];
    const ownerId = await this.getUserIdFromToken(token);
    const owner = await this.userRepository.findOne({
      where: { id: ownerId },
    });
    const ownerSubordinates = await this.entityManager.query(query, [ownerId]);

    if (owner.role === 'admin' && owner.id !== body.userId) {
      const newSupervisor = await this.userRepository.findOne({
        where: { id: body.bossId },
      });
      const user = await this.userRepository.findOne({
        where: { id: body.userId },
      });
      user.supervisor = newSupervisor;

      newSupervisor.role = 'boss';
      await this.userRepository.save(newSupervisor);

      await this.userRepository.save(user);
      const userSubordinates = await this.entityManager.query(query, [
        body.userId,
      ]);

      if (userSubordinates.length <= 1) {
        user.role = 'user';
        await this.userRepository.save(user);
      }
      return 'Supervisor updated successfully';
    } else if (
      owner.role === 'boss' &&
      owner.id !== body.bossId &&
      owner.id !== body.userId
    ) {
      const userToUpdate = ownerSubordinates.find(
        (subordinate) => subordinate.id === body.userId,
      );
      const newSupervisor = ownerSubordinates.find(
        (subordinate) => subordinate.id === body.bossId,
      );
      if (userToUpdate && newSupervisor) {
        userToUpdate.supervisor = newSupervisor;
        await this.userRepository.save(userToUpdate);

        newSupervisor.role = 'boss';
        await this.userRepository.save(newSupervisor);

        const userSubordinates = await this.entityManager.query(query, [
          body.userId,
        ]);

        if (userSubordinates.length <= 1) {
          userToUpdate.role = 'user';
          await this.userRepository.save(userToUpdate);
        }
        return 'Supervisor updated successfully';
      } else {
        return 'Supervisor or subordinate not found';
      }
    }
    return 'You dont have permission to change boss';
  }

  async getUserIdFromToken(token: string): Promise<number> {
    try {
      const payload = this.jwtService.verify(token.split(' ')[1]);
      return payload.id;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email: email } });
  }

  async create(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
