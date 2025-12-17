import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryColumn, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('follows')
export class Follow {
  @PrimaryColumn()
  follower_id!: number;

  @PrimaryColumn()
  followed_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followed_id' })
  followed!: User;
}