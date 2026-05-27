import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('sys_roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  roleName!: string;

  @Column({ length: 50, unique: true })
  roleCode!: string;

  @Column({ default: 0 })
  sort!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ length: 500, nullable: true })
  remark?: string;

  @Column({ nullable: true })
  createUser?: number;

  @CreateDateColumn()
  createTime!: Date;

  @Column({ nullable: true })
  lastModifier?: number;

  @UpdateDateColumn()
  lastModified!: Date;

  @Column({ nullable: true })
  deleteUser?: number;

  @Column({ nullable: true })
  deleteTime?: Date;
}
