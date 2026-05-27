import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { MenuService } from '../menu/menu.service';
import { RedisService } from "../redis/redis.service";
import { LoginDto } from "./dto/login.dto";
import type { LoginParams, LogoutParams, ForceLogoutParams } from "@shared/types/auth";
import type { UserInfo } from '@shared/types/user';

/** Token 过期时间（秒），默认 7 天 */
const TOKEN_TTL = 7 * 24 * 60 * 60;
/** 用户 Token 索引 Key 前缀 */
const USER_TOKENS_PREFIX = 'user_tokens:';
/** Token Key 前缀 */
const TOKEN_PREFIX = 'token:';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private menuService: MenuService,
    private redisService: RedisService
  ) {}

  /**
   * 登录
   */
  async login(loginDto: LoginDto): Promise<UserInfo> {
    if (loginDto.userName && loginDto.passWord) {
      return this.loginWithPassword(loginDto);
    } else {
      throw new BadRequestException("请提供用户名密码");
    }
  }

  /**
   * 账号密码登录
   */
  private async loginWithPassword(
    { userName, passWord }: LoginParams
  ): Promise<UserInfo> {
    try {
      const user = await this.userService.findByUserName(userName);

      if (!user || !(await bcrypt.compare(passWord, user.passWord))) {
        throw new BadRequestException("用户名或密码错误");
      }

      if (!user.isActive) {
        throw new BadRequestException("账户已被禁用，请联系管理员");
      }

      return await this.generateTokenResponse(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("登录失败，请稍后重试");
    }
  }

  /**
   * 生成令牌响应
   *
   * Key 设计（O(1) 查询，无需 SCAN）：
   *   - token:{accessToken} → Hash(userId, userName, email)   ← 直接 GET 验证
   *   - user_tokens:{userId} → Set[accessToken1, ...]         ← 用户索引，用于单点登录/强制登出
   */
  private async generateTokenResponse(user: any): Promise<UserInfo> {
    const accessToken = `tok_${randomUUID().replace(/-/g, '')}`;
    const tokenKey = `${TOKEN_PREFIX}${accessToken}`;
    const userTokensKey = `${USER_TOKENS_PREFIX}${user.id}`;

    // 1. 先清除该用户的所有旧 token，确保同一账号只有一个有效 token
    try {
      const oldTokens = await this.redisService.smembers(userTokensKey);
      if (oldTokens.length > 0) {
        const oldTokenKeys = oldTokens.map(t => `${TOKEN_PREFIX}${t}`);
        await this.redisService.delMany(...oldTokenKeys);
        await this.redisService.del(userTokensKey);
        console.log(`已清除用户 ${user.id} 的 ${oldTokens.length} 个旧 token`);
      }
    } catch (err) {
      console.warn('清除旧 token 失败，不影响登录:', (err as Error).message);
    }

    // 2. 写入新 token（Hash 结构）— O(1) 写入
    try {
      await this.redisService.hset(tokenKey, {
        userId: String(user.id),
        userName: user.userName,
        email: user.email || '',
      });
      await this.redisService.expire(tokenKey, TOKEN_TTL);

      // 3. 将 token 加入用户索引 Set，同样设置过期时间
      await this.redisService.sadd(userTokensKey, accessToken);
      await this.redisService.expire(userTokensKey, TOKEN_TTL);
    } catch (err) {
      console.error('Redis 写入 token 失败，登录失败:', (err as Error).message);
      throw new BadRequestException('登录失败，认证服务异常');
    }

    return await this.buildLoginResponse(user, accessToken);
  }

  /**
   * 生成登录响应（含角色、权限、菜单树）
   * 同时将权限列表缓存到 Redis（供 PermissionsGuard 使用）
   */
  private async buildLoginResponse(user: any, accessToken: string): Promise<UserInfo> {
    const roles = await this.roleService.getUserRoleCodes(user.id);
    const perms = await this.roleService.getUserPerms(user.id);
    const flatMenus = await this.roleService.getUserMenus(user.id);
    const menus = MenuService.buildTree(flatMenus);

    // 将权限列表缓存到 Redis，供 PermissionsGuard 鉴权
    try {
      await this.redisService.set(`perms:${user.id}`, JSON.stringify(perms), TOKEN_TTL);
    } catch (err) {
      console.warn('缓存权限列表到 Redis 失败:', (err as Error).message);
    }

    return {
      ...user,
      accessToken,
      roles,
      perms,
      menus,
    };
  }

  /**
   * 登出（带 token 时只清除当前 token）
   */
  async logout(params: LogoutParams): Promise<void> {
    const { userId, token } = params;
    try {
      if (token) {
        // 直接删除 token key — O(1)
        await this.redisService.del(`${TOKEN_PREFIX}${token}`);
        // 从用户索引 Set 中移除
        await this.redisService.srem(`${USER_TOKENS_PREFIX}${userId}`, token);
        console.log(`Token 已从 Redis 移除，用户 ${userId} 登出成功`);
        return;
      }

      await this.clearUserAllData(userId);
    } catch (error) {
      console.error('登出时清理 Redis 失败:', error);
    }
  }

  /**
   * 验证 token — O(1) 直接查询，不再 SCAN 遍历
   */
  async validateToken(token: string): Promise<{ sub: number; userName: string; email?: string } | null> {
    try {
      const tokenKey = `${TOKEN_PREFIX}${token}`;
      const data = await this.redisService.hgetall(tokenKey);
      if (data && data.userId) {
        return {
          sub: Number(data.userId),
          userName: data.userName,
          email: data.email,
        };
      }
      return null;
    } catch (error) {
      console.error('验证 token 失败:', error);
      return null;
    }
  }

  /**
   * 强制登出
   */
  async forceLogout(params: ForceLogoutParams): Promise<void> {
    await this.clearUserAllData(params.userId);
  }

  /**
   * 清除用户在 Redis 中的所有数据
   * 通过 user_tokens Set 索引直接获取所有 token，无需 KEYS 遍历
   */
  private async clearUserAllData(userId: number): Promise<void> {
    const userTokensKey = `${USER_TOKENS_PREFIX}${userId}`;

    try {
      // 从 Set 索引获取该用户所有 token — O(1)
      const tokens = await this.redisService.smembers(userTokensKey);
      if (tokens.length > 0) {
        const tokenKeys = tokens.map(t => `${TOKEN_PREFIX}${t}`);
        await this.redisService.delMany(...tokenKeys);
        console.log(`已清除用户 ${userId} 的 ${tokens.length} 个 token`);
      }

      // 删除用户索引 Set
      await this.redisService.del(userTokensKey);

      // 同时清理旧的 short_token 数据（兼容旧数据）
      const shortTokenKeys = await this.redisService.keys(`short_token:${userId}:*`);
      if (shortTokenKeys.length > 0) {
        await this.redisService.delMany(...shortTokenKeys);
      }

      // 清理缓存
      const cacheKeys = await this.redisService.keys(`user:${userId}:*`);
      if (cacheKeys.length > 0) {
        await this.redisService.delMany(...cacheKeys);
      }
    } catch (err) {
      console.error(`清除用户 ${userId} 数据失败:`, (err as Error).message);
    }
  }
}
