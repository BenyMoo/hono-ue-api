import { Redis } from '@upstash/redis/cloudflare';

let redisInstance: Redis | null = null;

export const getRedis = (url: string, token: string): Redis => {
  if (!redisInstance) {
    console.log('初始化 Redis，URL:', url, 'Token 长度:', token.length);
    
    if (!url || !token) {
      throw new Error('Redis URL 和 token 是必需的');
    }
    
    try {
      redisInstance = new Redis({
        url,
        token,
      });
      console.log('Redis 初始化成功');
    } catch (error) {
      console.error('Redis 连接错误详情:', error);
      throw new Error(`连接 Redis 失败: ${(error as Error).message}`);
    }
  }
  return redisInstance;
};

export const closeRedis = async (): Promise<void> => {
  if (redisInstance) {
    // Redis 客户端在 @upstash/redis 中没有关闭方法
    redisInstance = null;
  }
};