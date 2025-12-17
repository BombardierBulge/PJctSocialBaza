import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_profile')
export class UserProfile {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'userId' })
  userId!: number;

  @Column({ name: 'avatarUrl', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'website', nullable: true })
  website?: string;

  @Column({ name: 'bio', nullable: true })
  bio?: string;

  @Column({ name: 'location', nullable: true })
  location?: string;

}