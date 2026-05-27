import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity('sys_user_roles')
export class UserRole {
  @PrimaryColumn()
  userId!: number;

  @PrimaryColumn()
  roleId!: number;
}
