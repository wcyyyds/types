import http, { httpWithBody } from "./index";
import type { ApiResponse, RoleInfo, CreateRoleParams, UpdateRoleParams, RoleListParams } from "@/types";

/**
 * 获取角色列表（分页）
 */
export function getRoleListApi(params: RoleListParams): Promise<ApiResponse<RoleInfo[]>> {
  return httpWithBody.get("/role/list", { params });
}

/**
 * 新增角色
 */
export function createRoleApi(params: CreateRoleParams): Promise<RoleInfo> {
  return http.post("/role/create", params);
}

/**
 * 更新角色
 */
export function updateRoleApi(params: UpdateRoleParams): Promise<RoleInfo> {
  return http.put("/role/update", params);
}

/**
 * 删除角色（软删除）
 */
export function deleteRoleApi(id: number): Promise<void> {
  return http.delete("/role/delete", { params: { id } });
}

/**
 * 获取用户已分配的角色 ID 列表
 */
export function getUserRoleIdsApi(userId: number): Promise<number[]> {
  return http.get('/role/user-roles', { params: { userId } })
}

/**
 * 分配用户角色
 */
export function assignUserRolesApi(userId: number, roleIds: number[]): Promise<void> {
  return http.post('/role/user-roles', { userId, roleIds })
}

/**
 * 获取角色已分配的菜单 ID 列表
 */
export function getRoleMenuIdsApi(roleId: number): Promise<number[]> {
  return http.get('/role/role-menus', { params: { roleId } })
}

/**
 * 分配角色菜单
 */
export function assignRoleMenusApi(roleId: number, menuIds: number[]): Promise<void> {
  return http.post('/role/role-menus', { roleId, menuIds })
}
