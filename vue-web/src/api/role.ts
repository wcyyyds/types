import http, { httpWithBody } from "./index";
import type { ApiResponse, RoleInfo, CreateRoleParams, UpdateRoleParams, RoleListParams } from "@/types";
import { tokenManager } from "@/utils";

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
 * 导出角色列表（Excel .xlsx），返回 Blob 下载
 */
export function exportRoleApi(params: Partial<RoleListParams>): Promise<Blob> {
  const token = tokenManager.get()
  return fetch(`${import.meta.env.VITE_API_BASE_URL}/role/export`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  }).then((res) => {
    if (!res.ok) throw new Error('导出失败')
    return res.blob()
  })
}
