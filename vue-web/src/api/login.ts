import http from "./index";
import type { LoginParams, LoginResult, LogoutParams, ForceLogoutParams } from "@/types";

/**
 * 登录
 * @param params 用户名 + 密码
 * @returns 用户信息 + accessToken
 */
export function loginApi(params: LoginParams): Promise<LoginResult> {
  return http.post("/auth/login", params);
}

/**
 * 正常登出（携带 token，仅清除当前 token）
 */
export function logoutApi(params?: LogoutParams): Promise<void> {
  return http.post("/auth/logout", params);
}

/**
 * 强制登出（无需 token，通过 userId 清除所有服务端数据）
 * @param params 包含 userId
 */
export function forceLogoutApi(params: ForceLogoutParams): Promise<void> {
  return http.post("/auth/logout/force", params);
}
