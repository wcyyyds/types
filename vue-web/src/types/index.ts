// 从共享类型包中重新导出，保持前端 @/types 引用不变
export type { ApiResponse } from '@shared/types'
export type { LoginParams, LogoutParams, ForceLogoutParams } from '@shared/types/auth'
export type {
  UserInfo,
  CreateUserParams,
  UpdateUserParams,
  UserListParams,
  ChangePasswordParams,
} from '@shared/types/user'
/** 主题模式 */
export type ThemeMode = 'light' | 'dark'
