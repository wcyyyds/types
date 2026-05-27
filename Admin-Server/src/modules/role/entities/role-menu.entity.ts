import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity('sys_role_menus')
export class RoleMenu {
  @PrimaryColumn()
  roleId!: number;

  @PrimaryColumn()
  menuId!: number;
}
