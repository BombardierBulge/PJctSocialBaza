import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Post } from './Post';
import { Comment } from './Comment';
import { Like } from './Like';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];

  @OneToMany(() => Comment, comment => comment.author)
  comments!: Comment[];

  @OneToMany(() => Like, like => like.user)
  likes!: Like[];

  @CreateDateColumn()
  createdAt!: Date;
}