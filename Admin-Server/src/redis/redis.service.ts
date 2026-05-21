import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', '') || undefined,
      db: this.configService.get<number>('REDIS_DB', 0),
      // 远程 Redis 必须开启 keepAlive，防止空闲断开
      keepAlive: 10000,       // 每 10 秒发送一次 TCP 心跳
      retryStrategy: (times) => {
        // 无限重试，指数退避，最大 30 秒间隔
        return Math.min(times * 1000, 30000);
      },
      lazyConnect: true,
      connectTimeout: 10000,  // 连接超时 10 秒（远程服务器延迟较高）
      maxRetriesPerRequest: 3, // 单个请求最多重试 3 次
    });

    this.client.on('error', (err) => {
      console.error('Redis 连接错误:', err.message);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis 已连接');
    });

    try {
      await this.client.connect();
    } catch (err) {
      console.warn('⚠️  Redis 连接失败，将使用内存模式:', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * 设置键值对（带过期时间）
   * @param key   键
   * @param value 值
   * @param ttl   过期时间（秒）
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 按模式查找所有匹配的键
   * @param pattern 键模式，如 token:1:*
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * 批量删除键
   * @param keys 要删除的键列表
   */
  async delMany(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  /**
   * 设置哈希表字段
   */
  async hset(key: string, fields: Record<string, string | number>): Promise<void> {
    await this.client.hset(key, fields);
  }

  /**
   * 获取哈希表所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * 设置键的过期时间（秒）
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * 渐进式扫描匹配的键
   * @param cursor  游标
   * @param pattern 匹配模式，如 token:*:*
   * @returns [nextCursor, keys]
   */
  async scan(cursor: string, pattern: string): Promise<[string, string[]]> {
    return this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
  }

  /**
   * 获取原生 Redis 客户端（高级用法）
   */
  getClient(): Redis {
    return this.client;
  }
}
