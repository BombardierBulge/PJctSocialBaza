import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('user_passwords')
export class UserPassword {
  @PrimaryColumn()
  user_id!: number;

  @Column()
  password_hash!: string;
}