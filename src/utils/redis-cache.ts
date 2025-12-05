import { Redis } from '@upstash/redis/cloudflare';

let redisInstance: Redis | null = null;

// Redis 缓存键前缀
const CACHE_PREFIXES = {
  USER: 'user:',
  CHECKIN: 'checkin:',
  MEMBERSHIP: 'membership:',
  STATS: 'stats:',
  LEADERBOARD: 'leaderboard:'
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  USER: 3600,        // 1小时
  CHECKIN: 86400,    // 24小时
  MEMBERSHIP: 1800,  // 30分钟
  STATS: 300,        // 5分钟
  LEADERBOARD: 3600  // 1小时
};

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

// 用户缓存相关函数
export const cacheUserCheckinStatus = async (userId: number, date: string, checkedIn: boolean): Promise<void> => {
  if (!redisInstance) return;

  const key = `${CACHE_PREFIXES.CHECKIN}${userId}:${date}`;
  await redisInstance.setex(key, CACHE_TTL.CHECKIN, checkedIn ? '1' : '0');
  console.log(`💾 [CACHE SET] 签到状态已缓存 | User: ${userId} | Date: ${date} | Status: ${checkedIn}`);
};

export const getCachedCheckinStatus = async (userId: number, date: string): Promise<boolean | null> => {
  if (!redisInstance) return null;

  const key = `${CACHE_PREFIXES.CHECKIN}${userId}:${date}`;
  const result = await redisInstance.get(key);

  if (result === '1') {
    console.log(`✓ [CACHE HIT] 签到状态来自缓存 | User: ${userId} | Date: ${date} | Status: true`);
    return true;
  }
  if (result === '0') {
    console.log(`✓ [CACHE HIT] 签到状态来自缓存 | User: ${userId} | Date: ${date} | Status: false`);
    return false;
  }
  console.log(`✗ [CACHE MISS] 签到状态缓存未命中 | User: ${userId} | Date: ${date}`);
  return null;
};

export const cacheUserInfo = async (userId: number, userData: any): Promise<void> => {
  if (!redisInstance) return;

  const key = `${CACHE_PREFIXES.USER}${userId}`;
  await redisInstance.setex(key, CACHE_TTL.USER, JSON.stringify(userData));
  console.log(`💾 [CACHE SET] 用户信息已缓存 | User: ${userId}`);
};

export const getCachedUserInfo = async (userId: number): Promise<any | null> => {
  if (!redisInstance) return null;

  const key = `${CACHE_PREFIXES.USER}${userId}`;
  const result = await redisInstance.get(key);

  if (result) {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`✓ [CACHE HIT] 用户信息来自缓存 | User: ${userId}`);
      return parsed;
    } catch (error) {
      console.error('⚠ [CACHE ERROR] 解析用户缓存数据失败:', error);
      return null;
    }
  }
  console.log(`✗ [CACHE MISS] 用户信息缓存未命中 | User: ${userId}`);
  return null;
};

export const invalidateUserCache = async (userId: number): Promise<void> => {
  if (!redisInstance) return;

  // 删除用户相关的所有缓存
  const keys = [
    `${CACHE_PREFIXES.USER}${userId}`,
    `${CACHE_PREFIXES.MEMBERSHIP}${userId}`,
    `${CACHE_PREFIXES.STATS}${userId}`
  ];

  // 删除今日签到缓存（如果存在）
  const today = new Date().toISOString().split('T')[0];
  keys.push(`${CACHE_PREFIXES.CHECKIN}${userId}:${today}`);

  await redisInstance.del(...keys);
  console.log(`🗑️ [CACHE INVALIDATE] 用户缓存已清除 | User: ${userId} | Keys: ${keys.length}`);
};

// 会员缓存相关函数
export const cacheMembershipStatus = async (userId: number, status: any): Promise<void> => {
  if (!redisInstance) return;

  const key = `${CACHE_PREFIXES.MEMBERSHIP}${userId}`;
  await redisInstance.setex(key, CACHE_TTL.MEMBERSHIP, JSON.stringify(status));
  console.log(`💾 [CACHE SET] 会员状态已缓存 | User: ${userId}`);
};

export const getCachedMembershipStatus = async (userId: number): Promise<any | null> => {
  if (!redisInstance) return null;

  const key = `${CACHE_PREFIXES.MEMBERSHIP}${userId}`;
  const result = await redisInstance.get(key);

  if (result) {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`✓ [CACHE HIT] 会员状态来自缓存 | User: ${userId}`);
      return parsed;
    } catch (error) {
      console.error('⚠ [CACHE ERROR] 解析会员缓存数据失败:', error);
      return null;
    }
  }
  console.log(`✗ [CACHE MISS] 会员状态缓存未命中 | User: ${userId}`);
  return null;
};

// 统计信息缓存
export const cacheUserStats = async (userId: number, stats: any): Promise<void> => {
  if (!redisInstance) return;

  const key = `${CACHE_PREFIXES.STATS}${userId}`;
  await redisInstance.setex(key, CACHE_TTL.STATS, JSON.stringify(stats));
  console.log(`💾 [CACHE SET] 用户统计已缓存 | User: ${userId}`);
};

export const getCachedUserStats = async (userId: number): Promise<any | null> => {
  if (!redisInstance) return null;

  const key = `${CACHE_PREFIXES.STATS}${userId}`;
  const result = await redisInstance.get(key);

  if (result) {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`✓ [CACHE HIT] 用户统计来自缓存 | User: ${userId}`);
      return parsed;
    } catch (error) {
      console.error('⚠ [CACHE ERROR] 解析统计缓存数据失败:', error);
      return null;
    }
  }
  console.log(`✗ [CACHE MISS] 用户统计缓存未命中 | User: ${userId}`);
  return null;
};

// 排行榜缓存
export const cacheLeaderboard = async (leaderboard: any[]): Promise<void> => {
  if (!redisInstance) return;

  const key = `${CACHE_PREFIXES.LEADERBOARD}points`;
  await redisInstance.setex(key, CACHE_TTL.LEADERBOARD, JSON.stringify(leaderboard));
  console.log(`💾 [CACHE SET] 排行榜已缓存 | Count: ${leaderboard.length}`);
};

export const getCachedLeaderboard = async (): Promise<any[] | null> => {
  if (!redisInstance) return null;

  const key = `${CACHE_PREFIXES.LEADERBOARD}points`;
  const result = await redisInstance.get(key);

  if (result) {
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`✓ [CACHE HIT] 排行榜来自缓存 | Count: ${Array.isArray(parsed) ? parsed.length : 0}`);
      return parsed;
    } catch (error) {
      console.error('⚠ [CACHE ERROR] 解析排行榜缓存数据失败:', error);
      return null;
    }
  }
  console.log(`✗ [CACHE MISS] 排行榜缓存未命中`);
  return null;
};

// 批量缓存操作
export const batchInvalidateCache = async (patterns: string[]): Promise<void> => {
  if (!redisInstance) return;

  for (const pattern of patterns) {
    // 获取匹配的所有键
    const keys = await redisInstance.keys(pattern);
    if (keys.length > 0) {
      await redisInstance.del(...keys);
    }
  }
};

export { CACHE_PREFIXES, CACHE_TTL };