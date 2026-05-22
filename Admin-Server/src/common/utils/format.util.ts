import * as dayjs from 'dayjs';
import type { UserService } from '../../user/user.service';

// ============================================================
// 日期格式化
// ============================================================

/** 需要格式化的日期字段列表 */
const DATE_FIELDS = ['createTime', 'deleteTime', 'lastModified'] as const;

/** 需要翻译的用户 ID 字段列表 */
const USER_FIELDS = ['createUser', 'deleteUser', 'lastModifier'] as const;

/** 对应的用户名字段 */
const USER_NAME_MAP: Record<string, string> = {
  createUser: 'createUserName',
  deleteUser: 'deleteUserName',
  lastModifier: 'lastModifierName',
};

/**
 * 格式化对象中的日期字段（createTime / deleteTime / lastModified）
 * 将 Date 转为 "YYYY-MM-DD HH:mm:ss" 格式
 */
export function formatDateFields<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = { ...obj };
  for (const field of DATE_FIELDS) {
    if (result[field] instanceof Date) {
      result[field] = dayjs(result[field]).format('YYYY-MM-DD HH:mm:ss');
    }
  }
  return result as T;
}

/**
 * 翻译对象中的用户 ID 字段（createUser / deleteUser / lastModifier）
 * 从 userMap 中查找对应的用户名，填充到对应的 *Name 字段
 */
export function translateUserFields<T extends Record<string, any>>(
  obj: T,
  userMap: Map<number, string>,
): T {
  const result: Record<string, any> = { ...obj };
  for (const field of USER_FIELDS) {
    const userId = result[field];
    const nameField = USER_NAME_MAP[field];
    if (userId != null && nameField && userMap.has(userId)) {
      result[nameField] = userMap.get(userId);
    }
  }
  return result as T;
}

/**
 * 构建用户 ID → 用户名的 Map
 * 从已查询到的列表数据中提取所有用户 ID，批量查询并返回 Map
 */
export async function buildUserMap(
  list: Array<Record<string, any>>,
  userService: UserService,
): Promise<Map<number, string>> {
  const ids = new Set<number>();
  for (const item of list) {
    for (const field of USER_FIELDS) {
      const id = item[field];
      if (id != null) ids.add(id);
    }
  }

  const map = new Map<number, string>();
  if (ids.size === 0) return map;

  // 批量查询所有用户
  const userIds = Array.from(ids);
  const userMap = await Promise.all(
    userIds.map(async (id) => {
      const name = await userService.getUserNameById(id);
      return { id, name };
    }),
  );

  for (const { id, name } of userMap) {
    if (name) map.set(id, name);
  }

  return map;
}

/**
 * 对列表中的每一项执行 formatDateFields + translateUserFields
 */
export function formatList<T extends Record<string, any>>(
  list: T[],
  userMap: Map<number, string>,
): T[] {
  return list.map((item) => {
    let result = formatDateFields(item);
    result = translateUserFields(result, userMap);
    return result;
  });
}
