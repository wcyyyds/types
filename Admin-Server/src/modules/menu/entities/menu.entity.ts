import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('sys_menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 0 })
  parentId!: number;

  @Column({ length: 50 })
  title!: string;

  @Column()
  type!: number; // 1:目录 2:菜单 3:按钮

  @Column({ length: 200, nullable: true })
  path?: string;

  @Column({ length: 200, nullable: true })
  component?: string;

  @Column({ length: 100, nullable: true })
  perms?: string;

  @Column({ length: 100, nullable: true })
  icon?: string;

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
