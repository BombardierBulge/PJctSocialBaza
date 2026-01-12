import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('user_passwords')
export class UserPassword {

    @PrimaryGeneratedColumn() 
    id!: number;

    @Column() 
    user_id!: number; 

    @Column()
    password_hash!: string;
}