import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RedisService } from '../../modules/redis/redis.service';

/**
 * 权限守卫
 * 从 Redis 中读取用户的权限列表，与接口上 @RequirePermissions 声明的权限比对
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取接口上声明的所需权限
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 没有声明权限要求 → 放行
    if (!requiredPerms || requiredPerms.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('未认证');
    }

    try {
      // 从 Redis 读取用户权限
      const permsJson = await this.redisService.get(`perms:${userId}`);
      if (!permsJson) {
        throw new ForbiddenException('无权限访问');
      }

      const userPerms: string[] = JSON.parse(permsJson);

      // 检查是否有所需的任一权限
      const hasPermission = requiredPerms.some((p) => userPerms.includes(p));
      if (!hasPermission) {
        throw new ForbiddenException('无权限执行此操作');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('权限验证失败');
    }
  }
}
