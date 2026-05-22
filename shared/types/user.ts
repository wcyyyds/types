import type { TableParams } from ".";

/** 用户详情 */
export interface UserInfo extends TableParams {
  id?: number;
  userName: string;
  passWord?: string;
  email: string;
  phone: string;
  isActive: boolean;
  accessToken?: string;
}

/** 创建用户参数 */
export interface CreateUserParams {
  userName: string
  passWord?: string
  email?: string
  phone?: string
  isActive?: boolean
}

/** 更新用户参数 */
export interface UpdateUserParams extends CreateUserParams {
  id: number
}

/** 用户列表查询参数 */
export interface UserListParams {
  page?: number
  pageSize?: number
  userName?: string
  isActive?: boolean
  createTimeStart?: string
  createTimeEnd?: string
}

/** 修改密码参数 */
export interface ChangePasswordParams {
  userId: number
  oldPassword: string
  newPassword: string
}

/** 创建用户参数（服务层，含操作人） */
export interface CreateUserServiceParams extends CreateUserParams {
  operatorId: number
}

/** 更新用户参数（服务层，含操作人） */
export interface UpdateUserServiceParams extends UpdateUserParams {
  operatorId: number
}
