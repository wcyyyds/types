import type { TableParams } from ".";

/** 角色信息 */
export interface RoleInfo extends TableParams {
  id?: number;
  roleName: string;
  roleCode: string;
  sort: number;
  isActive: boolean;
  remark?: string;
}

/** 创建角色参数 */
export interface CreateRoleParams {
  roleName: string;
  roleCode: string;
  sort?: number;
  isActive?: boolean;
  remark?: string;
}

/** 更新角色参数 */
export interface UpdateRoleParams extends CreateRoleParams {
  id: number;
}

/** 角色列表查询参数 */
export interface RoleListParams {
  page?: number;
  pageSize?: number;
  roleName?: string;
  roleCode?: string;
  isActive?: boolean;
  createTimeStart?: string;
  createTimeEnd?: string;
}
