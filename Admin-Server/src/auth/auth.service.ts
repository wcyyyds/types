import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { UserService } from "../user/user.service";
import { RedisService } from "../redis/redis.service";
import { LoginDto } from "./dto/login.dto";
import type { LoginParams, LogoutParams, ForceLogoutParams } from "@shared/types/auth";
import type { UserInfo } from '@shared/types/user';
/** Token 过期时间（秒），默认 7 天 */
const TOKEN_TTL = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
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
      // 查找用户（支持用户名或邮箱）
      const user = await this.userService.findByUserName(userName);

      if (!user || !(await bcrypt.compare(passWord, user.passWord))) {
        throw new BadRequestException("用户名或密码错误");
      }

      // 检查用户是否被禁用
      if (!user.isActive) {
        throw new BadRequestException("账户已被禁用，请联系管理员");
      }

      // 生成token
      return await this.generateTokenResponse(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("登录失败，请稍后重试");
    }
  }

  /**
   * 生成令牌响应（账号密码登录时使用）
   */
  private async generateTokenResponse(user: any): Promise<UserInfo> {
    // 生成随机 token（UUID v4）
    const accessToken = `tok_${randomUUID().replace(/-/g, '')}`;

    // 先清除该用户的所有旧 token，确保同一账号只有一个有效 token
    try {
      const oldTokens = await this.redisService.keys(`token:${user.id}:*`);
      if (oldTokens.length > 0) {
        await this.redisService.delMany(...oldTokens);
        console.log(`已清除用户 ${user.id} 的 ${oldTokens.length} 个旧 token`);
      }
    } catch (err) {
      console.warn('清除旧 token 失败，不影响登录:', (err as Error).message);
    }

    // 将 token 和用户信息写入 Redis（Hash 结构）
    try {
      await this.redisService.hset(`token:${user.id}:${accessToken}`, {
        userId: String(user.id),
        userName: user.userName,
        email: user.email || '',
      });
      await this.redisService.expire(`token:${user.id}:${accessToken}`, TOKEN_TTL);
    } catch (err) {
      console.error('Redis 写入 token 失败，登录失败:', (err as Error).message);
      throw new BadRequestException('登录失败，认证服务异常');
    }

    return {
      ...user,
      accessToken,
    };
  }

  /**
   * 登出（带 token 时只清除当前 token）
   */
  async logout(params: LogoutParams): Promise<void> {
    const { userId, token } = params;
    try {
      // 1. 如果传了 token，只删这个 token（保留其他设备的登录）
      if (token) {
        const key = `token:${userId}:${token}`;
        await this.redisService.del(key);
        console.log(`Token 已从 Redis 移除，用户 ${userId} 登出成功`);
        return;
      }

      // 2. 没传 token → 清除该用户所有数据（强制登出）
      await this.clearUserAllData(userId);
    } catch (error) {
      console.error('登出时清理 Redis 失败:', error);
    }
  }

  /**
   * 验证 token 并返回用户信息
   * 在 Redis 中查找匹配的 token key，返回关联的用户信息
   */
  async validateToken(token: string): Promise<{ sub: number; userName: string; email?: string } | null> {
    try {
      // 在所有 token key 中查找（使用 scan 避免阻塞）
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redisService.scan(cursor, `token:*:${token}`);
        cursor = nextCursor;

        for (const key of keys) {
          const data = await this.redisService.hgetall(key);
          if (data && data.userId) {
            return {
              sub: Number(data.userId),
              userName: data.userName,
              email: data.email,
            };
          }
        }
      } while (cursor !== '0');

      return null;
    } catch (error) {
      console.error('验证 token 失败:', error);
      return null;
    }
  }

  /**
   * 强制登出 — 清除用户所有 token 和 Redis 缓存
   * 适用于：用户本地 token 丢失、账号被其他人登录、管理员踢人
   */
  async forceLogout(params: ForceLogoutParams): Promise<void> {
    await this.clearUserAllData(params.userId);
  }

  /**
   * 清除用户在 Redis 中的所有数据
   */
  private async clearUserAllData(userId: number): Promise<void> {
    const longTokenKeys = await this.redisService.keys(`token:${userId}:*`);
    const shortTokenKeys = await this.redisService.keys(`short_token:${userId}:*`);
    const cacheKeys = await this.redisService.keys(`user:${userId}:*`);

    const allKeys = [...longTokenKeys, ...shortTokenKeys, ...cacheKeys];
    if (allKeys.length > 0) {
      await this.redisService.delMany(...allKeys);
      console.log(`已清除用户 ${userId} 的 ${allKeys.length} 个 Redis 键（${longTokenKeys.length} 长 token + ${shortTokenKeys.length} 短 token + ${cacheKeys.length} 缓存）`);
    } else {
      console.log(`用户 ${userId} 在 Redis 中无数据需清理`);
    }
  }
}
