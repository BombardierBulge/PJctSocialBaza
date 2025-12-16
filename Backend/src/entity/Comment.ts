import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  content!: string;

  @ManyToOne(() => User, user => user.comments)
  author!: User;

  @ManyToOne(() => Post, post => post.comments)
  post!: Post;

  @CreateDateColumn()
  createdAt!: Date;
}