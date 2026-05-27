import { SetMetadata } from '@nestjs/common';

/** 权限标识元数据 key */
export const PERMISSIONS_KEY = 'permissions';

/**
 * @RequirePermissions 装饰器
 * 声明接口所需的权限标识
 *
 * @usage
 * ```ts
 * @Delete(':id')
 * @RequirePermissions('user:delete')
 * async deleteUser(...) { ... }
 *
 * @RequirePermissions(['user:add', 'user:edit']) // 满足其一即可
 * ```
 */
export const RequirePermissions = (perms: string | string[]) =>
  SetMetadata(PERMISSIONS_KEY, Array.isArray(perms) ? perms : [perms]);
