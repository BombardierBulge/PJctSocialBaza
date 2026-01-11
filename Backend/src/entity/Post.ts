import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { Comment } from './Comment';
import { Like } from './Like';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn({ name: 'post_id' })
  post_id!: number;

  @Column()
  user_id!: number;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  image_url?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Comment, comment => comment.post)
  comments!: Comment[];

  @OneToMany(() => Like, like => like.post)
  likes!: Like[];
}