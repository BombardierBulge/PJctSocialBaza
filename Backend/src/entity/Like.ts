import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  like_id!: number;

  @Column()
  user_id!: number;

  @Column()
  post_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User, user => user.likes)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Post, post => post.likes)
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}