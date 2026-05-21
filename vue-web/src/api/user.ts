import http from "./index";
import type { UserInfo, UserListResult, CreateUserParams, UpdateUserParams, UserListParams, ChangePasswordParams } from "@/types";

/**
 * 获取用户列表（分页）
 */
export function getUserListApi(params: UserListParams): Promise<UserListResult> {
  return http.get("/user/list", { params });
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
