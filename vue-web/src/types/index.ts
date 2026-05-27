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
export type {
  RoleInfo,
  CreateRoleParams,
  UpdateRoleParams,
  RoleListParams,
} from '@shared/types/role'
export type { MenuInfo, CreateMenuParams, UpdateMenuParams, MenuType, MenuTypeLabel } from '@shared/types/menu'
export { MenuTypeConst } from '@shared/types/menu'
/** 主题模式 */
export type ThemeMode = 'light' | 'dark'
