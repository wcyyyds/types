import http, { httpWithBody } from "./index";
import type { ApiResponse, UserInfo, CreateUserParams, UpdateUserParams, UserListParams, ChangePasswordParams } from "@/types";
import { tokenManager } from "@/utils";

/**
 * 获取用户列表（分页）
 * 使用 httpWithBody 以获取完整 body（含 page / total 等分页信息）
 */
export function getUserListApi(params: UserListParams): Promise<ApiResponse<UserInfo[]>> {
  return httpWithBody.get("/user/list", { params });
}

/**
 * 新增用户
 */
export function createUserApi(params: CreateUserParams): Promise<UserInfo> {
  return http.post("/user/create", params);
}

/**
 * 更新用户
 */
export function updateUserApi(params: UpdateUserParams): Promise<UserInfo> {
  return http.put("/user/update", params);
}

/**
 * 删除用户（软删除）
 */
export function deleteUserApi(id: number): Promise<void> {
  return http.delete("/user/delete", { params: { id } });
}

/**
 * 修改当前用户密码
 */
export function changePasswordApi(params: ChangePasswordParams): Promise<void> {
  return http.post("/user/change-password", params);
}

/**
 * 导出用户列表（Excel .xlsx），返回 Blob 下载
 */
export function exportUserApi(params: Partial<UserListParams>): Promise<Blob> {
  const token = tokenManager.get()
  return fetch(`${import.meta.env.VITE_API_BASE_URL}/user/export`, {
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
