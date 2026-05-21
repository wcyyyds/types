import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  userName: string;

  @Column({ length: 255 })
  passWord: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createUser: number;

  @CreateDateColumn()
  createTime: Date;

  @Column({ nullable: true })
  deleteUser: number;

  @Column({ nullable: true })
  deleteTime: Date;

  @Column({ nullable: true })
  lastModifier: number;

  @UpdateDateColumn()
  lastModified: Date;
}
