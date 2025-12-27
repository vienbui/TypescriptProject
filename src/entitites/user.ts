import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Lesson } from "./lesson";


@Entity({
    name: "USERS"
})
export class User {

    @PrimaryGeneratedColumn()
    id: number;

     @Column()
    email:string;

     @Column()
    passwordHash:string;

     @Column()
    passwordSalt:string;

     @Column()
    pictureUrl: string;

     @Column()
    isAdmin:boolean

     @CreateDateColumn()
    createdAt:Date;

    @UpdateDateColumn()
    lastUpdatedAt:Date
}
