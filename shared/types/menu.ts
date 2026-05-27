import type { TableParams } from ".";

/** 菜单类型 */
export type MenuType = 1 | 2 | 3;

/** 菜单类型常量 */
export const MenuTypeConst = {
  DIRECTORY: 1 as const,
  MENU: 2 as const,
  BUTTON: 3 as const,
} as const;

/** 菜单类型标签映射 */
export const MenuTypeLabel: Record<MenuType, string> = {
  [MenuTypeConst.DIRECTORY]: '目录',
  [MenuTypeConst.MENU]: '菜单',
  [MenuTypeConst.BUTTON]: '按钮',
};

/** 菜单信息 */
export interface MenuInfo extends TableParams {
  id?: number;
  parentId: number;
  title: string;
  type: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sort: number;
  isActive: boolean;
  remark?: string;
  /** 子节点（树形结构） */
  children?: MenuInfo[];
}

/** 创建菜单参数 */
export interface CreateMenuParams {
  parentId?: number;
  title: string;
  type: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sort?: number;
  isActive?: boolean;
  remark?: string;
}

/** 更新菜单参数 */
export interface UpdateMenuParams extends CreateMenuParams {
  id: number;
}

/** 菜单树查询参数 */
export interface MenuListParams {
  title?: string;
  isActive?: boolean;
}

/** 用户登录后返回的权限数据 */
export interface UserPermission {
  roles: string[];
  menus: MenuInfo[];
  perms: string[];
}
