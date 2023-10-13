import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'boss', 'user'],
  })
  role: 'admin' | 'boss' | 'user';

  @ManyToOne(() => User, (user) => user.subordinates, {
    nullable: true,
  })
  @JoinColumn({ name: 'supervisor' })
  supervisor: User | null;

  @OneToMany(() => User, (user) => user.supervisor, {})
  subordinates: User[] | null;
}
