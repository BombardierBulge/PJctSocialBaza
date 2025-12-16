import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity()
@Unique(['user', 'post'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.likes)
  user!: User;

  @ManyToOne(() => Post, post => post.likes)
  post!: Post;

  @CreateDateColumn()
  createdAt!: Date;
}