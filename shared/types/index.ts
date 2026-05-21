// ============================================================
// 前后端共享类型定义 - 入口文件
// 此文件由前后端共同引用，保持单一事实来源（Single Source of Truth）
// ============================================================

/** 通用 API 响应包装 */
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
  page?: number;
  pageSize?: number;
  total?: number
}

export interface ApiResponsePage<T = unknown> {
  data?: T;
  page?: number;
  pageSize?: number;
  total?: number
}

/** 通用 table 通用字段包装 */
export interface TableParams {
  createUser?: number;
  createUserName?: string;
  createTime?: string;
  deleteUser?: number;
  deleteUserName?: string;
  deleteTime?: string;
  lastModifier?: number;
  lastModifierName?: string;
  lastModified?: string;
}
