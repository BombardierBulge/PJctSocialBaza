import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './Post';
import { Comment } from './Comment';
import { Like } from './Like';

@Entity('users')
export class User {
  @PrimaryColumn()
  user_id!: number;

  @Column()
  username!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  is_admin?: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Post, post => post.user)
  posts!: Post[];

  @OneToMany(() => Comment, comment => comment.user)
  comments!: Comment[];

  @OneToMany(() => Like, like => like.user)
  likes!: Like[];
}