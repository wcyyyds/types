/** 登录请求参数 */
export interface LoginParams {
  userName: string;
  passWord: string;
}

/** 登出参数 */
export interface LogoutParams {
  userId: number;
  token?: string;
}

/** 强制登出参数 */
export interface ForceLogoutParams {
  userId: number;
}
